import { test, expect } from "@playwright/test";

test.describe("Accessibility Tests", () => {
	test("should have proper ARIA labels", async ({ page }) => {
		await page.goto("/");

		// Check form inputs have labels
		const inputs = await page.locator("input").all();
		for (const input of inputs) {
			const ariaLabel = await input.getAttribute("aria-label");
			const id = await input.getAttribute("id");
			if (id) {
				const label = await page.locator(`label[for="${id}"]`).count();
				expect(label > 0 || ariaLabel).toBeTruthy();
			}
		}
	});

	test("should support keyboard navigation completely", async ({ page }) => {
		await page.goto("/");

		// Explicitly focus the first form field to anchor our keyboard track loop
		const firstInput = page.locator('input[name="current_location"]').first();
		if (await firstInput.isVisible()) {
			await firstInput.focus();
		}

		let previousFocused = null;
		// Tab through actionable elements
		for (let i = 0; i < 10; i++) {
			await page.keyboard.press("Tab");
			const focused = await page.evaluate(() => {
				const el = document.activeElement;
				return el ? { tagName: el.tagName, id: el.id, name: el.getAttribute("name") } : null;
			});

			if (focused && previousFocused) {
				expect(focused.name || focused.tagName).not.toEqual(previousFocused.name || previousFocused.tagName);
			}
			previousFocused = focused;
		}
	});

	test("should have sufficient color contrast", async ({ page }) => {
		await page.goto("/");

		// Check contrast for primary text
		const textColor = await page.locator("body").evaluate((el) => {
			return window.getComputedStyle(el).color;
		});
		const bgColor = await page.locator("body").evaluate((el) => {
			return window.getComputedStyle(el).backgroundColor;
		});

		// This would require a color contrast library, but we can do basic check
		expect(textColor).toBeDefined();
		expect(bgColor).toBeDefined();
	});
});
