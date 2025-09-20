import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, Transaction, EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { evaluateLine } from "@/lib/utils/calculationEngine";

// We store more than just decorations to enable efficient re-calculation.
interface LineData {
    text: string;
    rawValue?: any;
}

interface CalculationState {
    decorations: DecorationSet;
    lineData: LineData[];
}

export const CalculationExtension = Extension.create({
    name: "calculationExtension",

    addProseMirrorPlugins() {
        return [
            new Plugin<CalculationState>({
                key: new PluginKey("calculation"),
                state: {
                    // Initialize state by calculating everything for the first time.
                    init: (_, { doc }) => getFullCalculationState(doc),

                    apply: (tr: Transaction, oldState: CalculationState, oldEditorState: EditorState): CalculationState => {
                        // If the document didn't change, or the change was just selection, do nothing.
                        if (!tr.docChanged) {
                            return oldState;
                        }

                        // Find the position of the first change.
                        let firstChangePos = tr.steps.reduce((min, step) => Math.min(min, (step as any).from), tr.doc.content.size);

                        // Find the line number of the first node affected by the change.
                        let firstDirtyLine = 0;
                        tr.doc.nodesBetween(firstChangePos, firstChangePos, (node, pos, _, index) => {
                            if (node.isBlock) {
                                firstDirtyLine = index + 1;
                                return false; // Stop searching once we find the first block node.
                            }
                        });

                        // Intelligently update the state instead of rebuilding from scratch.
                        return updateCalculationState(tr.doc, oldState, firstDirtyLine);
                    },
                },
                props: {
                    // Decorations read directly from our managed state.
                    decorations(state: EditorState) {
                        return this.getState(state)?.decorations;
                    },
                },
            }),
        ];
    },
});

/**
 * Creates the initial state by calculating all lines. Called only once on editor load.
 */
function getFullCalculationState(doc: ProsemirrorNode): CalculationState {
    return updateCalculationState(doc, { decorations: DecorationSet.empty, lineData: [] }, 1);
}

/**
 * It reuses old calculations for lines before `firstDirtyLine`.
 * @param doc The new Prosemirror document.
 * @param oldState The previous plugin state, containing old decorations and line data.
 * @param firstDirtyLine The first line number (1-indexed) that needs full re-evaluation.
 */
function updateCalculationState(doc: ProsemirrorNode, oldState: CalculationState, firstDirtyLine: number): CalculationState {
    const decorations: Decoration[] = [];
    const newLineData: LineData[] = [];
    const scope: Record<string, any> = {};
    let lineCounter = 1;

    doc.descendants((node: ProsemirrorNode, pos: number) => {
        if (node.type.name === "paragraph") {
            const expression = node.textContent;

            // If we are before the first dirty line and the text hasn't changed, reuse old data.
            if (lineCounter < firstDirtyLine && oldState.lineData[lineCounter - 1]?.text === expression) {
                const oldData = oldState.lineData[lineCounter - 1];
                newLineData.push(oldData); // Keep the old line data.

                // Rebuild the scope with the old raw value.
                if (oldData.rawValue !== undefined) {
                    scope[`_line${lineCounter}`] = oldData.rawValue;
                    // This part is crucial: re-apply variable assignments to the scope.
                    const assignmentMatch = expression.match(/^([a-zA-Z\s"][a-zA-Z0-9\s"]*\s*)=/);
                    if (assignmentMatch) {
                        const variableName = assignmentMatch[1].trim();
                        scope[variableName] = oldData.rawValue;
                    }
                }

                // Find and reuse the old decoration for this position.
                const oldDeco = oldState.decorations.find(pos + node.nodeSize - 1, pos + node.nodeSize - 1);
                if (oldDeco.length) {
                    decorations.push(...oldDeco);
                }

            } else {
                // This block is for new/changed lines or any line after the first change.
                const preprocessedExpression = preprocessForRangeFunctions(expression, scope, lineCounter);
                const result = evaluateLine(preprocessedExpression, scope);

                const currentLineData: LineData = { text: expression };

                if (result) {
                    currentLineData.rawValue = result.raw;
                    scope[`_line${lineCounter}`] = result.raw;

                    if (result.isAssignment && result.variableName) {
                        scope[result.variableName] = result.raw;
                    }

                    if (result.formatted) {
                        const widget = document.createElement("span");
                        widget.className = "calculation-result";
                        widget.textContent = `${result.formatted}`;
                        decorations.push(
                            Decoration.widget(pos + node.nodeSize - 1, widget, {
                                key: `calc-${pos}`,
                                side: 1,
                                ignoreSelection: true,
                            })
                        );
                    }
                }
                newLineData.push(currentLineData);
            }
        } else {
            // For non-paragraph nodes, push placeholder data to keep indices aligned.
            newLineData.push({ text: "" });
        }
        lineCounter++;
        return true;
    });

    return {
        decorations: DecorationSet.create(doc, decorations),
        lineData: newLineData,
    };
}


/**
 * Helper to handle range functions like sum(line X:line Y).
 * This was extracted from the original getCalculationState to be reusable.
 */
function preprocessForRangeFunctions(expression: string, scope: Record<string, any>, currentLine: number): string {
    const lineValues: Record<number, any> = {};
    for (const key in scope) {
        const match = key.match(/^_line(\d+)$/);
        if (match) {
            lineValues[parseInt(match[1], 10)] = scope[key];
        }
    }

    const rangeRegex = /(sum|mean|average|median)\s*\(\s*line\s*(\d+)\s*:\s*line\s*(\d+)\s*\)/i;
    const rangeMatch = expression.match(rangeRegex);

    if (rangeMatch) {
        const [, func, start, end] = rangeMatch;
        const startLine = parseInt(start, 10);
        const endLine = parseInt(end, 10);
        const valuesInRange = [];

        for (let i = startLine; i <= endLine; i++) {
            if (i < currentLine && lineValues[i] !== undefined) {
                valuesInRange.push(lineValues[i]);
            }
        }

        if (valuesInRange.length > 0) {
            const rangeScope: Record<string, any> = {};
            const argNames: string[] = [];
            valuesInRange.forEach((val, i) => {
                const argName = `__range_${i}`;
                rangeScope[argName] = val;
                argNames.push(argName);
            });
            Object.assign(scope, rangeScope);
            return expression.replace(rangeRegex, `${func}(${argNames.join(',')})`);
        }
    }

    // Ignore ordered list items
    const orderedListRegex = /^\d+\.\s+/;
    if (orderedListRegex.test(expression.trimStart())) {
        return "";
    }

    return expression;
}
