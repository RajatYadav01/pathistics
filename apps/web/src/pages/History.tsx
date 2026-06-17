import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
	Box,
	Container,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Chip,
	CircularProgress,
	Alert,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Button,
	Snackbar,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import type { TripPlan } from "@/types/trip.types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Error } from "@/components/ui/Error";
import { tripApi } from "@/services/api/tripApi";
import { formatDateTime, formatDistance } from "@/utils/formatting";

export const History: React.FC = () => {
	const navigate = useNavigate();
	const [trips, setTrips] = useState<TripPlan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
		open: false,
		message: "",
		severity: "success",
	});

	useEffect(() => {
		loadTrips();
	}, []);

	const loadTrips = async () => {
		try {
			setIsLoading(true);
			const history = await tripApi.getTripHistory();
			setTrips(Array.isArray(history) ? history : []);
			setError(null);
		} catch (error: unknown) {
			console.error("Failed to load trips:", error);
			const message =
				error && typeof error === "object" && "message" in error && typeof (error as Record<string, unknown>).message === "string"
					? String((error as Record<string, unknown>).message)
					: "Failed to load trip history. Please try again.";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleViewTrip = (tripId: number) => {
		navigate(`/trip/${tripId}`);
	};

	const handleDeleteClick = (trip: TripPlan) => {
		setSelectedTrip(trip);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedTrip) return;

		setDeleting(true);
		try {
			await tripApi.deleteTrip(selectedTrip.trip_id);

			setTrips(trips.filter((trip) => trip.trip_id !== selectedTrip.trip_id));

			setSnackbar({
				open: true,
				message: `Trip #${selectedTrip.trip_id} deleted successfully`,
				severity: "success",
			});

			setDeleteDialogOpen(false);
			setSelectedTrip(null);
		} catch (error) {
			console.error("Failed to delete trip:", error);
			setSnackbar({
				open: true,
				message: "Failed to delete trip. Please try again.",
				severity: "error",
			});
		} finally {
			setDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setSelectedTrip(null);
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	return (
		<Container maxWidth="lg" sx={{ my: 8, textAlign: "center" }}>
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
				Trip History
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
				View and manage your previous trips
			</Typography>
			{error && <Error title="Fetch Error" message={error} onClose={() => setError(null)} />}
			<TableContainer
				component={Paper}
				sx={{
					mt: 4,
					border: "0.5rem solid",
					borderColor: "divider",
					borderRadius: 2,
					backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#12121299" : "#f5fafa99"),
					backdropFilter: "blur(6px)",
					WebkitBackdropFilter: "blur(6px)",
				}}>
				{isLoading ? (
					<LoadingSpinner message="Loading trip history..." />
				) : (
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Trip ID</TableCell>
								<TableCell>Distance</TableCell>
								<TableCell>Duration</TableCell>
								<TableCell>Log Sheets</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Date</TableCell>
								<TableCell align="center">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{trips.length > 0 &&
								trips.map((trip) => (
									<TableRow
										key={trip.trip_id}
										sx={{ "&:hover": { backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#111111" : "#f3f3f3") } }}>
										<TableCell>
											<Typography variant="body2" sx={{ fontWeight: "medium" }}>
												#{trip.trip_id}
											</Typography>
										</TableCell>
										<TableCell>{formatDistance(trip.total_distance_miles)}</TableCell>
										<TableCell>{trip.eld_logs?.length || 0} days</TableCell>
										<TableCell>{trip.eld_logs?.length || 0}</TableCell>
										<TableCell>
											<Chip
												label={trip.requires_cycle_compliance ? "Needs Restart" : "Compliant"}
												color={trip.requires_cycle_compliance ? "warning" : "success"}
												size="small"
											/>
										</TableCell>
										<TableCell>
											<Typography variant="body2">{trip.eld_logs?.[0]?.date ? formatDateTime(trip.eld_logs[0].date) : "N/A"}</Typography>
										</TableCell>
										<TableCell align="center">
											<Tooltip title="View Trip Details">
												<IconButton size="small" onClick={() => handleViewTrip(trip.trip_id)} color="primary">
													<VisibilityIcon />
												</IconButton>
											</Tooltip>
											<Tooltip title="Delete Trip">
												<IconButton size="small" onClick={() => handleDeleteClick(trip)} color="error">
													<DeleteIcon />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							{!isLoading && !error && trips.length === 0 && (
								<TableRow key="no-trips-fallback">
									<TableCell colSpan={7} align="center">
										No trips found. Start planning your first trip!
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				)}
			</TableContainer>
			<Dialog
				open={deleteDialogOpen}
				onClose={handleDeleteCancel}
				aria-labelledby="delete-dialog-title"
				aria-describedby="delete-dialog-description">
				<DialogTitle id="delete-dialog-title">Delete Trip #{selectedTrip?.trip_id}?</DialogTitle>
				<DialogContent>
					<DialogContentText id="delete-dialog-description">
						Are you sure you want to delete this trip? This action cannot be undone.
						{selectedTrip && (
							<Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
								<Typography variant="body2">
									<strong>Route:</strong> {selectedTrip.instructions?.[0]?.text || "N/A"}
								</Typography>
								<Typography variant="body2">
									<strong>Distance:</strong> {formatDistance(selectedTrip.total_distance_miles)}
								</Typography>
								<Typography variant="body2">
									<strong>Date:</strong> {selectedTrip.eld_logs?.[0]?.date ? formatDateTime(selectedTrip.eld_logs[0].date) : "N/A"}
								</Typography>
							</Box>
						)}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel} disabled={deleting}>
						Cancel
					</Button>
					<Button
						onClick={handleDeleteConfirm}
						color="error"
						variant="contained"
						disabled={deleting}
						startIcon={deleting ? <CircularProgress size={20} /> : null}>
						{deleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
				<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Container>
	);
};
