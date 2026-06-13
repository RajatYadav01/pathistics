import { createTheme, type PaletteMode } from "@mui/material";
import "@fontsource/manrope/200.css";
import "@fontsource/manrope/300.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/sen/400.css";
import "@fontsource/sen/500.css";
import "@fontsource/sen/600.css";
import "@fontsource/sen/700.css";
import "@fontsource/sen/800.css";

export const getAppTheme = (mode: PaletteMode) =>
	createTheme({
		palette: {
			mode,
			primary: {
				main: "#1976d2",
				light: "#42a5f5",
				dark: "#1565c0",
			},
			secondary: {
				main: "#dc004e",
			},
			background: {
				default: mode === "dark" ? "#121212" : "#F5FAFA",
				paper: mode === "dark" ? "#121212" : "#ffffff",
			},
			text: {
				primary: mode === "dark" ? "#ffffff" : "#1a1a1a",
				secondary: mode === "dark" ? "#b0b0b0" : "#646464",
			},
		},
		typography: {
			fontFamily: ["Manrope", "Inter", "Geist", "Sen", "Helvetica", "Arial", "sans-serif"].join(","),
			h4: { fontWeight: 600 },
			h5: { fontWeight: 600 },
			h6: { fontWeight: 600 },
		},
		shape: {
			borderRadius: 8,
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: "none",
						fontWeight: 600,
					},
				},
			},
			MuiPaper: {
				styleOverrides: {
					root: {
						backgroundImage: "none",
					},
				},
			},
		},
	});
