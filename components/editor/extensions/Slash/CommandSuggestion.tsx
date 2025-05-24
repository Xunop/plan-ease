"use client";

import { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { CmdSugRef, CommandSugContent } from "./CommandSugContent";
import { CommandResult, CommandSuggestion, QueryState } from "./types";
import { PluginKey } from "@tiptap/pm/state";
// import { throttle } from "lodash";
import { processCommandQuery } from "./queryProcessor";
import { initialSuggestions, updateInitialSuggestions } from "./suggestions";
import { FormulasAttributes } from "../Formulas/types";
import { debounceAsyncSharedPromise } from "@/lib/utils/input";

type SuggestionProps = {
  editor: Editor;
  query: string;
};

const handleCMDTips = async (query: string): Promise<CommandSuggestion[]> => {
  if (query === "") {
    return initialSuggestions;
  }

  const inputText = "/" + query;
  const suggestionState: QueryState = processCommandQuery(
    inputText,
    initialSuggestions,
  );

  return suggestionState.suggestions.slice(0, 10);
};

const SlashPluginKey = new PluginKey("slash");

const debouncedFetchSlash = debounceAsyncSharedPromise(handleCMDTips, 300);

// About suggestion implement, see https://github.com/ueberdosis/tiptap/blob/develop/packages/suggestion/src/suggestion.ts
export default {
  // const slashSuggestionConfig: Omit<SuggestionOptions<SuggestionItem>, 'editor'> = {
  char: "/",
  pluginKey: SlashPluginKey,
  // It tells the Tiptap suggestion plugin not to treat a space character as the end of the suggestion query
  allowSpaces: true,

  items: async (query: string): Promise<CommandSuggestion[]> => {
    // Return immediately
    return initialSuggestions;
  },

  render: () => {
    let component: ReactRenderer;
    // Flag to track if onExit has been processed
    let exited = false;
    return {
      onBeforeStart: (props: any) => {
        updateInitialSuggestions();
      },

      onStart: (props: any) => {
        exited = false;
        component = new ReactRenderer(CommandSugContent, {
          props,
          editor: props.editor,
        });
        setTimeout(() => {
          if (component && component.ref && !exited) {
            const ref = component.ref as CmdSugRef;
            ref.handleShow();
          }
        }, 0);

        if (props.query !== undefined && props.query !== "") {
          debouncedFetchSlash(props.query)
            .then((tips) => {
              if (component && !exited) {
                // Once fetched, update the component with the actual items.
                component.updateProps({ ...props, items: tips });
              }
            })
            .catch((error) => {
              console.error("Error fetching slash tips in onStart:", error);
              if (component && !exited) {
                component.updateProps({ ...props, items: initialSuggestions });
              }
            });
        }
      },

      onUpdate(props: any) {
        // console.log("suggestion update");
        if (component && !exited) {
          if (props.query !== undefined && props.query !== "") {
            debouncedFetchSlash(props.query)
              .then((tips) => {
                if (component && !exited) {
                  // Once fetched, update the component with the actual items.
                  component.updateProps({ ...props, items: tips });
                }
              })
              .catch((error) => {
                console.error("Error fetching slash tips in onStart:", error);
                if (component && !exited) {
                  component.updateProps({
                    ...props,
                    items: initialSuggestions,
                  });
                }
              });
          }
        }
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (exited || !component || !component.ref) {
          return false;
        }

        const ref = component.ref as CmdSugRef;
        return ref.handleKeydown(props);
      },

      onExit() {
        if (!component || exited) {
          return;
        }

        exited = true;
        const ref = component.ref as CmdSugRef;

        ref?.handleHide();
        component?.destroy();
      },
    };
  },

  command: async ({
    editor,
    range,
    props: selectionProps,
  }: {
    editor: Editor;
    range: Range;
    props: any;
  }) => {
    const commandSug = selectionProps.commandSug as CommandSuggestion; // Get command name from selected item props
    if (!commandSug.baseDefinition?.action) {
      console.error("Selected suggestion has no action defined.");
      return;
    }

    let commandResult: CommandResult | null = null;
    let formulasAttrs: Partial<FormulasAttributes> = {
      commandName: commandSug.baseDefinition.name,
      // Pass the displayOptions used, not the action options, for rendering context
      displayOptions: commandSug.displayOptions ?? commandSug.options,
      status: "success", // Assume success initially
    };

    try {
      commandResult = await commandSug.baseDefinition.action(
        commandSug.options,
      ); // Pass ACTION options

      // Populate attributes from the result
      formulasAttrs.resultData = commandResult?.data ?? null;
      formulasAttrs.resultDisplay = commandResult?.display ?? null;
      formulasAttrs.status = "success";
    } catch (error: any) {
      console.error(
        `Error executing command "${commandSug.baseDefinition?.name}":`,
        error,
      );
      formulasAttrs.status = "error";
      formulasAttrs.errorMessage = error.message || "Action failed";
      // Keep resultData/Display as null or empty from initialization
    }

    // --- Insert the Formulas Node ---
    try {
      // Handle potential space override like in the original code
      const nodeAfter = editor.view.state.selection.$to.nodeAfter;
      const overrideSpace = nodeAfter?.text?.startsWith(" ");
      if (overrideSpace) {
        range.to += 1;
      }

      console.log("Action Result:", commandResult);
      const contentToInsert = [
        {
          type: "formulas",
          attrs: formulasAttrs,
        },
        {
          type: "text",
          text: " ", // Add space immediately after
        },
      ];

      // Perform the insertion and replacement in one go
      editor
        .chain()
        .focus() // Focus before making changes
        // Replace the content in finalRange with the node and space
        .insertContentAt(range, contentToInsert)
        // **** REMOVED the manual .command() for selection setting ****
        // Let Tiptap handle the selection placement after insertContentAt initially.
        // Tiptap usually places the cursor after the inserted content.
        .run();

      // editor
      //   .chain()
      //   // Use the custom command to insert/replace with the formulas node
      //   .insertFormulas(formulasAttrs, finalRange)
      //   // Optionally add a space after the node automatically
      //   .insertContent(" ")
      //   // Move cursor after the inserted content + space
      //   .command(({ tr, dispatch }) => {
      //     if (dispatch) {
      //       // Move selection to the end of the inserted content + space
      //       // const endPos = finalRange.from + (tr.steps[tr.steps.length - 1]?.slice?.content?.size ?? 0) + 1; // Crude estimate, might need refinement
      //       tr.setSelection(
      //         TextSelection.create(tr.doc, tr.mapping.map(finalRange.to) + 1),
      //       ); // Move after the space
      //     }
      //     return true;
      //   })
      //   .focus() // Refocus editor
      //   .run();
    } catch (insertError) {
      console.error("Error inserting formulas node:", insertError);
      // Fallback? Maybe insert plain text error?
      editor
        .chain()
        .focus()
        .insertContentAt(
          range,
          `Error displaying result: ${formulasAttrs.errorMessage || "Unknown Error"} `,
        )
        .run();
    }
  },
};
