import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly sidebar: Locator;
  readonly bottomNav: Locator;
  readonly mainContent: Locator;
  readonly continueLearning: Locator;
  readonly unitsLink: Locator;
  readonly aiLink: Locator;
  readonly storyLink: Locator;
  readonly liveLink: Locator;
  readonly gamesLink: Locator;
  readonly logoutButton: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("header");
    this.sidebar = page.locator('[aria-label="القائمة الجانبية"]');
    this.bottomNav = page.locator('[aria-label="التنقل السفلي"]');
    this.mainContent = page.locator("main#main-content");
    this.continueLearning = page.getByText("واصل التعلم");
    this.unitsLink = page.getByText("الوحدات التعليمية");
    this.aiLink = page.getByText("اسأل البنا AI");
    this.storyLink = page.getByText("قصة المنهج");
    this.liveLink = page.getByText("حصه مباشر");
    this.gamesLink = page.getByText("الألعاب التعليمية");
    this.logoutButton = page.getByText("تسجيل الخروج");
    this.notificationBell = page.locator('[aria-label="Notifications"]');
  }

  async expectDashboardLoaded(): Promise<void> {
    await expect(this.mainContent).toBeVisible({ timeout: 10000 });
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  async expectBottomNavVisible(): Promise<void> {
    await expect(this.bottomNav).toBeVisible();
  }

  async expectBottomNavHidden(): Promise<void> {
    await expect(this.bottomNav).not.toBeVisible();
  }

  async navigateToUnits(): Promise<void> {
    await this.unitsLink.first().click();
    await this.page.waitForURL(/\/dashboard\/units/, { timeout: 10000 });
  }

  async navigateToAI(): Promise<void> {
    await this.aiLink.first().click();
    await this.page.waitForURL(/\/dashboard\/ai/, { timeout: 10000 });
  }

  async navigateToStory(): Promise<void> {
    await this.storyLink.first().click();
    await this.page.waitForURL(/\/dashboard\/story/, { timeout: 10000 });
  }

  async navigateToLive(): Promise<void> {
    await this.liveLink.first().click();
    await this.page.waitForURL(/\/dashboard\/live/, { timeout: 10000 });
  }

  async openSidebar(): Promise<void> {
    const menuButton = this.header.locator('[aria-label="Toggle menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async logout(): Promise<void> {
    await this.openSidebar();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/, { timeout: 10000 });
  }
}
