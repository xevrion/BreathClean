import BreakPoint from "../../Schema/breakPoints.js";
import Route from "../../Schema/route.schema.js";
import { computeAQI } from "../compute/aqi.compute.js";
import {
  computeWeather,
  type RoutePoints,
} from "../compute/weather.compute.js";
import { type PathwayRouteInput, sendToPathway } from "./pathwayClient.js";

const PATHWAY_URL = process.env.PATHWAY_URL || "http://localhost:8001";
const BATCH_SIZE = 5;
const SCHEDULE_INTERVAL_MS = process.env.SCHEDULE_INTERVAL_MS
  ? parseInt(process.env.SCHEDULE_INTERVAL_MS, 10)
  : 30 * 60 * 1000;

function breakpointsToRoutePoints(
  breakpoints: Array<{
    pointIndex: number;
    location: { coordinates: [number, number] };
  }>
): RoutePoints {
  const routePoints: RoutePoints = {};
  const sorted = [...breakpoints].sort((a, b) => a.pointIndex - b.pointIndex);

  sorted.forEach((bp, index) => {
    const key = `point_${index + 1}` as keyof RoutePoints;
    routePoints[key] = {
      lat: bp.location.coordinates[1],
      lon: bp.location.coordinates[0],
    };
  });

  return routePoints;
}

async function processRoute(
  routeId: string,
  routeOptionIndex: number,
  routeOption: {
    distance: number;
    duration: number;
    travelMode: string;
    lastComputedScore?: number;
  }
): Promise<{
  success: boolean;
  routeId: string;
  routeOptionIndex: number;
  newScore?: number;
  error?: string;
}> {
  try {
    const breakpoints = await BreakPoint.find({
      routeId,
      routeOptionIndex,
    }).sort({ pointIndex: 1 });

    if (breakpoints.length === 0) {
      return {
        success: false,
        routeId,
        routeOptionIndex,
        error: "No breakpoints found",
      };
    }

    const routePoints = breakpointsToRoutePoints(breakpoints);

    const [weatherResults, aqiResults] = await Promise.all([
      computeWeather([routePoints]),
      computeAQI([routePoints]),
    ]);

    const weatherData = weatherResults[0];
    const aqiData = aqiResults[0];

    if (!weatherData || !aqiData) {
      return {
        success: false,
        routeId,
        routeOptionIndex,
        error: "Failed to fetch environmental data",
      };
    }

    const pathwayInput: PathwayRouteInput = {
      routeId,
      routeIndex: routeOptionIndex,
      distance: routeOption.distance,
      duration: routeOption.duration,
      travelMode: routeOption.travelMode,
      weatherPoints: weatherData.points.map((p) => ({ main: p.main })),
      aqiPoints: aqiData.points.map((p) => ({
        aqi: p.aqi,
      })) as PathwayRouteInput["aqiPoints"],
      trafficValue: 0,
      ...(routeOption.lastComputedScore !== undefined
        ? { lastComputedScore: routeOption.lastComputedScore }
        : {}),
    };

    const pathwayResult = await sendToPathway(PATHWAY_URL, [pathwayInput]);

    if (!pathwayResult.success || !pathwayResult.routes?.[0]) {
      return {
        success: false,
        routeId,
        routeOptionIndex,
        error: pathwayResult.message || "Pathway computation failed",
      };
    }

    const computedScore = pathwayResult.routes[0];

    await Route.updateOne(
      { _id: routeId },
      {
        $set: {
          [`routes.${routeOptionIndex}.lastComputedScore`]:
            computedScore.overallScore,
          [`routes.${routeOptionIndex}.lastComputedAt`]: new Date(),
        },
      }
    );

    return {
      success: true,
      routeId,
      routeOptionIndex,
      newScore: computedScore.overallScore,
    };
  } catch (error) {
    return {
      success: false,
      routeId,
      routeOptionIndex,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runBatchScoring(): Promise<void> {
  try {
    const routes = await Route.find({}).lean();

    if (routes.length === 0) {
      return;
    }

    const tasks: Array<{
      routeId: string;
      routeOptionIndex: number;
      routeOption: {
        distance: number;
        duration: number;
        travelMode: string;
        lastComputedScore?: number;
      };
    }> = [];

    for (const route of routes) {
      route.routes.forEach((option, index) => {
        const rawTravelMode = (option as unknown as { travelMode: string })
          .travelMode;

        tasks.push({
          routeId: route._id.toString(),
          routeOptionIndex: index,
          routeOption: {
            distance: option.distance,
            duration: option.duration,
            travelMode: rawTravelMode || "driving",
            ...(option.lastComputedScore !== undefined &&
            option.lastComputedScore !== null
              ? { lastComputedScore: option.lastComputedScore }
              : {}),
          },
        });
      });
    }

    const results: Array<{
      success: boolean;
      routeId: string;
      routeOptionIndex: number;
      newScore?: number;
      error?: string;
    }> = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map((task) =>
          processRoute(task.routeId, task.routeOptionIndex, task.routeOption)
        )
      );

      results.push(...batchResults);

      if (i + BATCH_SIZE < tasks.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  } catch {
    /* batch scoring failed silently — individual route errors are captured per-task */
  }
}

let _isRunning = false;

export function initScheduler(): void {
  setInterval(async () => {
    if (_isRunning) {
      return;
    }
    _isRunning = true;
    try {
      await runBatchScoring();
    } catch {
      /* scheduler tick failed — _isRunning reset in finally */
    } finally {
      _isRunning = false;
    }
  }, SCHEDULE_INTERVAL_MS);
}

export async function runManualBatchScoring(): Promise<void> {
  await runBatchScoring();
}

export default {
  initScheduler,
  runBatchScoring,
  runManualBatchScoring,
};
