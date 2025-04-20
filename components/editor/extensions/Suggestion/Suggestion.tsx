"use client";

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
};
