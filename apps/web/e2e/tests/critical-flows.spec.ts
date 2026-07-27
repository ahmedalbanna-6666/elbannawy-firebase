import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { DashboardPage } from "../pages/dashboard.page";
import { UnitsPage } from "../pages/units.page";
import { LessonDetailPage } from "../pages/lesson-detail.page";
import users from "../fixtures/test-users.json";

// ─────────────────────────────────────────────────
// 1. LOGIN FLOW
// ─────────────────────────────────────────────────
test.describe("Authentication", () => {
  test("Login page loads and shows form", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.expectLoginFormVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Login with invalid credentials shows error", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.emailInput.fill("wrong@email.com");
    await login.passwordInput.fill("wrongpassword");
    await login.submitButton.click();
    await login.expectError();
  });
});

// ─────────────────────────────────────────────────
// 2. DASHBOARD FLOW
// ─────────────────────────────────────────────────
test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Dashboard loads with all sections", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.expectHeaderVisible();
    // Skip bottom nav check — it may be hidden on desktop viewport
  });

  test("Navigation links are visible", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await expect(dash.unitsLink.first()).toBeVisible();
    await expect(dash.storyLink.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────
// 3. LEARNING PATH (UNITS → LESSONS)
// ─────────────────────────────────────────────────
test.describe("Learning Path", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Navigate to Units and see lesson list", async ({ page }) => {
    const dash = new DashboardPage(page);
    const units = new UnitsPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await units.expectUnitsLoaded();
  });

  test("Click first unit and verify lessons load", async ({ page }) => {
    const dash = new DashboardPage(page);
    const units = new UnitsPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await units.clickFirstUnit();
    await units.expectLessonsVisible();
  });

  test("Navigate to lesson detail page", async ({ page }) => {
    const dash = new DashboardPage(page);
    const units = new UnitsPage(page);
    const lesson = new LessonDetailPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await units.clickFirstUnit();
    await units.clickFirstLesson();
    await lesson.expectLessonLoaded();
    await lesson.expectLearningCardsVisible();
  });
});

// ─────────────────────────────────────────────────
// 4. AI CHAT
// ─────────────────────────────────────────────────
test.describe("AI Chat", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("AI Chat page loads", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToAI();
    await expect(page.locator("input, textarea").first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ─────────────────────────────────────────────────
// 5. STORY PAGE
// ─────────────────────────────────────────────────
test.describe("Story", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Story timeline page loads", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToStory();
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────
// 6. VIDEO PLAYER
// ─────────────────────────────────────────────────
test.describe("Video Player", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Video player renders on lesson detail", async ({ page }) => {
    const dash = new DashboardPage(page);
    const units = new UnitsPage(page);
    const lesson = new LessonDetailPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await units.clickFirstUnit();
    await units.clickFirstLesson();
    await lesson.expectLessonLoaded();
    await lesson.expectVideoPlayerVisible();
  });
});

// ─────────────────────────────────────────────────
// 7. QUIZ / HOMEWORK FLOW
// ─────────────────────────────────────────────────
test.describe("Quiz & Homework", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Lesson detail page has quiz/homework cards", async ({ page }) => {
    const dash = new DashboardPage(page);
    const units = new UnitsPage(page);
    const lesson = new LessonDetailPage(page);
    await dash.expectDashboardLoaded();
    await dash.navigateToUnits();
    await units.clickFirstUnit();
    await units.clickFirstLesson();
    await lesson.expectLessonLoaded();
    // Quiz and homework cards should be present
    const hasQuizOrHomework =
      (await lesson.quizCard.count()) > 0 ||
      (await lesson.homeworkCard.count()) > 0;
    expect(hasQuizOrHomework).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────
// 8. LOGOUT FLOW
// ─────────────────────────────────────────────────
test.describe("Logout", () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(users.student.email, users.student.password);
  });

  test("Logout redirects to login page", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.expectDashboardLoaded();
    await dash.logout();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
