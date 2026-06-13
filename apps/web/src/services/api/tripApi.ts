import { apiClient } from "./client";
import { config } from "@/config/env";
import type { TripInput, TripPlan } from "@/types/trip.types";

export const tripApi = {
	planTrip: async (input: TripInput): Promise<TripPlan> => {
		// console.log("API Request - Plan Trip:", input);
		try {
			const response = await apiClient.post<TripPlan>(config.api.endpoints.planTrip, input);
			// console.log("API Response - Plan Trip:", response);
			return response;
		} catch (error) {
			console.error("API Error - Plan Trip:", error);
			throw error;
		}
	},

	getTripHistory: async (): Promise<TripPlan[]> => {
		// console.log("API Request - Get Trip History");
		try {
			const response = await apiClient.get<TripPlan[]>(config.api.endpoints.tripHistory);
			// console.log("API Response - Trip History:", response);
			return response;
		} catch (error) {
			console.error("API Error - Get Trip History:", error);
			return [];
		}
	},

	getTripDetails: async (id: number): Promise<TripPlan> => {
		// console.log(`API Request - Get Trip Detail: ${id}`);
		try {
			const response = await apiClient.get<TripPlan>(config.api.endpoints.tripDetails(id));
			// console.log("API Response - Trip Detail:", response);
			return response;
		} catch (error) {
			console.error("API Error - Get Trip Detail:", error);
			throw error;
		}
	},

	deleteTrip: async (id: number): Promise<{ message: string }> => {
		// console.log(`API Request - Delete Trip: ${id}`);
		try {
			const response = await apiClient.delete<{ message: string }>(config.api.endpoints.deleteTrip(id));
			// console.log("API Response - Delete Trip:", response);
			return response;
		} catch (error) {
			console.error("API Error - Delete Trip:", error);
			throw error;
		}
	},
};
