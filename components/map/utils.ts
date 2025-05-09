import { AmapRoute } from "@/lib/api/gaode/types";
import { LatLngExpression } from "leaflet";

// Helper function to convert a string to a [number, number] tuple
const toLatLng = (str: string): [number, number] => {
  const [lng, lat] = str.split(",").map(Number);
  return [lat, lng];
};

export const getPolylineCoords = (
  route: AmapRoute,
  origin: string,
  destination: string,
): LatLngExpression[][] => {
  let allPolylines: LatLngExpression[][] = [];

  // Convert origin and destination strings to [number, number] tuples
  const originLatLng = toLatLng(origin);
  const destinationLatLng = toLatLng(destination);

  //TODO: (Maybe need to add options)Iterate over all paths in the route
  // route.paths.forEach((path) => {
  const path = route.paths[0];
  // Declare pathPolylines as an array of [number, number] tuples
  let pathPolylines: [number, number][] = [];

  // Iterate over all steps in each path
  path.steps.forEach((step) => {
    // Split the polyline string into individual lat,lng pairs
    const polylinePoints = step.polyline.split(";");

    // Convert each pair into a [number, number] tuple and add to the path
    polylinePoints.forEach((point) => {
      const [lng, lat] = point.split(",").map(Number);
      pathPolylines.push([lat, lng]); // Push as [lat, lng]
    });
  });

  // Check if the first and last points match the origin and destination
  // Some map provider can't change the origin and destination, this can cause markers and polyline to be inconsistent
  const firstPoint = pathPolylines[0];
  const lastPoint = pathPolylines[pathPolylines.length - 1];

  if (!arraysAreEqual(firstPoint, originLatLng)) {
    pathPolylines.unshift(originLatLng);
  }

  if (!arraysAreEqual(lastPoint, destinationLatLng)) {
    pathPolylines.push(destinationLatLng);
  }

  allPolylines.push(pathPolylines); // [number, number][] is assignable to LatLngExpression[]
  // });

  console.log("Updated Polylines: ", allPolylines);
  return allPolylines;
};

// Helper function to compare two [number, number] tuples
const arraysAreEqual = (
  arr1: [number, number],
  arr2: [number, number],
): boolean => {
  return arr1[0] === arr2[0] && arr1[1] === arr2[1];
};
