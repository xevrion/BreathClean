import mongoose, { Document, Schema } from "mongoose";

export interface IPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface ITravelMode {
  type: "walking" | "cycling" | "driving";
}

export interface ILineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface IRouteOption {
  distance: number;
  duration: number;
  travelMode: ITravelMode;
  routeGeometry: ILineString;

  lastComputedScore?: number;
  lastComputedAt?: Date;
}

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
    travelMode: {
      type: String,
      enum: ["walking", "cycling", "driving"],
      required: true,
    },
  },
  { _id: false }
);

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

routeSchema.index({ "from.location": "2dsphere" });
routeSchema.index({ "to.location": "2dsphere" });
routeSchema.index({ "routes.routeGeometry": "2dsphere" });

routeSchema.index({ userId: 1, updatedAt: -1 });
routeSchema.index({ userId: 1, isFavorite: 1 });

const Route = mongoose.model<IRoute>("Route", routeSchema);
export default Route;
