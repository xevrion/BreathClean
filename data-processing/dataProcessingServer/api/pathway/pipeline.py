"""
Pathway pipeline for BreathClean batch score computation.

This pipeline can run in two modes:
1. Streaming mode: Continuously process incoming data
2. Batch mode: Process a batch of routes and return results

For the hackathon, we use batch mode triggered by HTTP endpoint.

NOTE: Pathway requires Linux. On Windows, use run_simple_batch() which
uses direct Python computation. For production, run in Docker/WSL.
"""
from typing import List, Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)

# Try to import Pathway - gracefully handle if not available (Windows)
PATHWAY_AVAILABLE = False
pw = None

try:
    import pathway as _pw
    # Verify it's the real Pathway package
    if hasattr(_pw, 'Schema'):
        pw = _pw
        PATHWAY_AVAILABLE = True
except (ImportError, AttributeError):
    pass

# Pathway is Linux-only. Even if the package is importable on Windows
# (e.g. accidental/bundled install), avoid using it because it can
# hang or fail at runtime on Windows environments. Force disabled on
# Windows to ensure the Django server remains responsive.
import sys
if sys.platform.startswith("win") and PATHWAY_AVAILABLE:
    PATHWAY_AVAILABLE = False
    pw = None

from .transformers import compute_route_score, compute_batch_scores


# Define schema only if Pathway is available
RouteInputSchema = None
if PATHWAY_AVAILABLE and pw is not None:
    class RouteInputSchema(pw.Schema):
        """Schema for incoming route data."""
        route_id: str
        route_index: int
        distance: float
        duration: float
        travel_mode: str
        weather_points: str  # JSON string of weather data
        aqi_points: str      # JSON string of AQI data
        traffic_value: float
        last_computed_score: Optional[float]


def process_route_row(
    route_id: str,
    route_index: int,
    distance: float,
    duration: float,
    travel_mode: str,
    weather_points: str,
    aqi_points: str,
    traffic_value: float,
    last_computed_score: Optional[float]
) -> str:
    """
    Process a single route row and compute its score.
    Returns JSON string of computed score.
    """
    try:
        weather_data = json.loads(weather_points) if weather_points else []
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse weather_points for route: %s", e)
        weather_data = []

    try:
        aqi_data = json.loads(aqi_points) if aqi_points else []
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse aqi_points for route: %s", e)
        aqi_data = []

    route_data = {
        "routeId": route_id,
        "routeIndex": route_index,
        "distance": distance,
        "duration": duration,
        "travelMode": travel_mode,
        "weatherPoints": weather_data,
        "aqiPoints": aqi_data,
        "trafficValue": traffic_value,
        "lastComputedScore": last_computed_score
    }

    result = compute_route_score(route_data)
    return json.dumps(result)


