import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { tripApi } from "@/services/api/tripApi";
import { useTripPlan } from "./useTripPlan";

vi.mock("@/services/api/tripApi");

describe("useTripPlan", () => {
	const mockTripPlan = {
		trip_id: 1,
		route: {},
		instructions: [],
		total_distance_miles: 550,
		estimated_hours: 10,
		fuel_stops: [],
		rest_breaks: [],
		eld_logs: [],
		requires_cycle_compliance: false,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should initialize with default values", () => {
		const { result } = renderHook(() => useTripPlan());

		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe(null);
		expect(result.current.data).toBe(null);
	});

	it("should plan trip successfully", async () => {
		vi.mocked(tripApi.planTrip).mockResolvedValue(mockTripPlan);

		const { result } = renderHook(() => useTripPlan());

		await act(async () => {
			await result.current.planTrip({
				current_location: "LA",
				pickup_location: "Dallas",
				dropoff_location: "Chicago",
				current_cycle_used: 0,
			});
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toEqual(mockTripPlan);
		expect(result.current.error).toBe(null);
	});

	it("should handle errors", async () => {
		const error = new Error("API Error");
		vi.mocked(tripApi.planTrip).mockRejectedValue(error);

		const { result } = renderHook(() => useTripPlan());

		await act(async () => {
			try {
				await result.current.planTrip({
					current_location: "LA",
					pickup_location: "Dallas",
					dropoff_location: "Chicago",
					current_cycle_used: 0,
				});
			} catch (e) {
				// Expected error
			}
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBe("API Error");
	});

	it("should reset state", async () => {
		vi.mocked(tripApi.planTrip).mockResolvedValue(mockTripPlan);

		const { result } = renderHook(() => useTripPlan());

		await act(async () => {
			await result.current.planTrip({
				current_location: "LA",
				pickup_location: "Dallas",
				dropoff_location: "Chicago",
				current_cycle_used: 0,
			});
		});

		expect(result.current.data).toEqual(mockTripPlan);

		act(() => {
			result.current.reset();
		});

		expect(result.current.data).toBe(null);
		expect(result.current.error).toBe(null);
	});
});
