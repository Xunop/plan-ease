import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/core";
import {
  Check,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Text,
} from "lucide-react";
import React, { useMemo } from "react";

export const BlockSelectionContent = ({ editor }: { editor: Editor }) => {
  const formattingActions = useMemo(() => {
    return [
      {
        label: "Text",
        group: "Hierarchy",
        command: () => editor.chain().focus().setParagraph().run(),
        isActive:
          !editor.isActive("bulletList") &&
          !editor.isActive("orderedList") &&
          !editor.isActive("taskList") &&
          !editor.isActive("heading"),
        Icon: Text,
      },
      {
        label: "Heading 1",
        group: "Hierarchy",
        command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive("heading", { level: 1 }),
        Icon: Heading1,
      },
      {
        label: "Heading 2",
        group: "Hierarchy",
        command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive("heading", { level: 2 }),
        Icon: Heading2,
      },
      {
        label: "Heading 3",
        group: "Hierarchy",
        command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive("heading", { level: 3 }),
        Icon: Heading3,
      },
      {
        label: "Numbered list",
        group: "Lists",
        command: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive("orderedList"),
        Icon: ListOrdered,
      },
      {
        label: "Bulleted list",
        group: "Lists",
        command: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive("bulletList"),
        Icon: List,
      },
      {
        label: "Todo list",
        group: "Lists",
        command: () => editor.chain().focus().toggleTaskList().run(),
        isActive: editor.isActive("taskList"),
        Icon: ListTodo,
      },
    ];
  }, [editor]);

  let lastGroup = "";

  return (
    <div className="flex flex-col gap-0.5 px-2 py-4 bg-white rounded-lg dark:bg-black  border-neutral-200 dark:border-neutral-800 w-fit">
      {formattingActions.map((block, i) => {
        const isNewGroup = block.group !== lastGroup;
        if (isNewGroup) {
          lastGroup = block.group;
        }

        return (
          <React.Fragment key={i}>
            {isNewGroup && (
              <div
                key={`group-${block.group}`}
                className="text-[.65rem] font-semibold mb-1 uppercase text-neutral-500 dark:text-neutral-400 px-1.5"
              >
                {block.group}
              </div>
            )}

            <DropdownMenuItem
              key={`menu-item-${i}`}
              className={cn(
                "flex items-center gap-2 p-1.5 text-sm font-medium text-left w-full rounded hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-neutral-200",
                block.isActive
                  ? "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                  : "bg-transparent text-neutral-500 dark:text-neutral-400",
              )}
              onClick={() => block.command()}
            >
              <div className="flex items-center align-middle">
                <block.Icon />
                <span className="ml-2">{block.label}</span>
              </div>
            </DropdownMenuItem>

            {i < formattingActions.length - 1 &&
              formattingActions[i + 1].group !== block.group && (
                <DropdownMenuSeparator key={`separator-${block.group}-${i}`} />
              )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
