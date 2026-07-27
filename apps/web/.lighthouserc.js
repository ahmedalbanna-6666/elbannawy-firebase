/**
 * Lighthouse CI Configuration
 *
 * Usage:
 *   1. Install:           pnpm add -D @lhci/cli --filter @el-bannawy/web
 *   2. Build:             cd apps/web && next build
 *   3. Start server:      cd apps/web && next start -p 3000
 *   4. Run audit:         cd apps/web && npx lhci autorun
 *
 * Generates: .lighthouseci/ directory with HTML reports
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "next start -p 3000",
      url: [
        "http://localhost:3000/dashboard",
        "http://localhost:3000/dashboard/units",
        "http://localhost:3000/dashboard/ai",
        "http://localhost:3000/dashboard/profile",
        "http://localhost:3000/dashboard/reports",
        "http://localhost:3000/dashboard/mistakes",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        "interactive": ["warn", { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
