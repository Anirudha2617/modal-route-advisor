from django.contrib import admin
from .models import AIProvider, AIModel, Experiment, ExperimentResult

# Register your models here.
admin.site.register(AIProvider)
admin.site.register(AIModel)
admin.site.register(Experiment)
admin.site.register(ExperimentResult)