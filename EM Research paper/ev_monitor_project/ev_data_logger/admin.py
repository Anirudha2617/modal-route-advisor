# ev_data_logger/admin.py

from django.contrib import admin
from .models import EVReading

@admin.register(EVReading)
class EVReadingAdmin(admin.ModelAdmin):
    """
    Admin configuration for the EVReading model.
    Provides a user-friendly interface in the Django admin site
    for managing EV readings.
    """
    list_display = (
        'timestamp',
        'voltage',
        'current',
        'temperature',
        'soc',
        'soh',
        # 'device_id', # Uncomment if you add device_id to your model
    )
    list_filter = (
        'timestamp',
        'soc',
        'soh',
        'temperature',
        # 'device_id', # Uncomment if you add device_id
    )
    search_fields = (
        'timestamp', # You can search by timestamp (though it's a datetime, direct search might be tricky)
        # 'device_id', # Uncomment if you add device_id
    )
    readonly_fields = (
        'timestamp', # Usually, you don't want to edit the creation timestamp
    )
    date_hierarchy = 'timestamp' # Adds a date-based navigation drilldown

    fieldsets = (
        (None, {
            'fields': ('voltage', 'current', 'temperature', 'soc', 'soh')
        }),
        ('Metadata', {
            'fields': ('timestamp',),
            # 'classes': ('collapse',), # Optionally make this section collapsible
        }),
        # Uncomment if you add device_id
        # ('Device Information', {
        #     'fields': ('device_id',)
        # }),
    )

    # If you don't want users to add EVReadings manually through the admin
    # (since they come from ESP32), you can disable the add permission.
    # def has_add_permission(self, request):
    #     return False

    # Similarly, you might want to make all fields read-only if data
    # should only ever come from the ESP32 and not be manually altered.
    # def get_readonly_fields(self, request, obj=None):
    #     if obj: # Editing an existing object
    #         return self.readonly_fields + ('voltage', 'current', 'temperature', 'soc', 'soh')
    #     return self.readonly_fields

# If you prefer not to use the @admin.register decorator, you can do:
# admin.site.register(EVReading, EVReadingAdmin)
