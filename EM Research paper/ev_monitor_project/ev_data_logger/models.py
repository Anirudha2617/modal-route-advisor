# ev_data_logger/models.py

from django.db import models

class EVReading(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    voltage = models.FloatField()
    current = models.FloatField()
    temperature = models.FloatField()
    soc = models.FloatField()  # State of Charge
    soh = models.FloatField()  # State of Health
    # You can add an optional device ID if you plan to monitor multiple ESP32s
    # device_id = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Reading at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    class Meta:
        ordering = ['-timestamp'] # Show newest readings first