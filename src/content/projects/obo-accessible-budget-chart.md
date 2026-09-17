---
title: "Open Budget Oakland: accessible D3.js budget visualization"
client: "OpenOakland (volunteer, since 2015)"
summary: "An interactive budget bar chart built to be readable by everyone, including screen-reader users."
startDate: 2018-01-01
endDate: 2018-06-01
era: earlier
technologies:
  - D3.js
  - SVG
  - ARIA
featured: false
order: 11
draft: true
---
A public budget site fails at its mission if the visualizations exclude residents who use screen readers — and most SVG charts do exactly that. I built the site's department-by-department budget bar chart in D3.js following an accessible-SVG pattern, structuring the markup and ARIA roles so the chart's data is announced meaningfully by assistive technology rather than rendered as a silent graphic. The chart makes Oakland's department-level spending legible to residents using assistive technology — a group most budget visualizations quietly leave out.
