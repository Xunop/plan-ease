import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useState } from "react";
import { default as MentionExtension } from "@tiptap/extension-mention";
import { ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import { useBoundStore } from "@/providers/location-store-provider";
import { AmapPlace } from "@/lib/api/gaode/types";
import localforage from "localforage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverEditor } from "@/components/editor/components/PopoverEditor";

function Mention(props: NodeViewProps) {
  const {
    places,
    AddPlace,
    RemovePlace,
    AddLocation,
    RemoveLocation,
    setFocusModeTargetLocation,
  } = useBoundStore((state) => state);
  const [isOpen, setIsOpen] = useState(false);
  const [place, setPlace] = useState<AmapPlace | null>(null);
  const { id, location, label } = props.node.attrs;

  useEffect(() => {
    // console.log(`Mention ${props.node.attrs.label} added`);
    // Retrial places from local forage
    localforage.getItem(id).then((place) => {
      if (place !== null) {
        AddPlace(place as AmapPlace);
        setPlace(place as AmapPlace);
      }
    });

    AddLocation(location, label, id);
    return () => {
      // RemovePlace(placeId);
      RemoveLocation(id);
      // console.log(`Mention ${props.node.attrs.label} deleted`);
    };
  }, []);

  const handleClick = () => {
    setIsOpen(true);
    const id = props.node.attrs.id;
    if (id !== undefined && id !== "") {
      setFocusModeTargetLocation(id);
    }
  };

  return (
    <NodeViewWrapper className="inline w-fit">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <span
            onClick={handleClick}
            className="mention"
            {...props.HTMLAttributes}
            {...props.extension.options.HTMLAttributes}
          >
            @{label}
          </span>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverEditor mentionId={id} editor={props.editor} place={place} />
        </PopoverContent>
      </Popover>
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
