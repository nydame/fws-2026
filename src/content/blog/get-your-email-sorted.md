---
title: "Getting My Email Sorted"
description: "Even with AI helpers, it takes time to save time."
pubDate: 2026-09-18
draft: false
---

## The Problem

I don't know how other people deal with this, but the fact that I had 100+ emails piling up each day was fueling out-of-control, immobilizing anxiety. And for good reason: every week there would be at least one essential email that I needed to act on, but missed. At some point, I got tired of apologizing to people, e.g., "Oh, gee, I have no idea how I missed your email. It just got by me somehow." 

<strong>I was tired of making lame excuses, and guess what? Other people were tired of hearing them.</strong>

(A bit of advice: when coworkers, friends, clients, etc. begin to doubt you, they often won't tell you. Instead, they assume you are incorrigible and quietly start backing away. From your perspective, it may seem like ghosting, but from their point of vew it's totally justified self-preservation. )

But I digress. The point is, my situation was unsustainable and the way forward was clear: I had to get my email sorted.

## The Dream

Don't get me wrong: tidying up my email is not going to be my life's opus magnum. The true objective, the reason I get up in the morning, is to live my life more authentically. That's probably true for you, too. Living authentically means doing what is in alignment with core values as much of the time as possible. That is always the goal; it's very simple, and also very difficult. 

Here's an example. I want to live in a clean house, but having an Architectural Digest-worthy home is not actually a core value of mine. I just want to be able to find stuff quickly and not trip over things. Cleaning the house happens to be the best way to achieve this. 

Likewise, having a pristine email inbox is not a core value of mine. Rather, I recognize that it will foster the peace of mind that comes from knowing what I need to do and what I do not need to worry about. 

**Peace of mind is very much a core value for me.** 

So, yeah, simple, but easier said than done.

## The Strategy: Divide and Conquer with Labels

Since I have always used labels in Gmail to make sense of my email, I decided to double down on that. My strategy is to identify messages that belong in just 4 categories: finance, job search, newsletters, and time-sensitive. The last group would be starred, and the others would get appropriate labels. In a sense, those threads that are un-labeled and un-starred form a group in themselves, almost all destined for the trash, so that's a total of 5 groups to deal with one at a time. 

Within each group, I focus on 20 - 30 emails, on average, and decide on the spot whether they should be deleted; saved to the archive without a response; or, rarest of all, responded to and then archived. 

(In computer science, some sorting algorithms work by dividing a large number of items into groups, each of which can then be exponentially more quickly sorted. This strategy is based on the same principle.)

In effect, my inbox is like expensive real estate -- think "small, downtown office" -- that can only fit what I need right now, whereas the archive is like a cheap, sprawling property in the country where I can store everything else in labeled heaps. 

## The Tactics: Automated Email Labeling with Claude Cowork + Human in the Loop

At first I was tempted to just sign up for [SuperHuman](https://superhuman.com/products/mail/control-your-inbox). It's probably a pretty good service, otherwise so many people wouldn't be using it, right? However, my can-do spirit and pride, as well as being cheap AF, got the best of me. After all, I thought, shouldn't I be able to work this out myself with all these new AI tools?

With the announcement of [scheduled tasks for Claude Cowork](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork), I realized I had a great way to implement my strategy. I would automate the labeling part, but I would step in to perform the deletions myself. For acccurate, trustworthy labeling, I created a skill for each category.

Even though "deleted" email threads are actually kept for 30 days, I am not comfortable giving an AI agent permission to delete any email messages. Neither do I want its help in writing email responses, as I have always found them easy and fun to compose. Not everyone shares my outlook, of course, so feel free to step out of the loop and (perhaps) save yourself even more time.

## Example: A Skill for Labeling Newsletters

Instead of providing detailed, step-by-step instructions, I'll mostly just describe a bit of what I did and leave it to you to partner with your favorite AI tool to take action. User interfaces change so quickly that detailed guides are often worthless within a few months anyway.

Using Claude Cowork's built-in connection to Gmail, I asked Claude to build a skill for labeling newsletters, being sure to give it some examples of web domains that send me newsletters. The text of that SKILL.md file can be found  [in my GitHub account](https://gist.github.com/nydame/eefaf2cbb89c41260795d5e324af4d06).

Likewise, I built and tested skills for labeling job listings and messages from financial institutions, and for starring time-sensitive messages. I was careful to check outputs for accuracy and usefulness. Once these skills seemed to be working well, I was finally ready to create a scheduled task that calls upon them to sort my email everyday at the same time.

## The Results

At the risk of sounding like an uncritical rube, I must admit that the results are spectacular. After using this system for about two months, I can honestly say that I have not missed a single important email. In general, I am up-to-date on what's in my inbox, something I've never been able to achieve before. I'll go even further: it's life-changing to have more peace of mind and more hours in the week to spend as I choose.

## Last Word

If you remember nothing else, put a pin in this: 

**Before off-loading work to agentic AI, take the time to understand your own workflow so that you can break up your routines into meaningful chunks of focused activity.**

Build skills  based on those tasks. Only then build agents to deploy those skills for you.



