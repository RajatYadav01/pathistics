import React from "react";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import { Header } from "./Header";
import Footer from "./Footer";
import paperBackground from "@/assets/page-background.jpg";

interface LayoutProps {
	children: React.ReactNode;
	darkMode: boolean;
	onToggleDarkMode: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, onToggleDarkMode }) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				minHeight: "100%",
				backgroundImage: (theme) =>
					theme.palette.mode === "dark"
						? `linear-gradient(rgba(30, 30, 30, 0.85), rgba(30, 30, 30, 0.85)), url(${paperBackground})`
						: `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${paperBackground})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "repeat-y",
			}}>
			<CssBaseline />
			<Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
			<Toolbar />
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
                    mx: "auto",
					width: "100%",
				}}>
				{children}
			</Box>
			<Footer />
		</Box>
	);
};
