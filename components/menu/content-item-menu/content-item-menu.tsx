import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toolbar } from "@/components/ui/toolbar";
import { PopoverAnchor } from "@radix-ui/react-popover";
import {
  Editor,
  isNodeSelection,
  isTextSelection,
  posToDOMRect,
} from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { useCallback, useEffect, useState } from "react";
import useContentItemActions from "../hooks/useContentItemActions";
import { useData } from "../hooks/useData";
import { generalButtons } from "./buttons";
import { Separator } from "@/components/ui/separator";
import { BlockSelectionContent } from "./block-selection-content";

export type ContentItemMenuProps = {
  editor: Editor;
  isEditable?: boolean;
};

export const ContentItemMenu = ({
  editor,
  isEditable = true,
}: ContentItemMenuProps) => {
  const data = useData();
  const actions = useContentItemActions(
    editor,
    data.currentNode,
    data.currentNodePos,
  );
  const [top, setTop] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);

  const [open, setOpen] = useState<boolean>(false);
  const [isBlockSelectionOpen, setIsBlockSelectionOpen] =
    useState<boolean>(false);

  const buttonText = () => {
    if (editor.isActive("heading", { level: 1 })) {
      return "Heading 1";
    }
    if (editor.isActive("heading", { level: 2 })) {
      return "Heading 2";
    }
    if (editor.isActive("heading", { level: 3 })) {
      return "Heading 3";
    }
    if (editor.isActive("orderedList")) {
      return "Numbered list";
    }
    if (editor.isActive("bulletList")) {
      return "Bulleted list";
    }
    if (editor.isActive("taskList")) {
      return "Todo list";
    }

    return "Normal text";
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const { view } = editor;
      const { state } = view;
      const { selection } = state;
      const { ranges } = selection;

      // Make sure the selection is valid and not an empty text block
      if (selection.empty || !view.hasFocus()) {
        setOpen(false);
        return;
      }

      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));

      const shouldOpen = shouldShow({
        view,
        state,
        from,
        to,
      });

      if (!shouldOpen) {
        setOpen(false);
        return;
      }

      // Get the DOM location corresponding to the selection
      let pos = new DOMRect();
      if (isNodeSelection(editor.state.selection)) {
        const node = editor.view.nodeDOM(from) as HTMLElement;
        if (node) {
          pos = node.getBoundingClientRect();
          setLeft(pos.left ?? 0);
          setTop(pos.top ?? 0);
          setOpen(true);
          return;
        }
      }

      // Use other methods to calculate the location
      pos = posToDOMRect(editor.view, from, to);
      setLeft(pos.left ?? 0);
      setTop(pos.top ?? 0);
      setOpen(true);
    };

    // Requires the user to release the mouse to pop up the menu
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor, isBlockSelectionOpen]);

  const shouldShow = ({
    view,
    state,
    from,
    to,
  }: {
    view: EditorView;
    state: EditorState;
    from: number;
    to: number;
  }) => {
    const { selection } = state;
    const { empty } = selection;

    // Determine whether it is an empty text block
    const isEmptyTextBlock =
      !state.doc.textBetween(from, to).length && isTextSelection(selection);

    if (!view.hasFocus() || empty || isEmptyTextBlock) return false;

    return true;
  };

  if (isEditable) {
    return (
      <div className="flex items-center gap-0.5">
        <Popover open={open}>
          <PopoverAnchor
            className="fixed"
            style={{ top: top - 36, left }}
          ></PopoverAnchor>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e: any) => {
              e.target?.editor ? null : setOpen(false);
            }}
            side="top"
            align="start"
            alignOffset={-20}
            className="w-fit"
          >
            <Toolbar.Wrapper className="flex flex-row flowy-editor-toolbar w-fit h-11">
              <Toolbar.Button key="drop-down" className="w-fit p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-1 font-medium">
                      {buttonText()}
                      <Icon name="ChevronDown" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="center">
                    <BlockSelectionContent editor={editor} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </Toolbar.Button>
              <Separator orientation="vertical" className="my-4 h-6" />
              {generalButtons.map((btn) => (
                <Toolbar.Button
                  key={btn.tooltip}
                  type="button"
                  className={`p-2 hover:bg-gray-200 text-gray-700 ${
                    btn.isActive(editor) ? "bg-gray-100" : ""
                  }`}
                  tooltip={btn.tooltip}
                  onClick={(e) => btn.action(editor)}
                >
                  <btn.Icon />
                </Toolbar.Button>
              ))}
            </Toolbar.Wrapper>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
};
