# ev_data_logger/routing.py
from django.urls import re_path
from . import consumers # Create this file next

websocket_urlpatterns = [
    re_path(r'ws/ev_data/$', consumers.EVDataConsumer.as_asgi()),
]