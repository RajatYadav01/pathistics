import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import { Box, Paper, Typography, List, ListItem, ListItemText, Divider } from "@mui/material";
import L from "leaflet";
import { config } from "@/config/env";
import type { RouteInstruction } from "@/types/trip.types";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface RouteMapProps {
	geometry: any;
	instructions: RouteInstruction[];
	totalDistance: number;
}

export const RouteMap: React.FC<RouteMapProps> = ({ geometry, instructions, totalDistance }) => {
	const coordinates = geometry?.coordinates || [];
	const positions = coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
	const center = positions[0] || [config.map.defaultCenter.lat, config.map.defaultCenter.lng];

	return (
		<Paper elevation={3} sx={{ p: 2, mb: 4 }}>
			<Typography variant="h6" gutterBottom>
				Route Map - Total Distance: {totalDistance.toFixed(0)} miles
			</Typography>

			<Box sx={{ height: 400, width: "100%", borderRadius: 1, overflow: "hidden", mb: 2 }}>
				<MapContainer center={center as L.LatLngExpression} zoom={config.map.defaultZoom} style={{ height: "100%", width: "100%" }}>
					<TileLayer attribution={config.map.attribution} url={config.map.tileUrl} />
					{positions.length > 0 && <Polyline positions={positions as L.LatLngExpression[]} color="#1976d2" weight={4} />}
					{positions.length > 0 && (
						<>
							<Marker position={positions[0] as L.LatLngExpression}>
								<Popup>📍 Pickup Location</Popup>
							</Marker>
							<Marker position={positions[positions.length - 1] as L.LatLngExpression}>
								<Popup>🏁 Dropoff Location</Popup>
							</Marker>
						</>
					)}
				</MapContainer>
			</Box>

			<Typography variant="subtitle1" gutterBottom>
				Driving Instructions:
			</Typography>
			<List dense sx={{ maxHeight: 300, overflow: "auto", bgcolor: "background.paper" }}>
				{instructions.slice(0, 15).map((step, idx) => (
					<React.Fragment key={idx}>
						<ListItem>
							<ListItemText
								primary={step.text}
								secondary={`${step.distance_miles.toFixed(1)} miles • ${step.duration_minutes.toFixed(0)} minutes`}
							/>
						</ListItem>
						{idx < instructions.length - 1 && <Divider />}
					</React.Fragment>
				))}
			</List>
		</Paper>
	);
};
