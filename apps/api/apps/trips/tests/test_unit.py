from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.response import Response
from rest_framework import status
from unittest.mock import patch, Mock
from datetime import datetime
from typing import cast, Any
from apps.trips.models import Trip, RouteSegment, EldLogEntry
from apps.trips.eld_engine import ELDEngine
from apps.trips.routing import get_route_from_osrm


class ELDEngineTests(TestCase):
    """Test ELD engine calculations"""

    def setUp(self):
        self.engine = ELDEngine()

    def test_fuel_stop_calculation(self):
        """Test fuel stops every 1000 miles"""
        total_distance = 2500
        plan = self.engine.generate_trip_plan(total_distance)
        fuel_stops = plan["fuel_stops"]

        self.assertEqual(len(fuel_stops), 2)
        self.assertEqual(fuel_stops[0]["mile"], 1000)
        self.assertEqual(fuel_stops[1]["mile"], 2000)
        self.assertEqual(fuel_stops[0]["duration"], 0.5)

    def test_no_fuel_stops_under_1000_miles(self):
        total_distance = 950
        plan = self.engine.generate_trip_plan(total_distance)
        fuel_stops = plan["fuel_stops"]

        self.assertEqual(len(fuel_stops), 0)

    def test_rest_break_calculation(self):
        """Test rest breaks every 8 hours"""
        # 1320 miles / 55 mph = 24 hours
        plan = self.engine.generate_trip_plan(total_distance_miles=1320)
        rest_breaks = plan["rest_breaks"]

        self.assertEqual(len(rest_breaks), 3)
        self.assertEqual(rest_breaks[0]["after_hours"], 8)
        self.assertEqual(rest_breaks[1]["after_hours"], 16)
        self.assertEqual(rest_breaks[2]["after_hours"], 24)

    def test_daily_log_generation_single_day(self):
        """Test single day trip within 11 hours"""
        logs = self.engine._generate_daily_logs(10, 0, [], [])

        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0]["driving_hours"], 10)
        self.assertEqual(logs[0]["on_duty_non_driving"], 1)
        self.assertEqual(logs[0]["off_duty_hours"], 10)
        self.assertEqual(logs[0]["cycle_hours_remaining"], 60)

    def test_daily_log_generation_multiple_days(self):
        """Test trip requiring multiple days"""
        logs = self.engine._generate_daily_logs(25, 0, [], [])

        self.assertEqual(len(logs), 3)  # 11 + 11 + 3 hours
        self.assertEqual(logs[0]["driving_hours"], 11)
        self.assertEqual(logs[1]["driving_hours"], 11)
        self.assertEqual(logs[2]["driving_hours"], 3)

    def test_cycle_limit_enforcement(self):
        """Test 70-hour cycle limit enforcement"""
        logs = self.engine._generate_daily_logs(15, 60, [], [])

        total_driven = sum(log["driving_hours"] for log in logs)
        self.assertEqual(total_driven, 10)
        self.assertEqual(logs[-1]["cycle_hours_remaining"], 0)

    def test_complete_trip_plan(self):
        """Test complete trip plan generation"""
        plan = self.engine.generate_trip_plan(1650, 55.0, 0)

        self.assertIn("total_distance_miles", plan)
        self.assertIn("total_driving_hours", plan)
        self.assertIn("fuel_stops", plan)
        self.assertIn("rest_breaks", plan)
        self.assertIn("daily_logs", plan)
        self.assertEqual(plan["total_distance_miles"], 1650)
        self.assertAlmostEqual(plan["total_driving_hours"], 30.0, places=1)


class RoutingTests(TestCase):
    """Test routing and geocoding functions"""

    @patch("apps.trips.routing.requests.get")
    def test_route_api_failure(self, mock_get):
        """Test handling of routing API failure"""
        mock_get.side_effect = Exception("API Error")

        result = get_route_from_osrm("LA", "Dallas", "Chicago")
        self.assertIsNone(result)


