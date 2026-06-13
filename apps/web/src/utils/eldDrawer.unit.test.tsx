import { describe, it, expect } from "vitest";
import type { EldLogEntry } from "@/types/trip.types";
import { EldDrawer } from "./eldDrawer";

describe("EldDrawer", () => {
	describe("generateDutySegments", () => {
		it("should generate correct segments for a typical day", () => {
			const log: EldLogEntry = {
				day: 1,
				date: "2024-01-01",
				driving_hours: 10,
				on_duty_non_driving: 2,
				off_duty_hours: 10,
				sleeper_berth_hours: 0,
				total_hours: 22,
				miles_today: 550,
				cycle_hours_remaining: 60,
			};

			const segments = EldDrawer.generateDutySegments(log);

			expect(segments).toHaveLength(4); // OFF, DR, ON, SB
			expect(segments[0].status).toBe("OFF");
			expect(segments[0].hours).toBe(10);
			expect(segments[1].status).toBe("DR");
			expect(segments[1].hours).toBe(10);
			expect(segments[2].status).toBe("ON");
			expect(segments[2].hours).toBe(2);
			expect(segments[3].status).toBe("SB");
			expect(segments[3].hours).toBe(2); // 24 - 22 = 2
		});

		it("should handle missing segments", () => {
			const log: EldLogEntry = {
				day: 1,
				date: "2024-01-01",
				driving_hours: 11,
				on_duty_non_driving: 0,
				off_duty_hours: 10,
				sleeper_berth_hours: 0,
				total_hours: 21,
				miles_today: 605,
				cycle_hours_remaining: 59,
			};

			const segments = EldDrawer.generateDutySegments(log);

			expect(segments).toHaveLength(3); // OFF, DR, SB (ON missing)
			expect(segments.find((s) => s.status === "ON")).toBeUndefined();
		});

		it("should correctly calculate sleeper berth hours", () => {
			const log: EldLogEntry = {
				day: 1,
				date: "2024-01-01",
				driving_hours: 8,
				on_duty_non_driving: 1,
				off_duty_hours: 8,
				sleeper_berth_hours: 0,
				total_hours: 17,
				miles_today: 440,
				cycle_hours_remaining: 62,
			};

			const segments = EldDrawer.generateDutySegments(log);
			const sbSegment = segments.find((s) => s.status === "SB");

			expect(sbSegment).toBeDefined();
			expect(sbSegment?.hours).toBe(7); // 24 - 17 = 7
		});
	});

	describe("formatTimeRange", () => {
		it("should format time range correctly", () => {
			expect(EldDrawer.formatTimeRange(0, 10)).toBe("0:00 - 10:00");
			expect(EldDrawer.formatTimeRange(10, 14)).toBe("10:00 - 24:00");
			expect(EldDrawer.formatTimeRange(14, 2)).toBe("14:00 - 16:00");
		});
	});
});
