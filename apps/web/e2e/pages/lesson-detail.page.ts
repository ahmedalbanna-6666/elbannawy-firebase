import { type Page, type Locator, expect } from "@playwright/test";

export class LessonDetailPage {
  readonly page: Page;
  readonly lessonTitle: Locator;
  readonly learningCards: Locator;
  readonly quizCard: Locator;
  readonly homeworkCard: Locator;
  readonly vocabularyCard: Locator;
  readonly pdfCard: Locator;
  readonly videoPlayer: Locator;
  readonly breadcrumb: Locator;
  readonly navButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.lessonTitle = page.locator("h1").first();
    this.learningCards = page.locator("section.grid a, section.grid [role='button']");
    this.quizCard = page.getByText("Quiz").or(page.getByText("الاختبار"));
    this.homeworkCard = page.getByText("Homework").or(page.getByText("الواجب"));
    this.vocabularyCard = page.getByText("Vocabulary").or(page.getByText("المفردات"));
    this.pdfCard = page.getByText("PDF").or(page.getByText("ملف"));
    this.videoPlayer = page.locator(".plyr, iframe[src*='youtube'], video");
    this.breadcrumb = page.locator('[aria-label="Breadcrumb"]');
    this.navButtons = page.locator("nav a, nav button");
  }

  async expectLessonLoaded(): Promise<void> {
    await expect(this.lessonTitle).toBeVisible({ timeout: 10000 });
  }

  async expectLearningCardsVisible(): Promise<void> {
    await expect(this.learningCards.first()).toBeVisible({ timeout: 5000 });
  }

  async expectVideoPlayerVisible(): Promise<void> {
    if (await this.videoPlayer.isVisible()) {
      await expect(this.videoPlayer).toBeVisible({ timeout: 5000 });
    }
  }

  async clickVocabularyCard(): Promise<void> {
    await this.vocabularyCard.first().click();
    await this.page.waitForURL(/\/vocabulary/, { timeout: 10000 });
  }

  async clickQuizCard(): Promise<void> {
    await this.quizCard.first().click();
    await this.page.waitForURL(/\/quiz/, { timeout: 10000 });
  }

  async clickHomeworkCard(): Promise<void> {
    await this.homeworkCard.first().click();
    await this.page.waitForURL(/\/homework/, { timeout: 10000 });
  }
}
