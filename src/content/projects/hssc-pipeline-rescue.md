---
title: "HSSC: emergency rebuild of the pet-data pipeline host"
client: "Humane Society of Sonoma County"
summary: "Diagnosing and rebuilding the failed server behind the shelter's live animal listings."
startDate: 2022-06-01
endDate: 2022-07-01
era: recent
technologies:
  - DigitalOcean
  - WordPress
  - DNS (Hover)
  - WP All Import
  - EasyCron
featured: false
order: 18
draft: true
---
The server generating the shelter's adoptable-animals feed became inaccessible (most likely a runaway log file filling the disk), which froze the website's pet listings — a direct hit to adoptions. I diagnosed the failure, evaluated replacement hosting, and rebuilt the feed-generating WordPress site on an inexpensive DigitalOcean droplet, repointing DNS before setup so the petget.link domain cut over cleanly, then restored the import jobs and cron schedule. The listings came back online at a fraction of the failed server's cost, with the domain cut over cleanly and the five-minute sync schedule restored.
