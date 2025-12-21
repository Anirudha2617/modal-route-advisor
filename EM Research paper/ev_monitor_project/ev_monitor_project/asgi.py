# your_project_name/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack # For user auth in WebSockets if needed
import ev_data_logger.routing # Create this file next

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ev_monitor_project.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack( # Or just URLRouter if no auth on websocket needed initially
        URLRouter(
            ev_data_logger.routing.websocket_urlpatterns
        )
    ),
})