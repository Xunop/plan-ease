import { useEffect, useRef } from 'react';
import L, { latLng } from 'leaflet';
import isEqual from 'lodash/isEqual';
import { Route } from '@/stores/location-store';
import { fetchAmapDirection } from '@/lib/api/gaode/outline';
import { getPolylineCoords } from '@/components/map/utils';
import { HIGHLIGHTED_POLYLINE_STYLE, normalPolyLineStyle } from '@/config/leafletConfig';

interface UseMapPolylinesProps {
  map: L.Map | null;
  routes: Route[];
  highlightedRouteId: string | null;
  // onPolylineClick?: (routeId: string) => void; // Optional: callback for polyline click
}

export function useMapPolylines({
  map,
  routes,
  highlightedRouteId,
  // onPolylineClick,
}: UseMapPolylinesProps): void {
  const polylineLayersRef = useRef<Record<string, L.Polyline>>({});
  const prevRoutesRef = useRef<Route[]>([]);

  const applyHighlight = (polyline?: L.Polyline) => {
    if (polyline) {
      polyline.setStyle(HIGHLIGHTED_POLYLINE_STYLE);
      polyline.bringToFront();
    }
  };

  const removeHighlight = (polyline?: L.Polyline, color?: string) => {
    if (polyline) {
      polyline.setStyle(normalPolyLineStyle(color));
    }
  };

  useEffect(() => {
    if (!map) return;

    const currentPolylinesMap = polylineLayersRef.current;
    const prevRoutes = prevRoutesRef.current;
    const currentRoutes = routes;

    const addedRoutes = currentRoutes.filter(
      (route) => !prevRoutes.some((prev) => prev.id === route.id),
    );
    const removedRouteIds = prevRoutes
      .filter((prev) => !currentRoutes.some((route) => route.id === prev.id))
      .map((route) => route.id);
    const updatedRoutes = currentRoutes.filter((route) => {
      const prevRoute = prevRoutes.find((prev) => prev.id === route.id);
      return prevRoute && !isEqual(prevRoute.locations, route.locations);
    });

    removedRouteIds.forEach((routeId) => {
      const polylineToRemove = currentPolylinesMap[routeId];
      if (polylineToRemove) {
        map.removeLayer(polylineToRemove);
        delete currentPolylinesMap[routeId];
      }
    });

    const routesToProcess = [...addedRoutes, ...updatedRoutes];

    routesToProcess.forEach((route) => {
      if (updatedRoutes.includes(route) && currentPolylinesMap[route.id]) {
        map.removeLayer(currentPolylinesMap[route.id]);
        delete currentPolylinesMap[route.id];
      }

      const routeLocations = route.locations;
      const len = routeLocations.length;
      const color = route.normalColor;

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
              normalPolyLineStyle(color),
            ).addTo(map);
            currentPolylinesMap[route.id] = leafletPolyline;

            leafletPolyline.on("mouseover", function (this: L.Polyline) {
              if (route.id !== highlightedRouteId) applyHighlight(this);
            });
            leafletPolyline.on("mouseout", function (this: L.Polyline) {
              if (route.id !== highlightedRouteId) removeHighlight(this);
            });
            leafletPolyline.on("click", () => {
              console.log(`Polyline for route ${route.id} clicked.`);
              // if (onPolylineClick) onPolylineClick(route.id);
            });
            
            map.fitBounds(leafletPolyline.getBounds(), {
              paddingTopLeft: [50, 50],
              paddingBottomRight: [50, 50],
            });

            if (route.id === highlightedRouteId) {
              applyHighlight(leafletPolyline);
            } else {
              removeHighlight(leafletPolyline, color); // Ensure non-highlighted routes have normal style
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
        const [lng, lat] = routeLocations[0].split(",").map(parseFloat);
        map.flyTo(latLng(lat, lng));
      }
    });
    polylineLayersRef.current = currentPolylinesMap;
    prevRoutesRef.current = JSON.parse(JSON.stringify(currentRoutes));
  }, [map, routes, highlightedRouteId]);
}
