"""
API Views for BreathClean Data Processing Server.
Provides HTTP endpoints for Pathway-based score computation.
"""
import json
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .pathway.pipeline import run_batch_pipeline, run_simple_batch


@csrf_exempt
@require_http_methods(["POST"])
def compute_scores(request):
    """
    Compute route scores using Pathway pipeline.
    
    Endpoint: POST /api/compute-scores/
    
    Request Body:
    {
        "routes": [
            {
                "routeId": "mongo_object_id",  // Optional
                "routeIndex": 0,
                "distance": 12345,
                "duration": 1800,
                "travelMode": "driving",
                "weatherPoints": [
                    {"main": {"temp": 22, "humidity": 55, "pressure": 1013}},
                    ...
                ],
                "aqiPoints": [
                    {"aqi": {"aqi": 45, "dominentpol": "pm25", "iaqi": {...}}},
                    ...
                ],
                "trafficValue": 0.5,
                "lastComputedScore": 75.0  // Optional
            },
            ...
        ],
        "usePathway": true  // Optional: use full Pathway pipeline (default: false for reliability)
    }
    
    Response:
    {
        "success": true,
        "message": "Batch scores computed successfully",
        "routes": [...],
        "bestRoute": {"index": 0, "routeId": "...", "score": 78.5},
        "summary": {
            "totalRoutes": 3,
            "averageScore": 72.3,
            "scoreRange": {"min": 65.0, "max": 78.5}
        },
        "computedAt": "2026-02-16T12:00:00Z",
        "engine": "pathway"
    }
    """
    try:
        # Parse request body
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                "success": False,
                "message": "Invalid JSON in request body"
            }, status=400)

        routes = body.get("routes", [])
        use_pathway = body.get("usePathway", False)
        

        # Validation
        if not isinstance(routes, list):
            return JsonResponse({
                "success": False,
                "message": "'routes' must be an array."
            }, status=400)

        if not routes:
            return JsonResponse({
                "success": False,
                "message": "No routes provided. 'routes' array is required."
            }, status=400)

        if len(routes) > 10:
            return JsonResponse({
                "success": False,
                "message": "Maximum 10 routes allowed per batch."
            }, status=400)

        # Validate each route has required fields
        for i, route in enumerate(routes):
            if not isinstance(route, dict):
                return JsonResponse({
                    "success": False,
                    "message": f"Route at index {i} must be an object."
                }, status=400)

        # Process routes
        if use_pathway:
            # Use full Pathway pipeline with table operations
            result = run_batch_pipeline(routes)
        else:
            # Use simple batch processing (more reliable for hackathon)
            result = run_simple_batch(routes)

        if result.get("success"):
            return JsonResponse(result, status=200)
        else:
            return JsonResponse(result, status=500)

    except Exception:
        traceback.print_exc()
        return JsonResponse({
            "success": False,
            "message": "Internal server error"
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def compute_single_score(request):
    """
    Compute score for a single route.
    
    Endpoint: POST /api/compute-score/
    
    Request Body:
    {
        "routeId": "mongo_object_id",
        "routeIndex": 0,
        "distance": 12345,
        "duration": 1800,
        "travelMode": "driving",
        "weatherPoints": [...],
        "aqiPoints": [...],
        "trafficValue": 0.5,
        "lastComputedScore": 75.0
    }
    
    Response:
    {
        "success": true,
        "route": {...computed score data...}
    }
    """
    try:
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                "success": False,
                "message": "Invalid JSON in request body"
            }, status=400)

        if body is None:
            return JsonResponse({
                "success": False,
                "message": "Request body is required."
            }, status=400)

        # Validate required fields for compute_route_score
        required_fields = ["distance", "duration", "travelMode"]
        missing_fields = [field for field in required_fields if field not in body]

        if missing_fields:
            return JsonResponse({
                "success": False,
                "message": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=400)

        # Import here to avoid circular imports
        from .pathway.transformers import compute_route_score
        

        result = compute_route_score(body)

        return JsonResponse({
            "success": True,
            "route": result
        }, status=200)

    except Exception:
        traceback.print_exc()
        return JsonResponse({
            "success": False,
            "message": "Internal server error"
        }, status=500)


@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint.
    
    Endpoint: GET /api/health/
    """
    return JsonResponse({
        "status": "healthy",
        "service": "BreathClean Data Processing Server",
        "engine": "Pathway"
    })
