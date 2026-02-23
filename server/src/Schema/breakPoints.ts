import mongoose, { Document, Schema } from "mongoose";

export interface IBreakPoint extends Document {
  routeId: mongoose.Types.ObjectId;
  routeOptionIndex: number;
  pointIndex: number;

  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

const pointSchema = new Schema(
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

const breakPointSchema = new Schema<IBreakPoint>(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    routeOptionIndex: {
      type: Number,
      required: true,
    },
    pointIndex: {
      type: Number,
      required: true,
    },
    location: {
      type: pointSchema,
      required: true,
    },
  },
  { timestamps: true }
);

breakPointSchema.index({ location: "2dsphere" });

breakPointSchema.index({ routeId: 1, routeOptionIndex: 1 });

const BreakPoint = mongoose.model<IBreakPoint>("BreakPoint", breakPointSchema);

export default BreakPoint;
