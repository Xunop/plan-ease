import React, { useEffect, useRef } from "react";
import L, { latLng, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBoundStore } from "@/providers/location-store-provider";
import { Route } from "@/stores/location-store";
import isEqual from "lodash/isEqual";
import { fetchAmapDirection } from "@/lib/api/gaode/outline";
import { getPolyline } from "./utils";
// import "leaflet-routing-machine" from "leaflet-routing-machine";

// Define static tile layers and icon outside the component
const gaoDeNormal = L.tileLayer(
  "//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  // "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution: 'Map data © <a href="https://www.amap.com/">GaoDe</a>',
    // attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  },
);

// GaoDe Satellite Map provider
const gaoDeSatellite = L.tileLayer(
  "//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution:
      'Satellite map data &copy; <a href="https://www.amap.com/">GaoDe</a>',
  },
);

// GaoDe Satellite Annotation Map
const gaoDeSatelliteAnnotation = L.tileLayer(
  "//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution:
      'Satellite Annotation map data &copy; <a href="https://www.amap.com/">GaoDe</a>',
  },
);

// Add base map control to switch between layers
const baseMaps = {
  Normal: gaoDeNormal,
  Satellite: gaoDeSatellite,
  "Satellite Annotation": gaoDeSatelliteAnnotation,
};

const customIcon = L.icon({
  // iconUrl: "/map-pin-fill.svg",
  iconUrl: "/map-pin-a.svg",
  iconSize: [38, 95],
  iconAnchor: [12, 20],
  popupAnchor: [1, -34],
});

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const { locations, places, routes } = useBoundStore((state) => state);

  // Initialize the map once on mount
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current ? mapRef.current : "map", {
        center: [31.59, 120.29],
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });
      mapInstanceRef.current = map;
      gaoDeNormal.addTo(map);
      // L.control.layers(baseMaps).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      const resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(mapRef.current);

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
      };
    }
  }, []); // Empty dependency array ensures this runs only once

  // Update markers when locations change
  useEffect(() => {
    if (mapInstanceRef.current && layerGroupRef.current) {
      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;

      layerGroup.clearLayers();

      const markers = locations
        .filter((item) => item.location.length > 0)
        .map((item) => {
          const [longitude, latitude] = item.location
            .split(",")
            .map(parseFloat);
          return L.marker([latitude, longitude], {
            icon: customIcon,
          });
        });

      markers.forEach((marker) => layerGroup.addLayer(marker));

      if (markers.length > 0) {
        const lastMarker = markers[markers.length - 1];
        map.flyTo(lastMarker.getLatLng(), 12, {
          duration: 2,
          easeLinearity: 0.25,
        });
      }
    }
    // }, [places]);
  }, [locations]);

  const prevRoutesRef = useRef<Route[]>([]);

  // Update polyline when routes update
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      const prevRoutes = prevRoutesRef.current;
      const currentRoutes = routes;

      // Find added routes: in current but not in previous
      const addedRoutes = currentRoutes.filter(
        (route) => !prevRoutes.some((prev) => prev.id === route.id),
      );

      // Find removed routes: in previous but not in current
      const removedRoutes = prevRoutes.filter(
        (prev) => !currentRoutes.some((route) => route.id === prev.id),
      );

      // Find updated routes: in both, but properties differ
      const updatedRoutes = currentRoutes.filter((route) => {
        const prevRoute = prevRoutes.find((prev) => prev.id === route.id);
        return prevRoute && !isEqual(prevRoute, route);
      });

      // Process the changes
      addedRoutes.forEach((route) => {
        console.log("Route added:", route);
        const locations = route.locations;
        const len = locations.length;
        if (len > 0) {
          if (len > 1) {
            const origin = locations[0];
            const destination = locations[len - 1];
            let waypoints = "";
            if (locations.length > 2) {
              waypoints = locations.slice(1, len - 1).join(";");
            }
            console.log(
              `route origin: ${origin}, destination: ${destination}, waypoints: ${waypoints}`,
            );
            fetchAmapDirection({ origin, destination, waypoints }).then(
              (route) => {
                const polyline = getPolyline(route, origin, destination);
                // Add the origin and destination points to the polyline (ensure they are part of the route)
                const line = L.polyline(polyline, {
                  color: "#5C7CFA",
                  smoothFactor: 1,
                  weight: 4,
                }).addTo(map);
                map.fitBounds(line.getBounds());
              },
            );
          } else {
            const lat = parseFloat(locations[0].split(",")[1]);
            const lng = parseFloat(locations[0].split(",")[0]);
            map.flyTo(latLng(lat, lng));
          }
        }
      });

      updatedRoutes.forEach((route) => {
        console.log("Route updated:", route);
      });

      removedRoutes.forEach((route) => {
        console.log("Route removed:", route);
      });

      // Update the ref with the current routes for the next render
      prevRoutesRef.current = currentRoutes;
    }
  }, [routes]);

  return <div ref={mapRef} className="h-screen" />;
};

export default MapComponent;
