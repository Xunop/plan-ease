// src/lib/tiptap-extensions/DateNode/DateComponent.tsx

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'; // Import useLayoutEffect
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { parseDateString, dateObjectToDateString } from './dateUtils';
import { DatePickerWrapper } from '@/components/ui/date-picker-wrapper';
import './DateNodeStyles.css';

interface DateNodeViewProps extends NodeViewProps {
  editor: Editor;
}

export const DateComponent: React.FC<DateNodeViewProps> = ({
  node,
  updateAttributes,
  editor,
  getPos,
  deleteNode,
}) => {
  const { dateValue, displayText, isEditing } = node.attrs;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>(displayText);
  const inputRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Ref to store selection details (start and end offsets)
  const selectionRef = useRef<{ start: number; end: number } | null>(null); // <-- Store selection offset

  // Focus and set cursor to end on initial edit mode entry
  useEffect(() => {
    if (isEditing && inputRef.current) {
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        if (el.firstChild) { // Handle content existence
          range.selectNodeContents(el);
          range.collapse(false); // Move to end
        } else { // Handle empty element
          range.setStart(el, 0);
          range.collapse(true);
        }
        selection?.removeAllRanges();
        selection?.addRange(range);
        selectionRef.current = null; // Reset saved selection on initial focus
      }, 50);
    }
  }, [isEditing]); // Only on change of isEditing

  // Sync local input state if displayText attribute changes externally
  useEffect(() => {
    // Avoid overwriting input if currently editing unless displayText truly changes
    if (!isEditing || (isEditing && displayText !== inputValue)) {
       setInputValue(displayText);
    }
  }, [displayText, isEditing]);


  // --- Finalization Logic (Keep as before) ---
  const finalizeEdits = useCallback((newDisplayText?: string) => {
    // ... (finalizeEdits implementation remains the same)
    const textToParse = typeof newDisplayText !== 'undefined' ? newDisplayText : inputValue;
    const parsed = parseDateString(textToParse);

    const finalDisplayText = textToParse;
    const finalDateValue = parsed;

    updateAttributes({
      dateValue: finalDateValue,
      displayText: finalDisplayText,
      isEditing: false,
    });
    setIsPickerOpen(false);

     if (typeof getPos === 'function') {
       const pos = getPos();
       if (typeof pos === 'number') {
         editor.commands.focus(pos + node.nodeSize);
       }
     }
  }, [inputValue, updateAttributes, editor.commands, getPos, node.nodeSize, deleteNode, parseDateString]); // Added parseDateString dependency


  // --- Event Handlers ---

  const handleInputChange = (event: React.FormEvent<HTMLSpanElement>) => {
    const target = event.currentTarget;
    const newText = target.textContent || '';

    // --- Save Selection BEFORE state update ---
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && target.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      // Store offsets relative to the start of the text node content
      selectionRef.current = { start: range.startOffset, end: range.endOffset };
    } else {
      // If selection is lost or outside, maybe try to infer or reset
       selectionRef.current = null; // Or { start: newText.length, end: newText.length } ?
    }

    setInputValue(newText); // Update state, triggering re-render
  };

  // Use useLayoutEffect to restore selection AFTER DOM update
  useLayoutEffect(() => {
    // Only restore if editing, we have a ref, and a selection was saved
    if (isEditing && inputRef.current && selectionRef.current !== null) {
      const el = inputRef.current;
      const { start, end } = selectionRef.current;

      // Check if the text node exists and offsets are within bounds
      if (el.firstChild && start <= (el.textContent?.length ?? 0) && end <= (el.textContent?.length ?? 0)) {
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
    // ... (KeyDown logic remains the same)
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      finalizeEdits();
    } else if (event.key === 'Escape') {
        event.preventDefault();
        finalizeEdits(displayText); // Revert and finalize
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // ... (Blur logic remains mostly the same, check if finalize is needed)
     const relatedTarget = event.relatedTarget as Element | null;
    if (wrapperRef.current && relatedTarget && wrapperRef.current.contains(relatedTarget)) {
      return; // Focus still inside component
    }
     setTimeout(() => {
       // Check if the node instance in the editor state is still marked as editing
       // This avoids race conditions if finalizeEdits was already called
       const currentAttrs = editor.state.doc.nodeAt(getPos())?.attrs;
       if (currentAttrs?.isEditing && !isPickerOpen) {
           finalizeEdits();
       }
     }, 100);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    // ... (Date Select logic remains the same)
    const newDateValue = dateObjectToDateString(selectedDate);
    const newDisplayText = newDateValue || '';
    updateAttributes({
      dateValue: newDateValue,
      displayText: newDisplayText,
      isEditing: false,
    });
    setIsPickerOpen(false);
  };


  // --- Render Logic (Keep as before) ---
  if (isEditing) {
    return (
      <NodeViewWrapper
        ref={wrapperRef}
        as="span"
        className="date-node-wrapper is-editing"
        onBlur={handleBlur}
      >
        <DatePickerWrapper
          value={dateValue}
          onSelectDate={handleDateSelect}
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
        />
        <span
          ref={inputRef}
          className="date-node-input"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleInputChange} // Use onInput to capture changes
          onKeyDown={handleKeyDown}
          // Render inputValue state directly
        >
          {inputValue}
        </span>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="span"
      className={`date-node-wrapper ${!displayText ? 'is-empty' : ''}`}
      onClick={() => { /* ... re-enter editing logic ... */
         if (editor.isEditable) {
            if (typeof getPos === 'function') {
                const pos = getPos();
                if (typeof pos === 'number') {
                    editor.commands.setNodeSelection(pos);
                }
            }
            updateAttributes({ isEditing: true });
         }
      }}
    >
      {displayText || '...'}
    </NodeViewWrapper>
  );
};
