import React from "react";
import { useBoundStore } from "@/providers/location-store-provider";
import { Icon } from "@/components/ui/icon";

interface MapButtonListProps {
  onFocusAllMarkersClick: () => void;
}

const MapButtonList: React.FC<MapButtonListProps> = ({
  onFocusAllMarkersClick,
}) => {
  const { focusModeTargetLocationId, isFocusModeActive, toggleMapFocusMode } =
    useBoundStore((state) => state);

  // Common Tailwind classes for both buttons
  const buttonBaseClasses =
    "flex items-center justify-center w-8 h-8 rounded-md cursor-pointer shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-opacity-50 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className={`space-y-1 absolute top-[4px] left-[4px] z-[1000]`}>
      <button
        onClick={onFocusAllMarkersClick}
        className={`group ${buttonBaseClasses} bg-white hover:bg-blue-100 active:bg-blue-200`}
        title="Fit all markers in view"
      >
        <Icon name="Focus" className="text-black group-hover:text-blue-400 transition-all duration-300 ease-in-out" />
      </button>

      <button
        onClick={toggleMapFocusMode}
        className={`group ${buttonBaseClasses} ${
          isFocusModeActive
            ? "bg-blue-100 hover:bg-blue-200 active:bg-blue-200"
            : "bg-white hover:bg-blue-100 active:bg-blue-200"
        } `}
        title={
          isFocusModeActive
            ? "Exit Focus Mode"
            : "Enter Focus Mode (requires target set)"
        }
        // disabled={!focusModeTargetLocationId && !isFocusModeActive}
      >
        <Icon
          name="Locate"
          className={`transition-all duration-300 ease-in-out group-hover:text-blue-400 ${
            isFocusModeActive ? "text-blue-400" : "text-black"
          }`}
        />
      </button>
    </div>
  );
};

export default MapButtonList;
