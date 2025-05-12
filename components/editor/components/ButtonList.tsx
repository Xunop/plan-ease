"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Icon } from "@/components/ui/icon";
import { useBoundStore } from "@/providers/location-store-provider";
import { Editor } from "@tiptap/core";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import {
  ColorPicker,
  formatHex,
  isValidHexColor,
} from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { Route } from "@/stores/location-store";

interface ButtonListComponentProps {
  buttons: {
    icon: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
  }[];
  top: number;
}

const ButtonListComponent: React.FC<ButtonListComponentProps> = ({
  buttons,
  top,
}) => {
  return (
    <div
      className="flex flex-col items-center gap-1 p-1 bg-white rounded-md shadow-md border border-gray-200"
      style={{
        position: "absolute",
        right: "10px",
        top: `${top}px`,
        zIndex: 50,
      }}
    >
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md",
            button.isActive ? "bg-gray-300" : "hover:bg-gray-200", // Highlight if active
          )}
          aria-label={`Action ${index + 1}`} // Add basic aria-label
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
};

// Helper function to get the first mention ID from a node
const getFirstMentionId = (
  node: ProsemirrorNode | null | undefined,
): string | null => {
  let id: string | null = null;
  if (!node) return null;

  node.descendants((child) => {
    if (
      id === null &&
      child.type.name === "mention" &&
      child.attrs.location !== ""
    ) {
      id = child.attrs.id;
    }
    // Stop descending if ID is found to optimize
    return id === null;
  });
  return id;
};

type ButtonListProps = {
  pos: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    lineHeight: number;
    nodePos: number;
  };
  outerDivRef?: React.RefObject<HTMLDivElement>;
  editor: Editor;
};

