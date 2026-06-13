import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { InfoCard } from "./InfoCard";

describe("InfoCard", () => {
	it("should render title and value", () => {
		render(<InfoCard title="Test Title" value="Test Value" />);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Test Value")).toBeInTheDocument();
	});

	it("should render icon when provided", () => {
		render(<InfoCard title="With Icon" value="100" icon={<LocalShippingIcon data-testid="icon" />} />);

		expect(screen.getByTestId("icon")).toBeInTheDocument();
	});

	it("should render subtitle when provided", () => {
		render(<InfoCard title="With Subtitle" value="Value" subtitle="Subtitle text" />);

		expect(screen.getByText("Subtitle text")).toBeInTheDocument();
	});
});
