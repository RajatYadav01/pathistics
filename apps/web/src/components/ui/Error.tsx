import React from "react";
import { Alert, AlertTitle, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface ErrorProps {
	message: string;
	title?: string;
	onClose?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ message, title = "Error", onClose }) => {
	return (
		<Box sx={{ mb: 2 }}>
			<Alert
				severity="error"
				action={
					onClose && (
						<IconButton aria-label="close" color="inherit" size="small" onClick={onClose}>
							<CloseIcon fontSize="inherit" />
						</IconButton>
					)
				}>
				<AlertTitle>{title}</AlertTitle>
				{message}
			</Alert>
		</Box>
	);
};
