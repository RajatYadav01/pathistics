from django.urls import path
from . import views

urlpatterns = [
    path("", views.health_check, name="health_check"),
    path("plan-trip/", views.plan_trip, name="plan_trip"),
    path("trips/", views.get_trip_history, name="trip_history"),
    path("trips/<int:trip_id>/", views.get_trip_detail, name="trip_detail"),
    path("trips/<int:trip_id>/delete/", views.delete_trip, name="delete_trip"),
]
