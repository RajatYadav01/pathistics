export const config = {
	api: {
		baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
		endpoints: {
			planTrip: "/plan-trip/",
			tripHistory: "/trips/",
			tripDetails: (id: number) => `/trips/${id}/`,
			deleteTrip: (id: number) => `/trips/${id}/delete/`,
		},
	},
	map: {
		tileUrl: import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		defaultCenter: { lat: 39.8283, lng: -98.5795 },
		defaultZoom: 6,
	},
	eld: {
		maxDrivingDaily: 11,
		maxOnDutyDaily: 14,
		requiredOffDuty: 10,
		maxCycleHours: 70,
		fuelIntervalMiles: 1000,
		pickupDropoffHours: 1,
		avgSpeedMph: 55,
		restBreakAfterHours: 8,
		restBreakDuration: 0.5,
	},
} as const;

export type Config = typeof config;
