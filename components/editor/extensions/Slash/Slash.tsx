import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
import { default as MentionExtension } from "@tiptap/extension-mention";
import { ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function SlashComponent(props: NodeViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { id, label } = props.node.attrs;

  return (
    <NodeViewWrapper className="inline w-fit">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <span
            onClick={() => setIsOpen(true)}
            className="formulas"
            {...props.HTMLAttributes}
            {...props.extension.options.HTMLAttributes}
          >
          {/* Need to implements */}
          a
          </span>
        </PopoverTrigger>
        <PopoverContent>{/*<PopoverEditor /> */}</PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

// https://github.com/ueberdosis/tiptap/discussions/4924
// https://github.com/ueberdosis/tiptap/discussions/5072
export const Slash = MentionExtension.extend({
  name: "slash",

  addNodeView() {
    return ReactNodeViewRenderer(SlashComponent);
  },
  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    const mergedOptions = { ...this.options };

    mergedOptions.HTMLAttributes = mergeAttributes(
      { "data-type": this.name },
      this.options.HTMLAttributes,
      HTMLAttributes,
    );
    const html = this.options.renderHTML({
      options: mergedOptions,
      node,
    });

    if (typeof html === "string") {
      return [
        "span",
        mergeAttributes(
          { "data-type": this.name },
          this.options.HTMLAttributes,
          HTMLAttributes,
        ),
        html,
      ];
    }
    return html;
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "data-id": attributes.id,
          };
        },
      },
    };
  },
});
