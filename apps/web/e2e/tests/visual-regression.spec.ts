import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { DashboardPage } from "../pages/dashboard.page";
import users from "../fixtures/test-users.json";

const SCREENSHOT_DIR = "e2e/screenshots";

test.describe("Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Dashboard page matches baseline @visual", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await page.waitForTimeout(1000); // wait for animations
    await expect(page).toHaveScreenshot(`${SCREENSHOT_DIR}/dashboard.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.1,
    });
  });

  test("Units page matches baseline @visual", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot(`${SCREENSHOT_DIR}/units.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.1,
    });
  });

  test("Login page matches baseline @visual", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`${SCREENSHOT_DIR}/login.png`, {
      fullPage: true,
      maxDiffPixels: 50,
      threshold: 0.1,
    });
  });

  test("AI Chat page matches baseline @visual", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToAI();
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot(`${SCREENSHOT_DIR}/ai-chat.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.1,
    });
  });
});
