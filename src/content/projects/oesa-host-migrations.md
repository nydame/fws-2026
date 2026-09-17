---
title: "One Earth Sacred Arts: live e-commerce host migrations"
client: "One Earth Sacred Arts"
summary: "Moving a revenue-generating store between hosts repeatedly with minimal downtime."
startDate: 2020-01-01
endDate: 2021-06-01
era: current
technologies:
  - WP Engine
  - BlogVault
  - Cloudflare
  - DNS management
  - SFTP
featured: false
order: 16
draft: true
---
An online store can't afford downtime, yet OESA's hosting needs outgrew a series of providers — including Kinsta, which forced all sites through its own Cloudflare account and took away control of the CDN. I planned and executed the migrations (ultimately landing on WP Engine in 2021), using automated migration tooling, per-environment SFTP users, and Cloudflare-managed DNS with automated SSL issuance, sequencing each cutover so orders and email kept flowing. Each cutover landed without losing a sale, and the final move gave the business back control of its own CDN and DNS.
