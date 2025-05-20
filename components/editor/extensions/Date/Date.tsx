import { mergeAttributes, Node, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DateComponent } from "./DateComponent"; // React component for NodeView
import { generateFixedLengthId } from "@/lib/utils/index";

// Trigger: "^" followed by a space
const INPUT_REGEX = /\^\s$/;

export const DateNode = Node.create({
  name: "dateNode",
  group: "inline",
  inline: true,
  atom: true, // Treat as a single unit, internal editing managed by NodeView
  selectable: true,

  addAttributes() {
    return {
      dateId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-date-id"),
        renderHTML: (attributes) => {
          return attributes.dateValue
            ? { "data-date-id": attributes.dateValue }
            : {};
        },
      },
      // Stored canonical date value
      dateValue: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-date-value"),
        renderHTML: (attributes) => {
          return attributes.dateValue
            ? { "data-date-value": attributes.dateValue }
            : {};
        },
      },
      // Text displayed in the editor (user input or formatted date)
      displayText: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-display-text"),
        renderHTML: (attributes) => ({
          "data-display-text": attributes.displayText,
        }),
      },
      // Flag to indicate if the node is currently being edited
      isEditing: {
        default: false,
        // This attribute doesn't need to be parsed/rendered to HTML usually,
        // it's primarily for the NodeView's internal state management.
        // However, parsing it might help restore state if needed.
        // parseHTML: element => element.hasAttribute('data-editing'),
        // renderHTML: attributes => attributes.isEditing ? { 'data-editing': 'true'} : {}
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
        // Priority might be needed if conflicting with other span rules
        // priority: 51,
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          const dateValue = element.getAttribute("data-date-value") || null;
          const displayText = element.getAttribute("data-display-text") || "";
          // When parsing from HTML, assume it's not in editing state
          const isEditing = false;
          const dateId = element.getAttribute("data-date-id") || null;
          return { dateId, dateValue, displayText, isEditing };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Render the display text. The actual interaction logic is in the NodeView.
    // Add data-type for parsing and potentially other data attributes.
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
        // Render attributes needed for parsing back
        "data-date-value": node.attrs.dateValue,
        "data-display-text": node.attrs.displayText,
        "data-date-id": node.attrs.dateId,
      }),
      // The text content here is just for the static HTML render,
      // the NodeView will control the actual display dynamically.
      node.attrs.displayText || "...", // Placeholder if display text is empty
    ];
  },

  // Use a React component for rendering the node in the editor
  addNodeView() {
    return ReactNodeViewRenderer(DateComponent);
  },

  // Input rule to trigger node creation in editing mode
  addInputRules() {
    return [
      new InputRule({
        find: INPUT_REGEX,
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          // Replace the trigger text "^ " with the new DateNode in editing mode
          tr.replaceWith(
            start,
            end,
            this.type.create({
              dateId: generateFixedLengthId(8, "date-"),
              dateValue: null,
              displayText: "", // Start with empty display text
              isEditing: true, // Start in editing mode
            }),
          );

          // Optional: Set selection/cursor right after the node or inside it
          // This might require coordination with the NodeView's focus logic
          // Example: select the node itself
          // const resolvedPos = tr.doc.resolve(start);
          // tr.setSelection(NodeSelection.create(tr.doc, resolvedPos.pos));

          // Example: try to set cursor position - might not work perfectly with atom nodes
          // tr.setSelection(TextSelection.create(tr.doc, start + 1));
        },
      }),
    ];
  },
});

export default DateNode;
