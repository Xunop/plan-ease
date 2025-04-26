import {
  mergeAttributes,
  Node,
  NodeViewProps,
  wrappingInputRule,
} from "@tiptap/core";
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { useRef } from "react";

import styles from "./style.module.scss";

const inputRegex = /^~\s$/;

const PlanList = Node.create({
  name: "planList",
  draggable: true,
  content() {
    return "planItem+";
  },
  group: "block list",

  addNodeView() {
    return ReactNodeViewRenderer(PlanListComponent);
  },

  // Input rule to trigger the node with `~ `
  addInputRules() {
    let inputRule = wrappingInputRule({
      find: inputRegex,
      type: this.type,
      keepMarks: this.options.keepMarks,
      keepAttributes: this.options.keepAttributes,
    });
    return [inputRule];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ul",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      {
        "data-type": this.name,
      },
      0,
    ];
  },

  parseHTML() {
    return [
      {
        tag: `ul[data-type="${this.name}"]`,
        priority: 51,
      },
    ];
  },
});

function PlanListComponent(props: NodeViewProps) {
  const listRef = useRef<HTMLUListElement>(null);

  return (
    <NodeViewWrapper
      as="ul"
      ref={listRef}
      // className={`relative ${styles["plan-list"]}`}
      className="relative"
      data-type="planList"
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

export default PlanList;
