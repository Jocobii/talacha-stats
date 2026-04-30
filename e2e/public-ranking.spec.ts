import { expect, test } from "@playwright/test";

test.describe("Given a visitor on the public ranking page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/ranking");
	});

	test.describe("When the city ranking renders with seeded data", () => {
		test("Then the page heading is 'Ranking'", async ({ page }) => {
			await expect(page.getByRole("heading", { level: 1, name: "Ranking" })).toBeVisible();
		});

		test("Then a CAMPEÓN badge marks the top scorer of the podium", async ({ page }) => {
			// CAMPEÓN is rendered only when the city ranking query returns a
			// non-empty result and a leader can be identified — its presence
			// is a strong signal that the data path (seed → query → render)
			// is wired end-to-end.
			await expect(page.getByText("CAMPEÓN").first()).toBeVisible();
		});

		test("Then the Top 10 list renders at least one entry", async ({ page }) => {
			// Each entry is an anchor pointing to /player/<uuid>; finding at
			// least one proves the list rendered with real data.
			await expect(page.locator('a[href^="/player/"]').first()).toBeVisible();
		});
	});

	test.describe("When they click the CAMPEÓN of the city ranking", () => {
		test.beforeEach(async ({ page }) => {
			// `getByRole("link").filter({ hasText: "CAMPEÓN" })` returns the
			// anchor wrapping the badge — that's the leader's card. Clicking
			// it should navigate to /player/<uuid>.
			await page.getByRole("link").filter({ hasText: "CAMPEÓN" }).click();
		});

		test("Then the URL navigates to a /player/<uuid> route", async ({ page }) => {
			await expect(page).toHaveURL(/\/player\/[a-f0-9-]{36}$/);
		});

		test("Then the player detail page renders a heading with the player's name", async ({
			page,
		}) => {
			// The detail page must surface a level-1 heading — that's the
			// player's full name. We don't bind the assertion to a specific
			// name (the seed is deterministic but renaming it shouldn't
			// require touching this test); we only assert the heading
			// exists with non-empty text.
			const heading = page.getByRole("heading", { level: 1 });
			await expect(heading).toBeVisible();
			await expect(heading).not.toHaveText("");
		});
	});
});
