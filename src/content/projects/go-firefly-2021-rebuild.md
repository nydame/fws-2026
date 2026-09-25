---
title: "go-firefly.com: 2021 Eleventy rebuild on Netlify"
client: "Firefly Web Services (own business)"
summary: "Modernizing my business site as a design-token-driven static site with audited performance."
startDate: 2020-03-01
endDate: 2021-06-01
era: recent
technologies:
  - Eleventy
  - Nunjucks
  - Sass
  - Node.js
  - Netlify
  - Lighthouse
featured: false
order: 19
draft: true
---
By 2021 the portfolio site needed a stack that matched what I recommend to clients: fast, secure, cheap to run, and easy to iterate on. I rebuilt it as an Eleventy static site — forking the Hylia theme into firefly-11ty, with design tokens compiled from JSON into Sass — and deployed it to Netlify with continuous builds from the git repository, using baseline Lighthouse audits to drive fixes like compression, font-display, WebP images, and cache lifetimes. The site now builds and deploys itself on every push, scores well on the same audits I run for clients, and costs almost nothing to operate.
