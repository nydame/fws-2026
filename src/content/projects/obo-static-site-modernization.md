---
title: "Open Budget Oakland: Static-Site Migration and Automated Deployment"
client: "OpenOakland (volunteer, since 2015)"
summary: "Modernizing a site that volunteers were afraid to touch led to more features shipping faster."
startDate: 2021-06-03
endDate: 2021-11-02
era: current
technologies:
  - React.js
  - D3.js
  - Eleventy
  - Pug
  - Node.js
  - GitHub Actions
  - GitHub Pages
featured: false
order: 10
draft: false
---
The Open Budget Oakland website was built on Harp, a static-site generator that was intimidating to non-technical staff and, even worse, had been abandoned by its developer. The all-volunteer project was left stranded on an obsolete codebase, and their manual deployment procedure did nothing to help the situation. My first move was to migrate the site to a well-maintained front-end stack: Eleventy with Pug templates. Then I set up GitHub Actions to automate the whole release process with a CI/CD workflow. As a result, volunteers were free to focus on content creation and feature addition, which is, of course, exactly what they signed up for.
