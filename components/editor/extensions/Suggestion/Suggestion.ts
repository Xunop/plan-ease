"use client";

import { Editor, Range } from "@tiptap/core";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { posToDOMRect, ReactRenderer } from "@tiptap/react";
import { SuggestionContentRef } from "./SuggestionContent";
import { fetchAmapTips } from "@/lib/api/gaode/search";
import { AmapTip } from "@/lib/api/gaode/types";
// import { debounce, throttle } from "lodash";
// import { debounce, throttle } from "radash";
import { debounceAsyncSharedPromise } from "@/lib/utils/input";
import MentionList from "./List";
import { fetchSuggestions } from "@/lib/bridge/search";
import { Suggestion } from "@/lib/api/types";

// Define the types for the props and the structure of the component.
interface MentionProps {
    query: string;
}

const updatePosition = (editor: Editor, element: HTMLElement) => {
    const virtualElement = {
        getBoundingClientRect: () =>
            posToDOMRect(
                editor.view,
                editor.state.selection.from,
                editor.state.selection.to,
            ),
    };

    computePosition(virtualElement, element, {
        placement: "bottom-start",
        strategy: "absolute",
        middleware: [shift(), flip()],
    }).then(({ x, y, strategy }) => {
        element.style.width = "max-content";
        element.style.position = strategy;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    });
};

const handleTips = async (query: string): Promise<Suggestion[]> => {
    const trimmedQuery = query.trim();

    // If the query is empty or contains only spaces, return an empty array
    if (!trimmedQuery) {
        console.warn("Empty or invalid query");
        return [];
    }

    try {
        // console.log("tips res: ", tips);
        // return fetchAmapTips(trimmedQuery);
        return fetchSuggestions(trimmedQuery)
        // return [];
    } catch (error) {
        console.error("Error fetching tips: ", error);
        return [];
    }
};

const debouncedFetchTips = debounceAsyncSharedPromise(handleTips, 300);

// About suggestion implement, see https://github.com/ueberdosis/tiptap/blob/develop/packages/suggestion/src/suggestion.ts
export default {
    items: ({ query }: MentionProps): Suggestion[] => {
        // Return immediately
        return [];
    },

    render: () => {
        let component: ReactRenderer;
        return {
            onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                let element = component.element as HTMLElement;
                element.style.position = "absolute";
                document.body.appendChild(element);
                updatePosition(props.editor, element);

                // if (props.query !== undefined) {
                //     debouncedFetchAmapTips(props.query)
                //         .then((tips) => {
                //             if (component) {
                //                 // Once fetched, update the component with the actual items.
                //                 component.updateProps({
                //                     ...props,
                //                     items: tips,
                //                 });
                //             }
                //         })
                //         .catch((error) => {
                //             console.error(
                //                 "Error fetching mention tips in onStart:",
                //                 error,
                //             );
                //             if (component) {
                //                 component.updateProps({ ...props, items: [] });
                //             }
                //         });
                // }
            },

            onUpdate(props: any) {
                // console.log("suggestion update");

                if (component) {
                    if (props.query !== undefined) {
                        debouncedFetchTips(props.query)
                            .then((tips) => {
                                if (component) {
                                    component.updateProps({
                                        ...props,
                                        items: tips,
                                    });
                                }
                            })
                            .catch((error) => {
                                console.error(
                                    "Error fetching tips in onUpdate:",
                                    error,
                                );
                                if (component) {
                                    component.updateProps({
                                        ...props,
                                        items: [],
                                    }); // Handle error
                                }
                            });
                    } else {
                        // If query becomes undefined/empty, clear items
                        if (component) {
                            component.updateProps({ ...props, items: [] });
                        }
                    }
                }

                if (!props.clientRect) {
                    return;
                }
                updatePosition(props.editor, component.element as HTMLElement);
            },

            onKeyDown(props: { event: KeyboardEvent }) {
                // console.log("on key down");

                if (props.event.key === "Escape") {
                    component.destroy();

                    return true;
                }

                if (!component || !component.ref) {
                    return false;
                }

                const ref = component.ref as SuggestionContentRef;
                return ref.handleKeydown(props);
            },

            onExit() {
                component.element.remove();
                component.destroy();
            },
        };
    },

    // Will insert a mention, called in the SuggestionContent.tsx
    command: (props: { editor: Editor; range: Range; props: any }) => {
        const editor = props.editor;
        const range = props.range;
        const cmdProps = props.props;
        // increase range.to by one when the next node is of type "text"
        // and starts with a space character
        const nodeAfter = editor.view.state.selection.$to.nodeAfter;
        const overrideSpace = nodeAfter?.text?.startsWith(" ");

        if (overrideSpace) {
            range.to += 1;
        }

        const location = cmdProps.location;
        const id = cmdProps.id;
        const label = cmdProps.label;

        editor
            .chain()
            .focus()
            .insertContentAt(range, [
                {
                    type: "mention",
                    attrs: {
                        id: id,
                        location: location,
                        label: label,
                    },
                },
                {
                    type: "text",
                    text: " ",
                },
            ])
            .run();

        // get reference to `window` object from editor element, to support cross-frame JS usage
        editor.view.dom.ownerDocument.defaultView
            ?.getSelection()
            ?.collapseToEnd();
    },
};
