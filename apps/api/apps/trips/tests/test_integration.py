from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework.response import Response
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
from typing import cast, Any
from apps.trips.models import Trip


class TripIntegrationTests(TestCase):
    """Integration tests for the complete trip planning flow"""

    def setUp(self):
        self.client = APIClient()
        self.plan_url = reverse("plan_trip")

    @patch("apps.trips.views.get_route_from_osrm")
    @patch("apps.trips.views.ELDEngine.generate_trip_plan")
    def test_end_to_end_trip_planning(self, mock_eld, mock_route):
        """Test complete end-to-end trip planning flow"""

        # Mock route response
        mock_route.return_value = {
            "total_distance_miles": 1650,
            "total_duration_hours": 30,
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-118.2437, 34.0522],
                    [-96.7970, 32.7767],
                    [-87.6298, 41.8781],
                ],
            },
            "instructions": [
                {
                    "text": "Head east on I-10",
                    "distance_miles": 150,
                    "duration_minutes": 163,
                },
                {
                    "text": "Continue on I-20",
                    "distance_miles": 800,
                    "duration_minutes": 872,
                },
            ],
        }

        # Mock ELD response
        mock_eld.return_value = {
            "total_driving_hours": 30,
            "fuel_stops": [
                {"mile": 1000, "duration": 0.5},
                {"mile": 2000, "duration": 0.5},
            ],
            "rest_breaks": [
                {"after_hours": 8, "duration": 0.5},
                {"after_hours": 16, "duration": 0.5},
            ],
            "daily_logs": [
                {
                    "day": 1,
                    "date": "2026-01-01",
                    "driving_hours": 11,
                    "on_duty_non_driving": 2,
                    "off_duty_hours": 10,
                    "sleeper_berth_hours": 1,
                    "total_hours": 24,
                    "miles_today": 605,
                    "cycle_hours_remaining": 59,
                },
                {
                    "day": 2,
                    "date": "2026-01-02",
                    "driving_hours": 11,
                    "on_duty_non_driving": 2,
                    "off_duty_hours": 10,
                    "sleeper_berth_hours": 1,
                    "total_hours": 24,
                    "miles_today": 605,
                    "cycle_hours_remaining": 48,
                },
                {
                    "day": 3,
                    "date": "2026-01-03",
                    "driving_hours": 8,
                    "on_duty_non_driving": 2,
                    "off_duty_hours": 10,
                    "sleeper_berth_hours": 4,
                    "total_hours": 24,
                    "miles_today": 440,
                    "cycle_hours_remaining": 40,
                },
            ],
            "requires_multiple_cycle_reset": False,
        }

        request_data = {
            "current_location": "Los Angeles, CA",
            "pickup_location": "Dallas, TX",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 0,
        }

        response = cast(
            Response, self.client.post(self.plan_url, request_data, format="json")
        )
        res_data = cast(dict[str, Any], response.data)

        # Assert response structure
        self.assertEqual(response.status_code, 200)
        self.assertIn("trip_id", res_data)
        self.assertIn("route", res_data)
        self.assertIn("instructions", res_data)
        self.assertIn("eld_logs", res_data)
        self.assertIn("total_distance_miles", res_data)

        # Assert data correctness
        self.assertEqual(res_data["total_distance_miles"], 1650)
        self.assertEqual(len(res_data["eld_logs"]), 3)
        self.assertEqual(len(res_data["instructions"]), 2)

        # Verify database persistence
        self.assertEqual(Trip.objects.count(), 1)
        saved_trip = Trip.objects.first()

        self.assertIsNotNone(saved_trip)
        if saved_trip is not None:
            self.assertEqual(saved_trip.current_location, "Los Angeles, CA")
            self.assertEqual(saved_trip.pickup_location, "Dallas, TX")

    @patch("apps.trips.views.get_route_from_osrm")
    @patch("apps.trips.views.ELDEngine.generate_trip_plan")
    def test_cycle_exceeded_scenario(self, mock_eld, mock_route):
        """Test when trip exceeds 70-hour cycle"""

        mock_route.return_value = {
            "total_distance_miles": 4400,
            "total_duration_hours": 80,
            "geometry": {"coordinates": []},
            "instructions": [],
        }

        mock_eld.return_value = {
            "total_driving_hours": 80,
            "fuel_stops": [],
            "rest_breaks": [],
            "daily_logs": [],
            "requires_multiple_cycle_reset": True,
        }

        request_data = {
            "current_location": "LA",
            "pickup_location": "Dallas",
            "dropoff_location": "NYC",
            "current_cycle_used": 10,
        }

        response = cast(
            Response, self.client.post(self.plan_url, request_data, format="json")
        )
        res_data = cast(dict[str, Any], response.data)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(res_data["requires_cycle_compliance"])

    def test_concurrent_requests(self):
        """Test handling multiple concurrent trip planning requests"""

        def make_request() -> Any:
            # Creating an individual client instance prevents thread collisions over client state
            thread_client = APIClient()
            return thread_client.post(
                self.plan_url,
                {
                    "current_location": "City A",
                    "pickup_location": "City B",
                    "dropoff_location": "City C",
                    "current_cycle_used": 0,
                },
                format="json",
            )

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            results = [cast(Response, f.result()) for f in futures]

        # All requests should fail gracefully with 400 since routing functions are unmocked here
        for result in results:
            self.assertEqual(result.status_code, 400)
