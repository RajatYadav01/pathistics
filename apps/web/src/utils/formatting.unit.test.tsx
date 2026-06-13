import { describe, it, expect } from "vitest";
import { formatDistance, formatDuration, formatDateTime } from "./formatting";

describe("formatting utilities", () => {
	describe("formatDistance", () => {
		it("should format small distances", () => {
			expect(formatDistance(0.05)).toBe("< 0.1 mi");
			expect(formatDistance(0.5)).toBe("0.5 mi");
		});

		it("should format medium distances", () => {
			expect(formatDistance(5.5)).toBe("5.5 mi");
			expect(formatDistance(9.9)).toBe("9.9 mi");
		});

		it("should format large distances", () => {
			expect(formatDistance(150)).toBe("150 mi");
			expect(formatDistance(1234.56)).toBe("1235 mi");
		});
	});

	describe("formatDuration", () => {
		it("should format minutes only", () => {
			expect(formatDuration(0.5)).toBe("30 min");
			expect(formatDuration(0.25)).toBe("15 min");
		});

		it("should format hours only", () => {
			expect(formatDuration(5)).toBe("5 hr");
			expect(formatDuration(10)).toBe("10 hr");
		});

		it("should format hours and minutes", () => {
			expect(formatDuration(5.5)).toBe("5 hr 30 min");
			expect(formatDuration(3.75)).toBe("3 hr 45 min");
		});
	});

	describe("formatDateTime", () => {
		it("should format date correctly", () => {
			const date = "2024-01-15";
			const formatted = formatDateTime(date);

			expect(formatted).toContain("Jan");
			expect(formatted).toContain("15");
			expect(formatted).toContain("2024");
		});
	});
});
