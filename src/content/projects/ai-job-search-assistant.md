---
title: "An AI Job Search Assistant That Writes Grounded, Insightful Resumes"
client: "Personal project (2026)"
summary: "Claude uses my custom skills to curate a career wiki and draft job application materials grounded in that knowledgebase."
startDate: 2026-07-01
era: current
technologies:
  - Claude Cowork
  - Custom agent skills
  - Obsidian
  - Markdown
  - Google Sheets
  - MBOX file converison
featured: true
order: 6
draft: false
---
AI-drafted resumes have a couple of problems: 1) shallow understanding of one's experience and body of work; and 2) generic "AI style". The second issue is readily addressed by re-writing the AI output in one's own voice, but the first is much more challenging. Simply shoveling in more data won't magically improve comprehension. Rather, the information architecture of what is fed into the large language model (LLM) must be done right. 
I found myself facing this exact dilemma mid-2026. I first built a knowledgebase for retrieval-augmented generation (RAG) from personal notes, emails, and other documents by tokenizing them and embedding those into a vector database. The results, however, were disappointing: queries requiring anything more than a direct recollection of facts were not answered correctly. 
The answer turned out to be exquisitely simple. Borrowing from [Karpathy's "wiki-as-GraphRAG" design](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), I used Claude Cowork to build a wiki that ingests my raw documents to create cross-linked, indexed wiki pages. Wiki curation, indexing, and auditing are now handled by a set of reusable Claude skills. An independent Job Search agent queries this wiki to draft resumes and cover letters that are well-grounded in documented experience, verifies current hiring-market practices via web search, and logs every application to a spreadsheet tracker automatically. The result is tailored, verifiable application materials produced in minutes — with a firm guarantee that nothing on the page is invented. 
