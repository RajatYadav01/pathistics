import { config } from "@/config/env";
import type { EldLogEntry, FuelStop, RestBreak } from "@/types/trip.types";

export class EldCalculator {
	static generateTripPlan(
		totalDistanceMiles: number,
		currentCycleUsed: number = 0,
	): {
		totalDrivingHours: number;
		fuelStops: FuelStop[];
		restBreaks: RestBreak[];
		dailyLogs: EldLogEntry[];
		requiresCycleReset: boolean;
	} {
		const totalDrivingHours = totalDistanceMiles / config.eld.avgSpeedMph;

		const fuelStops = this.calculateFuelStops(totalDistanceMiles);
		const restBreaks = this.calculateRestBreaks(totalDrivingHours);
		const dailyLogs = this.generateDailyLogs(totalDrivingHours, currentCycleUsed);

		return {
			totalDrivingHours,
			fuelStops,
			restBreaks,
			dailyLogs,
			requiresCycleReset: currentCycleUsed + totalDrivingHours > config.eld.maxCycleHours,
		};
	}

	private static calculateFuelStops(totalDistanceMiles: number): FuelStop[] {
		const numStops = Math.max(0, Math.floor(totalDistanceMiles / config.eld.fuelIntervalMiles));
		const stops: FuelStop[] = [];

		for (let i = 1; i <= numStops; i++) {
			stops.push({
				mile: config.eld.fuelIntervalMiles * i,
				duration: 0.5, // 30 minutes
			});
		}

		return stops;
	}

	private static calculateRestBreaks(totalDrivingHours: number): RestBreak[] {
		const numBreaks = Math.floor(totalDrivingHours / config.eld.restBreakAfterHours);
		const breaks: RestBreak[] = [];

		for (let i = 1; i <= numBreaks; i++) {
			breaks.push({
				after_hours: config.eld.restBreakAfterHours * i,
				duration: config.eld.restBreakDuration,
			});
		}

		return breaks;
	}

	private static generateDailyLogs(totalDrivingHours: number, currentCycleUsed: number): EldLogEntry[] {
		const logs: EldLogEntry[] = [];
		let day = 1;
		let remainingDriving = totalDrivingHours;
		let cycleRemaining = config.eld.maxCycleHours - currentCycleUsed;

		while (remainingDriving > 0 && cycleRemaining > 0) {
			const driveToday = Math.min(config.eld.maxDrivingDaily, remainingDriving, cycleRemaining);

			const offDuty = config.eld.requiredOffDuty;
			const onDutyNonDriving = config.eld.pickupDropoffHours;

			logs.push({
				day,
				date: new Date(Date.now() + (day - 1) * 86400000).toISOString().split("T")[0],
				driving_hours: Number(driveToday.toFixed(1)),
				on_duty_non_driving: onDutyNonDriving,
				off_duty_hours: offDuty,
				sleeper_berth_hours: 0,
				total_hours: Number((offDuty + onDutyNonDriving + driveToday).toFixed(1)),
				miles_today: Number((driveToday * config.eld.avgSpeedMph).toFixed(0)),
				cycle_hours_remaining: Number((cycleRemaining - driveToday).toFixed(1)),
			});

			remainingDriving -= driveToday;
			cycleRemaining -= driveToday;
			day++;
		}

		return logs;
	}
}
