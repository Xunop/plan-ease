import React, { useEffect, useRef } from "react";
import L, { latLng, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBoundStore } from "@/providers/location-store-provider";
import { Route } from "@/stores/location-store";
import isEqual from "lodash/isEqual";
import { fetchAmapDirection } from "@/lib/api/gaode/outline";
import { getPolylineCoords } from "./utils";
// import "leaflet-routing-machine" from "leaflet-routing-machine";

// Define static tile layers and icon outside the component
const gaoDeNormal = L.tileLayer(
  "//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  // "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution: 'Map data © <a href="https://www.amap.com/">GaoDe</a>',
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
  // Store polyline, key is routeId
  const polylineLayersRef = useRef<Record<string, L.Polyline>>({});
  const { locations, places, routes, curPLHeiLine } = useBoundStore(
    (state) => state,
  );
  const highlightedRouteId = curPLHeiLine?.routeId ?? "";

  const NORMAL_POLYLINE_STYLE = {
    color: "#5C7CFA",
    weight: 4,
    opacity: 0.8,
  };

  const HIGHLIGHTED_POLYLINE_STYLE = {
    color: "#3355DD",
    weight: 7,
    opacity: 1.0,
  };

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

  const applyHighlight = (polyline?: L.Polyline) => {
    if (polyline) {
      polyline.setStyle(HIGHLIGHTED_POLYLINE_STYLE);
      polyline.bringToFront();
    }
  };

  const removeHighlight = (polyline?: L.Polyline) => {
    if (polyline) {
      polyline.setStyle(NORMAL_POLYLINE_STYLE);
    }
  };

  // Update polyline when routes update
  useEffect(() => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const currentPolylinesMap = polylineLayersRef.current;

      const prevRoutes = prevRoutesRef.current;
      const currentRoutes = routes;

      // Find added routes: in current but not in previous
      const addedRoutes = currentRoutes.filter(
        (route) => !prevRoutes.some((prev) => prev.id === route.id),
      );

      // Find removed routes: in previous but not in current
      const removedRouteIds = prevRoutes
        .filter((prev) => !currentRoutes.some((route) => route.id === prev.id))
        .map((route) => route.id);

      // Find updated routes: in both, but properties differ
      const updatedRoutes = currentRoutes.filter((route) => {
        const prevRoute = prevRoutes.find((prev) => prev.id === route.id);
        return prevRoute && !isEqual(prevRoute.locations, route.locations);
      });

      // Remove old routes
      removedRouteIds.forEach((routeId) => {
        const polylineToRemove = currentPolylinesMap[routeId];
        if (polylineToRemove) {
          map.removeLayer(polylineToRemove);
          delete currentPolylinesMap[routeId];
          console.log("Polyline removed for route ID:", routeId);
        }
      });

      // Added and updated
      const routesToProcess = [...addedRoutes, ...updatedRoutes];

      // Process the changes
      routesToProcess.forEach((route) => {
        console.log(
          addedRoutes.includes(route) ? "Route added:" : "Route updated:",
          route.id,
        );
        if (updatedRoutes.includes(route) && currentPolylinesMap[route.id]) {
          map.removeLayer(currentPolylinesMap[route.id]);
          delete currentPolylinesMap[route.id];
        }

        const routeLocations = route.locations;
        const len = routeLocations.length;

        if (len > 1) {
          const origin = routeLocations[0];
          const destination = routeLocations[len - 1];
          let waypoints = "";
          if (routeLocations.length > 2) {
            waypoints = routeLocations.slice(1, len - 1).join(";");
          }

          fetchAmapDirection({ origin, destination, waypoints })
            .then((apiRouteResponse) => {
              const polylinePath = getPolylineCoords(
                apiRouteResponse,
                origin,
                destination,
              );

              if (!polylinePath || polylinePath.length === 0) {
                console.warn("Empty polyline path for route:", route.id);
                return;
              }

              const leafletPolyline = L.polyline(
                polylinePath,
                NORMAL_POLYLINE_STYLE,
              ).addTo(map);

              // Store Polyline
              currentPolylinesMap[route.id] = leafletPolyline;

              leafletPolyline.on("mouseover", function (this: L.Polyline) {
                  applyHighlight(this);
              });

              leafletPolyline.on("mouseout", function (this: L.Polyline) {
                  removeHighlight(this);
              });

              leafletPolyline.on("click", () => {
                console.log(`Polyline for route ${route.id} clicked.`);
                // Select a route or show details
              });

              // Adjust map view if this route is new
              if (addedRoutes.includes(route)) {
                map.fitBounds(leafletPolyline.getBounds(), {
                  paddingTopLeft: [50, 50],
                  paddingBottomRight: [50, 50],
                });
              }

              if (route.id === highlightedRouteId) {
                applyHighlight(leafletPolyline);
              }
            })
            .catch((error) => {
              console.error(
                "Error fetching or processing route direction for ID:",
                route.id,
                error,
              );
            });
        } else if (len === 1) {
          // Single location handle
          const [lng, lat] = routeLocations[0].split(",").map(parseFloat);
          map.flyTo(latLng(lat, lng));
        }
      });
      polylineLayersRef.current = currentPolylinesMap;
      prevRoutesRef.current = JSON.parse(JSON.stringify(currentRoutes));
    }
  }, [routes, highlightedRouteId]);

  return <div ref={mapRef} className="h-screen" />;
};

export default MapComponent;
