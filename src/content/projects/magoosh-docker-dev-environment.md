---
title: "Magoosh: faithful local development environment in Docker"
client: "Magoosh"
summary: "A reproducible local copy of a production WordPress multisite, so development stopped happening against live infrastructure."
startDate: 2022-01-01
endDate: 2022-04-01
era: recent
technologies:
  - Docker Compose
  - WordPress multisite
  - MySQL
  - WP Migrate DB Pro
  - WP-CLI
  - phpMyAdmin
featured: false
order: 9
draft: true
---
Developing safely for Magoosh's production multisite required a local environment that faithfully mirrored it, which didn't exist. I built a Docker Compose stack configured for multisite, pulled the production database down with WP Migrate DB Pro, and set up rewrite rules so media requests fall back to production — giving a complete working replica at magoosh.com.local without copying gigabytes of uploads. Development stopped happening against live infrastructure, and the replica became the foundation for the theme, testing, and migration work that followed.
