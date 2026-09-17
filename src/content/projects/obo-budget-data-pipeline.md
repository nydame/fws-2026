---
title: "Open Budget Oakland: budget data cleaning and standardization workflow"
client: "OpenOakland (volunteer, since 2015)"
summary: "Turning the City of Oakland's messy budget spreadsheets into a clean, queryable public database."
startDate: 2015-06-01
era: current
technologies:
  - CSV data wrangling
  - MySQL
  - WordPress
  - REST API
featured: false
order: 5
draft: true
---
The City of Oakland publishes its budget as raw CSV exports whose columns, formats, and even department names change from cycle to cycle, making the data nearly impossible for residents to use or compare. I built a repeatable standardization workflow that maps each new budget release into a consistent schema — including reconciling renamed departments across years — and loads it into a WordPress database through a DEV, TEST, LIVE promotion sequence with API checks at each step. Every visualization on openbudgetoakland.org runs on this standardized data, and the workflow has absorbed a decade's worth of the city's format changes since 2015.
