import crypto from "crypto";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import {
  computeAQI,
  type RouteAQIResult,
} from "../utils/compute/aqi.compute.js";
import { computeBreakpoints } from "../utils/compute/breakPoint.compute.js";
import {
  computeWeather,
  type RouteWeatherResult,
} from "../utils/compute/weather.compute.js";
import redis from "../utils/redis.js";

interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

interface RouteData {
  distance: number;
  duration: number;
  routeGeometry: RouteGeometry;
  lastComputedScore?: number;
  lastComputedAt?: string;
  travelMode: string;
}

interface ScoreRequestBody {
  routes: RouteData[];
  traffic?: number[];
}

interface WeatherScore {
  temperature: number;
  humidity: number;
  pressure: number;
  overall: number;
}

interface AQIScore {
  aqi: number;
  score: number;
  category: string;
}

interface RouteScore {
  routeIndex: number;
  distance: number;
  duration: number;
  travelMode: string;
  breakpointCount: number;
  weatherScore: WeatherScore;
  weatherDetails?:
    | {
        avgTemp: number;
        avgHumidity: number;
        avgPressure: number;
      }
    | undefined;
  aqiScore: AQIScore;
  aqiDetails?:
    | {
        dominentpol?: string | undefined;
        pollutants?:
          | {
              pm25?: number | undefined;
              pm10?: number | undefined;
              o3?: number | undefined;
              no2?: number | undefined;
              so2?: number | undefined;
              co?: number | undefined;
            }
          | undefined;
      }
    | undefined;
  trafficScore: number;
  overallScore: number;
  lastComputedScore?: number | undefined;
  scoreChange?: number | undefined;
}

// Ideal: 21°C — score drops 6 pts per degree away from ideal
function calculateTemperatureScore(temp: number): number {
  const diff = Math.abs(temp - 21);
  if (diff <= 1) return 100;
  return Math.max(0, 100 - diff * 6);
}

// Ideal: 45–55% humidity
function calculateHumidityScore(humidity: number): number {
  if (humidity >= 45 && humidity <= 55) return 100;
  return Math.max(0, 100 - (Math.abs(humidity - 50) - 5) * 2);
}

// Ideal: 1013 hPa (sea-level standard)
function calculatePressureScore(pressure: number): number {
  const diff = Math.abs(pressure - 1013);
  if (diff <= 2) return 100;
  return Math.max(0, 100 - (diff - 2) * 4);
}

