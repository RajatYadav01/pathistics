import { test, expect } from "@playwright/test";

test.describe("Trip Planning E2E Tests", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
	});

	test("should load the dashboard page", async ({ page }) => {
		await expect(page).toHaveTitle(/Pathistics/);
		await expect(page.getByRole("heading", { name: "Trip Planner" })).toBeVisible();
	});

	test("should display form with all required fields", async ({ page }) => {
		await expect(page.locator('input[name="current_location"], label:has-text("Current Location")').first()).toBeVisible();
		await expect(page.locator('input[name="pickup_location"], label:has-text("Pickup Location")').first()).toBeVisible();
		await expect(page.locator('input[name="dropoff_location"], label:has-text("Dropoff Location")').first()).toBeVisible();
		await expect(page.locator('input[type="range"], label:has-text("Cycle")').first()).toBeVisible();
		await expect(page.getByRole("button", { name: /Plan Route and Generate Logs/i })).toBeVisible();
	});

	test("should show validation errors for empty form submission", async ({ page }) => {
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await expect(page.getByText(/Current location is required/i)).toBeVisible();
		await expect(page.getByText(/Pickup location is required/i)).toBeVisible();
		await expect(page.getByText(/Dropoff location is required/i)).toBeVisible();
	});

	test("should successfully plan a short trip", async ({ page }) => {
		// Fill form
		await page.fill('input[name="current_location"]', "Los Angeles, CA");
		await page.fill('input[name="pickup_location"]', "San Diego, CA");
		await page.fill('input[name="dropoff_location"]', "Las Vegas, NV");

		// Adjust cycle slider
		const slider = page.locator('input[type="range"]');
		await slider.fill("10");

		// Submit form
		await page.click('button:has-text("Plan Route and Generate Logs")');

		// Wait for results
		await page.waitForSelector(".MuiPaper-root", { timeout: 30000 });

		// Verify trip summary appears
		await expect(page.getByText(/Trip Summary/i)).toBeVisible();
		await expect(page.getByText(/Total Distance/i)).toBeVisible();

		// Verify map appears
		await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 });

		// Verify ELD logs appear
		await expect(page.getByText(/ELD Daily Logs/i)).toBeVisible();
	});

	test("should handle long trips with multiple days", async ({ page }) => {
		await page.fill('input[name="current_location"]', "New York, NY");
		await page.fill('input[name="pickup_location"]', "Chicago, IL");
		await page.fill('input[name="dropoff_location"]', "Los Angeles, CA");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await page.waitForSelector(".MuiPaper-root", { timeout: 30000 });

		// Should show multiple days
		const dayCards = await page.locator('[id^="log-"]').count();
		expect(dayCards).toBeGreaterThan(2);
	});

	test("should show cycle warning when limit exceeded", async ({ page }) => {
		await page.fill('input[name="current_location"]', "Seattle, WA");
		await page.fill('input[name="pickup_location"]', "Denver, CO");
		await page.fill('input[name="dropoff_location"]', "Miami, FL");

		// Set high cycle usage
		const slider = page.locator('input[type="range"]');
		await slider.fill("65");

		await page.click('button:has-text("Plan Route and Generate Logs")');

		await page.waitForSelector(".MuiAlert-root", { timeout: 30000 });

		await expect(page.getByText(/Cycle Limit Warning/i)).toBeVisible();
	});

	test("should download ELD logs as image", async ({ page }) => {
		await page.fill('input[name="current_location"]', "Boston, MA");
		await page.fill('input[name="pickup_location"]', "Philadelphia, PA");
		await page.fill('input[name="dropoff_location"]', "Washington, DC");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await page.waitForSelector(".MuiPaper-root", { timeout: 30000 });

		// Setup download listener
		const downloadPromise = page.waitForEvent("download");
		await page.click('button:has-text("Download Summary")');
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toContain("eld-logs");
	});
});

test.describe("Navigation and Responsive Tests", () => {
	test("should navigate to history page", async ({ page }) => {
		await page.goto("/");
		await page.click("text=Trip History");
		await expect(page).toHaveURL(/.*history/);
		await expect(page.getByRole("heading", { name: "Trip History" })).toBeVisible();
	});

	test("should be responsive on mobile viewport", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");

		// Mobile menu should be visible
		const menuButton = page.locator('[aria-label="open drawer"]');
		await expect(menuButton).toBeVisible();

		// Form should stack vertically
		await expect(page.locator(".MuiGrid-root")).toHaveCSS("flex-direction", "column");
	});

	test("should handle keyboard navigation", async ({ page }) => {
		await page.goto("/");

		// Tab through form fields
		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="current_location"]')).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="pickup_location"]')).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(page.locator('input[name="dropoff_location"]')).toBeFocused();
	});
});

