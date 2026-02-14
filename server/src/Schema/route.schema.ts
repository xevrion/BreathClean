import mongoose, { Document, Schema } from "mongoose";

/* ================= GEO TYPES ================= */

export interface IPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ITravelMode {
  type: "walking" | "cycling" | "driving";
}

export interface ILineString {
  type: "LineString";
  coordinates: [number, number][];
}

/* ================= ROUTE OPTION ================= */

export interface IRouteOption {
  distance: number; // in km
  duration: number; // in minutes
  travelMode: ITravelMode;
  routeGeometry: ILineString;

  // dynamically updated by pollution engine
  lastComputedScore?: number;
  lastComputedAt?: Date;
}

/* ================= MAIN ROUTE ================= */

export interface IRoute extends Document {
  userId: mongoose.Types.ObjectId;
  name?: string;
  travelMode: ITravelMode;

  from: {
    address: string;
    location: IPoint;
  };

  to: {
    address: string;
    location: IPoint;
  };

  routes: IRouteOption[];

  isFavorite: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* ================= SCHEMAS ================= */

const pointSchema = new Schema<IPoint>(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

const lineStringSchema = new Schema<ILineString>(
  {
    type: {
      type: String,
      enum: ["LineString"],
      required: true,
    },
    coordinates: {
      type: [[Number]],
      required: true,
    },
  },
  { _id: false }
);

/* ===== Route Option Schema ===== */

const routeOptionSchema = new Schema<IRouteOption>(
  {
    distance: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },

    routeGeometry: {
      type: lineStringSchema,
      required: true,
    },

    lastComputedScore: {
      type: Number,
      default: null,
    },

    lastComputedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/* ===== Main Route Schema ===== */

const routeSchema = new Schema<IRoute>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      default: "Saved Route",
      trim: true,
    },

    from: {
      address: {
        type: String,
        required: true,
      },
      location: {
        type: pointSchema,
        required: true,
      },
    },

    to: {
      address: {
        type: String,
        required: true,
      },
      location: {
        type: pointSchema,
        required: true,
      },
    },

    routes: {
      type: [routeOptionSchema],
      required: true,
      validate: {
        validator: (v: IRouteOption[]) => v.length > 0 && v.length <= 5,
        message: "Routes must contain between 1 and 5 route options",
      },
    },

    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ================= INDEXES ================= */

// Needed for geo queries (AQI lookup, weather zone)
routeSchema.index({ "from.location": "2dsphere" });
routeSchema.index({ "to.location": "2dsphere" });
routeSchema.index({ "routes.routeGeometry": "2dsphere" });

// User queries
routeSchema.index({ userId: 1, updatedAt: -1 });
routeSchema.index({ userId: 1, isFavorite: 1 });

/* ================= MODEL ================= */

const Route = mongoose.model<IRoute>("Route", routeSchema);
export default Route;
