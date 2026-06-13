import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTripPlan } from "@/hooks/useTripPlan";
import { TripForm } from "./TripForm";

vi.mock("@/hooks/useTripPlan");

describe("TripForm", () => {
	const mockPlanTrip = vi.fn();

	beforeEach(() => {
		vi.mocked(useTripPlan).mockReturnValue({
			planTrip: mockPlanTrip,
			isLoading: false,
			error: null,
			data: null,
			reset: vi.fn(),
		});
	});

	it("should render all form fields", () => {
		render(<TripForm onSubmitTrip={mockPlanTrip} />);

		expect(screen.getByLabelText(/Current Location/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Pickup Location/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Dropoff Location/i)).toBeInTheDocument();
		expect(screen.getByText(/Current Cycle Used/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Plan Route/i })).toBeInTheDocument();
	});

	it("should validate required fields", async () => {
		render(<TripForm onSubmitTrip={mockPlanTrip} />);

		const submitButton = screen.getByRole("button", { name: /Plan Route/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/Current location is required/i)).toBeInTheDocument();
			expect(screen.getByText(/Pickup location is required/i)).toBeInTheDocument();
			expect(screen.getByText(/Dropoff location is required/i)).toBeInTheDocument();
		});

		expect(mockPlanTrip).not.toHaveBeenCalled();
	});

	it("should submit form with valid data", async () => {
		render(<TripForm onSubmitTrip={mockPlanTrip} />);

		await userEvent.type(screen.getByLabelText(/Current Location/i), "Los Angeles, CA");
		await userEvent.type(screen.getByLabelText(/Pickup Location/i), "Dallas, TX");
		await userEvent.type(screen.getByLabelText(/Dropoff Location/i), "Chicago, IL");

		const submitButton = screen.getByRole("button", { name: /Plan Route/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockPlanTrip).toHaveBeenCalledWith({
				current_location: "Los Angeles, CA",
				pickup_location: "Dallas, TX",
				dropoff_location: "Chicago, IL",
				current_cycle_used: 0,
			});
		});
	});

	it("should show loading state", () => {
		vi.mocked(useTripPlan).mockReturnValue({
			planTrip: mockPlanTrip,
			isLoading: true,
			error: null,
			data: null,
			reset: vi.fn(),
		});

		render(<TripForm onSubmitTrip={mockPlanTrip} isLoading={true} />);

		expect(screen.getByRole("progressbar")).toBeInTheDocument();
	});

	it("should display error message", () => {
		vi.mocked(useTripPlan).mockReturnValue({
			planTrip: mockPlanTrip,
			isLoading: false,
			error: "Failed to plan trip",
			data: null,
			reset: vi.fn(),
		});

		render(<TripForm onSubmitTrip={mockPlanTrip} error="Failed to plan trip" />);

		expect(screen.getByText("Failed to plan trip")).toBeInTheDocument();
	});
});
