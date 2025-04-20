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
import { useState, useEffect, useRef } from "react";

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
  // State to track if this list is focused
  const [isFocused, setIsFocused] = useState(false);
  const [buttonTop, setButtonTop] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // console.log("current focus", props.editor.state.selection.$head)
  // console.log("props", props)

  // useEffect(() => {
  //   // const handleSelectionUpdate = () => {
  //   //   const { from, to } = props.editor.state.selection;
  //   //   const pos = props.getPos();
  //   //   const nodeSize = props.node.nodeSize;
  //   //   const selectionInThisList = from >= pos && from < pos + nodeSize;
  //   //
  //   //   // console.log("selection:", from, to);
  //   //   console.log("pos:", pos);
  //   //   // console.log("nodeSize:", nodeSize);
  //   //   // console.log("inlist", selectionInThisList)
  //   //
  //   //   if (!selectionInThisList) {
  //   //     console.log("pos not in this range", pos)
  //   //     setButtonTop(null); // Selection is outside this list, hide buttons
  //   //     return;
  //   //   }
  //   //   console.log("pos in this range", pos)
  //   //
  //   //   let focusedItemTop: number | null = null;
  //   //
  //   //   // Traverse child nodes to locate the selection
  //   //   props.node.descendants((child, childPos) => {
  //   //     // console.log("child:", child)
  //   //     // console.log("childPos:", childPos)
  //   //
  //   //     if (child.type.name === "planItem") {
  //   //       const itemStart = pos + childPos + 1; // +1 to account for the node itself
  //   //       const itemEnd = itemStart + child.nodeSize - 1;
  //   //
  //   //       // console.log("item: ", itemStart, from, itemEnd)
  //   //
  //   //       if (from >= itemStart && from <= itemEnd) {
  //   //         // Check if this PlanItem has a nested PlanList
  //   //         const hasSublist = child.content.content.some(
  //   //           (c) => c.type.name === "planList",
  //   //         );
  //   //
  //   //         if (hasSublist) {
  //   //           // If there's a sublist, check if the selection is within it
  //   //           let selectionInSublist = false;
  //   //           child.descendants((subChild, subPos) => {
  //   //             if (subChild.type.name === "planList") {
  //   //               // Offset
  //   //               const subListStart = itemStart + subPos;
  //   //               const subListEnd = subListStart + subChild.nodeSize;
  //   //               console.log(`subListStart: ${subListStart}, subListEnd: ${subListEnd}, itemStart: ${itemStart}, from: ${from}, itemEnd: ${itemEnd}, subPos: ${subPos}, subListSize: ${subChild.nodeSize}`)
  //   //               // 如果聚焦的 item 在 subList 中
  //   //               if (from >= subListStart && from < subListEnd) {
  //   //                 // selectionInSublist = true;
  //   //                 return false; // Stop traversal
  //   //               }
  //   //             }
  //   //           });
  //   //
  //   //           // If selection is in the sublist, don't show buttons here
  //   //           if (selectionInSublist) {
  //   //             return false;
  //   //           }
  //   //         }
  //   //
  //   //         // If no sublist or selection isn't in a sublist, this is the target item
  //   //         const itemElement = listRef.current?.querySelector(
  //   //           `[data-pos="${itemStart}"]`,
  //   //         ) as HTMLElement;
  //   //         if (itemElement && listRef.current) {
  //   //           const listRect = listRef.current.getBoundingClientRect();
  //   //           const itemRect = itemElement.getBoundingClientRect();
  //   //           focusedItemTop = itemRect.top - listRect.top;
  //   //         }
  //   //         return false; // Stop traversal
  //   //       }
  //   //     }
  //   //   });
  //   //
  //   //   console.log("focusedItemTop", focusedItemTop)
  //   //   // Adjust button position based on the focused item
  //   //   setButtonTop(focusedItemTop);
  //   // };
  //
  //   const handleSelectionUpdate = () => {
  //     const { from } = props.editor.state.selection;
  //     const pos = props.getPos();
  //     const nodeSize = props.node.nodeSize;
  //     const selectionInThisList = from >= pos && from < pos + nodeSize;
  //
  //     if (!selectionInThisList) {
  //       setButtonTop(null); // Selection is outside this list, hide buttons
  //       return;
  //     }
  //
  //     let shouldShowButtons = false;
  //     let focusedItemTop: number | null = null;
  //
  //     // Traverse child nodes to locate the selection
  //     props.node.descendants((child, childPos) => {
  //       if (child.type.name === "planItem") {
  //         const itemStart = pos + childPos + 1; // +1 to account for the node itself
  //         const itemEnd = itemStart + child.nodeSize - 1;
  //
  //         if (from >= itemStart && from <= itemEnd) {
  //           // Check if this PlanItem has a nested PlanList
  //           const hasSublist = child.content.content.some(
  //             (c) => c.type.name === "planList",
  //           );
  //
  //           if (hasSublist) {
  //             // Show buttons only if there’s a sublist
  //             shouldShowButtons = true;
  //             const itemElement = listRef.current?.querySelector(
  //               `[data-pos="${itemStart}"]`,
  //             ) as HTMLElement;
  //             if (itemElement && listRef.current) {
  //               const listRect = listRef.current.getBoundingClientRect();
  //               const itemRect = itemElement.getBoundingClientRect();
  //               focusedItemTop = itemRect.top - listRect.top;
  //               console.log(`listRect: ${listRect}, itemRect: ${itemRect}, focusedItemTop: ${focusedItemTop}`)
  //             }
  //           }
  //           return false; // Stop traversal after finding the focused item
  //         }
  //       }
  //     });
  //
  //     setButtonTop(shouldShowButtons ? focusedItemTop : null);
  //   };
  //
  //   props.editor.on("selectionUpdate", handleSelectionUpdate);
  //   return () => {
  //     props.editor.off("selectionUpdate", handleSelectionUpdate);
  //   };
  // }, [props.editor, props.getPos, props.node]);

  const handlePrintNestedLists = (event: React.MouseEvent) => {
    event.stopPropagation();
    const pos = props.getPos();
    const listNode = props.editor.state.doc.nodeAt(pos);
    if (!listNode) return;

    const nestedLists: any = [];
    listNode.descendants((child) => {
      if (child.type.name === "planList") {
        nestedLists.push(child.toJSON());
      }
    });
    console.log("Nested lists:", nestedLists);
  };

  return (
    <NodeViewWrapper as="ul" ref={listRef} className="relative" data-type="planList">
      <NodeViewContent />
    </NodeViewWrapper>
  );
  // return (
  //   <NodeViewWrapper>
  //     <NodeViewContent as="ul" />
  //   </NodeViewWrapper>
  // );
}

export default PlanList;
