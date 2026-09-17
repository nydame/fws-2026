---
title: "A Performance Audie and Overhaul for an Ed-tech Start-up"
client: "Magoosh"
summary: "Their homepage is the sales funnel for the entire business, but it was underperforming due to sluggish page loading. After I replaced their expensive optimization plugin with Cloudflare and standard best practices, the page loaded 4x as fast as before."
startDate: 2022-04-01
endDate: 2022-12-01
era: current
technologies:
  - Cloudflare (APO)
  - WebPageTest
  - WordPress
  - WP Engine
  - Google Cloud
featured: true
order: 1
draft: false
---
At the beginning of the project, Magoosh's Core Web Vitals statistics were disappointing, particularly on mobile. The homepage was the one page that had to load quickly, since it acted as the sales funnel. In addition, Google Analytics showed that the vast majority of users accessed the site via mobile phone. An LCP metric of roughly 8 seconds under mobile testing conditions was almost certainly hurting user experience and costing my client sales. A paid optimization service (*****Pack) did little to help. 

To understand what was going wrong, I stood up a sandboxed replica of the site on Google Cloud and ran dozens of experiments on WebPageTest, changing one variable at a time. My analysis showed that setting up a properly configured Cloudflare CDN with edge caching cut LCP all the way down to ~2.1 seconds. The winning configuration shipped to production, along with standard best practices for boosting performance such as deferred font-loading, replacing a costly plugin with a solution that was cheaper, more lightweight, and more user-friendly.
