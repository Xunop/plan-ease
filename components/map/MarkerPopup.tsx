import React from "react";
import { createRoot, Root as ReactDOMRoot } from "react-dom/client";
import L from "leaflet";
import { Editor as CoreTiptapEditor } from "@tiptap/core";
import { PopoverEditor } from "@/components/editor/components/PopoverEditor";
import { AmapPlace } from "@/lib/api/gaode/types";
import "./style.scss"

// Define a more specific type for the data attached to markers
export interface CustomMarkerData {
  id: string;
  place: AmapPlace;
}

// Extend Leaflet's Marker to hold custom data and React root
export interface CustomMarker extends L.Marker {
  _customData?: CustomMarkerData;
}

interface PopupContentElement extends HTMLElement {
  _reactRoot?: ReactDOMRoot;
}

export function setupMarkerPopup(
  marker: CustomMarker,
  mainEditor: CoreTiptapEditor,
  customData: CustomMarkerData,
): void {
  marker._customData = customData;

  const popupElement = document.createElement("div");
  // Configure popup options as needed
  marker.bindPopup(popupElement, {
    minWidth: 320, // Set a minWidth for the popup
    autoClose: true,
    keepInView: true,
  });

  marker.on("popupopen", (e) => {
    const currentMarker = e.target as CustomMarker; // The marker instance
    const popup = e.popup;

    if (currentMarker._customData && popup && mainEditor) {
      const contentNode = popup.getContent() as PopupContentElement | null;
      if (contentNode) {
        // If a React root already exists (e.g., reopening without full close), unmount first
        if (contentNode._reactRoot) {
          contentNode._reactRoot.unmount();
        }
        // console.log("marker", currentMarker)
        const root = createRoot(contentNode);
        root.render(
          <React.StrictMode>
            <PopoverEditor
              mentionId={currentMarker._customData.id}
              editor={mainEditor} // Pass the shared CoreTiptapEditor instance
              place={currentMarker._customData.place}
            />
          </React.StrictMode>,
        );
        contentNode._reactRoot = root; // Store root for unmounting
      }
    } else if (popup && !mainEditor) {
      const contentNode = popup.getContent() as HTMLElement | null;
      if (contentNode)
        contentNode.innerHTML = "Editor not available for popup.";
    }
  });

  marker.on("popupclose", (e) => {
    const popup = e.popup;
    if (popup) {
      const contentNode = popup.getContent() as PopupContentElement | null;
      if (contentNode && contentNode._reactRoot) {
        contentNode._reactRoot.unmount();
        delete contentNode._reactRoot; // Clean up
      }
    }
  });
}
