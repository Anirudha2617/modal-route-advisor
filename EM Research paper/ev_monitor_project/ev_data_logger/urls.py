# ev_data_logger/urls.py
from django.urls import path
from . import views

app_name = 'ev_data_logger' # Important for namespacing URLs

urlpatterns = [
    path('api/esp32-data/', views.ESP32DataAPI.as_view(), name='esp32_data_input_api'),
    path('dashboard/', views.ev_dashboard_view, name='dashboard'),
    path('api/chart-data/', views.get_ev_chart_data_api, name='get_ev_chart_data_api'),
    # Add this for the polling method (if you choose it over WebSockets)
    path('api/latest-reading/', views.get_latest_ev_reading_api, name='get_latest_ev_reading_api'),
]