import { expect, test } from "@playwright/test";

test.describe("Given a fresh browser session", () => {
	test.describe("When the visitor navigates to the homepage", () => {
		test("Then the server responds with a 2xx status and a non-empty title", async ({ page }) => {
			const response = await page.goto("/");
			if (!response) throw new Error("No response received for /");

			expect(response.status()).toBeLessThan(400);
			await expect(page).toHaveTitle(/.+/);
		});
	});
});
