import React from "react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import styles from "./style.module.scss"; // Import your styles

interface CommandNodeComponentProps extends NodeViewProps {
  node: NodeViewProps["node"] & {
    attrs: {
      command: string;
      data: string | null;
    };
  };
}

export function CommandNodeComponent(props: CommandNodeComponentProps) {
  const { command, data } = props.node.attrs;

  // Add specific classes based on the command for targeted styling if needed
  const commandClassName = command ? `command-${command.toLowerCase()}` : "";

  return (
    <NodeViewWrapper
      as="span" // Render as an inline span
      className={`${styles["command-node"]} ${commandClassName}`}
      data-command={command}
    >
      {/* Display the data in the desired format */}
      {/* Add loading/error state handling here if doing real async calls */}
      {data !== null ? `{{${data}}}` : `{{Loading ${command}...}}`}
    </NodeViewWrapper>
  );
}
