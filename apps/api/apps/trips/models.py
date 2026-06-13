from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.manager import Manager


class Trip(models.Model):
    segments: Manager["RouteSegment"]
    eld_logs: Manager["EldLogEntry"]
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(70)],
        help_text="Hours used in current 70hr/8day cycle",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Trip #{self.pk} - {self.pickup_location} to {self.dropoff_location}"


class RouteSegment(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="segments")
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    distance_miles = models.FloatField()
    duration_hours = models.FloatField()
    is_driving = models.BooleanField(default=True)
    is_fuel_stop = models.BooleanField(default=False)
    is_rest_break = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Segment {self.order}: {self.start_location} -> {self.end_location}"


class EldLogEntry(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="eld_logs")
    day_number = models.IntegerField()
    date = models.DateField()
    driving_hours = models.FloatField()
    on_duty_hours = models.FloatField()
    off_duty_hours = models.FloatField()
    sleeper_berth_hours = models.FloatField()
    total_miles = models.FloatField()
    cycle_hours_remaining = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["trip", "day_number"]

    def __str__(self):
        return f"Day {self.day_number} - {self.date} - {self.driving_hours} hrs driving"
