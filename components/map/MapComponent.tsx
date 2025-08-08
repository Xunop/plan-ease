import { useMapPolylines } from "@/hooks/useMapPolylines";
import { AmapPlace } from "@/lib/api/gaode/types";
import { customIcon, gaoDeNormal } from "@/lib/map/leafletConfig";
import { useBoundStore } from "@/providers/location-store-provider";
import { Location as LocationFromStore } from "@/stores/location-store";
import { Editor } from "@tiptap/core";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import {
    CustomMarker,
    CustomMarkerData,
    setupMarkerPopup,
} from "./MarkerPopup";
import MapButtonList from "./MapButtonList";

// export type MapComponentHandle = {
//     invalidate: () => void;
// };

export interface MapProps {
    mainEditor: Editor;
    // ref?: Ref<MapComponentHandle>;
}

const MapComponent: React.FC<MapProps> = ({ mainEditor }: MapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    const {
        locations,
        routes,
        curPLHeiLine,
        GetPlaceById,
        focusModeTargetLocationId,
        isFocusModeActive,
        toggleMapFocusMode,
        GetLocationById,
    } = useBoundStore((state) => state);

    const highlightedRouteId = curPLHeiLine?.routeId ?? null;

    // Use hook for managing polylines
    useMapPolylines({
        map: mapInstanceRef.current,
        routes,
        highlightedRouteId,
    });

    useEffect(() => {
        let map: L.Map;
        let currentMapRef: HTMLDivElement | null = null;

        if (mapRef.current && !mapInstanceRef.current) {
            currentMapRef = mapRef.current;
            map = L.map(currentMapRef, {
                center: [31.59, 120.29],
                zoom: 12,
                zoomControl: false,
                attributionControl: false,
            });
            mapInstanceRef.current = map;
            gaoDeNormal.addTo(map); // Add default tile layer

            markersLayerRef.current = L.layerGroup().addTo(map);

            const resizeObserver = new ResizeObserver(() =>
                map.invalidateSize(),
            );
            resizeObserver.observe(currentMapRef);

            return () => {
                if (currentMapRef) {
                    resizeObserver.unobserve(currentMapRef);
                }
                resizeObserver.disconnect();
                map.remove();
                mapInstanceRef.current = null;
                markersLayerRef.current = null;
            };
        }
    }, []);

    // Update markers when locations or mainEditor instance changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;

        // Ensure map, layer, and the editor are ready
        if (map && markersLayer && mainEditor) {
            markersLayer.clearLayers(); // Clear existing markers

            const leafletMarkers: CustomMarker[] = [];

            locations
                .filter(
                    (item: LocationFromStore) =>
                        item.location && item.location.length > 0,
                )
                .forEach((item: LocationFromStore, index: number) => {
                    const [longitude, latitude] = item.location
                        .split(",")
                        .map(parseFloat);

                    const marker = L.marker([latitude, longitude], {
                        icon: customIcon,
                    }) as CustomMarker;

                    const place =
                        GetPlaceById(item.id) === undefined
                            ? null
                            : GetPlaceById(item.id);
                    // Prepare data for the popup
                    // Ensure 'item' has an 'id' or use another unique key.
                    // Also, 'item' should be compatible with AmapPlace.
                    const markerData: CustomMarkerData = {
                        id: item.id || `marker-${item.name || index}`, // Fallback for unique ID
                        place: place as AmapPlace, // Cast or transform 'item' as needed
                    };

                    // Setup popup for this marker using the imported function
                    setupMarkerPopup(marker, mainEditor, markerData);
                    leafletMarkers.push(marker);
                });

            leafletMarkers.forEach((marker) => markersLayer.addLayer(marker));

            // Fly to the last marker if any markers were added and avoid flyTo
            // if focus mode might take over
            // if (leafletMarkers.length > 0 && !isFocusModeActive && focusModeTargetLocationId !== null) {
            if (leafletMarkers.length > 0 && !isFocusModeActive) {
                const lastMarker = leafletMarkers[leafletMarkers.length - 1];
                map.flyTo(lastMarker.getLatLng(), map.getZoom() || 12, {
                    duration: 1.5,
                    easeLinearity: 0.25,
                });
            }
        }
    }, [locations, mainEditor, GetPlaceById, isFocusModeActive]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (map && isFocusModeActive && focusModeTargetLocationId) {
            const targetLocation = GetLocationById(focusModeTargetLocationId);
            if (targetLocation && targetLocation.location) {
                const [longitude, latitude] = targetLocation.location
                    .split(",")
                    .map(parseFloat);
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    map.flyTo(
                        [latitude, longitude],
                        map.getZoom() > 14 ? map.getZoom() : 16,
                        { duration: 1.5 },
                    );
                } else {
                    console.warn(
                        "Focus Mode: Invalid coordinates for target location ID:",
                        focusModeTargetLocationId,
                    );
                }
            } else {
                console.warn(
                    "Focus Mode: Target location not found for ID:",
                    focusModeTargetLocationId,
                );
            }
        }
    }, [
        isFocusModeActive,
        focusModeTargetLocationId,
        GetLocationById,
        mapInstanceRef,
    ]);

    const handleFocusAllMarkersClick = () => {
        const map = mapInstanceRef.current;
        const markersLayer = markersLayerRef.current;
        if (map && markersLayer) {
            const currentMarkers = markersLayer.getLayers();
            if (currentMarkers.length > 0) {
                const markerBounds = L.latLngBounds(
                    currentMarkers.map((marker) =>
                        (marker as L.Marker).getLatLng(),
                    ),
                );
                map.flyToBounds(markerBounds, { padding: [50, 50] });
            } else {
                map.flyTo([31.59, 120.29], 12, { duration: 1 });
            }
        }
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full z-0" />

            <MapButtonList
                onFocusAllMarkersClick={handleFocusAllMarkersClick}
            />
        </div>
    );
};

export default MapComponent;
