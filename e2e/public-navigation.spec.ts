import { expect, test } from "@playwright/test";

test.describe("Given a visitor on the public homepage", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test.describe("When they click the 'Ranking' link in the public nav", () => {
		test.beforeEach(async ({ page }) => {
			// `exact: true` matters: the homepage also has CTA links such
			// as "Ver ranking" and "Ver ranking completo" that contain the
			// word "ranking" and would otherwise match. Only the desktop
			// sidebar link has the accessible name "Ranking" exactly.
			// (The mobile bottom-nav has the same exact label, but at the
			// default viewport 1280×720 it's `display:none` via `sm:hidden`
			// so it doesn't appear in the accessibility tree.)
			await page
				.getByRole("link", { name: "Ranking", exact: true })
				.click();
		});

		test("Then the URL becomes /ranking", async ({ page }) => {
			await expect(page).toHaveURL(/\/ranking(\?|$)/);
		});

		test("Then the page heading shows 'Ranking'", async ({ page }) => {
			// Asserts the visible H1 (not document.title): on Next 16
			// client-side navigation the <title> can lag while metadata
			// streams in, and the H1 is the truthful signal that the
			// destination page rendered.
			await expect(
				page.getByRole("heading", { level: 1, name: "Ranking" }),
			).toBeVisible();
		});
	});
});
