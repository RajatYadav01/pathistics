import React, { useRef } from "react";
import { Box, Paper, Typography, Button, Grid, Chip } from "@mui/material";
import html2canvas from "html2canvas";
import type { EldLogEntry } from "@/types/trip.types";
import { EldDrawer } from "@/utils/eldDrawer";
import { formatDateTime } from "@/utils/formatting";

interface EldCanvasProps {
	logs: EldLogEntry[];
}

export const EldCanvas: React.FC<EldCanvasProps> = ({ logs }) => {
	const canvasRef = useRef<HTMLDivElement>(null);

	const downloadLogSheet = async () => {
		if (!canvasRef.current) return;
		const canvas = await html2canvas(canvasRef.current, { scale: 2 });
		const link = document.createElement("a");
		link.download = `eld-logs-${Date.now()}.png`;
		link.href = canvas.toDataURL();
		link.click();
	};

	const downloadAllLogs = () => {
		logs.forEach((log, index) => {
			setTimeout(() => {
				const element = document.getElementById(`log-${index}`);
				if (element) {
					html2canvas(element, { scale: 2 }).then((canvas) => {
						const link = document.createElement("a");
						link.download = `eld-day-${log.day}-${log.date}.png`;
						link.href = canvas.toDataURL();
						link.click();
					});
				}
			}, index * 500);
		});
	};

	return (
		<Paper elevation={3} sx={{ p: 3, mt: 4 }}>
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
				<Typography variant="h6">
					ELD Daily Logs ({logs.length} day{logs.length > 1 ? "s" : ""})
				</Typography>
				<Box
					sx={{
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						justifyContent: "space-between",
						alignItems: "center",
						gap: 1,
					}}>
					<Button variant="outlined" onClick={downloadAllLogs} sx={{ mr: 1 }}>
						Download All
					</Button>
					<Button variant="contained" onClick={downloadLogSheet}>
						Download Summary
					</Button>
				</Box>
			</Box>

			<Box ref={canvasRef}>
				{logs.map((log, idx) => {
					const segments = EldDrawer.generateDutySegments(log);
					const totalWidth = 100; // percentage

					return (
						<Paper
							key={idx}
							id={`log-${idx}`}
							elevation={1}
							sx={{ p: 2, mb: 3, backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#444444" : "#f3f3f3") }}>
							<Typography variant="subtitle1" gutterBottom>
								Day {log.day} - {formatDateTime(log.date)}
							</Typography>

							<Grid container spacing={2} sx={{ mb: 2 }}>
								<Grid size={{ xs: 6, md: 3 }}>
									<Typography variant="caption" color="textSecondary">
										Driving Hours
									</Typography>
									<Typography variant="h6">{log.driving_hours} hrs</Typography>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Typography variant="caption" color="textSecondary">
										On-Duty (Non-Driving)
									</Typography>
									<Typography variant="h6">{log.on_duty_non_driving} hrs</Typography>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Typography variant="caption" color="textSecondary">
										Off-Duty
									</Typography>
									<Typography variant="h6">{log.off_duty_hours} hrs</Typography>
								</Grid>
								<Grid size={{ xs: 6, md: 3 }}>
									<Typography variant="caption" color="textSecondary">
										Miles Today
									</Typography>
									<Typography variant="h6">{log.miles_today} mi</Typography>
								</Grid>
							</Grid>

							<Box sx={{ mt: 2, mb: 1 }}>
								<Typography variant="body2" gutterBottom>
									Duty Status Grid (24 hours):
								</Typography>
								<Box sx={{ display: "flex", height: 60, borderRadius: 1, overflow: "hidden" }}>
									{segments.map((segment, segIdx) => (
										<Box
											key={segIdx}
											sx={{
												width: `${(segment.hours / 24) * totalWidth}%`,
												bgcolor: segment.color,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												borderRight: "1px solid rgba(0,0,0,0.1)",
											}}>
											<Typography variant="body2" sx={{ fontWeight: 700 }}>
												{segment.label}
											</Typography>
										</Box>
									))}
								</Box>
								<Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
									{segments.map((segment, segIdx) => (
										<Chip key={segIdx} label={`${segment.label}: ${segment.hours} hrs`} size="small" sx={{ bgcolor: segment.color }} />
									))}
								</Box>
							</Box>

							{log.cycle_hours_remaining && (
								<Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
									Cycle hours remaining: {log.cycle_hours_remaining} / 70 hours
								</Typography>
							)}
						</Paper>
					);
				})}
			</Box>

			<Box sx={{ mt: 2, p: 2, backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#444444" : "#f3f3f3"), borderRadius: 1 }}>
				<Typography variant="body2" color="text.secondary">
					<strong>Status Legend:</strong>
					<br />
					• OFF: Off-duty / 10-hour restart
					<br />
					• DR: Driving (max 11 hours/day)
					<br />
					• ON: On-duty non-driving (pickup/delivery/fueling)
					<br />
					• SB: Sleeper Berth
					<br />
					<strong>FMCSA Rules:</strong> 70-hour / 8-day cycle, 14-hour on-duty limit, 10-hour off-duty required
				</Typography>
			</Box>
		</Paper>
	);
};
