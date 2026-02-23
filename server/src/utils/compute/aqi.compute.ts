import type { Coordinate, RoutePoints } from "./weather.compute.js";

export interface AQIData {
  aqi: number;
  dominentpol?: string | undefined;
  iaqi?:
    | {
        pm25?: { v: number };
        pm10?: { v: number };
        o3?: { v: number };
        no2?: { v: number };
        so2?: { v: number };
        co?: { v: number };
      }
    | undefined;
  time?:
    | {
        s: string;
        tz: string;
      }
    | undefined;
}

// Full AQI API response
interface AQIAPIResponse {
  status: string;
  data?: {
    aqi: number;
    idx?: number;
    dominentpol?: string;
    iaqi?: {
      pm25?: { v: number };
      pm10?: { v: number };
      o3?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
    };
    time?: {
      s: string;
      tz: string;
      v: number;
    };
    city?: {
      name: string;
      geo: [number, number];
    };
  };
}

export interface PointAQIResult {
  point: string;
  coordinate: Coordinate;
  aqi: AQIData | null;
  error?: string;
}

export interface RouteAQIResult {
  routeIndex: number;
  points: PointAQIResult[];
  totalPoints: number;
  successfulFetches: number;
}

const AQI_TIMEOUT_MS = 5000;
const AQI_MAX_RETRIES = 2;

// Fetches AQI data for a coordinate point using AQICN API with retries
async function fetchAQIForPoint(
  lat: number,
  lon: number
): Promise<AQIData | null> {
  for (let attempt = 0; attempt <= AQI_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AQI_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.AQI_API_KEY}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        console.error(`AQI API error for (${lat}, ${lon}): ${response.status}`);
        return null;
      }

      const apiResponse = (await response.json()) as AQIAPIResponse;

      if (apiResponse.status !== "ok" || !apiResponse.data) {
        console.error(
          `AQI API returned invalid status for (${lat}, ${lon}):`,
          apiResponse.status
        );
        return null;
      }

      const data = apiResponse.data;

      return {
        aqi: data.aqi,
        dominentpol: data.dominentpol,
        iaqi: data.iaqi,
        time: data.time ? { s: data.time.s, tz: data.time.tz } : undefined,
      };
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isLast = attempt === AQI_MAX_RETRIES;

      if (isLast) {
        if (isAbort) {
          console.error(
            `AQI API timeout for (${lat}, ${lon}) after ${AQI_MAX_RETRIES + 1} attempts`
          );
        } else {
          console.error(
            `Failed to fetch AQI for (${lat}, ${lon}) after ${AQI_MAX_RETRIES + 1} attempts:`,
            error
          );
        }
      }

      if (!isLast) {
        // Brief delay before retry (500ms, 1000ms)
        await new Promise((resolve) =>
          setTimeout(resolve, 500 * (attempt + 1))
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

// Computes AQI data for multiple routes
export async function computeAQI(
  routes: RoutePoints[]
): Promise<RouteAQIResult[]> {
  try {
    if (!routes || routes.length === 0) {
      throw new Error("No routes provided");
    }

    if (!process.env.AQI_API_KEY) {
      throw new Error("AQI_API_KEY not configured");
    }

    interface PointTask {
      routeIndex: number;
      pointKey: string;
      point: Coordinate;
    }

    const allPointTasks: PointTask[] = [];
    routes.forEach((route, routeIndex) => {
      for (let i = 1; i <= 7; i++) {
        const pointKey = `point_${i}` as keyof RoutePoints;
        const point = route[pointKey];
        if (point && point.lat !== undefined && point.lon !== undefined) {
          allPointTasks.push({ routeIndex, pointKey, point });
        }
      }
    });

    // 2. Fetch data in parallel batches (Concurrency Limiter)
    const pointResultsMap = new Map<number, PointAQIResult[]>();
    const CONCURRENCY_LIMIT = 5;

    for (let i = 0; i < allPointTasks.length; i += CONCURRENCY_LIMIT) {
      const batch = allPointTasks.slice(i, i + CONCURRENCY_LIMIT);

      // Execute this batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (task) => {
          const aqiData = await fetchAQIForPoint(
            task.point.lat,
            task.point.lon
          );

          const result: PointAQIResult = {
            point: task.pointKey,
            coordinate: task.point,
            aqi: aqiData,
          };

          if (aqiData === null) {
            result.error = "Failed to fetch AQI (timeout or API error)";
          }

          return { routeIndex: task.routeIndex, result };
        })
      );

      // Store results in the map grouped by routeIndex
      batchResults.forEach(({ routeIndex, result }) => {
        if (!pointResultsMap.has(routeIndex)) {
          pointResultsMap.set(routeIndex, []);
        }
        pointResultsMap.get(routeIndex)!.push(result);
      });
    }

    // 3. Format results into RouteAQIResult structure
    const results: RouteAQIResult[] = routes.map((_, routeIndex) => {
      const pointResults = pointResultsMap.get(routeIndex) || [];
      return {
        routeIndex,
        points: pointResults,
        totalPoints: pointResults.length,
        successfulFetches: pointResults.filter((p) => p.aqi !== null).length,
      };
    });

    return results;
  } catch (error) {
    console.error("Error in computeAQI:", error);
    throw error;
  }
}
