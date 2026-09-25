---
title: "Magoosh: automated end-to-end test suite"
client: "Magoosh"
summary: "A Playwright browser-testing suite that catches site breakage before customers do."
startDate: 2022-10-01
endDate: 2023-01-01
era: recent
technologies:
  - Playwright
  - TypeScript
  - GitHub Actions
featured: false
order: 3
draft: true
---
Parts of Magoosh's site had broken silently in the past — a blog's podcast player failed for weeks after a hosting account quietly expired — because a site that large can't be verified by hand after every change. I evaluated the major testing frameworks, chose Playwright for its cross-browser support, and converted the team's manual QA checklist into an automated suite covering desktop and mobile Chrome, Firefox, and WebKit, running in CI on every push. The suite surfaced real bugs immediately and became the safety net that made the PHP 8 migration and block-theme rollout safe to ship.
