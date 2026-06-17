import requests
import logging
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Initialize geocoder with rate limiting (1 request per second)
geolocator = Nominatim(user_agent="pathistics")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1.0)


def geocode_location(location: str) -> Optional[Tuple[float, float]]:
    """
    Convert address to lat/lon using free Nominatim API
    Returns (latitude, longitude) tuple or None
    """
    try:
        result = geocode(location)
        if not result:
            logger.warning(f"Could not geocode location: {location}")
            return None
        return (result.latitude, result.longitude)
    except Exception as e:
        logger.error(f"Geocoding error for '{location}': {str(e)}")
        return None


def get_route_from_osrm(
    current: str, pickup: str, dropoff: str
) -> Optional[Dict[str, Any]]:
    """
    Get route from OSRM (Open Source Routing Machine) API
    Returns route data including geometry, distance, and instructions
    """
    try:
        # Geocode all locations
        coords = []
        locations = [current, pickup, dropoff]

        for loc in locations:
            geo = geocode_location(loc)
            if not geo:
                logger.error(f"Failed to geocode: {loc}")
                return None
            coords.append(f"{geo[1]},{geo[0]}")  # OSRM expects lon,lat

        # Build OSRM route URL
        coordinates = ";".join(coords)
        url = f"http://router.project-osrm.org/route/v1/driving/{coordinates}"

        logger.info(f"Requesting route from OSRM: {url}")

        response = requests.get(
            url,
            params={
                "overview": "full",
                "steps": "true",
                "geometries": "geojson",
                "alternatives": "false",
            },
            timeout=30,
        )

        if response.status_code != 200:
            logger.error(f"OSRM API returned {response.status_code}")
            return None

        data = response.json()
        if not data.get("routes") or len(data["routes"]) == 0:
            logger.error("No routes found in OSRM response")
            return None

        route = data["routes"][0]

        # Extract instructions
        instructions = []
        for leg in route["legs"]:
            for step in leg["steps"]:
                # Get instruction text
                instruction_text = step.get("name", "")
                if step.get("maneuver", {}).get("instruction"):
                    instruction_text = step["maneuver"]["instruction"]

                instructions.append(
                    {
                        "text": instruction_text,
                        "distance_miles": step["distance"] / 1609.34,
                        "duration_minutes": step["duration"] / 60,
                    }
                )

        return {
            "total_distance_miles": route["distance"] / 1609.34,
            "total_duration_hours": route["duration"] / 3600,
            "geometry": route["geometry"],  # GeoJSON
            "instructions": instructions,
        }

    except requests.exceptions.Timeout:
        logger.error("OSRM API request timed out")
        return None
    except requests.exceptions.ConnectionError:
        logger.error("Could not connect to OSRM API")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in get_route_from_osrm: {str(e)}")
        return None


def get_route_fallback(
    current: str, pickup: str, dropoff: str
) -> Optional[Dict[str, Any]]:
    """
    Fallback route calculator using straight-line distances
    Used when OSRM is unavailable
    """
    try:
        current_coords = geocode_location(current)
        pickup_coords = geocode_location(pickup)
        dropoff_coords = geocode_location(dropoff)

        if not all([current_coords, pickup_coords, dropoff_coords]):
            return None

        from geopy.distance import geodesic

        # Calculate straight-line distances
        dist1 = geodesic(current_coords, pickup_coords).miles
        dist2 = geodesic(pickup_coords, dropoff_coords).miles
        total_distance = dist1 + dist2

        # Create simple GeoJSON line
        if current_coords is None or pickup_coords is None or dropoff_coords is None:
            raise ValueError(
                "One or more locations could not be resolved to valid coordinates."
            )

        geometry = {
            "type": "LineString",
            "coordinates": [
                [current_coords[1], current_coords[0]],
                [pickup_coords[1], pickup_coords[0]],
                [dropoff_coords[1], dropoff_coords[0]],
            ],
        }

        instructions = [
            {
                "text": f"Drive from {current} to {pickup}",
                "distance_miles": dist1,
                "duration_minutes": dist1 * 1.1,
            },
            {
                "text": f"Drive from {pickup} to {dropoff}",
                "distance_miles": dist2,
                "duration_minutes": dist2 * 1.1,
            },
        ]

        return {
            "total_distance_miles": total_distance,
            "total_duration_hours": total_distance / 55.0,
            "geometry": geometry,
            "instructions": instructions,
        }

    except Exception as e:
        logger.error(f"Fallback routing failed: {str(e)}")
        return None
