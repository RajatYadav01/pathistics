import { useState, useMemo } from "react";
import { BrowserRouter } from "react-router";
import { ThemeProvider, CssBaseline, type PaletteMode } from "@mui/material";
import { AppRoutes } from "./routes";
import { getAppTheme } from "./styles/theme";
import { Layout } from "./layouts/MainLayout";

export default function App() {
    const [mode, setMode] = useState<PaletteMode>("light");

	const theme = useMemo(() => getAppTheme(mode), [mode]);

	const handleToggleDarkMode = () => {
		setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<BrowserRouter basename={import.meta.env.VITE_BASE_URL}>
				<Layout darkMode={mode === "dark"} onToggleDarkMode={handleToggleDarkMode}>
					<AppRoutes />
				</Layout>
			</BrowserRouter>
		</ThemeProvider>
	);
}
