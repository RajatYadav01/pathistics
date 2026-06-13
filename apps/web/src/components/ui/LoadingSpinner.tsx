import React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

interface LoadingSpinnerProps {
	message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
			<CircularProgress size={48} />
			<Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
				{message}
			</Typography>
		</Box>
	);
};
