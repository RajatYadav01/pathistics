import { describe, it, expect } from "vitest";
import { config } from "@/config/env";
import { EldCalculator } from "./eldCalculator";

describe("EldCalculator", () => {
	describe("generateTripPlan", () => {
		it("should calculate basic trip plan correctly", () => {
			const distance = 550; // 10 hours at 55 mph
			const result = EldCalculator.generateTripPlan(distance, 0);

			expect(result.totalDrivingHours).toBeCloseTo(10, 1);
			expect(result.fuelStops).toHaveLength(0); // Under 1000 miles, no fuel stops
			expect(result.restBreaks).toHaveLength(1); // After 8 hours
			expect(result.dailyLogs).toHaveLength(1); // One day
			expect(result.dailyLogs[0].driving_hours).toBeCloseTo(10, 1);
			expect(result.requiresCycleReset).toBe(false);
		});

		it("should add fuel stops every 1000 miles", () => {
			const distance = 2500;
			const result = EldCalculator.generateTripPlan(distance, 0);

			expect(result.fuelStops).toHaveLength(2);
			expect(result.fuelStops[0].mile).toBe(1000);
			expect(result.fuelStops[1].mile).toBe(2000);
		});

		it("should add rest breaks every 8 hours", () => {
			const distance = 1320; // 24 hours driving
			const result = EldCalculator.generateTripPlan(distance, 0);

			expect(result.restBreaks).toHaveLength(3); // At 8, 16, 24 hours
			expect(result.restBreaks[0].after_hours).toBe(8);
			expect(result.restBreaks[1].after_hours).toBe(16);
		});

		it("should generate multiple days for long trips", () => {
			const distance = 1650; // 30 hours driving
			const result = EldCalculator.generateTripPlan(distance, 0);

			expect(result.dailyLogs.length).toBeGreaterThan(1);
			expect(result.dailyLogs[0].driving_hours).toBe(config.eld.maxDrivingDaily); // 11

			// Day 2 should also cap at maxDrivingDaily (11), leaving the remaining 8 hours for Day 3
			expect(result.dailyLogs[1].driving_hours).toBe(config.eld.maxDrivingDaily); // 11
			expect(result.dailyLogs[2].driving_hours).toBe(30 - config.eld.maxDrivingDaily * 2); // 8
		});

		it("should respect cycle limits", () => {
			const distance = 3300; // 60 hours
			const cycleUsed = 30;
			const result = EldCalculator.generateTripPlan(distance, cycleUsed);

			expect(result.requiresCycleReset).toBe(true);
			expect(result.dailyLogs.length).toBeLessThan(6); // Limited by cycle
		});

		it("should handle zero distance", () => {
			const result = EldCalculator.generateTripPlan(0, 0);

			expect(result.totalDrivingHours).toBe(0);
			expect(result.fuelStops).toHaveLength(0);
			expect(result.restBreaks).toHaveLength(0);
			expect(result.dailyLogs).toHaveLength(0);
		});
	});
});
