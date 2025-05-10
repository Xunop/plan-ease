import { useMapPolylines } from "@/hooks/useMapPolylines";
import { AmapPlace } from "@/lib/api/gaode/types";
import { customIcon, gaoDeNormal } from "@/lib/map/leafletConfig";
import { useBoundStore } from "@/providers/location-store-provider";
import { Location as LocationFromStore } from "@/stores/location-store";
import { Editor } from "@tiptap/core";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef } from "react";
import { CustomMarker, CustomMarkerData, setupMarkerPopup } from "./MarkerPopup";

interface MapProps {
    mainEditor: Editor
}

const MapComponent: React.FC<MapProps> = ({mainEditor}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const { locations, routes, curPLHeiLine, GetPlaceById } = useBoundStore((state) => state);

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
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;
      gaoDeNormal.addTo(map); // Add default tile layer

      markersLayerRef.current = L.layerGroup().addTo(map);

      const resizeObserver = new ResizeObserver(() => map.invalidateSize());
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
        .filter((item: LocationFromStore) => item.location && item.location.length > 0)
        .forEach((item: LocationFromStore, index: number) => {
          const [longitude, latitude] = item.location.split(",").map(parseFloat);
          
          const marker = L.marker([latitude, longitude], {
            icon: customIcon,
          }) as CustomMarker;

          const place = GetPlaceById(item.id) === undefined ? null : GetPlaceById(item.id)
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

      // Fly to the last marker if any markers were added
      if (leafletMarkers.length > 0) {
        const lastMarker = leafletMarkers[leafletMarkers.length - 1];
        map.flyTo(lastMarker.getLatLng(), map.getZoom() || 12, {
          duration: 1.5,
          easeLinearity: 0.25,
        });
      }
    }
  }, [locations, mainEditor]);

  return <div ref={mapRef} className="h-screen" />;
};

export default MapComponent;