function calculateWeatherScore(weatherData: RouteWeatherResult): WeatherScore {
  let totalTemp = 0;
  let totalHumidity = 0;
  let totalPressure = 0;
  let validPoints = 0;

  for (const point of weatherData.points) {
    if (point.main) {
      totalTemp += calculateTemperatureScore(point.main.temp);
      totalHumidity += calculateHumidityScore(point.main.humidity);
      totalPressure += calculatePressureScore(point.main.pressure);
      validPoints++;
    }
  }

  const tempScore = validPoints > 0 ? totalTemp / validPoints : 0;
  const humidityScore = validPoints > 0 ? totalHumidity / validPoints : 0;
  const pressureScore = validPoints > 0 ? totalPressure / validPoints : 0;
  // Weighted blend: temp 50%, humidity 30%, pressure 20%
  const overall = tempScore * 0.5 + humidityScore * 0.3 + pressureScore * 0.2;

  return {
    temperature: Math.round(tempScore * 10) / 10,
    humidity: Math.round(humidityScore * 10) / 10,
    pressure: Math.round(pressureScore * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

function calculateAQIScore(aqiData: RouteAQIResult): AQIScore {
  let totalAQI = 0;
  let validPoints = 0;

  for (const point of aqiData.points) {
    if (point.aqi && point.aqi.aqi !== undefined) {
      const val = Number(point.aqi.aqi);
      if (!isNaN(val)) {
        totalAQI += val;
        validPoints++;
      }
    }
  }

  if (validPoints === 0) {
    return { aqi: 0, score: 0, category: "Unknown - No Data" };
  }

  const avgAQI = totalAQI / validPoints;
  let score = 0;
  let category = "Unknown";

  if (avgAQI <= 20) {
    score = 100;
    category = "Excellent";
  } else if (avgAQI <= 50) {
    score = 100 - ((avgAQI - 20) / 30) * 20;
    category = "Good";
  } else if (avgAQI <= 100) {
    score = 80 - ((avgAQI - 50) / 50) * 30;
    category = "Moderate";
  } else if (avgAQI <= 150) {
    score = 50 - ((avgAQI - 100) / 50) * 20;
    category = "Unhealthy for Sensitive Groups";
  } else if (avgAQI <= 200) {
    score = 30 - ((avgAQI - 150) / 50) * 20;
    category = "Unhealthy";
  } else {
    score = Math.max(0, 10 - ((avgAQI - 200) / 100) * 10);
    category = avgAQI <= 300 ? "Very Unhealthy" : "Hazardous";
  }

  return {
    aqi: Math.round(avgAQI * 10) / 10,
    score: Math.round(score * 10) / 10,
    category,
  };
}

// Non-linear penalty curve — light traffic barely penalised, heavy traffic punished
function calculateTrafficScore(trafficValue: number): number {
  if (trafficValue <= 0) return 100;
  const penalty = Math.pow(Math.min(trafficValue / 3, 1), 0.7);
  return Math.round((1 - penalty) * 100 * 10) / 10;
}

// Cache computed scores for 30 minutes
const SCORE_CACHE_TTL = 1800;

// SHA-256 hash of route coords + mode + traffic → deterministic cache key
function generateScoreCacheKey(routes: RouteData[], traffic: number[]): string {
  const keyData = routes.map((r, i) => ({
    coords: r.routeGeometry.coordinates,
    mode: r.travelMode,
    traffic: traffic[i] || 0,
  }));
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(keyData))
    .digest("hex");
  return `score_cache:${hash}`;
}

export const getScoreController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { routes, traffic = [] }: ScoreRequestBody = req.body;

    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "Invalid request. 'routes' array is required and cannot be empty.",
      });
      return;
    }

    if (routes.length > 3) {
      res
        .status(400)
        .json({ success: false, message: "Maximum 3 routes allowed." });
      return;
    }

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (
        !route ||
        route.distance == null ||
        route.duration == null ||
        !route.routeGeometry
      ) {
        res.status(400).json({
          success: false,
          message: `Invalid route data at index ${i}. Missing required fields.`,
        });
        return;
      }
    }

    const cacheKey = generateScoreCacheKey(routes, traffic);
    try {
      const cached = await redis.get<Record<string, unknown>>(cacheKey);
      if (cached) {
        const searchId = uuidv4();
        const breakpoints = computeBreakpoints(routes);
        try {
          await redis.set(
            `route_search:${searchId}`,
            JSON.stringify({
              breakpoints,
              timestamp: new Date().toISOString(),
            }),
            { ex: 3600 }
          );
        } catch {
          /* redis set failed — serve response without caching searchId */
        }

        res.json({
          ...cached,
          searchId,
          cached: true,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    } catch {
      /* redis get failed — skip cache, compute fresh */
    }

    const breakpoints = computeBreakpoints(routes);
    const weatherData = await computeWeather(breakpoints);
    const aqiData = await computeAQI(breakpoints);

    const routeScores: RouteScore[] = routes.map((route, index) => {
      const routeWeather = weatherData[index];
      if (!routeWeather) {
        throw new Error(`Weather data missing for route ${index}`);
      }

      const routeAQI =
        aqiData[index] ??
        ({
          routeIndex: index,
          points: [],
          totalPoints: 0,
          successfulFetches: 0,
        } as RouteAQIResult);

      const aqiScore = calculateAQIScore(routeAQI);
      const trafficValue = traffic[index] || 0;
      const weatherScore = calculateWeatherScore(routeWeather);
      const trafficScore = calculateTrafficScore(trafficValue);

      let avgTemp = 0;
      let avgHumidity = 0;
      let avgPressure = 0;
      let validWeatherPoints = 0;

      for (const point of routeWeather.points) {
        if (point.main) {
          avgTemp += point.main.temp;
          avgHumidity += point.main.humidity;
          avgPressure += point.main.pressure;
          validWeatherPoints++;
        }
      }

      const weatherDetails =
        validWeatherPoints > 0
          ? {
              avgTemp: Math.round((avgTemp / validWeatherPoints) * 10) / 10,
              avgHumidity:
                Math.round((avgHumidity / validWeatherPoints) * 10) / 10,
              avgPressure:
                Math.round((avgPressure / validWeatherPoints) * 10) / 10,
            }
          : undefined;

      let pm25Total = 0;
      let pm10Total = 0;
      let o3Total = 0;
      let no2Total = 0;
      let so2Total = 0;
      let coTotal = 0;
      let pm25Count = 0;
      let pm10Count = 0;
      let o3Count = 0;
      let no2Count = 0;
      let so2Count = 0;
      let coCount = 0;
      let dominentpol: string | undefined;

      for (const point of routeAQI.points) {
        if (point.aqi) {
          if (point.aqi.dominentpol) {
            dominentpol = point.aqi.dominentpol;
          }
          if (point.aqi.iaqi?.pm25) {
            pm25Total += point.aqi.iaqi.pm25.v;
            pm25Count++;
          }
          if (point.aqi.iaqi?.pm10) {
            pm10Total += point.aqi.iaqi.pm10.v;
            pm10Count++;
          }
          if (point.aqi.iaqi?.o3) {
            o3Total += point.aqi.iaqi.o3.v;
            o3Count++;
          }
          if (point.aqi.iaqi?.no2) {
            no2Total += point.aqi.iaqi.no2.v;
            no2Count++;
          }
          if (point.aqi.iaqi?.so2) {
            so2Total += point.aqi.iaqi.so2.v;
            so2Count++;
          }
          if (point.aqi.iaqi?.co) {
            coTotal += point.aqi.iaqi.co.v;
            coCount++;
          }
        }
      }

      const aqiDetails = {
        dominentpol,
        pollutants: {
          pm25:
            pm25Count > 0
              ? Math.round((pm25Total / pm25Count) * 10) / 10
              : undefined,
          pm10:
            pm10Count > 0
              ? Math.round((pm10Total / pm10Count) * 10) / 10
              : undefined,
          o3:
            o3Count > 0 ? Math.round((o3Total / o3Count) * 10) / 10 : undefined,
          no2:
            no2Count > 0
              ? Math.round((no2Total / no2Count) * 10) / 10
              : undefined,
          so2:
            so2Count > 0
              ? Math.round((so2Total / so2Count) * 10) / 10
              : undefined,
          co:
            coCount > 0 ? Math.round((coTotal / coCount) * 10) / 10 : undefined,
        },
      };

      // Final score: weather 40%, air quality 30%, traffic 30%
      const overallScore =
        Math.round(
          (weatherScore.overall * 0.4 +
            aqiScore.score * 0.3 +
            trafficScore * 0.3) *
            10
        ) / 10;

      let scoreChange: number | undefined;
      if (route.lastComputedScore !== undefined) {
        scoreChange =
          Math.round((overallScore - route.lastComputedScore) * 10) / 10;
      }

      return {
        routeIndex: index,
        distance: route.distance,
        duration: route.duration,
        travelMode: route.travelMode,
        breakpointCount: routeWeather.totalPoints,
        weatherScore,
        weatherDetails,
        aqiScore,
        aqiDetails,
        trafficScore,
        overallScore,
        lastComputedScore: route.lastComputedScore,
        scoreChange,
      };
    });

    const bestRoute = routeScores.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );

    const responseData = {
      success: true,
      message: "Route scores computed successfully",
      data: {
        routes: routeScores,
        bestRoute: {
          index: bestRoute.routeIndex,
          score: bestRoute.overallScore,
        },
        summary: {
          totalRoutes: routes.length,
          averageScore:
            Math.round(
              (routeScores.reduce((sum, r) => sum + r.overallScore, 0) /
                routes.length) *
                10
            ) / 10,
          scoreRange: {
            min: Math.min(...routeScores.map((r) => r.overallScore)),
            max: Math.max(...routeScores.map((r) => r.overallScore)),
          },
        },
      },
    };

    const searchId = uuidv4();
    try {
      await Promise.all([
        redis.set(cacheKey, JSON.stringify(responseData), {
          ex: SCORE_CACHE_TTL,
        }),
        redis.set(
          `route_search:${searchId}`,
          JSON.stringify({ breakpoints, timestamp: new Date().toISOString() }),
          { ex: 3600 }
        ),
      ]);
    } catch {
      /* redis set failed — response still sent */
    }

    res.json({
      ...responseData,
      searchId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to compute route scores" });
  }
};
