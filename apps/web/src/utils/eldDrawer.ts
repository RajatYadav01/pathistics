import type { DutyStatusSegment } from "@/types/eld.types";
import type { EldLogEntry } from "@/types/trip.types";

export class EldDrawer {
	static readonly STATUS_CONFIG = {
		OFF: { label: "OFF", color: "#90caf9", order: 0 },
		DR: { label: "DR", color: "#ef5350", order: 1 },
		ON: { label: "ON", color: "#ffb74d", order: 2 },
		SB: { label: "SB", color: "#81c784", order: 3 },
	};

	static generateDutySegments(log: EldLogEntry): DutyStatusSegment[] {
		const segments: DutyStatusSegment[] = [];
		let currentHour = 0;

		// Off-duty
		if (log.off_duty_hours > 0) {
			segments.push({
				status: "OFF",
				hours: log.off_duty_hours,
				color: this.STATUS_CONFIG.OFF.color,
				label: this.STATUS_CONFIG.OFF.label,
			});
			currentHour += log.off_duty_hours;
		}

		// Driving
		if (log.driving_hours > 0) {
			segments.push({
				status: "DR",
				hours: log.driving_hours,
				color: this.STATUS_CONFIG.DR.color,
				label: this.STATUS_CONFIG.DR.label,
			});
			currentHour += log.driving_hours;
		}

		// On-duty non-driving
		if (log.on_duty_non_driving > 0) {
			segments.push({
				status: "ON",
				hours: log.on_duty_non_driving,
				color: this.STATUS_CONFIG.ON.color,
				label: this.STATUS_CONFIG.ON.label,
			});
			currentHour += log.on_duty_non_driving;
		}

		// Sleeper berth (remaining hours to reach 24)
		const remainingHours = 24 - currentHour;
		if (remainingHours > 0) {
			segments.push({
				status: "SB",
				hours: remainingHours,
				color: this.STATUS_CONFIG.SB.color,
				label: this.STATUS_CONFIG.SB.label,
			});
		}

		return segments;
	}

	static formatTimeRange(startHour: number, duration: number): string {
		const start = startHour % 24;
		const end = (start + duration) % 24;

		const startTimeStr = `${start}:00`;
		const endTimeStr = end === 0 ? "24:00" : `${end}:00`;

		return `${startTimeStr} - ${endTimeStr}`;
	}
}
