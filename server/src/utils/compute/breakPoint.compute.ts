interface Coordinate {
  lat: number;
  lon: number;
}

interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

interface RouteInput {
  distance: number;
  duration: number;
  routeGeometry: RouteGeometry;
}

interface RouteBreakpoints {
  point_1?: Coordinate;
  point_2?: Coordinate;
  point_3?: Coordinate;
  point_4?: Coordinate;
  point_5?: Coordinate;
  point_6?: Coordinate;
  point_7?: Coordinate;
}

// Calculates points needed based on distance to balance detail and speed
function calculateBreakpointCount(distance: number): number {
  if (distance < 100) {
    return 3;
  } else if (distance >= 100 && distance <= 500) {
    return distance < 300 ? 3 : 4;
  } else {
    return distance < 750 ? 3 : 4;
  }
}

// Checks if coordinates are within 0.0001 degrees (tolerance)
function areCoordinatesEqual(
  coord1: Coordinate,
  coord2: Coordinate,
  tolerance: number = 0.0001
): boolean {
  return (
    Math.abs(coord1.lat - coord2.lat) < tolerance &&
    Math.abs(coord1.lon - coord2.lon) < tolerance
  );
}

// Extracts evenly spaced, unique breakpoints from route geometry
function extractBreakpoints(
  coordinates: [number, number][],
  count: number,
  usedCoordinates: Coordinate[],
  routeLabel: string = "unknown"
): Coordinate[] {
  const totalCoords = coordinates.length;
  if (totalCoords < 2) {
    return [];
  }
  const breakpoints: Coordinate[] = [];

  for (let i = 0; i < count; i++) {
    const fraction = (i + 1) / (count + 1);
    const index = Math.floor(fraction * totalCoords);

    const safeIndex = Math.max(1, Math.min(index, totalCoords - 2));

    const coordAtIndex = coordinates[safeIndex];
    if (!coordAtIndex) {
      continue;
    }
    const coordinate: Coordinate = {
      lat: coordAtIndex[1],
      lon: coordAtIndex[0],
    };

    // Check if this coordinate is already used
    const isDuplicate = usedCoordinates.some((used) =>
      areCoordinatesEqual(coordinate, used)
    );

    if (!isDuplicate) {
      breakpoints.push(coordinate);
      usedCoordinates.push(coordinate);
    } else {
      let offset = 1;
      let found = false;
      while (!found && offset < 10) {
        for (const direction of [1, -1]) {
          const altIndex = safeIndex + offset * direction;
          if (altIndex > 0 && altIndex < totalCoords - 1) {
            const altCoordAtIndex = coordinates[altIndex];
            if (!altCoordAtIndex) {
              continue;
            }
            const altCoordinate: Coordinate = {
              lat: altCoordAtIndex[1],
              lon: altCoordAtIndex[0],
            };

            const isAltDuplicate = usedCoordinates.some((used) =>
              areCoordinatesEqual(altCoordinate, used)
            );

            if (!isAltDuplicate) {
              breakpoints.push(altCoordinate);
              usedCoordinates.push(altCoordinate);
              found = true;
              break;
            }
          }
        }
        offset++;
      }

      if (!found) {
        console.warn(
          `[Route ${routeLabel}] Skipping duplicate breakpoint at index ${safeIndex} (${coordinate.lat}, ${coordinate.lon})`
        );
      }
    }
  }

  return breakpoints;
}

// Main entry point for computing unique breakpoints for multiple routes
export function computeBreakpoints(routes: RouteInput[]): RouteBreakpoints[] {
  if (!routes || routes.length === 0) {
    throw new Error("No routes provided");
  }

  if (routes.length > 3) {
    throw new Error("Maximum 3 routes allowed");
  }

  // Track all used coordinates to ensure uniqueness across routes
  const usedCoordinates: Coordinate[] = [];
  const result: RouteBreakpoints[] = [];

  for (const route of routes) {
    const { distance, routeGeometry } = route;

    if (!routeGeometry || !routeGeometry.coordinates) {
      throw new Error("Invalid route geometry");
    }

    if (routeGeometry.coordinates.length < 2) {
      throw new Error(
        "Insufficient coordinates in route geometry (minimum 2 required)"
      );
    }

    // Calculate how many breakpoints we need for this route
    const breakpointCount = calculateBreakpointCount(distance);

    // Extract breakpoints
    const breakpoints = extractBreakpoints(
      routeGeometry.coordinates,
      breakpointCount,
      usedCoordinates,
      result.length.toString()
    );

    // Build the route breakpoints object
    const routeBreakpoints: RouteBreakpoints = {};
    breakpoints.forEach((coord, index) => {
      const key = `point_${index + 1}` as keyof RouteBreakpoints;
      routeBreakpoints[key] = coord;
    });

    result.push(routeBreakpoints);
  }

  return result;
}
