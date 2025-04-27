import { useBoundStore } from "@/providers/location-store-provider";
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { useEffect, useRef } from "react";
// import { Fragment, Node as ProseMirrorNode } from "prosemirror-model";

const TextStyleName = "textStyle";
// Trigger regex for `~ `
const inputRegex = /^~\s$/;

export const Formulas = Node.create({
  name: "dataRoute",

  content() {
    return "listItem+";
  },

  // Group as a block node
  group: "block list",

  addAttributes() {
    return {
      start: {
        default: 1,
        parseHTML: (element) => {
          return element.hasAttribute("start")
            ? parseInt(element.getAttribute("start") || "", 10)
            : 1;
        },
      },
      type: {
        default: null,
        parseHTML: (element) => element.getAttribute("type"),
      },
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("route-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "route-id": attributes.id,
          };
        },
      },
    };
  },

  // Input rule to trigger the node with `~ `
  addInputRules() {
    let inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
      keepMarks: this.options.keepMarks,
      keepAttributes: this.options.keepAttributes,
      getAttributes: () => ({
        start: 1,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        ...this.editor.getAttributes(TextStyleName),
      }),
      // joinPredicate: (match, node) =>
      //   node.childCount + node.attrs.start === +match[1],
    });
    return [inputRule];
  },

  // Parse HTML: match <ol> with data-type="dataRoute"
  parseHTML() {
    return [
      {
        tag: `ol[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },

  // Render HTML: output <ol> with data-type attribute
  renderHTML({ HTMLAttributes }) {
    const { start, ...attributesWithoutStart } = HTMLAttributes;

    return start === 1
      ? [
          "ol",
          mergeAttributes(this.options.HTMLAttributes, attributesWithoutStart, {
            "data-type": this.name,
          }),
          0,
        ]
      : [
          "ol",
          mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
          {
            "data-type": this.name,
          },
          0,
        ];
  },

  // Add React node view
  addNodeView() {
    return ReactNodeViewRenderer(FormulasComponent);
  },
});

function FormulasComponent(props: NodeViewProps) {
  const items = props.node.content.content || [];
  const {
    routes,
    RemoveRoute,
    RemoveLocationFromRoute,
    AddLocationToRoute,
  } = useBoundStore((state) => state);
  const prevMentionedLocationsRef = useRef<string[]>([]);

  // Function to extract all location fields from mentions in items
  const getMentionedLocations = (items: any[]): string[] => {
    const locations: string[] = [];
    items.forEach((item) => {
      // console.log("DEBUG::mentions::content:", item)
      if (item.type.name === "listItem" && item.content) {
        item.content.forEach((content: any) => {
          if (content.type.name === "paragraph" && content.content) {
            content.content.forEach((subcontent: any) => {
              if (
                subcontent.type.name === "mention" &&
                subcontent.attrs &&
                subcontent.attrs.location
              ) {
                locations.push(subcontent.attrs.location);
              }
            });
          }
        });
      }
    });
    return locations;
  };

  useEffect(() => {
    console.log("DEBUG::routes:", routes);
  }, [routes]);

  useEffect(() => {
    const routeId = props.node.attrs.id;
    console.log("content: ", items, items.length, routeId);
    const currentMentionedLocations = getMentionedLocations(items as any[]);
    console.log("DEBUG::mentions::locations: ", currentMentionedLocations);
    if (currentMentionedLocations.length > 0) {
      const prevMentionedLocations = prevMentionedLocationsRef.current;

      // Locations newly added (in current but not in previous)
      const addedLocations = currentMentionedLocations.filter(
        (loc) => !prevMentionedLocations.includes(loc),
      );

      // Locations removed (in previous but not in current)
      const removedLocations = prevMentionedLocations.filter(
        (loc) => !currentMentionedLocations.includes(loc),
      );

      console.log("DEBUG::mentions::addedLocations:", addedLocations)
      console.log("DEBUG::mentions::removedLocations:", removedLocations)
      // Add newly mentioned locations
      addedLocations.forEach((location) => {
        AddLocationToRoute(routeId, location);
        // RemoveLocationFromRoute(routeId, location);
      });

      // Remove locations that are no longer mentioned
      removedLocations.forEach((location) => {
        // AddLocationToRoute(routeId, location);
        RemoveLocationFromRoute(routeId, location);
      });

      // Update the ref with current locations for the next render
      prevMentionedLocationsRef.current = currentMentionedLocations;
    }
  }, [items, AddLocationToRoute, RemoveLocationFromRoute]);


  useEffect(() => {
    return () => {
      const id = props.node.attrs.id
      if (id !== undefined) {
        RemoveRoute(id);
        console.log("Route delete:", id);
      }
    };
  }, []);

  return (
    <NodeViewWrapper
      as="ol"
      data-type="dataRoute"
      className="tiptap"
      {...props.HTMLAttributes}
      {...props.extension.options.HTMLAttributes}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
