from django.urls import path
from . import views

urlpatterns = [
    path('run-experiment/', views.run_experiment_backend, name='run-experiment'),
    path('providers/', views.AIProviderViewSet.as_view({'get': 'list'}), name='provider-list'),
    path('models/', views.AIModelViewSet.as_view({'get': 'list'}), name='model-list'),
    path('experiments/', views.ExperimentViewSet.as_view({'get': 'list'}), name='experiment-list'),
    path('experiments/<int:pk>/', views.ExperimentViewSet.as_view({'get': 'retrieve'}), name='experiment-detail'),
    path('results/', views.ExperimentResultViewSet.as_view({'get': 'list'}), name='result-list'),
    path('results/<int:pk>/', views.ExperimentResultViewSet.as_view({'get': 'retrieve'}), name='result-detail'),
    path('trending-models/', views.get_trending_data, name='trending-models'),
]