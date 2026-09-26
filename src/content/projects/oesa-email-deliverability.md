---
title: "One Earth Sacred Arts: transactional email deliverability"
client: "One Earth Sacred Arts"
summary: "Making sure a store's order and contact-form email actually reaches inboxes."
startDate: 2021-07-01
endDate: 2021-09-01
era: recent
technologies:
  - WordPress
  - Post SMTP
  - Gmail API
  - Google Workspace
  - SPF/DKIM/DMARC
  - DNS
featured: false
order: 17
draft: true
---
After OESA's move to WP Engine, contact-form and store email silently stopped arriving — a common WordPress failure, since mail sent directly from a web host is routinely treated as spam. I rerouted all site mail through authenticated SMTP via the Gmail API under the business's Google Workspace account, then set up the SPF, DKIM, and DMARC anti-spoofing DNS records, splitting them across two DNS providers when one couldn't hold the long DKIM key. Order and contact-form email now arrives reliably and verifiably, with authentication records that also protect the domain against spoofing.
