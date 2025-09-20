"use client";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import localForage from "localforage";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { forwardRef } from "react";
import { Editor } from "@tiptap/core";
import "./List.scss";
import { AmapPlace, AmapTip } from "@/lib/api/gaode/types";
import {
  fetchAmapGeocode,
  fetchAmapPlaceById,
  fetchAmapPlaceByKeywords,
} from "@/lib/api/gaode/search";
import { useBoundStore } from "@/providers/location-store-provider";
import localforage from "localforage";
import { generateFixedLengthId } from "@/lib/utils/index";
import { throttle } from "lodash";

interface SuggestionContentProps {
  items: AmapTip[];
  editor: Editor;
  decorationNode: Element;
  command: (args: { id: string; label: string; location: string }) => void;
}

export interface SuggestionContentRef {
  handleShow: () => void;
  handleHide: () => void;
  handleKeydown: ({ event }: { event: KeyboardEvent }) => boolean;
}

export const SuggestionContent = forwardRef<
  SuggestionContentRef,
  SuggestionContentProps
>((props, ref) => {
  const [open, setOpen] = useState<boolean>(false);

  const [dynamicWidth, setDynamicWidth] = useState<string>("auto");

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

  useImperativeHandle(ref, () => ({
    handleShow: () => {
      console.log("show sug")
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

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    height: 0,
    bottom: 0,
  });

  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const popoverRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const { AddLocation, places, AddPlace, RemovePlace } = useBoundStore(
    (state) => state,
  );

  const selectItem = (index: number) => {
    const item = props.items[index];

    let place: AmapPlace;

    // FIXME: `location` still need more check.
    if (item) {
      // Use `location` as id, but formatted as `lng-lat`
      // let uniqueId: string;
      const uniqueId = generateFixedLengthId(8, "mention-");
      let location: string;
      const placeId = item.id;
      // The id will no return when search a city.
      if (Array.isArray(placeId) && placeId.length === 0) {
        // Fetch location if not available
        fetchAmapPlaceByKeywords(item.name)
          .then((places) => {
            place = places[0];
            location = place.location;
            // uniqueId = location.split(",")[0] + "-" + location.split(",")[1];

            // When selected a place, we need to store it.
            place.id = uniqueId;
            AddPlace(place);
            localforage.setItem(uniqueId, place).then(() => {
              // command implement see Suggestion.tsx
              props.command({
                id: uniqueId,
                label: place.name,
                location: location,
              });
            });
          })
          .catch((error) => {
            console.error("Error fetching place:", error);
          });
      } else {
        // First get place from localforage, if not exist will to fetch from remote
        localforage.getItem(uniqueId).then((value) => {
          if (value === null) {
            fetchAmapPlaceById(placeId)
              .then((places) => {
                if (places.length > 0) {
                  place = places[0];
                  location = place.location;
                  // uniqueId = location.split(",")[0] + "-" + location.split(",")[1];
                  place.id = uniqueId;
                  AddPlace(place);
                  localforage.setItem(uniqueId, place).then(() => {
                    props.command({
                      id: uniqueId,
                      label: place.name,
                      location: location,
                    });
                  });
                } else {
                  // uniqueId = item.location.split(",")[0] + "-" + item.location.split(",")[1];
                  props.command({
                    id: uniqueId,
                    label: item.name,
                    location: item.location,
                  });
                }
              })
              .catch((error) => {
                console.error("Error fetching place:", error);
              });
          } else {
            // AddLocation(location);
            place.id = uniqueId;
            AddPlace(place);
          }
        });
      }
    }
  };

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

  useEffect(() => setSelectedIndex(0), [props.items]);

  const handleOpenAutoFocus = () => {
    // console.log("Popover opened, focus will be set to the content.");
    // commandRef.current?.focus();

    props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
    // console.log("focus", props.editor.view.hasFocus());
  };

  const handleEscapeKeyDown = () => {
    console.log("Escape key pressed, closing Popover.");
    // props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
  };

  // FIXME: The side props not affect the direction of the popover
  return (
    <Popover open={open}>
      <PopoverContent
        ref={popoverRef}
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
        // sideOffset={position.height}
        // sideOffset={10}
        className="p-0"
      >
        <div className="dropdown-menu">
          {props.items.length ? (
            props.items.map((item, index) => (
              <button
                className={index === selectedIndex ? "is-selected item" : "item"}
                key={index}
                onClick={() => selectItem(index)}
                title={item.name || item.address}
              >
                {item.name}
              </button>
            ))
          ) : (
            <div className="item">No result</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});
