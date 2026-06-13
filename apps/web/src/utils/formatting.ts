export const formatDistance = (miles: number): string => {
	if (miles < 0.1) return "< 0.1 mi";
	if (miles < 10) return `${miles.toFixed(1)} mi`;
	return `${Math.round(miles)} mi`;
};

export const formatDuration = (hours: number): string => {
	const hrs = Math.floor(hours);
	const mins = Math.round((hours - hrs) * 60);
	if (hrs === 0) return `${mins} min`;
	if (mins === 0) return `${hrs} hr`;
	return `${hrs} hr ${mins} min`;
};

export const formatDateTime = (date: string): string => {
	return new Date(date).toLocaleDateString("en-US", {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};
