
# BreathClean

**Breathe Easier on Every Journey.**


<div align="center">
  
![Nova Drive Logo](https://breathe.daemondoc.online/_next/image?url=%2Flogo.png&w=256&q=75) 

</div>

BreathClean is a health-first route planning application for urban commuters. It integrates real-time Air Quality Index (AQI) and weather data into navigation to recommend routes that minimize pollution exposure — because the fastest route isn't always the healthiest.

![AQI Live Data](https://img.shields.io/badge/AQI-Live%20Data-emerald)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Express](https://img.shields.io/badge/Express-5-blue)
![Django](https://img.shields.io/badge/Django-5.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![License](https://img.shields.io/badge/License-ISC-lightgrey)

---
## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Route Scoring Pipeline](#route-scoring-pipeline)
  - [Score Components](#score-components)
  - [Authentication Flow](#authentication-flow)
  - [Caching Strategy](#caching-strategy)
  - [Background Scheduler](#background-scheduler)
- [API Reference](#api-reference)
  - [Authentication](#authentication-endpoints)
  - [Route Scoring](#route-scoring-endpoint)
  - [Saved Routes](#saved-routes-endpoints)
  - [Scheduler](#scheduler-endpoints)
  - [Data Processing Server](#data-processing-server-endpoints)
- [Database Schemas](#database-schemas)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Servers](#running-the-servers)
- [Available Scripts](#available-scripts)
- [Code Style](#code-style)
- [Contributing](#contributing)
- [License](#license)

---

## The Problem

In modern urban environments, air pollution varies significantly from street to street. Standard navigation apps optimize for speed or distance, often routing commuters through high-pollution corridors near highways, construction zones, and industrial areas. Over time, this repeated exposure contributes to respiratory issues, cardiovascular problems, and reduced quality of life.

## The Solution

BreathClean shifts the priority to your health. By analyzing live AQI data, real-time weather conditions, and traffic congestion at multiple points along each route, it computes a **health score** for every option and recommends the cleanest path through the city.

---

## Key Features

- **Health-First Routing** — Compare routes by health score, not just travel time. Each route is scored on air quality, weather conditions, and traffic congestion.
- **Real-Time AQI Integration** — Live air quality data from the AQICN network, with pollutant breakdowns (PM2.5, PM10, O3, NO2, SO2, CO).
- **Route Comparison Panel** — Side-by-side analysis of up to 3 route options with labels: "Cleanest Path", "Fastest", and "Balanced".
- **Multi-Modal Support** — Walking, cycling, and driving directions with mode-specific health considerations and traffic awareness for driving.
- **Saved Routes** — Store frequent commutes, toggle favorites, and monitor background-refreshed health scores over time.
- **Background Score Updates** — A built-in scheduler re-computes health scores for all saved routes every 30 minutes using fresh AQI and weather data.
- **Google OAuth Authentication** — Secure sign-in with Google for personalized route saving and preferences.
- **Responsive Design** — Mobile-first UI with a drag-to-expand bottom sheet, snap-scroll route cards, and floating map controls.
- **Redis Caching** — Score results are cached for 30 minutes to eliminate redundant API calls for identical routes.
- **Pathway Integration** — Optional Django + Pathway framework microservice for advanced batch score computation.

---

## Tech Stack

### Frontend

| Technology                                                                  | Purpose                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| [Next.js 16](https://nextjs.org/)                                           | App Router, SSR/SSG, route groups                |
| [React 19](https://react.dev/)                                              | UI components with hooks-only state management   |
| [TypeScript 5](https://www.typescriptlang.org/)                             | Strict-mode type safety                          |
| [Tailwind CSS 4](https://tailwindcss.com/)                                  | Utility-first styling                            |
| [Mapbox GL JS](https://www.mapbox.com/)                                     | Interactive maps, geocoding, directions API      |
| [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible component primitives (new-york style) |
| [Lucide React](https://lucide.dev/)                                         | Icon system                                      |
| [Sonner](https://sonner.emilkowal.dev/)                                     | Toast notifications                              |
| [Vercel Analytics](https://vercel.com/analytics)                            | Usage analytics                                  |

### Backend

| Technology                                                                  | Purpose                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [Express 5](https://expressjs.com/)                                         | HTTP server and API routing                                                    |
| [TypeScript 5](https://www.typescriptlang.org/)                             | Strict-mode type safety (noUncheckedIndexedAccess, exactOptionalPropertyTypes) |
| [MongoDB](https://www.mongodb.com/) + [Mongoose 9](https://mongoosejs.com/) | Document database with geospatial indexing                                     |
| [Upstash Redis](https://upstash.com/)                                       | Serverless Redis for score caching and breakpoint storage                      |
| [simply-auth](https://www.npmjs.com/package/simply-auth)                    | Google OAuth integration                                                       |
| [JWT](https://www.npmjs.com/package/jsonwebtoken)                           | Access and refresh token management                                            |
| [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)      | API rate limiting (10 req/min on score endpoint)                               |
| [uuid](https://www.npmjs.com/package/uuid)                                  | Search ID generation for route persistence                                     |

### Data Processing

| Technology                                   | Purpose                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| [Django 5.x](https://www.djangoproject.com/) | Scoring microservice HTTP layer                              |
| [Pathway](https://pathway.com/)              | Optional streaming/batch data pipeline for score computation |
| Python                                       | Core scoring transformers and batch processor                |

### External APIs

| API                                                                         | Usage                                                |
| --------------------------------------------------------------------------- | ---------------------------------------------------- |
| [Mapbox](https://docs.mapbox.com/)                                          | Map rendering, directions, geocoding                 |
| [AQICN](https://aqicn.org/api/)                                             | Real-time air quality data at route breakpoints      |
| [OpenWeather](https://openweathermap.org/api)                               | Weather conditions (temperature, humidity, pressure) |
| [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) | User authentication                                  |

---

## Project Structure

```
BreathClean/
├── client/                              # Next.js 16 frontend (port 3000)
│   ├── app/
│   │   ├── (public)/                    # Unauthenticated pages
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── login/page.tsx           # Google OAuth login UI
│   │   │   ├── about/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   └── layout.tsx
│   │   └── (private)/                   # Auth-protected pages
│   │       ├── home/
│   │       │   ├── page.tsx             # Main map interface
│   │       │   └── routes/
│   │       │       └── (from)/(to)/
│   │       │           └── page.tsx     # Route comparison page
│   │       ├── profile/page.tsx         # User profile
│   │       ├── saved-routes/page.tsx    # Saved routes gallery
│   │       └── layout.tsx
│   ├── components/
│   │   ├── home/
│   │   │   └── HomeMap.tsx              # Core map interface component
│   │   ├── routes/                      # Route comparison & discovery panels
│   │   │   ├── RouteComparisonPanel.tsx
│   │   │   ├── RouteDiscoveryPanel.tsx
│   │   │   ├── RouteMapBackground.tsx
│   │   │   ├── InsightToast.tsx
│   │   │   └── MapControls.tsx
│   │   ├── saved-routes/                # Saved routes gallery components
│   │   ├── landing/                     # Landing page sections
│   │   ├── login/                       # OAuth login UI
│   │   ├── profile/                     # User profile and preferences
│   │   └── ui/                          # Shared shadcn/ui primitives
│   ├── lib/                             # Utility functions
│   ├── types/                           # Global type declarations
│   ├── middleware.ts                     # Auth route protection (Next.js middleware)
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                              # Express 5 backend (port 8000)
│   └── src/
│       ├── index.ts                     # App entry — Express setup + scheduler init
│       ├── controllers/
│       │   ├── oauth.controllers.ts     # Google OAuth handlers
│       │   ├── score.controller.ts      # Route health score computation
│       │   └── savedRoutes.controllers.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── score.routes.ts
│       │   └── savedRoutes.routes.ts
│       ├── Schema/
│       │   ├── user.schema.ts           # User model
│       │   ├── route.schema.ts          # Route + RouteOption models
│       │   └── breakPoints.ts           # BreakPoint model
│       ├── middleware/
│       │   └── tokenVerify.ts           # JWT refresh token verification
│       └── utils/
│           ├── compute/
│           │   ├── breakPoint.compute.ts # Waypoint extraction from geometry
│           │   ├── aqi.compute.ts        # AQICN API fetcher with retry
│           │   └── weather.compute.ts    # OpenWeather API fetcher
│           ├── scheduler/
│           │   ├── computeData.scheduler.ts  # Background batch re-scoring
│           │   └── pathwayClient.ts          # Pathway server HTTP client
│           ├── connectDB.ts             # MongoDB connection
│           ├── redis.ts                 # Upstash Redis client
│           └── userAdapter.ts           # OAuth profile → User schema mapping
│
├── data-processing/                     # Django + Pathway scoring microservice (port 8001)
│   └── dataProcessingServer/
│       ├── api/
│       │   ├── views.py                 # HTTP endpoint handlers
│       │   ├── urls.py                  # URL routing
│       │   ├── serializers.py           # Request/response serialization
│       │   ├── middleware.py            # CORS, logging
│       │   ├── services/
│       │   │   ├── breakpoint_fetcher.py
│       │   │   ├── pathway_client.py
│       │   │   └── score_persister.py
│       │   └── pathway/
│       │       ├── pipeline.py          # Batch Pathway pipeline
│       │       ├── transformers.py      # Score computation logic
│       │       └── connectors.py        # Data pipeline connectors
│       ├── dataProcessingServer/
│       │   ├── settings.py
│       │   └── urls.py
│       └── manage.py
│
├── .github/workflows/                   # CI/CD workflows
├── .husky/                              # Git hooks (pre-commit)
├── package.json                         # Monorepo root — shared scripts
├── .prettierrc.json                     # Prettier config
└── .lintstagedrc.json                   # Lint-staged config
```

---

## Architecture

### System Overview

BreathClean is a three-tier monorepo. All traffic flows from the frontend through the Express backend; the Django microservice is used only by the Express scheduler for background batch processing.

```
┌─────────────────────────────────┐
│  Client  (Next.js — port 3000)  │
│  Map UI, route comparison, auth │
└────────────┬────────────────────┘
             │ REST API calls
             ▼
┌─────────────────────────────────┐     ┌───────────────────┐
│  Server  (Express — port 8000)  │────▶│  Upstash Redis    │
│  Auth, scoring, saved routes,   │     │  Score cache 30m  │
│  scheduler                      │     │  Breakpoints 1hr  │
└──────┬──────────────────────────┘     └───────────────────┘
       │                     │
       │ MongoDB              │ HTTP (scheduler only)
       ▼                     ▼
┌────────────┐    ┌──────────────────────────────┐
│  MongoDB   │    │  Data Processing             │
│  Users     │    │  (Django + Pathway — 8001)   │
│  Routes    │    │  Batch score computation     │
│  BreakPts  │    └──────────────────────────────┘
└────────────┘
```

### Route Scoring Pipeline

**On-demand (per user request):**

```
1. User selects origin + destination in HomeMap
         │
2. Routes page fetches Mapbox Directions API
   (base + traffic variants for driving, up to 3 routes)
         │
3. Client POSTs to POST /api/v1/score/compute
   { routes: [...geometries], traffic: [...values] }
         │
4. Express checks Redis cache (SHA-256 of coords + mode + traffic)
   ├── Cache HIT  → return cached scores + new searchId
   └── Cache MISS → continue pipeline:
         │
5. Extract breakpoints (3–4 per route via fractional distribution)
         │
6. Parallel fetch: weather (OpenWeather) + AQI (AQICN)
   for every breakpoint (5 concurrent, 8s timeout, 2 retries for AQI)
         │
7. Compute health scores for each route
         │
8. Cache result in Redis (30-min TTL)
   Store searchId → breakpoints in Redis (1-hr TTL)
         │
9. Return scores + searchId to client
         │
10. Client renders RouteComparisonPanel
    (best route highlighted, pollution reduction %, exposure warnings)
         │
11. User optionally saves the route (enters name):
    POST /api/v1/saved-routes { searchId, name, ... }
    → Backend retrieves breakpoints from Redis
    → Persists Route + BreakPoint docs in MongoDB
```

**Background (scheduler):**

```
Every 30 minutes (+ on server startup):
  For each saved route in MongoDB:
    1. Load breakpoints from BreakPoint collection
    2. Re-fetch weather + AQI for all breakpoints
    3. Send to Pathway server (if reachable) or compute inline
    4. Update lastComputedScore + lastComputedAt on RouteOption
```

### Score Components

Each route receives a single **overall health score** (0–100) from three weighted components:

| Component   | Weight | Metric      | Ideal Value | Scoring Logic                                   |
| ----------- | ------ | ----------- | ----------- | ----------------------------------------------- |
| **Weather** | 40%    | Temperature | 21 °C       | 100 − \|temp − 21\| × 6                         |
|             |        | Humidity    | 45–55 %     | 100 − (deviation − 5) × 2                       |
|             |        | Pressure    | 1013 hPa    | 100 − (deviation − 2) × 4                       |
|             |        | _Combined_  | —           | temp×0.5 + humidity×0.3 + pressure×0.2          |
| **AQI**     | 30%    | Air Quality | < 20 AQI    | Piecewise inverse: 20→100, 50→80, 100→60, 200→0 |
| **Traffic** | 30%    | Congestion  | 0 (none)    | (1 − (value / 3)^0.7) × 100                     |

**Overall = (weather × 0.4) + (aqi × 0.3) + (traffic × 0.3)**

The same scoring formula is implemented independently in both the Express backend (`score.controller.ts`) and the Django microservice (`api/pathway/transformers.py`) to ensure consistency across on-demand and batch computation paths.

### Authentication Flow

```
1. Client → GET /api/v1/auth/google/link
           ← Google OAuth consent URL

2. User authorizes on Google
   Google → GET /api/v1/auth/google/callback?code=...

3. Server exchanges code for Google tokens (simply-auth)
   Creates or updates User document in MongoDB
   Issues JWT refresh token → sets httpOnly cookie (30-day expiry)
   Redirects to CLIENT_REDIRECT_URL (/home)

4. All protected endpoints read refreshToken cookie
   tokenVerify middleware validates JWT → attaches userId to req

5. Logout → GET /api/v1/auth/google/logout
   Clears refreshToken cookie → client redirects to /login
```

### Caching Strategy

| Cache Key                 | Content                        | TTL        |
| ------------------------- | ------------------------------ | ---------- |
| `score_cache:{sha256}`    | Full score computation result  | 30 minutes |
| `route_search:{searchId}` | Breakpoints for a route search | 60 minutes |

The SHA-256 hash is derived from route coordinates, travel mode, and traffic values — identical routes from different users share the same cache entry, reducing API usage significantly.

### Background Scheduler

`initScheduler()` is called on server startup and runs a batch re-scoring job on a configurable interval (default: 30 minutes, set via `SCHEDULE_INTERVAL_MS`).

The job:

1. Queries all saved routes in MongoDB
2. For each route option, loads its breakpoints from the `BreakPoint` collection
3. Fetches fresh weather and AQI data for those breakpoints
4. Optionally sends the data to the Django/Pathway microservice (`POST /api/compute-scores/`)
5. Falls back to inline computation if Pathway is unreachable
6. Persists updated `lastComputedScore` and `lastComputedAt` to MongoDB

---

## API Reference

All backend endpoints are prefixed with `/api/v1`.

### Authentication Endpoints

| Method | Endpoint                | Auth Required | Description                       |
| ------ | ----------------------- | ------------- | --------------------------------- |
| `GET`  | `/auth/google/link`     | No            | Generate Google OAuth consent URL |
| `GET`  | `/auth/google/callback` | No            | Handle OAuth redirect from Google |
| `GET`  | `/auth/google/logout`   | No            | Clear auth cookie and sign out    |
| `GET`  | `/auth/user`            | Yes           | Get authenticated user profile    |
| `GET`  | `/auth/health`          | No            | Server health check               |

### Route Scoring Endpoint

**`POST /api/v1/score/compute`** — Auth required, rate-limited (10 req/min per IP)

**Request body:**

```json
{
  "routes": [
    {
      "distance": 12345,
      "duration": 1800,
      "routeGeometry": {
        "type": "LineString",
        "coordinates": [[lng, lat], "..."]
      },
      "travelMode": "driving"
    }
  ],
  "traffic": [0.5, 1.2, 0.3]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "routeIndex": 0,
        "weatherScore": {
          "temperature": 82,
          "humidity": 78,
          "pressure": 91,
          "overall": 83
        },
        "aqiScore": { "aqi": 42, "score": 83, "category": "Good" },
        "trafficScore": 76,
        "overallScore": 81,
        "weatherDetails": {
          "avgTemp": 23.1,
          "avgHumidity": 52,
          "avgPressure": 1011
        },
        "aqiDetails": { "dominentpol": "pm25", "pollutants": { "pm25": 12.3 } },
        "pollutionReductionPct": 14.2
      }
    ],
    "bestRoute": { "index": 0, "score": 81 },
    "summary": {
      "totalRoutes": 2,
      "averageScore": 76,
      "scoreRange": { "min": 71, "max": 81 }
    }
  },
  "searchId": "550e8400-e29b-41d4-a716-446655440000",
  "cached": false,
  "timestamp": "2026-02-23T10:00:00.000Z"
}
```

### Saved Routes Endpoints

| Method   | Endpoint                     | Auth Required | Description                        |
| -------- | ---------------------------- | ------------- | ---------------------------------- |
| `GET`    | `/saved-routes`              | Yes           | List all saved routes for the user |
| `POST`   | `/saved-routes`              | Yes           | Save a new route                   |
| `DELETE` | `/saved-routes/:id`          | Yes           | Delete a saved route               |
| `PATCH`  | `/saved-routes/:id/favorite` | Yes           | Toggle favorite status             |

**`POST /api/v1/saved-routes` request body:**

```json
{
  "name": "Morning Commute",
  "searchId": "550e8400-e29b-41d4-a716-446655440000",
  "from": {
    "address": "Mission District, San Francisco",
    "location": { "type": "Point", "coordinates": [-122.419, 37.759] }
  },
  "to": {
    "address": "Financial District, San Francisco",
    "location": { "type": "Point", "coordinates": [-122.399, 37.794] }
  },
  "routes": [
    {
      "distance": 4200,
      "duration": 900,
      "travelMode": "cycling",
      "routeGeometry": { "type": "LineString", "coordinates": [] }
    }
  ],
  "isFavorite": false
}
```

### Scheduler Endpoints

| Method | Endpoint                    | Auth Required | Description                              |
| ------ | --------------------------- | ------------- | ---------------------------------------- |
| `POST` | `/scheduler/run`            | Yes           | Manually trigger a batch re-scoring job  |
| `GET`  | `/scheduler/pathway-health` | Yes           | Check if the Pathway server is reachable |

### Data Processing Server Endpoints

Base URL: `http://localhost:8001/api`

| Method | Endpoint           | Description                         |
| ------ | ------------------ | ----------------------------------- |
| `POST` | `/compute-scores/` | Batch route scoring (max 10 routes) |
| `POST` | `/compute-score/`  | Single route scoring                |
| `GET`  | `/health/`         | Health check                        |

**`POST /api/compute-scores/` request body:**

```json
{
  "routes": [
    {
      "routeId": "mongo_object_id",
      "routeIndex": 0,
      "distance": 12345,
      "duration": 1800,
      "travelMode": "driving",
      "weatherPoints": [
        { "main": { "temp": 22, "humidity": 55, "pressure": 1013 } }
      ],
      "aqiPoints": [
        { "aqi": { "aqi": 45, "dominentpol": "pm25", "iaqi": {} } }
      ],
      "trafficValue": 0.5
    }
  ],
  "usePathway": false
}
```

Set `"usePathway": true` to run the full Pathway streaming pipeline (Linux only; falls back to simple batch on other platforms).

---

## Database Schemas

### User

```
{
  googleId:      string    // Google sub ID (unique index)
  email:         string    // Unique, lowercase
  name:          string
  givenName:     string
  familyName:    string
  picture:       string    // Google profile picture URL
  emailVerified: boolean
  locale:        string
  createdAt:     Date
  updatedAt:     Date
}
```

### Route

```
{
  userId:     ObjectId  // Reference to User (indexed)
  name:       string    // User-defined route name
  from: {
    address:  string
    location: GeoJSON Point  // 2dsphere indexed
  }
  to: {
    address:  string
    location: GeoJSON Point  // 2dsphere indexed
  }
  routes: [   // Up to 5 route options
    {
      distance:           number    // meters
      duration:           number    // seconds
      travelMode:         "walking" | "cycling" | "driving"
      routeGeometry:      GeoJSON LineString  // 2dsphere indexed
      lastComputedScore:  number?   // 0–100, updated by scheduler
      lastComputedAt:     Date?
    }
  ]
  isFavorite:  boolean
  createdAt:   Date
  updatedAt:   Date
}

// Indexes: { userId, updatedAt }, { userId, isFavorite },
//          2dsphere on from.location, to.location, routes.routeGeometry
```

### BreakPoint

```
{
  routeId:          ObjectId  // Reference to Route (indexed)
  routeOptionIndex: number    // Index in Route.routes array
  pointIndex:       number    // Order within breakpoints (0, 1, 2, ...)
  location: {
    type:        "Point"
    coordinates: [lon, lat]   // 2dsphere indexed
  }
  createdAt:  Date
  updatedAt:  Date
}

// Indexes: 2dsphere on location, { routeId, routeOptionIndex }
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **Python** 3.10+ (for the data processing server)
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Upstash Redis** — free tier at [upstash.com](https://upstash.com/)
- **API Keys:**
  - [Mapbox](https://account.mapbox.com/) — map rendering and directions
  - [AQICN](https://aqicn.org/data-platform/token/) — real-time air quality data
  - [OpenWeather](https://openweathermap.org/api) — weather data
  - [Google Cloud Console](https://console.cloud.google.com/) — OAuth 2.0 credentials (set redirect URI to `http://localhost:8000/api/v1/auth/google/callback`)

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/kaihere14/BreathClean.git
cd BreathClean
```

**2. Install Node.js dependencies:**

```bash
npm install
```

**3. Install Python dependencies for the data processing server:**

```bash
cd data-processing/dataProcessingServer
pip install -r requirements.txt
cd ../..
```

### Environment Variables

**`client/.env`:**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-public-token>
```

**`server/.env`:**

```env
# Database
MONGODB_URI=<your-mongodb-connection-string>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# JWT Secrets (use long, random strings)
ACCESS_TOKEN_SECRET=<random-secret>
REFRESH_TOKEN_SECRET=<random-secret>

# External APIs
WEATHER_API_KEY=<your-openweather-api-key>
AQI_API_KEY=<your-aqicn-api-token>

# Redirect after login
CLIENT_REDIRECT_URL=http://localhost:3000

# Upstash Redis
UPSTASH_REDIS_REST_URL=<your-upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-rest-token>

# Data processing server (optional — only needed for background scheduler)
PATHWAY_URL=http://localhost:8001

# Scheduler interval in milliseconds (default: 30 minutes)
SCHEDULE_INTERVAL_MS=1800000
```

**`data-processing/dataProcessingServer/.env`** (or set as environment variables):

```env
DJANGO_SECRET_KEY=<your-django-secret-key>
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

### Running the Servers

The frontend and backend can run independently. The data processing server is optional and only required for background score updates via the scheduler.

```bash
# Terminal 1 — Next.js frontend (port 3000)
npm run dev:client

# Terminal 2 — Express backend (port 8000)
npm run dev:server

# Terminal 3 — Django data processing server (port 8001, optional)
cd data-processing/dataProcessingServer
python manage.py runserver 8001
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Without the data processing server, the background scheduler will compute scores inline using the Express backend logic. The user-facing scoring pipeline (on-demand route analysis) always runs entirely within Express and does not require the Django server.

---

## Available Scripts

All scripts run from the monorepo root:

| Command                      | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `npm run dev:client`         | Start Next.js dev server on port 3000                 |
| `npm run dev:server`         | Start Express dev server on port 8000 (nodemon + tsx) |
| `npm run build:client`       | Build Next.js for production (`next build`)           |
| `npm run build:server`       | Compile TypeScript to `server/dist/`                  |
| `npm run lint`               | ESLint on both client and server                      |
| `npm run lint:client`        | ESLint on client only                                 |
| `npm run lint:server`        | ESLint on server only                                 |
| `npm run format`             | Prettier write on all files                           |
| `npm run check`              | Prettier check without writing                        |
| `npm run check-types:client` | TypeScript type-check client                          |
| `npm run check-types:server` | TypeScript type-check server                          |

---

## Code Style

- **TypeScript** — strict mode on both client and server; server additionally enforces `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **Prettier** — double quotes, semicolons, trailing commas (es5), 80-char line width
- **Import sorting** via `@trivago/prettier-plugin-sort-imports`: react → next → third-party → `@/` → relative
- **Tailwind class sorting** via `prettier-plugin-tailwindcss`
- **Pre-commit hooks** — Husky + lint-staged runs Prettier check and ESLint on all staged files

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

ISC

---

Built with care for a healthier urban future.