test.describe("API Integration Tests", () => {
	test("should handle API errors gracefully", async ({ page }) => {
		// Mock API failure
		await page.route("/api/plan-trip/", async (route) => {
			await route.fulfill({
				status: 500,
				body: JSON.stringify({ error: "Server error" }),
			});
		});

		await page.goto("/");
		await page.fill('input[name="current_location"]', "Test City");
		await page.fill('input[name="pickup_location"]', "Pickup City");
		await page.fill('input[name="dropoff_location"]', "Drop City");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await expect(page.getByText(/Failed to plan trip/i)).toBeVisible();
	});

	test("should show loading state during API call", async ({ page }) => {
		// Delay API response
		await page.route("/api/plan-trip/", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			await route.continue();
		});

		await page.goto("/");
		await page.fill('input[name="current_location"]', "Test City");
		await page.fill('input[name="pickup_location"]', "Pickup City");
		await page.fill('input[name="dropoff_location"]', "Drop City");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await expect(page.locator(".MuiCircularProgress-root")).toBeVisible();
	});
});

test.describe("ELD Compliance Tests", () => {
	test("should display correct duty status colors", async ({ page }) => {
		await page.fill('input[name="current_location"]', "City A");
		await page.fill('input[name="pickup_location"]', "City B");
		await page.fill('input[name="dropoff_location"]', "City C");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await page.waitForSelector(".MuiPaper-root", { timeout: 30000 });

		// Check for duty status chips
		const chips = page.locator(".MuiChip-root");
		await expect(chips.first()).toBeVisible();

		// Verify legend is present
		await expect(page.getByText(/Status Legend/i)).toBeVisible();
		await expect(page.getByText(/OFF: Off-duty/i)).toBeVisible();
		await expect(page.getByText(/DR: Driving/i)).toBeVisible();
	});

	test("should calculate correct hours for 11-hour driving limit", async ({ page }) => {
		// Mock a long trip
		await page.route("/api/plan-trip/", async (route) => {
			await route.fulfill({
				status: 200,
				body: JSON.stringify({
					trip_id: 1,
					route: { coordinates: [] },
					instructions: [],
					total_distance_miles: 605,
					estimated_hours: 11,
					fuel_stops: [],
					rest_breaks: [{ after_hours: 8, duration: 0.5 }],
					eld_logs: [
						{
							day: 1,
							date: "2024-01-01",
							driving_hours: 11,
							on_duty_non_driving: 2,
							off_duty_hours: 10,
							sleeper_berth_hours: 1,
							total_hours: 24,
							miles_today: 605,
							cycle_hours_remaining: 59,
						},
					],
					requires_cycle_compliance: false,
				}),
			});
		});

		await page.goto("/");
		await page.fill('input[name="current_location"]', "City A");
		await page.fill('input[name="pickup_location"]', "City B");
		await page.fill('input[name="dropoff_location"]', "City C");
		await page.click('button:has-text("Plan Route and Generate Logs")');

		await page.waitForSelector(".MuiPaper-root", { timeout: 10000 });

		await expect(page.getByText("11 hrs")).toBeVisible();
	});
});

test.describe("Performance Tests", () => {
	test("should load initial page within 3 seconds", async ({ page }) => {
		const startTime = Date.now();
		await page.goto("/");
		const loadTime = Date.now() - startTime;

		expect(loadTime).toBeLessThan(3000);
	});

	test("should handle large route data efficiently", async ({ page }) => {
		// Mock large route response
		const largeInstructions = Array(100)
			.fill(null)
			.map((_, i) => ({
				text: `Step ${i}: Continue on highway for 10 miles`,
				distance_miles: 10,
				duration_minutes: 10.9,
			}));

		await page.route("/api/plan-trip/", async (route) => {
			await route.fulfill({
				status: 200,
				body: JSON.stringify({
					trip_id: 1,
					route: { coordinates: Array(200).fill([-118, 34]) },
					instructions: largeInstructions,
					total_distance_miles: 1000,
					estimated_hours: 18,
					fuel_stops: [{ mile: 1000, duration: 0.5 }],
					rest_breaks: [{ after_hours: 8, duration: 0.5 }],
					eld_logs: [
						{
							day: 1,
							date: "2024-01-01",
							driving_hours: 11,
							on_duty_non_driving: 2,
							off_duty_hours: 10,
							sleeper_berth_hours: 1,
							total_hours: 24,
							miles_today: 605,
							cycle_hours_remaining: 59,
						},
						{
							day: 2,
							date: "2024-01-02",
							driving_hours: 7,
							on_duty_non_driving: 2,
							off_duty_hours: 10,
							sleeper_berth_hours: 5,
							total_hours: 24,
							miles_today: 385,
							cycle_hours_remaining: 52,
						},
					],
					requires_cycle_compliance: false,
				}),
			});
		});

		await page.goto("/");
		await page.fill('input[name="current_location"]', "Start");
		await page.fill('input[name="pickup_location"]', "Middle");
		await page.fill('input[name="dropoff_location"]', "End");

		const startTime = Date.now();
		await page.click('button:has-text("Plan Route and Generate Logs")');
		await page.waitForSelector(".MuiPaper-root", { timeout: 30000 });
		const renderTime = Date.now() - startTime;

		expect(renderTime).toBeLessThan(5000); // Should render within 5 seconds
	});
});
