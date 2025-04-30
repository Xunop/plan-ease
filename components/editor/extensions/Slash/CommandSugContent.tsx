// CommandSugContent.tsx (Conceptual Changes)
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  forwardRef,
} from "react";
import { debounce, throttle } from "lodash"; // Import debounce
import {
  CommandContext,
  CommandResult,
  CommandSuggestion,
  ResolvedOptions,
} from "./types"; // Adjust paths
import { commands } from "./commands"; // Adjust path
// import { resolveImplicitOptions } from "./commandUtils"; // Adjust path
import { Editor, Range } from "@tiptap/core";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { getStore } from "@/providers/location-store-provider";
import "./List.scss";

export interface CmdSugRef {
  handleShow: () => void;
  handleHide: () => void;
  handleKeydown: ({ event }: { event: KeyboardEvent }) => boolean;
}

interface CommandSugContentProps {
  // Expects the structured SuggestionItem array now
  items: CommandSuggestion[];
  editor: Editor;
  range: Range; // Need the range for context position
  decorationNode: Element;
  command: (args: { commandName: string }) => void; // Pass command name on selection
}

// Inside the component:
export const CommandSugContent = forwardRef<CmdSugRef, CommandSugContentProps>(
  (props, ref) => {
    const suggestionItems = props.items;
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [open, setOpen] = useState<boolean>(false);
    const [position, setPosition] = useState({
      top: 0,
      left: 0,
      height: 0,
      bottom: 0,
    });

    const [side, setSide] = useState<"top" | "bottom">("bottom");
    const popoverRef = useRef<HTMLDivElement>(null);

    const [dynamicWidth, setDynamicWidth] = useState<string>("auto"); // Start with 'auto' or a fallback width like '170px'
    // Callback to Calculate and Set Width
    const updateWidth = useCallback(() => {
      if (props.editor?.view?.dom) {
        const editorWidth = props.editor.view.dom.clientWidth;

        // 60% of editor width
        const fraction = 3 / 5;

        let desiredWidth = editorWidth * fraction;

        // Apply a minimum width
        desiredWidth = Math.max(150, desiredWidth);

        setDynamicWidth(`${desiredWidth}px`);
      } else {
        setDynamicWidth("200px"); // Fallback width if editor isn't available
      }
    }, [props.editor]);

    // --- Effect to Calculate Width When Opening ---
    useEffect(() => {
      if (open) {
        updateWidth(); // Calculate width when popover opens
      }
    }, [open, updateWidth]);

    useEffect(() => {
      if (!open || !props.editor?.view?.dom) return;
      const pos = props.decorationNode?.getBoundingClientRect();
      if (pos) {
        // Estimate the height of the PopoverContent
        const popoverHeight =
          popoverRef.current?.getBoundingClientRect().height || 200; // Fallback to 200px if not rendered yet
        const viewportHeight = window.innerHeight;

        // Margin to ensure some space between Popover and viewport edge
        const margin = 20;

        // Check if there's enough space below the anchor
        const spaceBelow = viewportHeight - pos.bottom;
        // console.log(
        //     `popoverHeight: ${popoverHeight}, viewportHeight: ${viewportHeight}, spcae: ${spaceBelow}`,
        // );
        if (spaceBelow < popoverHeight + margin) {
          // Not enough space below, show Popover above
          setSide("top");
        } else {
          // Enough space below, show Popover below
          setSide("bottom");
        }
        setPosition({
          top: pos.top,
          left: pos.left,
          height: pos.height,
          bottom: pos.bottom,
        });
      }

      const editorElement = props.editor.view.dom;

      // Throttle the update function to avoid excessive calls during resize/drag
      const throttledUpdateWidth = throttle(updateWidth, 100); // Update max every 100ms

      // Create an observer instance linked to the throttled callback
      const observer = new ResizeObserver(() => {
        throttledUpdateWidth();
      });

      // Start observing the editor element
      observer.observe(editorElement);

      return () => {
        observer.unobserve(editorElement);
        observer.disconnect();
        throttledUpdateWidth.cancel?.();
      };
    }, [open, updateWidth]);

    const upHandler = () => {
      // console.log("up");
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length,
      );
    };

    const downHandler = () => {
      // console.log("down");
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
      handleShow: () => {
        setOpen(true);
      },
      handleHide: () => {
        setOpen(false);
      },
      handleKeydown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    // Selection logic
    const selectItem = (index: number) => {
      const selected = suggestionItems[index];
      if (selected) {
        props.command({ commandName: selected.command.name }); // Pass command name back
      }
    };

    const handleOpenAutoFocus = () => {
      props.editor.commands.focus(
        props.editor.view.state.selection.$anchor.pos,
      );
    };
    const handleEscapeKeyDown = () => {
      console.log("Escape key pressed, closing Popover.");
      // props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
    };

    // Render logic using `suggestionItems` state
    return (
      <Popover open={open}>
        <PopoverContent
          onOpenAutoFocus={handleOpenAutoFocus}
          onEscapeKeyDown={handleEscapeKeyDown}
          style={{
            position: "absolute",
            top: position.bottom,
            left: position.left,
            width: dynamicWidth,
            maxWidth: "none",
          }}
          side={side}
          align="start"
          className="p-0"
        >
          <div className="cmd-dropdown-menu">
            {suggestionItems.length ? (
              suggestionItems.map((item, index) => (
                <button
                  className={index === selectedIndex ? "is-selected" : ""}
                  key={item.id}
                  onClick={() => selectItem(index)}
                  // Keep the full displayText in the title for tooltips/accessibility
                  title={item.displayText}
                >
                  {/* Display Command Prefix (Assuming segments cover the part *after* the prefix) */}
                  <span className="cmd-prefix">{item.commandPrefix}</span>

                  {/* Render based on segments if definition and segments exist */}
                  {
                    item.baseDefinition?.segments
                      ? // Iterate through the segments defined in the command's format
                        item.baseDefinition.segments.map(
                          (segment, segIndex) => {
                            if (segment.type === "literal") {
                              // Use segment index and type/name for a unique React key
                              const segmentKey = `${segIndex}-lit`;
                              // Render literal text directly (might contain spaces)
                              return (
                                <span key={segmentKey} className="cmd-literal">
                                  {segment.value}
                                </span>
                              );
                            } else if (segment.type === "option") {
                              const segmentKey = `${segIndex}-opt-${segment.name}`;
                              // Find the actual value for this option placeholder
                              // from the specific suggestion's options map.
                              const optionValue = item.options[segment.name];
                              return (
                                <span
                                  key={segmentKey}
                                  // Add both a general class and a specific class for styling
                                  className={`cmd-option cmd-option-${segment.name}`}
                                >
                                  {/* Display the value if found, otherwise show the placeholder name */}
                                  {optionValue !== undefined
                                    ? optionValue
                                    : `{${segment.name}}`}
                                </span>
                              );
                            }
                            // Should ideally not happen with valid segment types
                            return null;
                          },
                        )
                      : // --- Fallback Rendering ---
                        // If baseDefinition or segments are missing, fall back to rendering
                        // the options directly after the prefix. Add a space before each.
                        Object.entries(item.options).map(([key, value]) => (
                          <React.Fragment key={`fallback-${key}`}>
                            {" "}
                            {/* Add space before each fallback option */}
                            {/* Use a distinct class for fallback options if needed */}
                            <span className={`option-fallback option-${key}`}>
                              {value}
                            </span>
                          </React.Fragment>
                        ))
                    // --- Alternative Fallback ---
                    // Or, simply display the rest of the pre-formatted displayText:
                    // <span className="cmd-display-text-fallback">
                    //  {' '}{item.displayText.substring(item.commandPrefix.length)}
                    // </span>
                  }

                  {/* --- Original commented out preview logic remains untouched --- */}
                  {/*
        <small>
          {item.command.description || item.command.format}
        </small>
        ... etc ...
        */}
                </button>
              ))
            ) : (
              <div className="item">No matching commands</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);
