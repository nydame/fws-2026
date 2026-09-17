---
title: "A Customized Data Pipeline for a Price-Sensitive Non-Profit"
client: "Humane Society of Sonoma County"
summary: "A robust but inexpensive data pipeline keeps an animal shelter's website in sync with its third-party CRM, saving staff from duplicate manual data entry."
startDate: 2020-01-01
endDate: 2021-06-01
era: current
technologies:
  - AWS LightSail
  - Digital Ocean
  - WordPress
  - PHP
  - ShelterBuddy REST API
  - ACF Pro
  - FacetWP
  - WP All Import
  - EasyCron
featured: true
order: 4
draft: false
---
The Humane Society of Sonoma County needs its website to show up-to-the-minute information about the pets in its care. When they approached me, staff were forced to enter information about each pet admitted into their system twice: once for their third-party shelter management software (ShelterBuddy) and then a second time for their own website. The fragility of this system was obvious to everyone: animals were constantly being admitted and adopted, but synchronization of the two data sets was slow and error-prone, in addition to wasting hours of valuable time.

To address this dilemma, I built a scheduled pipeline: a custom plugin on a proxy server polls<sup>*</sup> the ShelterBuddy API roughly every five minutes and packages data to be displayed on the website into a JSON file. A cron job on the client's web server imports the JSON file and loads it into the database so that updated information can be displayed on the website. This low-cost solution has kept the shelter's listings accurate for several years with no manual data entry and little down time. Staff were especially appreciative of the maintenance guide PDF I prepared for them and UX touches such as a "new" badge for recently listed animals.

<sup>*</sup>ShelterBuddy didn't have webhooks until mid-2024
