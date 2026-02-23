from django.http import JsonResponse
import traceback
from django.conf import settings


class ApiExceptionMiddleware:
    """
    Catch unhandled exceptions for API paths and return a JSON 500 response.
    This avoids triggering Django's HTML technical_500 page (which on some
    environments can fail to render) and gives a stable JSON error for the
    frontend.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            return self.get_response(request)
        except Exception as exc:
            # Only intercept API routes
            path = getattr(request, 'path', '') or ''
            if path.startswith('/api/'):
                if settings.DEBUG:
                    tb = traceback.format_exc()
                    return JsonResponse({'success': False, 'message': 'Internal server error', 'error': str(exc), 'trace': tb}, status=500)
                else:
                    return JsonResponse({'success': False, 'message': 'Internal server error'}, status=500)
            # Re-raise for non-API routes so Django can handle normally
            raise
