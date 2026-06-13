import React from "react";
import { Grid, Paper, Typography, Box, Alert } from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import TimerIcon from "@mui/icons-material/Timer";
import RouteIcon from "@mui/icons-material/Route";
import WarningIcon from "@mui/icons-material/Warning";
import { InfoCard } from "@/components/ui/InfoCard";
import { formatDistance, formatDuration } from "@/utils/formatting";
import type { TripPlan } from "@/types/trip.types";

interface TripSummaryProps {
	plan: TripPlan;
}

export const TripSummary: React.FC<TripSummaryProps> = ({ plan }) => {
	return (
		<Paper elevation={3} sx={{ p: 3, mb: 4 }}>
			<Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
				Trip Summary
			</Typography>

			<Grid container spacing={3} sx={{ mb: 3 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<InfoCard title="Total Distance" value={formatDistance(plan.total_distance_miles)} icon={<RouteIcon />} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<InfoCard title="Estimated Driving Time" value={formatDuration(plan.estimated_hours)} icon={<TimerIcon />} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<InfoCard title="Fuel Stops" value={plan.fuel_stops.length} subtitle="Every 1,000 miles" icon={<LocalGasStationIcon />} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<InfoCard title="Required Days" value={plan.eld_logs.length} subtitle={`${plan.eld_logs.length} log sheets`} />
				</Grid>
			</Grid>

			{plan.requires_cycle_compliance && (
				<Alert severity="warning" icon={<WarningIcon />}>
					<strong>Cycle Limit Warning:</strong> This trip will exceed your available 70-hour cycle. You will need to take a 34-hour restart
					before completing the trip.
				</Alert>
			)}

			{plan.fuel_stops.length > 0 && (
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle2" gutterBottom>
						Recommended Fuel Stops:
					</Typography>
					{plan.fuel_stops.map((stop, idx) => (
						<Typography key={idx} variant="body2" color="textSecondary">
							• At {stop.mile.toFixed(0)} miles (30 min fueling)
						</Typography>
					))}
				</Box>
			)}
		</Paper>
	);
};
