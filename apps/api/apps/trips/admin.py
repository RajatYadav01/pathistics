from django.contrib import admin
from .models import Trip, RouteSegment, EldLogEntry


class RouteSegmentInline(admin.TabularInline):
    model = RouteSegment
    extra = 0
    fields = [
        "start_location",
        "end_location",
        "distance_miles",
        "duration_hours",
        "order",
    ]


class EldLogEntryInline(admin.TabularInline):
    model = EldLogEntry
    extra = 0
    fields = ["day_number", "date", "driving_hours", "on_duty_hours", "total_miles"]


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "pickup_location",
        "dropoff_location",
        "current_cycle_used",
        "created_at",
    ]
    list_filter = ["created_at"]
    search_fields = ["pickup_location", "dropoff_location", "current_location"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [RouteSegmentInline, EldLogEntryInline]

    fieldsets = (
        (
            "Trip Information",
            {"fields": ("current_location", "pickup_location", "dropoff_location")},
        ),
        ("Compliance", {"fields": ("current_cycle_used",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(RouteSegment)
class RouteSegmentAdmin(admin.ModelAdmin):
    list_display = ["trip", "start_location", "end_location", "distance_miles", "order"]
    list_filter = ["is_driving", "is_fuel_stop"]
    search_fields = ["start_location", "end_location"]


@admin.register(EldLogEntry)
class EldLogEntryAdmin(admin.ModelAdmin):
    list_display = ["trip", "day_number", "date", "driving_hours", "total_miles"]
    list_filter = ["date"]
    search_fields = ["trip__pickup_location"]
