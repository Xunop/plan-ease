"use client";

import { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import SuggestionContent, { SuggestionContentRef } from "./SuggestionContent";
import { fetchAmapTips } from "@/lib/api/gaode/search";
import throttle from "lodash.throttle";
import { AmapTip } from "@/lib/api/gaode/types";

// Define the types for the props and the structure of the component.
interface MentionProps {
  query: string;
}

const throttledFetchAmapTips = throttle(
  async (query: string): Promise<AmapTip[]> => {
    const trimmedQuery = query.trim();

    // If the query is empty or contains only spaces, return an empty array
    if (!trimmedQuery) {
      console.warn("Empty or invalid query");
      return [];
    }

    try {
      const tips = await fetchAmapTips(trimmedQuery);
      // const names = tips.map((tip) => tip.name);
      // const tips = response.tips.map((tip) => tip.name);
      return tips;
    } catch (error) {
      console.log("Error fetching tips: ", error);
      return [];
    }
  },
  1000,
);

// About suggestion implement, see https://github.com/ueberdosis/tiptap/blob/develop/packages/suggestion/src/suggestion.ts
export default {
  items: async ({ query }: MentionProps): Promise<AmapTip[]> => {
    return await throttledFetchAmapTips(query);
  },

  render: () => {
    let component: ReactRenderer;
    return {
      onStart: (props: any) => {
        // console.log("Suggestion start", props);
        component = new ReactRenderer(SuggestionContent, {
          props,
          editor: props.editor,
        });
        const ref = component.ref as SuggestionContentRef;
        ref.handleShow();
      },

      onUpdate(props: any) {
        // console.log("suggestion update");
        if (component) {
          component.updateProps(props);
        }
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        const ref = component.ref as SuggestionContentRef;
        return ref.handleKeydown(props);
      },

      onExit() {
        const ref = component.ref as SuggestionContentRef;

        ref.handleHide();
        component?.destroy();
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
    editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
  },
};
