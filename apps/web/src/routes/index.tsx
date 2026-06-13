import React from "react";
import { Routes, Route } from "react-router";
import { Dashboard } from "@/pages/Dashboard";
import { History } from "@/pages/History";
import { TripDetails } from "@/pages/TripDetails";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const AppRoutes: React.FC = () => {
	return (
		<Routes>
			<Route path="/" element={<Dashboard />} />
			<Route path="/history" element={<History />} />
            <Route path="/trip/:id" element={<TripDetails />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};
