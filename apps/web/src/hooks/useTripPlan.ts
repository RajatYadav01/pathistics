import { useState } from "react";
import { tripApi } from "@/services/api/tripApi";
import type { TripInput, TripPlan } from "@/types/trip.types";

export const useTripPlan = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<TripPlan | null>(null);

	const planTrip = async (input: TripInput): Promise<TripPlan | null> => {
		setIsLoading(true);
		setError(null);

		try {
			console.log("Planning trip with input:", input);
			const result = await tripApi.planTrip(input);
			console.log("Trip plan result:", result);
			setData(result);
			return result;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to plan trip";
			console.error("Trip planning error:", err);
			setError(message);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const reset = () => {
		setData(null);
		setError(null);
	};

	return {
		planTrip,
		isLoading,
		error,
		data,
		reset,
	};
};
