import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField, Button, Paper, Typography, Grid, Alert, CircularProgress, Slider } from "@mui/material";
import type { TripInput, TripPlan } from "@/types/trip.types";

const tripSchema = z.object({
	current_location: z.string().min(3, "Current location is required"),
	pickup_location: z.string().min(3, "Pickup location is required"),
	dropoff_location: z.string().min(3, "Dropoff location is required"),
	current_cycle_used: z.number().min(0).max(70, "Cycle used must be between 0 and 70"),
});

interface TripFormProps {
	onSuccess?: (data: TripPlan) => void;
	isLoading?: boolean;
	error?: string | null;
	onSubmitTrip: (data: TripInput) => Promise<TripPlan | null>;
}

export const TripForm: React.FC<TripFormProps> = ({ onSuccess, isLoading = false, error = null, onSubmitTrip }) => {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<TripInput>({
		resolver: zodResolver(tripSchema),
		defaultValues: {
			current_cycle_used: 0,
		},
	});

	const cycleUsed = watch("current_cycle_used");

	const onSubmit = async (formData: TripInput) => {
		try {
			const result = await onSubmitTrip(formData);
			if (onSuccess && result) {
				onSuccess(result);
			}
		} catch (err) {
			console.error("Form submission error:", err);
		}
	};

	return (
		<Paper
			elevation={3}
			sx={{
				p: 4,
				mb: 4,
				textAlign: "center",
				border: "0.5rem solid",
				borderColor: "divider",
				borderRadius: 2,
				backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#12121299" : "rgba(245, 250, 250, 0.6)"),
				backdropFilter: "blur(6px)",
				WebkitBackdropFilter: "blur(6px)",
			}}>
			<Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
				Plan Your Trip
			</Typography>

			<form onSubmit={handleSubmit(onSubmit)}>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12 }}>
						<TextField
							fullWidth
							label="Current Location"
							{...register("current_location")}
							error={!!errors.current_location}
							helperText={errors.current_location?.message}
							placeholder="e.g., Los Angeles, CA"
                            disabled={isLoading}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							fullWidth
							label="Pickup Location"
							{...register("pickup_location")}
							error={!!errors.pickup_location}
							helperText={errors.pickup_location?.message}
							placeholder="e.g., Dallas, TX"
                            disabled={isLoading}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<TextField
							fullWidth
							label="Dropoff Location"
							{...register("dropoff_location")}
							error={!!errors.dropoff_location}
							helperText={errors.dropoff_location?.message}
							placeholder="e.g., Chicago, IL"
                            disabled={isLoading}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Typography gutterBottom>Current Cycle Used: {cycleUsed} / 70 hours</Typography>
						<Slider
							value={cycleUsed}
							onChange={(_, value) => setValue("current_cycle_used", value as number)}
							min={0}
							max={70}
							step={0.5}
							marks={[
								{ value: 0, label: "0" },
								{ value: 35, label: "35" },
								{ value: 70, label: "70" },
							]}
                            disabled={isLoading}
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Button type="submit" variant="contained" size="large" disabled={isLoading} fullWidth>
							{isLoading ? <CircularProgress size={24} /> : "Plan Route and Generate Logs"}
						</Button>
					</Grid>
				</Grid>
			</form>

			{error && (
				<Alert severity="error" sx={{ mt: 2 }}>
					{error}
				</Alert>
			)}
		</Paper>
	);
};
