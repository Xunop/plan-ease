"use client";

import { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import { SuggestionContent, SuggestionContentRef } from "./SuggestionContent";
import { fetchAmapTips } from "@/lib/api/gaode/search";
import { AmapTip } from "@/lib/api/gaode/types";
// import { debounce, throttle } from "lodash";
// import { debounce, throttle } from "radash";
import { debounceAsyncSharedPromise } from "@/lib/utils/input";

// Define the types for the props and the structure of the component.
interface MentionProps {
  query: string;
}

const handleAmapTips = async (query: string): Promise<AmapTip[]> => {
  const trimmedQuery = query.trim();

  // If the query is empty or contains only spaces, return an empty array
  if (!trimmedQuery) {
    console.warn("Empty or invalid query");
    return [];
  }

  try {
    // console.log("tips res: ", tips);
    return fetchAmapTips(trimmedQuery);
  } catch (error) {
    console.log("Error fetching tips: ", error);
    return [];
  }
};

const debouncedFetchAmapTips = debounceAsyncSharedPromise(handleAmapTips, 300);

// About suggestion implement, see https://github.com/ueberdosis/tiptap/blob/develop/packages/suggestion/src/suggestion.ts
export default {
  items: ({ query }: MentionProps): AmapTip[] => {
    // Return immediately
    return [];
  },

  render: () => {
    let component: ReactRenderer;
    // Flag to track if onExit has been processed
    let exited = false;
    return {
      onStart: (props: any) => {
        exited = false;
        component = new ReactRenderer(SuggestionContent, {
          props,
          editor: props.editor,
        });

        setTimeout(() => {
          if (component && component.ref && !exited) {
            const ref = component.ref as SuggestionContentRef;
            ref.handleShow();
          }
        }, 0);

        if (props.query !== undefined) {
          debouncedFetchAmapTips(props.query)
            .then((tips) => {
              if (component && !exited) {
                // Once fetched, update the component with the actual items.
                component.updateProps({ ...props, items: tips });
              }
            })
            .catch((error) => {
              console.error("Error fetching tips in onStart:", error);
              if (component && !exited) {
                component.updateProps({ ...props, items: [] });
              }
            });
        }
      },

      onUpdate(props: any) {
        // console.log("suggestion update");

        if (component && !exited) {
          if (props.query !== undefined) {
            debouncedFetchAmapTips(props.query)
              .then((tips) => {
                if (component && !exited) {
                  component.updateProps({ ...props, items: tips });
                }
              })
              .catch((error) => {
                console.error("Error fetching tips in onUpdate:", error);
                if (component && !exited) {
                  component.updateProps({ ...props, items: [] }); // Handle error
                }
              });
          } else {
            // If query becomes undefined/empty, clear items
            if (component && !exited) {
              component.updateProps({ ...props, items: [] });
            }
          }
        }
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (exited || !component || !component.ref) {
          return false;
        }

        const ref = component.ref as SuggestionContentRef;
        return ref.handleKeydown(props);
      },

      onExit() {
        if (!component || exited) {
          return;
        }

        exited = true;

        const currentRef = component.ref as SuggestionContentRef;

        if (currentRef) {
          currentRef.handleHide();
        }
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
    editor.view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
  },
};
