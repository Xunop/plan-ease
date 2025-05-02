import { Node, mergeAttributes, type Range } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react"; // Using React for NodeView example
import FormulasComponent from "./FormulasComponent"; // We'll create this React component
import { FormulasAttributes } from "./types";

// No such method is used at present
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    formulas: {
      /**
       * Insert a formulas node
       */
      insertFormulas: (
        attributes: Partial<FormulasAttributes>,
        range?: Range | null,
      ) => ReturnType;
      /**
       * Update attributes of the formulas node at the current position or given range
       */
      updateFormulas: (
        attributes: Partial<FormulasAttributes>,
        range?: Range | null,
      ) => ReturnType;
    };
  }
}

export const FormulasExtension = Node.create<FormulasAttributes>({
  name: "formulas",
  group: "inline", // Rendered inline with text
  inline: true,
  atom: true, // Treated as a single, undeletable unit by default
  selectable: true, // Allow selecting the whole node
  draggable: false,

  addAttributes() {
    return {
      commandName: { default: null },
      displayOptions: {
        default: null,
        parseHTML: (element) =>
          JSON.parse(element.getAttribute("data-options") || "{}"),
      },
      resultData: {
        default: null,
        parseHTML: (element) =>
          JSON.parse(element.getAttribute("data-result") || "null"),
      },
      resultDisplay: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-display"),
      },
      status: {
        default: "success",
        parseHTML: (element) =>
          element.getAttribute("data-status") || "success",
      },
      errorMessage: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-error"),
      },
    };
  },

  // How to parse this node from HTML
  parseHTML() {
    return [
      {
        tag: 'span[data-type="formulas"]',
        // getAttrs is implicitly handled by addAttributes' parseHTML above
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // mergeAttributes combines defaults with parsed/provided attrs
    // We store data in data-* attributes for potential re-parsing
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "formulas",
        // Ensure attributes are stringified for HTML
        "data-command": this.options.commandName,
        "data-options": JSON.stringify(this.options.displayOptions),
        "data-result": JSON.stringify(this.options.resultData),
        "data-display": this.options.resultDisplay,
        "data-status": this.options.status,
        "data-error": this.options.errorMessage,
        // Add a class for easier styling targeting
        class: `formulas-node status-${this.options.status}`,
      }),
      0,
    ]; // 0 indicates this node cannot have content in default rendering
  },

  addNodeView() {
    return ReactNodeViewRenderer(FormulasComponent);
  },

  // Add custom commands for inserting/updating this node
  addCommands() {
    return {
      insertFormulas:
        (attributes, range = null) =>
        ({ chain }) => {
          const content = [{ type: this.name, attrs: attributes }];
          let commandChain = chain().focus();
          if (range) {
            commandChain = commandChain.insertContentAt(range, content);
          } else {
            commandChain = commandChain.insertContent(content);
          }
          // Add a space after insertion might be needed depending on desired behavior
          // commandChain = commandChain.insertContent(' ');
          return commandChain.run();
        },
      updateFormulas:
        (attributes, range = null) =>
        ({ chain }) => {
          let commandChain = chain().focus();
          if (range) {
            commandChain = commandChain
              .updateAttributes(this.name, attributes)
              .setTextSelection(range);
          } else {
            commandChain = commandChain.updateAttributes(this.name, attributes);
          }
          return commandChain.run();
        },
    };
  },
});
