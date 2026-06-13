import math
from datetime import datetime, timedelta
from typing import List, Dict, Any


class ELDEngine:
    """
    FMCSA HOS rules for property-carrying drivers (70hrs/8days)
    """

    MAX_DRIVING_DAILY = 11.0  # Hours
    MAX_ON_DUTY_DAILY = 14.0  # Hours (after 10hr off-duty)
    REQUIRED_OFF_DUTY = 10.0  # Consecutive hours
    MAX_CYCLE_HOURS = 70.0  # Rolling 8-day period
    FUEL_INTERVAL_MILES = 1000.0
    PICKUP_DROPOFF_HOURS = 1.0

    @classmethod
    def generate_trip_plan(
        cls,
        total_distance_miles: float,
        avg_speed_mph: float = 55.0,
        current_cycle_used: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Generate route instructions and ELD logs
        """
        total_driving_hours = total_distance_miles / avg_speed_mph

        # Calculate fuel stops
        num_fuel_stops = max(
            0, math.floor(total_distance_miles / cls.FUEL_INTERVAL_MILES)
        )
        fuel_stops = []
        for i in range(num_fuel_stops):
            fuel_stops.append(
                {
                    "mile": cls.FUEL_INTERVAL_MILES * (i + 1),
                    "duration": 0.5,  # 30 min fueling
                }
            )

        # Calculate required rest breaks (30-min after 8 hours driving)
        num_rest_breaks = math.floor(total_driving_hours / 8.0)
        rest_breaks = [
            {"after_hours": 8.0 * i, "duration": 0.5}
            for i in range(1, num_rest_breaks + 1)
        ]

        # Generate daily logs
        logs = cls._generate_daily_logs(
            total_driving_hours, current_cycle_used, fuel_stops, rest_breaks
        )

        return {
            "total_distance_miles": total_distance_miles,
            "total_driving_hours": total_driving_hours,
            "fuel_stops": fuel_stops,
            "rest_breaks": rest_breaks,
            "daily_logs": logs,
            "requires_multiple_cycle_reset": current_cycle_used + total_driving_hours
            > cls.MAX_CYCLE_HOURS,
        }

    @classmethod
    def _generate_daily_logs(
        cls,
        total_driving_hours: float,
        current_cycle_used: float,
        fuel_stops: List,
        rest_breaks: List,
    ) -> List[Dict]:
        logs = []
        day = 1
        remaining_driving = total_driving_hours
        cycle_remaining = cls.MAX_CYCLE_HOURS - current_cycle_used

        while remaining_driving > 0 and cycle_remaining > 0:
            # Each day: max 11 driving hours, but limited by cycle
            drive_today = min(cls.MAX_DRIVING_DAILY, remaining_driving, cycle_remaining)

            # Calculate duty statuses
            # 10hr off-duty + 11hr driving + 1hr pickup/dropoff + fueling/rest
            off_duty = cls.REQUIRED_OFF_DUTY
            on_duty_non_driving = cls.PICKUP_DROPOFF_HOURS  # Pickup/dropoff
            # Add fueling and rest break time if they occur this day
            fueling_today = 0.5 * sum(
                1
                for fs in fuel_stops
                if fs["mile"] / 55.0
                <= sum(l["driving_hours"] for l in logs) + drive_today
            )

            driving = drive_today
            sleeper_berth = 0  # Simplified - not using split sleeper berth

            logs.append(
                {
                    "day": day,
                    "date": (datetime.now() + timedelta(days=day - 1)).strftime(
                        "%Y-%m-%d"
                    ),
                    "driving_hours": round(driving, 1),
                    "on_duty_non_driving": round(
                        on_duty_non_driving + fueling_today, 1
                    ),
                    "off_duty_hours": round(off_duty, 1),
                    "sleeper_berth_hours": sleeper_berth,
                    "total_hours": round(
                        off_duty + on_duty_non_driving + driving + sleeper_berth, 1
                    ),
                    "miles_today": round(drive_today * 55.0),
                    "cycle_hours_remaining": round(cycle_remaining - drive_today, 1),
                }
            )

            remaining_driving -= drive_today
            cycle_remaining -= drive_today
            day += 1

        return logs