const ButtonList = ({ pos, outerDivRef, editor }: ButtonListProps) => {
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [currentColoringRouteId, setCurrentColoringRouteId] = useState<
    string | null
  >(null);
  const colorPickerRef = useRef<HTMLDivElement>(null); // Ref for the color picker itself

  const { GetRoute, UpdateRoute, AddRoute } = useBoundStore((state) => state);

  // Memoize node lookup based on position
  const node = useMemo(() => {
    try {
      // Ensure nodePos is within valid bounds
      if (pos.nodePos >= 0 && pos.nodePos < editor.state.doc.content.size) {
        return editor.state.doc.nodeAt(pos.nodePos);
      }
    } catch (error) {
      console.error("Error finding node at pos:", pos.nodePos, error);
    }
    return null; // Return null if invalid position or error
  }, [editor.state.doc, pos.nodePos]);

  // Memoize the route ID extraction
  const routeId = useMemo(() => getFirstMentionId(node), [node]);

  // Memoize the current route based on the ID
  const currentRoute = useMemo(() => {
    if (!routeId) return undefined;
    return GetRoute(routeId);
  }, [routeId, GetRoute]);

  const handleMapClick = useCallback(() => {
    if (!node || !routeId) return; // Guard clause

    const locations: string[] = [];
    node.descendants((child) => {
      if (child.type.name === "mention" && child.attrs.location) {
        locations.push(child.attrs.location);
      }
    });

    const routeData: Partial<Route> & { id: string; locations: string[] } = {
      // Use Partial<Route>
      id: routeId,
      locations: locations,
      // Include color if available, otherwise allow default/undefined
      normalColor: currentRoute?.normalColor,
    };

    if (currentRoute === undefined) {
      console.log("Add route", routeData);
      AddRoute(routeData as Route); // Assuming AddRoute expects a full Route, cast carefully or adjust AddRoute signature
    } else {
      // FIXME: route color need to store
      console.log("Update route", routeData);
      // UpdateRoute expects the full route object potentially
      UpdateRoute(routeId, { ...currentRoute, ...routeData });
    }
  }, [node, routeId, AddRoute, UpdateRoute, currentRoute]);

  const handleColorPickerToggle = useCallback(() => {
    if (!routeId) {
      console.warn("Cannot open color picker: No route ID found for the node.");
      setIsColorPickerVisible(false); // Ensure it's closed if no ID
      return;
    }
    // If opening, store the ID. If closing, clear it.
    setCurrentColoringRouteId((prevId) =>
      prevId === routeId ? null : routeId,
    );
    setIsColorPickerVisible(
      (prev) => !prev || routeId !== currentColoringRouteId,
    );
  }, [routeId, currentColoringRouteId]);

  const handleColorChange = useCallback(
    (newColor: string) => {
      if (!currentColoringRouteId) {
        console.error("Cannot update color: No route ID selected.");
        return;
      }

      const routeToUpdate = GetRoute(currentColoringRouteId);
      if (!routeToUpdate) {
        console.warn(
          `Cannot update color: Route with ID ${currentColoringRouteId} not found.`,
        );
        return;
      }

      // Update the route with the new color
      UpdateRoute(currentColoringRouteId, {
        ...routeToUpdate,
        normalColor: newColor,
      });

      // Optionally close the picker after selection
      // setIsColorPickerVisible(false);
      // setCurrentColoringRouteId(null);
    },
    [currentColoringRouteId, GetRoute, UpdateRoute],
  );

  // Effect to handle clicks outside the color picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the color picker div
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        // Optional: Also check if the click wasn't on the toggle button itself
        // This requires passing the button ref or identifying it another way.
        // For simplicity now, clicking anywhere outside closes it.
        setIsColorPickerVisible(false);
        setCurrentColoringRouteId(null);
      }
    };

    if (isColorPickerVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup listener on component unmount or when picker is hidden
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColorPickerVisible]); // Only run when visibility changes

  const buttons = useMemo(
    () => [
      {
        icon: <Icon name="Map" className="w-5 h-5" />, // Slightly smaller icons
        onClick: handleMapClick,
      },
      // {
      //     icon: <Icon name="Calendar" className="w-5 h-5" />,
      //     onClick: () => console.log("Calendar clicked"),
      // },
      // {
      //     icon: <Icon name="Bike" className="w-5 h-5" />,
      //     onClick: () => console.log("Bicycle clicked"),
      // },
      ...(currentRoute !== undefined
        ? [
            {
              icon: (
                <Icon
                  name="Circle"
                  className="w-5 h-5 transition-colors duration-150" // Added transition
                  // Use currentRoute directly now since we know it's defined here
                  style={{ color: currentRoute.normalColor || "currentColor" }}
                  fill={currentRoute.normalColor || "none"}
                />
              ),
              onClick: handleColorPickerToggle,
              isActive:
                isColorPickerVisible && currentColoringRouteId === routeId,
            },
          ]
        : []),
    ],
    [
      handleMapClick,
      handleColorPickerToggle,
      currentRoute,
      isColorPickerVisible,
      currentColoringRouteId,
      routeId,
    ],
  );

  const relativeTop = useMemo(() => {
    let top = pos.bottom ?? 0; // Use pos.bottom as the base vertical position
    if (outerDivRef?.current) {
      const outerDivRect = outerDivRef.current.getBoundingClientRect();
      // Calculate top relative to the outerDivRef's viewport position
      top = top - outerDivRect.top;
      // No need to subtract lineHeight here if pos.bottom aligns with the bottom of the line
    }
    return Math.max(0, top); // Ensure top is not negative
  }, [pos.bottom, outerDivRef]);

  // --- Render Logic ---
  if (!node) {
    // Don't render if the node couldn't be found (e.g., invalid pos.nodePos)
    return null;
  }

  // Get the color to pass to the picker, use default if undefined
  const initialPickerColor = currentRoute?.normalColor;

  return (
    <>
      <ButtonListComponent buttons={buttons} top={relativeTop} />

      {/* Conditionally render the ColorPicker */}
      {isColorPickerVisible && currentColoringRouteId === routeId && (
        <div
          ref={colorPickerRef}
          className="absolute" // No styling needed here if ColorPicker has its own panel styles
          style={{
            top: `${relativeTop + 40}px`, // Adjust as needed
            right: "10px",
            zIndex: 51,
          }}
        >
          <ColorPicker
            // Ensure value is #RRGGBB or undefined
            value={
              currentRoute?.normalColor &&
              isValidHexColor(currentRoute.normalColor)
                ? formatHex(currentRoute.normalColor)
                : undefined
            }
            onChange={handleColorChange}
            // colors={YOUR_CUSTOM_COLORS} // Optional: override default colors
          />
        </div>
      )}
    </>
  );
};

export default ButtonList;
