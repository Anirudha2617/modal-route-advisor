# project/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('ev/', include('ev_data_logger.urls', namespace='ev_data_logger')),
    # ... other project urls
]