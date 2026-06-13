import React, { useState } from "react";
import { Container, Typography, Box, Alert, Snackbar } from "@mui/material";
import { TripForm } from "@/features/trip-planner";
import { RouteMap } from "@/features/trip-planner";
import { EldCanvas } from "@/features/eld-drawing";
import { TripSummary } from "@/features/trip-summary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTripPlan } from "@/hooks/useTripPlan";
import type { TripInput } from "@/types/trip.types";

export const Dashboard: React.FC = () => {
	const { planTrip, isLoading, error, data, reset } = useTripPlan();
	const [showSuccess, setShowSuccess] = useState(false);

	const handleSubmit = async (formData: TripInput) => {
		reset();
		const result = await planTrip(formData);
		if (result) {
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 5000);
		}
		return result;
	};

	return (
		<Box>
			<Container maxWidth="lg" sx={{ my: 8 }}>
				<Box sx={{ mb: 4, textAlign: "center" }}>
					<Typography
						variant="h3"
						gutterBottom
						sx={{
							fontSize: {
								xs: "1.75rem",
								sm: "2.75rem",
								md: "3.5rem",
							},
							fontFamily: "Sen",
							fontWeight: 500,
						}}>
						Trip Planner
					</Typography>
					<Typography
						variant="h6"
						color="textSecondary"
						sx={{
							fontSize: {
								xs: "0.75rem",
								sm: "1.25rem",
								md: "1.75rem",
							},
							fontFamily: "Sen",
							fontWeight: 300,
						}}>
						Enter your trip details to generate route instructions and ELD logs
					</Typography>
				</Box>
				<TripForm onSubmitTrip={handleSubmit} isLoading={isLoading} error={error} />
				{isLoading && <LoadingSpinner message="Planning your trip..." />}
				{data && !isLoading && (
					<>
						<Snackbar open={showSuccess} autoHideDuration={5000} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
							<Alert severity="success" sx={{ width: "100%" }}>
								Trip planned successfully!
							</Alert>
						</Snackbar>
						<TripSummary plan={data} />
						{data.route && <RouteMap geometry={data.route} instructions={data.instructions} totalDistance={data.total_distance_miles} />}
						{data.eld_logs && data.eld_logs.length > 0 && <EldCanvas logs={data.eld_logs} />}
					</>
				)}
			</Container>
		</Box>
	);
};
