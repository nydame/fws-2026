---
title: "Open Budget Oakland: public budget REST API"
client: "OpenOakland (volunteer, since 2015)"
summary: "A custom WordPress REST API that serves Oakland budget data to the site's React comparison tool."
startDate: 2019-06-01
era: recent
technologies:
  - PHP
  - WordPress REST API
  - MySQL
  - Docker Compose
  - React
  - Webpack
featured: false
order: 8
draft: true
---
Open Budget Oakland's interactive Compare tool — a React application letting residents compare city budgets across years — needed a reliable public data source rather than static files. I built and maintain the OBO Custom Routes WordPress plugin, a REST API exposing custom endpoints over the standardized budget table, and packaged it with a Docker Compose stack so other contributors can develop against it locally. The API now serves every budget comparison residents run on the site, and the project README directs anyone needing backend access to me by name.
