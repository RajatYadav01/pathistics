import logging
from typing import cast, Any, Dict
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import Trip, EldLogEntry, RouteSegment
from .serializers import (
    TripInputSerializer,
    TripPlanResponseSerializer,
    TripSerializer,
    TripDetailsSerializer,
)
from .eld_engine import ELDEngine
from .routing import get_route_from_osrm

logger = logging.getLogger(__name__)


@api_view(["POST"])
def plan_trip(request):
    """
    Main endpoint: Accept trip inputs, return route + ELD logs
    """
    serializer = TripInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Validation Failed", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = cast(Dict[str, Any], serializer.validated_data)

    try:
        # Get route from OSRM (free)
        route_data = get_route_from_osrm(
            data["current_location"], data["pickup_location"], data["dropoff_location"]
        )

        if not route_data:
            return Response(
                {"error": "Could not calculate route. Please check your locations."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate ELD plan
        eld_plan = ELDEngine.generate_trip_plan(
            total_distance_miles=route_data["total_distance_miles"],
            current_cycle_used=data["current_cycle_used"],
        )

        # Save to DB
        trip = Trip.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used=data["current_cycle_used"],
        )

        # Save route segments
        for idx, instruction in enumerate(
            route_data["instructions"][:10]
        ):  # Save first 10 instructions
            RouteSegment.objects.create(
                trip=trip,
                start_location=instruction.get("text", "Unknown"),
                end_location=instruction.get("text", "Unknown"),
                distance_miles=instruction["distance_miles"],
                duration_hours=instruction["duration_minutes"] / 60,
                is_driving=True,
                order=idx,
            )

        # Save ELD logs
        for log in eld_plan["daily_logs"]:
            EldLogEntry.objects.create(
                trip=trip,
                day_number=log["day"],
                date=log["date"],
                driving_hours=log["driving_hours"],
                on_duty_hours=log["on_duty_non_driving"],
                off_duty_hours=log["off_duty_hours"],
                sleeper_berth_hours=log.get("sleeper_berth_hours", 0),
                total_miles=log["miles_today"],
                cycle_hours_remaining=log.get("cycle_hours_remaining"),
            )

        raw_response_data = {
            "trip_id": trip.pk,
            "route": route_data["geometry"],
            "instructions": route_data["instructions"],
            "total_distance_miles": route_data["total_distance_miles"],
            "estimated_hours": eld_plan["total_driving_hours"],
            "fuel_stops": eld_plan["fuel_stops"],
            "rest_breaks": eld_plan["rest_breaks"],
            "eld_logs": trip.eld_logs.all(),  # Use DB model relationship
            "requires_cycle_compliance": eld_plan["requires_multiple_cycle_reset"],
        }

        response_serializer = TripPlanResponseSerializer(raw_response_data)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error planning trip: {str(e)}")
        return Response(
            {"error": f"An error occurred: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_trip_history(request):
    """
    Get trip history for the user
    """
    trips = (
        Trip.objects.prefetch_related("eld_logs", "segments")
        .all()
        .order_by("created_at")[:50]
    )  # Limit to last 50 trips
    serializer = TripSerializer(trips, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def get_trip_detail(request, trip_id):
    """
    Get detailed information for a specific trip
    """
    trip = get_object_or_404(Trip, id=trip_id)
    serializer = TripDetailsSerializer(trip)
    return Response(serializer.data)


@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint for monitoring
    """
    return Response({"status": "healthy", "version": "1.0.0", "database": "connected"})


@api_view(["DELETE"])
def delete_trip(request, trip_id):
    """
    Delete a specific trip and all related data (cascade delete)
    """
    try:
        # Get the trip or raise Http404
        trip = get_object_or_404(Trip, id=trip_id)

        # Store trip info for response message
        trip_info = (
            f"Trip #{trip.pk} from {trip.pickup_location} to {trip.dropoff_location}"
        )

        # Delete the trip (related segments and logs will be deleted automatically due to CASCADE)
        trip.delete()

        logger.info(f"Successfully deleted {trip_info}")

        return Response(
            {
                "message": f"{trip_info} deleted successfully",
                "deleted_trip_id": trip_id,
            },
            status=status.HTTP_200_OK,
        )

    except Http404:
        raise

    except Exception as e:
        logger.error(f"Error deleting trip {trip_id}: {str(e)}")
        return Response(
            {"error": "Failed to delete trip", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
