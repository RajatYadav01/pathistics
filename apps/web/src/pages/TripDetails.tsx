import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Container, Typography, Box, Button, CircularProgress, Alert, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { RouteMap } from "@/features/trip-planner";
import { EldCanvas } from "@/features/eld-drawing";
import { TripSummary } from "@/features/trip-summary";
import { tripApi } from "@/services/api/tripApi";
import type { TripPlan } from "@/types/trip.types";

export const TripDetails: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [trip, setTrip] = useState<TripPlan | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			loadTripDetails();
		}
	}, [id]);

	const loadTripDetails = async () => {
		try {
			setLoading(true);
			const detail = await tripApi.getTripDetails(parseInt(id!));
			console.log(detail);
			setTrip(detail);
		} catch (err) {
			setError("Failed to load trip details");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<Container maxWidth="lg">
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
					<CircularProgress />
				</Box>
			</Container>
		);
	}

	if (error || !trip) {
		return (
			<Container maxWidth="lg">
				<Alert severity="error" sx={{ mt: 2 }}>
					{error || "Trip not found"}
				</Alert>
				<Button onClick={() => navigate("/history")} sx={{ mt: 2 }}>
					Back to History
				</Button>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ my: 8, textAlign: "center" }}>
			<Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
				<IconButton onClick={() => navigate("/history")}>
					<ArrowBackIcon />
				</IconButton>
				<Typography
					variant="h4"
					sx={{
						fontSize: {
							xs: "1.75rem",
							sm: "2.75rem",
							md: "3.5rem",
						},
						fontFamily: "Sen",
						fontWeight: 500,
					}}>
					Trip #{trip.trip_id} Details
				</Typography>
			</Box>
			<TripSummary plan={trip} />
			{trip.route && <RouteMap geometry={trip.route} instructions={trip.instructions} totalDistance={trip.total_distance_miles} />}
			{trip.eld_logs && trip.eld_logs.length > 0 && <EldCanvas logs={trip.eld_logs} />}
		</Container>
	);
};
