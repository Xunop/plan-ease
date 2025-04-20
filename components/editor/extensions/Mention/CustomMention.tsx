import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect } from "react";
import { default as MentionExtension } from "@tiptap/extension-mention";
import { ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import { useBoundStore } from "@/providers/location-store-provider";

function Mention(props: NodeViewProps) {
  const { locations, AddLocation, RemoveLocation } = useBoundStore(
    (state) => state,
  );
  useEffect(() => {
    const id = props.node.attrs.id;
    const location = {
      id: id,
      name: props.node.attrs.label,
      location: props.node.attrs.location,
    };
    AddLocation(location);
    // console.log(`Mention ${props.node.attrs.label} added`);
    return () => {
      RemoveLocation(id);
      // console.log(`Mention ${props.node.attrs.label} deleted`);
    };
  }, []);

  useEffect(() => {
    console.log("debug::locations:", locations);
  }, [locations]);

  const id = props.node.attrs.id;
  return (
    <NodeViewWrapper className="inline w-fit ">
      <span
        className="mention"
        data-id={id}
        {...props.HTMLAttributes}
        {...props.extension.options.HTMLAttributes}
      >
        @{props.node.attrs.label}
      </span>
    </NodeViewWrapper>
  );
}

// https://github.com/ueberdosis/tiptap/discussions/4924
// https://github.com/ueberdosis/tiptap/discussions/5072
export const CustomMention = MentionExtension.extend({
  addNodeView() {
    return ReactNodeViewRenderer(Mention);
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

      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }

          return {
            "data-label": attributes.label,
          };
        },
      },

      location: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-location"),
        renderHTML: (attributes) => {
          if (!attributes.location) {
            return {};
          }
          return {
            "data-location": attributes.location,
          };
        },
      },
    };
  },
});
