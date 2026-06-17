export interface TripInput {
	current_location: string;
	pickup_location: string;
	dropoff_location: string;
	current_cycle_used: number;
}

export interface RouteInstruction {
	text: string;
	distance_miles: number;
	duration_minutes: number;
}

export interface FuelStop {
	mile: number;
	duration: number;
}

export interface RestBreak {
	after_hours: number;
	duration: number;
}

export interface EldLogEntry {
	day: number;
	date: string;
	driving_hours: number;
	on_duty_non_driving: number;
	off_duty_hours: number;
	sleeper_berth_hours: number;
	total_hours: number;
	miles_today: number;
	cycle_hours_remaining?: number;
}

export interface TripPlan {
	trip_id: number;
	route: Record<string, unknown>;
	instructions: RouteInstruction[];
	total_distance_miles: number;
	estimated_hours: number;
	fuel_stops: FuelStop[];
	rest_breaks: RestBreak[];
	eld_logs: EldLogEntry[];
	requires_cycle_compliance: boolean;
}

export interface ApiError {
	error: string;
	details?: Record<string, string[]>;
}
