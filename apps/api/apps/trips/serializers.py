from rest_framework import serializers
from .models import Trip, RouteSegment, EldLogEntry
from .eld_engine import ELDEngine


class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)


class FuelStopSerializer(serializers.Serializer):
    mile = serializers.FloatField()
    duration = serializers.FloatField()


class RestBreakSerializer(serializers.Serializer):
    after_hours = serializers.FloatField()
    duration = serializers.FloatField()


class EldLogEntrySerializer(serializers.ModelSerializer):
    day = serializers.IntegerField(source="day_number")
    on_duty_non_driving = serializers.FloatField(source="on_duty_hours")
    miles_today = serializers.FloatField(source="total_miles")
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = EldLogEntry
        fields = [
            "day",
            "date",
            "driving_hours",
            "on_duty_non_driving",
            "off_duty_hours",
            "sleeper_berth_hours",
            "total_hours",
            "miles_today",
            "cycle_hours_remaining",
        ]

    def get_total_hours(self, obj: EldLogEntry) -> float:
        # Aggregates hours for the day, rounding to 1 decimal place
        return round(
            obj.driving_hours
            + obj.on_duty_hours
            + obj.off_duty_hours
            + obj.sleeper_berth_hours,
            1,
        )


class RouteInstructionSerializer(serializers.Serializer):
    text = serializers.CharField()
    distance_miles = serializers.FloatField()
    duration_minutes = serializers.FloatField()


class TripPlanResponseSerializer(serializers.Serializer):
    trip_id = serializers.IntegerField()
    route = serializers.JSONField()
    instructions = RouteInstructionSerializer(many=True)
    total_distance_miles = serializers.FloatField()
    estimated_hours = serializers.FloatField()
    fuel_stops = FuelStopSerializer(many=True)
    rest_breaks = RestBreakSerializer(many=True)
    eld_logs = EldLogEntrySerializer(many=True)
    requires_cycle_compliance = serializers.BooleanField()


class TripSerializer(serializers.ModelSerializer):
    trip_id = serializers.IntegerField(source="id")
    total_distance_miles = serializers.SerializerMethodField()
    requires_cycle_compliance = serializers.SerializerMethodField()
    eld_logs = EldLogEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            "trip_id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "created_at",
            "total_distance_miles",
            "requires_cycle_compliance",
            "eld_logs",
        ]

    def get_total_distance_miles(self, obj: Trip) -> float:
        # Dynamically calculates total miles from related segments
        return sum(segment.distance_miles for segment in obj.segments.all())

    def get_requires_cycle_compliance(self, obj: Trip) -> bool:
        # Fallback check based on cycle hours rules
        total_driving = sum(log.driving_hours for log in obj.eld_logs.all())
        return (obj.current_cycle_used + total_driving) > 70.0


class RouteSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteSegment
        fields = [
            "id",
            "start_location",
            "end_location",
            "distance_miles",
            "duration_hours",
            "is_driving",
            "is_fuel_stop",
            "is_rest_break",
            "order",
        ]


class TripDetailsSerializer(serializers.ModelSerializer):
    trip_id = serializers.IntegerField(source="id")
    total_distance_miles = serializers.SerializerMethodField()
    segments = RouteSegmentSerializer(many=True, read_only=True)
    eld_logs = EldLogEntrySerializer(many=True, read_only=True)
    fuel_stops = serializers.SerializerMethodField()
    rest_breaks = serializers.SerializerMethodField()
    estimated_hours = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "trip_id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "created_at",
            "total_distance_miles",
            "segments",
            "eld_logs",
            "fuel_stops",
            "rest_breaks",
            "estimated_hours",
        ]

    def get_total_distance_miles(self, obj: Trip) -> float:
        return sum(segment.distance_miles for segment in obj.segments.all())
    
    def get_estimated_hours(self, obj: Trip) -> float:
        total_distance = self.get_total_distance_miles(obj)
        plan = ELDEngine.generate_trip_plan(
            total_distance_miles=total_distance, 
            current_cycle_used=obj.current_cycle_used
        )
        return plan["total_driving_hours"]

    def get_fuel_stops(self, obj: Trip) -> list:
        total_distance = self.get_total_distance_miles(obj)
        plan = ELDEngine.generate_trip_plan(
            total_distance_miles=total_distance, 
            current_cycle_used=obj.current_cycle_used
        )
        return plan["fuel_stops"]

    def get_rest_breaks(self, obj: Trip) -> list:
        total_distance = self.get_total_distance_miles(obj)
        plan = ELDEngine.generate_trip_plan(
            total_distance_miles=total_distance, 
            current_cycle_used=obj.current_cycle_used
        )
        return plan["rest_breaks"]
