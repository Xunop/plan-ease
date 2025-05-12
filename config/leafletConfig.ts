"use client";
import L from "leaflet";

// Define static tile layers
export const gaoDeNormal = L.tileLayer(
  "//webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution: 'Map data © <a href="https://www.amap.com/">GaoDe</a>',
  },
);

export const gaoDeSatellite = L.tileLayer(
  "//webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution:
      'Satellite map data &copy; <a href="https://www.amap.com/">GaoDe</a>',
  },
);

export const gaoDeSatelliteAnnotation = L.tileLayer(
  "//webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}",
  {
    subdomains: ["1", "2", "3", "4"],
    attribution:
      'Satellite Annotation map data &copy; <a href="https://www.amap.com/">GaoDe</a>',
  },
);

// Base map control object
export const baseMaps = {
  Normal: gaoDeNormal,
  Satellite: gaoDeSatellite,
  "Satellite Annotation": gaoDeSatelliteAnnotation,
};

// Custom marker icon
export const customIcon = L.icon({
  iconUrl: "/map-pin-a.svg",
  iconSize: [38, 95],
  iconAnchor: [12, 20],
  popupAnchor: [1, -34],
});

// Polyline styles
export const DEFAULT_LINE_COLOR = "#5C7CFA";

// Polyline styles
export function normalPolyLineStyle(color?: string) {
  return {
    color: color || DEFAULT_LINE_COLOR,
    weight: 4,
    opacity: 0.9,
  };
}

export const NORMAL_POLYLINE_STYLE = {
  color: "#5C7CFA",
  weight: 4,
  opacity: 0.9,
};

export const HIGHLIGHTED_POLYLINE_STYLE = {
  color: "#3355DD",
  weight: 5,
  opacity: 1.0,
};
