import { Link as RouterLink } from "react-router";
import { Box, Typography, Link as MuiLink } from "@mui/material";

export function NotFoundPage() {
	return (
		<Box
			sx={{
				width: "100%",
				height: "100%",
				textAlign: "center",
				fontSize: {
					xs: "3rem",
					md: "6rem",
					lg: "7.5rem",
					xl: "8.5rem",
					cx: "10rem",
				},
			}}>
			<Typography
				variant="h1"
				sx={{
					marginTop: "10%",
					marginBottom: "2%",
					color: "#969696",
					fontSize: "1em",
					fontWeight: 700,
				}}>
				404 Error
			</Typography>

			<Typography
				variant="h2"
				sx={{
					marginTop: "2%",
					marginBottom: "2%",
					color: "#646464",
					fontSize: "0.5em",
					fontWeight: 500,
				}}>
				Page not found
			</Typography>

			<Typography
				variant="h2"
				sx={{
					marginTop: "2%",
					marginBottom: "2%",
					color: "#646464",
					fontSize: "0.3em",
					fontWeight: 400,
				}}>
				Click{" "}
				<MuiLink
					component={RouterLink}
					to=".."
					underline="none"
					sx={{
						color: "#2d9ef6",
						lineHeight: 2,
						fontWeight: 400,
					}}>
					here
				</MuiLink>{" "}
				to go back
			</Typography>
		</Box>
	);
}
