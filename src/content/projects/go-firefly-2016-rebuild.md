---
title: "go-firefly.com: 2016 rebuild and HTTPS migration"
client: "Firefly Web Services (own business)"
summary: "Rebuilding my business's portfolio site on a flat-file CMS and moving it to HTTPS without losing search ranking."
startDate: 2016-02-01
endDate: 2016-08-01
era: earlier
technologies:
  - Pico CMS
  - DigitalOcean
  - Let's Encrypt
  - HTTPS/HSTS
  - Imgix
  - Cloudinary
  - vivus.js
  - Flexbox
featured: false
order: 20
draft: true
---
My web-services business needed a fast, low-maintenance portfolio site at a time when the web was shifting to HTTPS — a migration that, done carelessly, splits a site's search equity across four HTTP/HTTPS/www variants. I rebuilt go-firefly.com on a flat-file CMS, then executed a full HTTPS cutover: a Let's Encrypt certificate verified with Qualys SSL Labs, sitewide 301 redirects, canonical tags, and an HSTS header, with robots and indexing signals reconciled across every variant. The site kept its search equity through the cutover — no split signals across the four URL variants — while gaining modern image delivery, Flexbox layout, and critical CSS.
