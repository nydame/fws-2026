---
title: "Migration to PHP 8 for a Legacy WordPress Multisite"
client: "Magoosh"
summary: "A test-prep company's massive WordPress multisite gets an upgrade from end-of-life PHP to PHP 8 with zero downtime."
startDate: 2022-12-01
endDate: 2023-03-01
era: current
technologies:
  - PHP 8
  - WordPress multisite
  - Docker
  - Playwright
  - Git
  - WP Engine
  - Query Monitor
featured: false
order: 2
draft: false
---
My client's massive WordPress multi-site was running on an end-of-life PHP version. Upgrading had been long-delayed because it's risky: PHP 8 turns once-silent bugs in older plugins and themes into fatal errors that instantly take down even the most robust sites. To mitigate the risk of the migration, I audited the theme and dozens of plugins; all software found to be incompatible with modern PHP was painstakingly replaced on a copy of the site created in a Docker container and later on a live staging site. A suite of end-to-end tests were run before and after every change with Playwright JS. Finally, when all tests for all blogs passed, the migration shipped through git-based deployment with zero downtime.
