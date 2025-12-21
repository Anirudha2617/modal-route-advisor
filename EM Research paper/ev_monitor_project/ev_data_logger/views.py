# ev_data_logger/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import EVReadingSerializer
from .models import EVReading # For webpage views

from django.shortcuts import render # For webpage views
from django.http import JsonResponse # For serving data to charts
from django.utils import timezone # For time-based filtering
from datetime import timedelta # For time-based filtering

# For Django Channels broadcast
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class ESP32DataAPI(APIView):
    def post(self, request, format=None):
        serializer = EVReadingSerializer(data=request.data)
        if serializer.is_valid():
            saved_instance = serializer.save() # Get the saved instance
            print("Data received and saved:", serializer.data)

            # Broadcast the new data via Channels
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "ev_data_broadcast", # Must match group_name in consumer
                {
                    "type": "ev_reading.update", # This will call ev_reading_update in consumer
                    "payload": serializer.data # Send the serialized data
                }
            )
            print("Broadcasted data via Channels.")
            return Response({"message": "Data received successfully"}, status=status.HTTP_201_CREATED)
        print("Error receiving data:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Views for Webpage (will be expanded later) ---
def ev_dashboard_view(request):
    # This view will render the main dashboard page
    latest_reading = EVReading.objects.order_by('-timestamp').first()
    context = {
        'latest_reading': latest_reading,
        # Add more context if needed, e.g., for initial chart data
    }
    return render(request, 'ev_data_logger/dashboard.html', context)

def get_ev_chart_data_api(request):
    # This API endpoint will serve data for the charts on the dashboard
    # Fetch the last N readings or readings from the last X minutes/hours
    time_threshold = timezone.now() - timedelta(hours=1) # Example: last 1 hour
    readings = EVReading.objects.filter(timestamp__gte=time_threshold).order_by('timestamp')

    # Limit number of data points to avoid overly cluttered charts if many readings
    MAX_POINTS = 100 # Adjust as needed
    if readings.count() > MAX_POINTS:
        readings = readings[readings.count() - MAX_POINTS:]


    data = {
        "labels": [r.timestamp.strftime('%H:%M:%S') for r in readings],
        "voltage": [r.voltage for r in readings],
        "current": [r.current for r in readings],
        "temperature": [r.temperature for r in readings],
        "soc": [r.soc for r in readings],
        # "soh": [r.soh for r in readings], # SOH changes slowly, might not need frequent chart updates
    }
    return JsonResponse(data)



def get_latest_ev_reading_api(request):
    """
    API endpoint to get the single latest EVReading.
    """
    latest_reading = EVReading.objects.order_by('-timestamp').first()
    if latest_reading:
        serializer = EVReadingSerializer(latest_reading) # Use your existing serializer
        return JsonResponse(serializer.data)
    return JsonResponse({}, status=404) # Or return status 204 if no content