# ev_data_logger/serializers.py

from rest_framework import serializers
from .models import EVReading

# In ev_data_logger/serializers.py
class EVReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EVReading
        # Ensure timestamp is included if it's a model field and you want it in the output
        fields = ['id', 'timestamp', 'voltage', 'current', 'temperature', 'soc', 'soh']
        read_only_fields = ['id', 'timestamp'] # If timestamp is auto-generated