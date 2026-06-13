import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
	AppBar,
	Box,
	Toolbar,
	Typography,
	IconButton,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Divider,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { Logo } from "@/components/ui/Logo";

const drawerWidth = 240;

interface HeaderProps {
	darkMode: boolean;
	onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode }) => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const navigate = useNavigate();
	const location = useLocation();

	const menuItems = [
		{ text: "Dashboard", icon: <DashboardIcon />, path: "/" },
		{ text: "Trip History", icon: <HistoryIcon />, path: "/history" },
	];

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const navLinks = (
		<List
			sx={{
				display: { xs: "block", md: "flex" },
				p: 0,
				height: { md: "100%" },
				alignItems: { md: "stretch" },
			}}>
			{menuItems.map((item) => {
				const isSelected = location.pathname === item.path;
				return (
					<ListItem
						key={item.text}
						disablePadding
						sx={{
							width: { md: "auto" },
							height: { md: "100%" },
						}}>
						<ListItemButton
							onClick={() => {
								navigate(item.path);
								if (isMobile) setMobileOpen(false);
							}}
							selected={isSelected}
							sx={{
								whiteSpace: "nowrap",
								mx: { md: 0.5 },
								px: 2,
								height: { md: "100%" },
								borderRadius: { xs: 1, md: 0 },
								borderBottom: {
									md: isSelected ? `3px solid ${theme.palette.primary.main}` : "3px solid transparent",
								},
								"&.Mui-selected": {
									backgroundColor: { md: "transparent" },
								},
							}}>
							<ListItemIcon sx={{ minWidth: { xs: 40, md: 32 }, color: isSelected ? "primary.main" : "inherit" }}>{item.icon}</ListItemIcon>
							<ListItemText
								primary={
									<Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500 }}>
										{item.text}
									</Typography>
								}
							/>
						</ListItemButton>
					</ListItem>
				);
			})}
		</List>
	);

	return (
		<>
			<AppBar
				position="fixed"
				color="inherit"
				elevation={0}
				sx={{
					height: 100,
					backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#121212e6" : "#F5FAFA99"),
					backdropFilter: "blur(8px)",
					WebkitBackdropFilter: "blur(8px)",
					borderBottom: "1px solid",
					borderColor: "divider",
				}}>
				<Toolbar sx={{ justifyContent: "space-between", height: "100%", minHeight: "100% !important", p: "0 16px" }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "primary.main" }}>
						<Logo />
					</Box>
					<Box sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}>
						{!isMobile && (
							<Box component="nav" sx={{ height: "100%", mr: 1 }}>
								{navLinks}
							</Box>
						)}
						<IconButton onClick={onToggleDarkMode} color="inherit" aria-label="toggle light dark mode" sx={{ mx: 0.5 }}>
							{darkMode ? <LightModeIcon /> : <DarkModeIcon />}
						</IconButton>

						{isMobile && (
							<IconButton color="inherit" aria-label="open drawer" edge="end" onClick={handleDrawerToggle}>
								<MenuIcon />
							</IconButton>
						)}
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer
				anchor="right"
				variant="temporary"
				open={mobileOpen}
				onClose={handleDrawerToggle}
				ModalProps={{ keepMounted: true }}
				sx={{
					display: { xs: "block", md: "none" },
					"& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
				}}>
				<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
						Navigation
					</Typography>
					<IconButton onClick={handleDrawerToggle}>
						<CloseIcon />
					</IconButton>
				</Box>
				<Divider />
				<Box sx={{ p: 1 }}>{navLinks}</Box>
			</Drawer>
		</>
	);
};
