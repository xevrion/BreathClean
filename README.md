# BreathClean 🌿

**Breathe Easier on Every Journey.**

BreathClean is a health-first route planning application designed for urban commuters. It prioritizes respiratory health by integrating real-time air quality data into navigation, helping users find the cleanest path through the city.

![Live AQI Data Active](https://img.shields.io/badge/AQI-Live%20Data-emerald)

---

## 🚀 Overview

In modern urban environments, air pollution varies significantly from street to street. Standard navigation apps focus on the fastest or shortest route, often leading commuters through high-pollution corridors. **BreathClean** shifts the priority to your health, analyzing live AQI (Air Quality Index) data to recommend routes that minimize exposure to harmful pollutants.

## ✨ Key Features

- **Health-First Routing:** Find the "cleanest" path between two points, not just the fastest.
- **Real-time AQI Integration:** Live air quality overlays and data points integrated directly into the map interface.
- **Route Comparison:** Side-by-side analysis of multiple route options with detailed health insights.
- **Saved Routes:** Store your frequent commutes and monitor their air quality over time.
- **Personalized Dashboard:** Track your exposure and manage notification preferences for high-pollution alerts.
- **Modern UI/UX:** A responsive, dark-mode-ready interface built with the latest web technologies.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Mapping:** [Mapbox GL JS](https://www.mapbox.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Components:** [Shadcn UI](https://ui.shadcn.com/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication:** OAuth & Custom JWT-based Auth

### Data Processing
- **Engine:** Python (for advanced AQI data modeling and processing)

## 📁 Project Structure

```text
.
├── client/              # Next.js frontend application
├── server/              # Express backend API
├── data-processing/     # Python scripts for data analysis
└── package.json         # Monorepo configuration and scripts
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB
- Mapbox API Token

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kaihere14/BreathClean.git
   cd BreathClean
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create `.env` files in both `client/` and `server/` directories based on the provided examples (if available) or existing configurations.

4. **Run the development servers:**
   ```bash
   # Run both client and server in parallel
   npm run dev:client
   npm run dev:server
   ```


---

Built with ❤️ for a healthier urban future.
