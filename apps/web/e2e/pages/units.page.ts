import { type Page, type Locator, expect } from "@playwright/test";

export class UnitsPage {
  readonly page: Page;
  readonly unitCards: Locator;
  readonly unitTitle: Locator;
  readonly lessonList: Locator;
  readonly lessonCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.unitCards = page.locator('[role="button"]').filter({ has: page.locator("h3") });
    this.unitTitle = page.locator("h1, h2").first();
    this.lessonList = page.locator("main").first();
    this.lessonCards = page.locator("main [role='button']");
  }

  async expectUnitsLoaded(): Promise<void> {
    await expect(this.unitCards.first()).toBeVisible({ timeout: 10000 });
  }

  async clickFirstUnit(): Promise<void> {
    await this.unitCards.first().click();
    await this.page.waitForURL(/\/dashboard\/units\//, { timeout: 10000 });
  }

  async expectLessonsVisible(): Promise<void> {
    await expect(this.page.locator("h1, h2").first()).toBeVisible({ timeout: 5000 });
  }

  async clickFirstLesson(): Promise<void> {
    const link = this.page.locator('a[href*="/dashboard/lessons/"]').first();
    await link.click();
    await this.page.waitForURL(/\/dashboard\/lessons\//, { timeout: 10000 });
  }
}