class TripAPITests(TestCase):
    """Test the trip planning API endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.plan_url = reverse("plan_trip")

    @patch("apps.trips.views.get_route_from_osrm")
    @patch("apps.trips.views.ELDEngine.generate_trip_plan")
    def test_create_trip_success(self, mock_eld, mock_route):
        """Test successful trip creation"""
        mock_route.return_value = {
            "total_distance_miles": 550,
            "total_duration_hours": 10,
            "geometry": {"type": "LineString", "coordinates": []},
            "instructions": [
                {"text": "Head north", "distance_miles": 10, "duration_minutes": 12}
            ],
        }

        mock_eld.return_value = {
            "total_driving_hours": 10,
            "fuel_stops": [],
            "rest_breaks": [],
            "daily_logs": [
                {
                    "day": 1,
                    "date": "2026-06-15",
                    "driving_hours": 10.0,
                    "on_duty_non_driving": 1.0,
                    "off_duty_hours": 10.0,
                    "sleeper_berth_hours": 0.0,
                    "miles_today": 550.0,
                    "cycle_hours_remaining": 60.0,
                }
            ],
            "requires_multiple_cycle_reset": False,
        }

        data = {
            "current_location": "Los Angeles, CA",
            "pickup_location": "Dallas, TX",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 0.0,
        }

        response = cast(Response, self.client.post(self.plan_url, data, format="json"))
        # Inform type checker that data is a non-None, indexable dictionary
        res_data = cast(dict[str, Any], response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("trip_id", res_data)
        self.assertIn("route", res_data)
        self.assertIn("eld_logs", res_data)

    def test_create_trip_invalid_data(self):
        """Test trip creation with invalid data"""
        data = {
            "current_location": "",
            "pickup_location": "Dallas, TX",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 75,  # Validated max is 70
        }

        response = cast(Response, self.client.post(self.plan_url, data, format="json"))
        res_data = cast(dict[str, Any], response.data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("details", res_data)
        self.assertIn("current_location", res_data["details"])
        self.assertIn("current_cycle_used", res_data["details"])

    def test_create_trip_missing_fields(self):
        """Test trip creation with missing required fields"""
        data = {"current_location": "Los Angeles, CA"}
        response = self.client.post(self.plan_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.trips.views.get_route_from_osrm")
    def test_route_calculation_failure(self, mock_route):
        """Test handling when route calculation fails"""
        mock_route.return_value = None

        data = {
            "current_location": "Los Angeles, CA",
            "pickup_location": "Dallas, TX",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 0,
        }

        response = cast(Response, self.client.post(self.plan_url, data, format="json"))
        res_data = cast(dict[str, Any], response.data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", res_data)


class TripModelTests(TestCase):
    """Test Trip and related models"""

    def setUp(self):
        self.trip = Trip.objects.create(
            current_location="Los Angeles, CA",
            pickup_location="Dallas, TX",
            dropoff_location="Chicago, IL",
            current_cycle_used=15.5,
        )

    def test_trip_creation(self):
        """Test trip model creation"""
        self.assertEqual(self.trip.current_location, "Los Angeles, CA")
        self.assertEqual(self.trip.current_cycle_used, 15.5)
        self.assertIsNotNone(self.trip.created_at)

    def test_route_segment_creation(self):
        """Test route segment creation and relationship"""
        segment = RouteSegment.objects.create(
            trip=self.trip,
            start_location="Los Angeles, CA",
            end_location="Phoenix, AZ",
            distance_miles=370,
            duration_hours=6.7,
            is_driving=True,
        )

        self.assertEqual(segment.trip, self.trip)
        self.assertEqual(self.trip.segments.count(), 1)

    def test_eld_log_creation(self):
        """Test ELD log entry creation"""
        log = EldLogEntry.objects.create(
            trip=self.trip,
            day_number=1,
            date=datetime.now().date(),
            driving_hours=10,
            on_duty_hours=1,
            off_duty_hours=10,
            sleeper_berth_hours=0,
            total_miles=550,
        )

        self.assertEqual(log.trip, self.trip)
        self.assertEqual(self.trip.eld_logs.count(), 1)

    def test_string_representation(self):
        """Test string representation of models"""
        expected = f"Trip #{self.trip.pk} - {self.trip.pickup_location} to {self.trip.dropoff_location}"
        self.assertEqual(str(self.trip), expected)


class TripDeleteTests(TestCase):
    """Test trip deletion functionality"""

    def setUp(self):
        self.client = APIClient()
        self.trip = Trip.objects.create(
            current_location="Los Angeles, CA",
            pickup_location="Dallas, TX",
            dropoff_location="Chicago, IL",
            current_cycle_used=10,
        )
        self.delete_url = reverse("delete_trip", args=[self.trip.pk])

    def test_delete_trip_success(self):
        """Test successful trip deletion"""
        response = cast(Response, self.client.delete(self.delete_url))
        res_data = cast(dict[str, Any], response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("message", res_data)
        self.assertEqual(Trip.objects.count(), 0)

    def test_delete_nonexistent_trip(self):
        """Test deleting a trip that doesn't exist"""
        url = reverse("delete_trip", args=[999])
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_cascade(self):
        """Test that related data is also deleted"""
        trip_id = self.trip.pk

        # Create related data
        RouteSegment.objects.create(
            trip=self.trip,
            start_location="Test",
            end_location="Test",
            distance_miles=100,
            duration_hours=2,
            order=1,
        )

        EldLogEntry.objects.create(
            trip=self.trip,
            day_number=1,
            date=datetime.now().date(),
            driving_hours=10,
            on_duty_hours=2,
            off_duty_hours=10,
            sleeper_berth_hours=0,
            total_miles=550,
        )

        # Verify related data exists
        self.assertEqual(RouteSegment.objects.filter(trip_id=trip_id).count(), 1)
        self.assertEqual(EldLogEntry.objects.filter(trip_id=trip_id).count(), 1)

        # Delete trip
        response = self.client.delete(self.delete_url)

        # Verify all related data is gone cascading down
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Trip.objects.count(), 0)
        self.assertEqual(RouteSegment.objects.filter(trip_id=trip_id).count(), 0)
        self.assertEqual(EldLogEntry.objects.filter(trip_id=trip_id).count(), 0)
