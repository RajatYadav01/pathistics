export type DutyStatus = "OFF" | "DR" | "ON" | "SB";

export interface DutyStatusSegment {
	status: DutyStatus;
	hours: number;
	color: string;
	label: string;
}

export interface EldGridConfig {
	width: number;
	height: number;
	hoursPerGrid: number;
	totalHours: number;
}
