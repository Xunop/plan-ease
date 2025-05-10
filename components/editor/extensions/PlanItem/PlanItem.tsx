import { mergeAttributes, Node, NodeViewProps } from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { useState } from "react";
import { useBoundStore } from "@/providers/location-store-provider";

import styles from "./style.module.scss";

export const PlanItem = Node.create({
  name: "planItem",
  content: "paragraph block*",
  defining: true,

  parseHTML() {
    return [
      {
        tag: `li[data-type=${this.name}]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "li",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlanItemComponent);
  },
});

function PlanItemComponent(props: NodeViewProps) {
  // console.log("props", props);

  const { GetRoute, SetButtonListPos, SetButtonListOpen, ChangePLHeiLien } = useBoundStore(
    (state) => state,
  );
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    // console.log("mouse enter")
    event.stopPropagation();
    setIsHovered(true);
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    // console.log("mouse leave")
    event.stopPropagation();
    setIsHovered(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Disable bubble
    event.stopPropagation();

    const from = props.editor.state.selection.from;
    const pos = props.editor.view.coordsAtPos(from);
    if (pos) {
      const lineHei = pos.bottom - pos.top;
      SetButtonListOpen(true);
      SetButtonListPos({
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        right: pos.right,
        lineHeight: lineHei,
        nodePos: props.getPos(),
      });

      let dataId = ""
      try {
        const curNode = props.node;
        curNode?.descendants((child) => {
          if (child.type.name === "mention") {
            dataId = child.attrs.id;
            if (dataId !== undefined && dataId !== "") {
              const route = GetRoute(dataId);
              if (route !== undefined) {
                throw new Error("Location found, stopping traversal.");
              }
              // If no route found, continue
            }
          }
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message !== "Location found, stopping traversal."
        ) {
          // Throw error if it doesn't we need
          throw error;
        }
        // Height line this route
        // default
        ChangePLHeiLien(dataId, true, "#fff")
      }
    }
  };

  return (
    <NodeViewWrapper
      as="li"
      // className={`transition-all duration-200 ease-in-out list-image-[url(/icons/map-list.svg)] ${
      className="transition-all duration-250 ease-in-out marker:text-gray-300  text-black border-l-2 border-transparent"
      data-type="planItem"
    >
      <NodeViewContent
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`${isHovered ? styles["plan-item-content-hovered"] : styles["plan-item-content"]}`}
        // data-pos={props.getPos()}
      />
    </NodeViewWrapper>
  );
}
