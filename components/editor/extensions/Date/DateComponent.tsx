import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { NodeViewWrapper, NodeViewProps, NodeViewContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import { parseDateString, dateObjectToDateString } from "./utils";
import { DatePickerWrapper } from "./DatePicker";

import "./DateNodeStyles.scss";
import { cn } from "@/lib/utils";
import { getStore } from "@/providers/location-store-provider";

// Helper type for Tiptap editor instance within props
interface DateNodeViewProps extends NodeViewProps {
  editor: Editor;
}

export const DateComponent: React.FC<DateNodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  getPos, // Function to get the node's current position
  deleteNode, // Function to delete the node
}) => {
  const { dateId, dateValue, displayText, isEditing } = node.attrs;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(displayText);
  // Ref to track IME composition state
  const isComposingRef = useRef(false);
  // Ref for the editable span to manage focus and content
  const inputRef = useRef<HTMLSpanElement>(null);
  // Ref for the main wrapper to help with blur detection
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Store selection offset
  const selectionRef = useRef<{ start: number; end: number } | null>(null);

  // Centralized Date Storage/Logging Logic
  const previousDateValueRef = useRef<string | null | undefined>(dateValue);

  const store = getStore();
  const { dates, GetDateById, AddDate, RemoveDate } = store.getState();

  useEffect(() => {
    const currentDateValue = node.attrs.dateValue;
    const previousDateValue = previousDateValueRef.current;

    if (currentDateValue !== previousDateValue) {
      // console.log("Update date value", currentDateValue, dateId);
      AddDate(dateId, currentDateValue);
      // Update the ref for the next render cycle
      previousDateValueRef.current = currentDateValue;
    }
  }, [dateValue, dateId, AddDate, RemoveDate]);

  useEffect(() => {
    if (dateValue) {
      // console.log(`Init Date Value: ${dateValue} ${dateId}`)
      AddDate(dateId, dateValue);
    }
    return () => {
      // console.log(`Remove Date Value: ${dateValue} ${dateId}`);
      RemoveDate(dateId);
    };
  }, []);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Small timeout often helps ensure the element is fully ready for focus
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        // Move cursor to the end of the existing text
        const selection = window.getSelection();
        const range = document.createRange();
        if (el.firstChild) {
          range.selectNodeContents(el);
          range.collapse(false); // false collapses to the end
        } else {
          // Handle empty element
          range.setStart(el, 0);
          range.collapse(true);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
        // Reset saved selection on initial focus
        selectionRef.current = null;
        isComposingRef.current = false;
      }, 50);
    }
  }, [isEditing]);

  useEffect(() => {
    // Avoid overwriting input if currently editing unless displayText truly changes
    if (!isEditing || (isEditing && displayText !== inputValue)) {
      setInputValue(displayText);
    }
  }, [displayText, isEditing]);

  const finalizeAndAddSpace = useCallback(
    (attrsToUpdate: Partial<typeof node.attrs>) => {
      updateAttributes(attrsToUpdate);
      setIsPickerOpen(false); // Ensure picker is closed

      // Use setTimeout to allow the updateAttributes transaction to complete
      // and the node's state (isEditing=false) to render before moving focus/inserting space
      setTimeout(() => {
        if (typeof getPos === "function" && editor.isEditable) {
          const pos = getPos();
          if (typeof pos === "number") {
            // Calculate position immediately after the node
            const endPos = pos + node.nodeSize;

            // Check if the character immediately following the node is already a space
            // Use empty string '' as block separator to check only immediate character
            const nextChar = editor.state.doc.textBetween(
              endPos,
              endPos + 1,
              "",
            );

            if (nextChar !== " ") {
              // If no space, insert one and focus after it
              console.log("insert space");
              editor.chain().focus(endPos).insertContent(" ").run();
            } else {
              // If space exists, just move focus after the existing space
              editor.commands.focus(endPos + 1);
            }
          }
        }
      }, 0); // Timeout 0 pushes execution to after current stack/render
    },
    [updateAttributes, getPos, editor, node.nodeSize],
  );

  // Finalization Logic
  const finalizeEdits = useCallback(
    (newDisplayText?: string) => {
      const textToParse =
        typeof newDisplayText !== "undefined" ? newDisplayText : inputValue;
      const parsed = parseDateString(textToParse);

      // If input is empty or invalid after editing, maybe delete the node? Or keep it?
      // Option 1: Keep it with empty display / null value
      const finalDisplayText = textToParse;
      const finalDateValue = parsed;

      // Option 2: Delete node if input is invalid/empty (might be more user-friendly)
      // if (!textToParse.trim() || !parsed) {
      //   deleteNode();
      //   return;
      // }
      // const finalDisplayText = textToParse;
      // const finalDateValue = parsed;

      finalizeAndAddSpace({
        dateValue: finalDateValue,
        displayText: finalDisplayText,
        isEditing: false,
      });
    },
    [inputValue, deleteNode, finalizeAndAddSpace],
  );

  // This is extracted to be callable from both onInput and onCompositionEnd
  const updateInputState = useCallback((target: HTMLSpanElement) => {
    const newText = target.textContent || "";

    // Save Selection
    const selection = window.getSelection();
    if (
      selection &&
      selection.rangeCount > 0 &&
      target.contains(selection.anchorNode)
    ) {
      const range = selection.getRangeAt(0);
      selectionRef.current = { start: range.startOffset, end: range.endOffset };
    } else {
      selectionRef.current = null;
    }

    setInputValue(newText);
  }, []);

  const handleInputChange = (event: React.FormEvent<HTMLSpanElement>) => {
    // IME Check
    if (isComposingRef.current) {
      // If IME is active, do nothing during onInput.
      // The update will happen on compositionend.
      return;
    }

    updateInputState(event.currentTarget);
  };

  // IME Event Handlers
  const handleCompositionStart = () => {
    isComposingRef.current = true;
    // Composition starts, don't save selection/update state yet
    selectionRef.current = null; // Clear saved selection during composition
  };
  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLSpanElement>,
  ) => {
    isComposingRef.current = false;
    // Composition finished, now update the state with the final content
    // Use setTimeout to ensure the DOM has the final composed text
    // setTimeout(() => {
    //   if (inputRef.current) {
    //     updateInputState(event.currentTarget as HTMLSpanElement);
    //   }
    // }, 0); // Delay slightly to allow browser to finalize IME composition
  };

  // Use useLayoutEffect to restore selection AFTER DOM update
  useLayoutEffect(() => {
    // Only restore if editing, we have a ref, and a selection was saved *outside* of composition
    if (
      isEditing &&
      inputRef.current &&
      selectionRef.current !== null &&
      !isComposingRef.current
    ) {
      const el = inputRef.current;
      const { start, end } = selectionRef.current;

      // Check if the text node exists and offsets are within bounds
      if (
        el.firstChild &&
        start <= (el.textContent?.length ?? 0) &&
        end <= (el.textContent?.length ?? 0)
      ) {
        try {
          const range = document.createRange();
          // IMPORTANT: Set range relative to the text node (el.firstChild)
          range.setStart(el.firstChild, start);
          range.setEnd(el.firstChild, end);

          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (e) {
          console.error("Error restoring selection:", e);
          // Fallback: put cursor at end if restoration fails
        }
      }
      // We don't reset selectionRef.current here; let the next input save the new position.
    }
  }, [inputValue, isEditing]); // Re-run when inputValue changes (after re-render)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      finalizeEdits();
    } else if (event.key === "Escape") {
      event.preventDefault();
      // Revert to original displayText or delete? Let's revert and finalize.
      finalizeEdits(displayText); // Finalize with the original text before editing started
      // Alternative: delete node on escape?
      // deleteNode();
    }
    // Could handle Arrow keys to open picker, etc.
  };

  // Handle blur more carefully to prevent closing when interacting with Popover
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // relatedTarget is the element receiving focus (if any)
    const relatedTarget = event.relatedTarget as Element | null;

    // Check if the focus is moving *within* the component (wrapper, input, button, popover content)
    if (
      wrapperRef.current &&
      relatedTarget &&
      wrapperRef.current.contains(relatedTarget)
    ) {
      // Focus is still inside the component, do nothing
      return;
    }

    // If focus moves outside, finalize edits
    // Use setTimeout to allow click events (like on Popover trigger) to fire first
    setTimeout(() => {
      const currentAttrs = editor.state.doc.nodeAt(getPos() === undefined ? 0 : getPos() as number)?.attrs;
      if (currentAttrs?.isEditing && !isPickerOpen) {
        finalizeEdits();
      }
    }, 100); // Small delay
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    const newDateValue = dateObjectToDateString(selectedDate);
    const newDisplayText = newDateValue || ""; // Display the selected date as yyyy-mm-dd
    // Or use a different display format:
    // const newDisplayText = selectedDate ? formatDateForDisplay(newDateValue) : '';

    // Update attributes directly, this also finalizes
    updateAttributes({
      dateValue: newDateValue,
      displayText: newDisplayText,
      isEditing: false, // Exit editing mode
    });
    setIsPickerOpen(false); // Close picker
  };

  // Render based on editing state
  if (isEditing) {
    return (
      <NodeViewWrapper
        ref={wrapperRef} // Attach ref to the outer element
        as="span"
        className="date-node-wrapper is-editing"
        // className={cn(styles.dateNodeWrapper, styles.isEditing)}
        onBlur={handleBlur} // Attach blur handler to the wrapper
      >
        <DatePickerWrapper
          value={dateValue} // Pass the stored yyyy-mm-dd value
          selectDateAction={handleDateSelect}
          open={isPickerOpen}
          openChangeAction={setIsPickerOpen} // Control the picker's open state
        />
        <span
          ref={inputRef}
          className="date-node-input"
          contentEditable={true} // Make the span editable
          suppressContentEditableWarning={true} // Suppress React warning
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          date-id={dateId}
          date-date={dateValue}
          // We handle blur on the wrapper now
        >
          {inputValue}
        </span>
      </NodeViewWrapper>
    );
  }

  // Display State
  return (
    <NodeViewWrapper
      as="span"
      className={`date-node-wrapper ${!displayText ? "is-empty" : ""}`}
      // className={cn(styles.dateNodeWrapper, { [styles.isEmpty]: !displayText })}
      onClick={() => {
        // Allow clicking to re-enter editing mode
        if (editor.isEditable) {
          // Set selection to inside the node before enabling editing
          if (typeof getPos === "function") {
            const pos = getPos();
            if (typeof pos === "number") {
              // Select node or place cursor - selecting node might be safer
              editor.commands.setNodeSelection(pos);
            }
          }
          updateAttributes({ isEditing: true });
        }
      }}
      date-id={dateId}
      date-date={dateValue}
    >
      {displayText || "..."}
    </NodeViewWrapper>
  );
};
