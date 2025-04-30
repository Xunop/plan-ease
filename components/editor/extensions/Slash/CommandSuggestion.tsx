"use client";

import { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { CmdSugRef, CommandSugContent } from "./CommandSugContent";
import {
  CommandContext,
  CommandResult,
  CommandSuggestion,
  QueryState,
  ResolvedOptions,
  SuggestionItem,
  SuggestionQueryState,
} from "./types";
import { commands } from "./commands";
import { getStore } from "@/providers/location-store-provider";
//import { buildNodeSequence, resolveImplicitOptions } from "./commandUtils";
import { PluginKey } from "@tiptap/pm/state";
import { debounce, throttle } from "lodash";
import { generateFixedLengthId } from "@/lib/utils/index";
import { processCommandQuery } from "./queryProcessor";
import { initialSuggestions } from "./suggestions";

type SuggestionProps = {
  editor: Editor;
  query: string;
};

const throttleFetchSlash = throttle(
  async ({ query, editor }: SuggestionProps): Promise<CommandSuggestion[]> => {
    const inputText = "/" + query;
    const suggestionState: QueryState = processCommandQuery(
      inputText,
      initialSuggestions,
    );

    const context: CommandContext = {
      editor: editor,
      pos: editor.state.selection.from,
      store: getStore(),
    };
    return suggestionState.suggestions.slice(0, 10);
  },
  300,
);

const SlashPluginKey = new PluginKey("slash");

// About suggestion implement, see https://github.com/ueberdosis/tiptap/blob/develop/packages/suggestion/src/suggestion.ts
export default {
  // const slashSuggestionConfig: Omit<SuggestionOptions<SuggestionItem>, 'editor'> = {
  char: "/",
  pluginKey: SlashPluginKey,
  // It tells the Tiptap suggestion plugin not to treat a space character as the end of the suggestion query
  allowSpaces: true,

  items: async ({
    query,
    editor,
  }: SuggestionProps): Promise<CommandSuggestion[]> => {
    return throttleFetchSlash({ query, editor });
  },

  render: () => {
    let component: ReactRenderer;
    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandSugContent, {
          props,
          editor: props.editor,
        });
        const ref = component.ref as CmdSugRef;
        ref.handleShow();
      },

      onUpdate(props: any) {
        // console.log("suggestion update");
        if (component) {
          component.updateProps(props);
        }
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        const ref = component.ref as CmdSugRef;
        return ref.handleKeydown(props);
      },

      onExit() {
        const ref = component.ref as CmdSugRef;

        ref.handleHide();
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
    const commandName = selectionProps.commandName; // Get command name from selected item props

    const commandDef = commands.find((cmd) => cmd.name === commandName);
    if (!commandDef) {
      console.error(`Command definition not found for "${commandName}"`);
      return;
    }

    // 1. Final Parsing of text in range (might be slightly different from suggestion query)
    // Get text content within the suggestion trigger range
    const commandText = editor.state.doc.textBetween(
      range.from,
      range.to,
      "\n",
      " ",
    );
    // We need the *full* command query state here, including parsed explicit options
    // Let's reuse the suggestion query function for simplicity, assuming the text is correct
    // A more robust way might be needed if the text differs significantly
    const finalSuggestionState = getCommandSuggestions(commandText, commands); // Re-run suggestion matching on the range text
    const explicitOptions =
      finalSuggestionState.explicitOptionsForBestMatch ?? {};

    // 2. Prepare Context
    // Ensure store is accessible here. Using getState() if outside React component.
    const context: CommandContext = {
      editor,
      pos: range.from, // Use start of range as context position
      store: getStore(),
    };

    try {
      // 3. Resolve ALL options (explicit + implicit)
      const resolvedOptions: ResolvedOptions = await resolveImplicitOptions(
        commandDef,
        explicitOptions,
        context,
      );

      // 4. (Optional) Final action call if needed (e.g., for validation or data not in resolvedOptions)
      // If action's main job was moved to resolveImplicitOptions, this might not be needed
      // Or it might return the final validated/structured data
      // const finalNodeData = await commandDef.action(resolvedOptions, context);
      // For now, assume resolvedOptions contains all needed data.

      // 5. Build Node Sequence
      const nodeSequence = buildNodeSequence(commandDef, resolvedOptions);

      // 6. Insert Content
      // Handle potential space override like in the original code
      const nodeAfter = editor.view.state.selection.$to.nodeAfter;
      const overrideSpace = nodeAfter?.text?.startsWith(" ");
      const finalRange = { ...range }; // Clone range
      if (overrideSpace) {
        finalRange.to += 1;
      }

      editor
        .chain()
        .focus()
        .insertContentAt(finalRange, nodeSequence) // Insert the sequence
        .run();

      // Collapse selection after insertion (from original code)
      editor.view.dom.ownerDocument.defaultView
        ?.getSelection()
        ?.collapseToEnd();
    } catch (error: any) {
      console.error(`Error executing command "${commandName}":`, error);
      // Optionally insert an error node or show a notification to the user
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: "text", text: `Error: ${error.message} ` },
        ])
        .run();
    }
  },
};
