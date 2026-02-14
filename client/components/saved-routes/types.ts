export interface IPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ILineString {
  type: "LineString";
  coordinates: [number, number][];
}

export interface IRouteOption {
  distance: number; // in km
  duration: number; // in minutes
  routeGeometry: ILineString;
  lastComputedScore?: number | null;
  lastComputedAt?: string | null;
}

export interface ISavedRoute {
  _id: string;
  userId: string;
  name?: string;
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
  createdAt: string;
  updatedAt: string;
}
