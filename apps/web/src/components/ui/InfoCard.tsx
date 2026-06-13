import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

interface InfoCardProps {
	title: string;
	value: string | number;
	icon?: React.ReactNode;
	subtitle?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon, subtitle }) => {
	return (
		<Card sx={{ height: "100%", backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#444444" : "#f3f3f3") }}>
			<CardContent>
				<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<Typography color="textSecondary" variant="body2" gutterBottom>
						{title}
					</Typography>
					{icon && <Box sx={{ color: "primary.main" }}>{icon}</Box>}
				</Box>
				<Typography variant="h4" component="h2" gutterBottom>
					{value}
				</Typography>
				{subtitle && (
					<Typography variant="body2" color="textSecondary">
						{subtitle}
					</Typography>
				)}
			</CardContent>
		</Card>
	);
};