def run_batch_pipeline(routes_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Run Pathway pipeline in batch mode for a list of routes.
    
    This is the main entry point called by the Django view.
    Uses Pathway's batch processing capabilities for efficient computation.
    
    Falls back to simple batch processing if Pathway is not available (Windows).
    
    Args:
        routes_data: List of route dictionaries with weather/aqi/traffic data
        
    Returns:
        Dictionary with computed scores and summary
    """
    # If Pathway is not available, fall back to simple batch processing
    if not PATHWAY_AVAILABLE or pw is None:
        result = run_simple_batch(routes_data)
        result["engine"] = "python-fallback"
        result["message"] = "Scores computed (Pathway not available, using Python fallback)"
        return result
    
    # For batch processing, we use Pathway's static mode
    # This processes all data at once and returns results
    
    if not routes_data:
        return {
            "success": False,
            "message": "No routes provided",
            "routes": [],
            "summary": None
        }

    # Convert input to Pathway table format
    table_data = []
    for route in routes_data:
        table_data.append({
            "route_id": str(route.get("routeId", "")),
            "route_index": route.get("routeIndex", 0),
            "distance": float(route.get("distance", 0)),
            "duration": float(route.get("duration", 0)),
            "travel_mode": route.get("travelMode", "driving"),
            "weather_points": json.dumps(route.get("weatherPoints", [])),
            "aqi_points": json.dumps(route.get("aqiPoints", [])),
            "traffic_value": float(route.get("trafficValue", 0)),
            "last_computed_score": route.get("lastComputedScore")
        })

    # Create Pathway table from data
    input_table = pw.debug.table_from_markdown(
        _markdown_from_data(table_data),
        schema=RouteInputSchema
    )

    # Apply transformation using UDF
    @pw.udf
    def compute_score_udf(
        route_id: str,
        route_index: int,
        distance: float,
        duration: float,
        travel_mode: str,
        weather_points: str,
        aqi_points: str,
        traffic_value: float,
        last_computed_score: Optional[float]
    ) -> str:
        return process_route_row(
            route_id, route_index, distance, duration, travel_mode,
            weather_points, aqi_points, traffic_value, last_computed_score
        )

    # Transform table
    result_table = input_table.select(
        score_json=compute_score_udf(
            input_table.route_id,
            input_table.route_index,
            input_table.distance,
            input_table.duration,
            input_table.travel_mode,
            input_table.weather_points,
            input_table.aqi_points,
            input_table.traffic_value,
            input_table.last_computed_score
        )
    )

    # Run pipeline and collect results
    results = pw.debug.table_to_pandas(result_table)
    
    # Parse results back to dictionaries
    route_scores = []
    for _, row in results.iterrows():
        try:
            score_data = json.loads(row["score_json"])
            route_scores.append(score_data)
        except (json.JSONDecodeError, KeyError):
            continue

    if not route_scores:
        return {
            "success": False,
            "message": "Failed to compute scores",
            "routes": [],
            "summary": None
        }

    # Sort by route index
    route_scores.sort(key=lambda x: x.get("routeIndex", 0))

    # Find best route
    best_route = max(route_scores, key=lambda r: r.get("overallScore", 0))

    # Calculate summary statistics
    overall_scores = [r.get("overallScore", 0) for r in route_scores]
    avg_score = round(sum(overall_scores) / len(overall_scores), 1)

    from datetime import datetime, timezone
    
    return {
        "success": True,
        "message": "Batch scores computed via Pathway pipeline",
        "routes": route_scores,
        "bestRoute": {
            "index": best_route.get("routeIndex"),
            "routeId": best_route.get("routeId"),
            "score": best_route.get("overallScore")
        },
        "summary": {
            "totalRoutes": len(route_scores),
            "averageScore": avg_score,
            "scoreRange": {
                "min": min(overall_scores),
                "max": max(overall_scores)
            }
        },
        "computedAt": datetime.now(timezone.utc).isoformat(),
        "engine": "pathway"
    }


def run_simple_batch(routes_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Simplified batch processing without full Pathway table operations.
    Falls back to direct transformer calls for reliability.
    
    Use this if Pathway table operations cause issues.
    """
    return compute_batch_scores(routes_data)


def _markdown_from_data(data: List[Dict]) -> str:
    """
    Convert list of dicts to markdown table format for Pathway.
    """
    if not data:
        return ""
    
    headers = list(data[0].keys())
    lines = [" | ".join(headers)]
    lines.append(" | ".join(["---"] * len(headers)))
    
    for row in data:
        values = []
        for h in headers:
            val = row.get(h)
            if val is None:
                values.append("")
            else:
                # Escape pipe characters in values
                values.append(str(val).replace("|", "\\|"))
        lines.append(" | ".join(values))
    
    return "\n".join(lines)


# Streaming mode (for future use)
def create_streaming_pipeline(input_connector, output_connector):
    """
    Create a streaming Pathway pipeline.
    
    This is for future use when we want real-time streaming updates
    instead of batch processing.
    
    Raises:
        RuntimeError: If Pathway is not available (e.g., on Windows).
    """
    if not PATHWAY_AVAILABLE or pw is None:
        raise RuntimeError(
            "Pathway is not available. Streaming pipeline requires Pathway "
            "(Linux only). Use run_simple_batch() as a fallback or run in "
            "Docker/WSL."
        )

    # Read from input connector
    input_table = pw.io.jsonlines.read(
        input_connector,
        schema=RouteInputSchema,
        mode="streaming"
    )
    
    @pw.udf
    def compute_score_streaming(
        route_id: str,
        route_index: int,
        distance: float,
        duration: float,
        travel_mode: str,
        weather_points: str,
        aqi_points: str,
        traffic_value: float,
        last_computed_score: Optional[float]
    ) -> str:
        return process_route_row(
            route_id, route_index, distance, duration, travel_mode,
            weather_points, aqi_points, traffic_value, last_computed_score
        )
    
    # Transform
    result_table = input_table.select(
        score_json=compute_score_streaming(
            input_table.route_id,
            input_table.route_index,
            input_table.distance,
            input_table.duration,
            input_table.travel_mode,
            input_table.weather_points,
            input_table.aqi_points,
            input_table.traffic_value,
            input_table.last_computed_score
        )
    )
    
    # Write to output
    pw.io.jsonlines.write(result_table, output_connector)
    
    return result_table
