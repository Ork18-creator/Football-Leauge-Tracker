# Product Requirements Document

## Product Name

Football League Tracker

## Product Summary

Football League Tracker is a multi-competition football dashboard that helps users explore league tables, club performance, live context, recent form, and key competition insights in a polished, product-style interface.

The product is designed for football fans who want a visually strong, easy-to-scan dashboard for understanding how a club is performing across domestic leagues and European competition.

## Problem Statement

Football fans often need to switch between multiple sites to understand:

- league position
- recent form
- upcoming fixtures
- scorer leaderboards
- defensive records
- European progression

Most football products either focus only on raw scores or only on betting-style data. This product aims to provide a clean club-and-league tracking experience that combines standings, insights, and visual analysis in one place.

## Goals

- Provide a polished football dashboard that feels like a real product, not a simple stats page
- Let a user select a club and quickly understand its current status
- Support multiple major competitions in one interface
- Present live and recent football context in a visual, readable layout
- Be suitable for portfolio presentation and public deployment

## Non-Goals

- Live event timelines such as goal scorers and goal minutes
- Betting integration or bookmaker odds feeds
- Full historical season archive browsing
- Player-level advanced data such as assists, injuries, or xG
- Account system, personalization, or social features

## Target Users

### Primary Users

- football fans tracking their club
- casual users comparing top clubs in major leagues
- recruiters or portfolio reviewers viewing the product as a frontend project

### Secondary Users

- users exploring league-wide leaderboards
- users monitoring Champions League progression for qualifying clubs

## Core User Stories

- As a fan, I want to select my club and instantly see its current table position and key stats.
- As a fan, I want to see the club’s recent matches and next upcoming fixture.
- As a fan, I want to understand current form using charts and simple insights.
- As a fan, I want to see top scorers, most goals, and most clean sheets in a league.
- As a fan, I want to know whether a club is still active in the Champions League.
- As a user, I want a dashboard that looks polished on desktop and mobile.

## Supported Competitions

- Premier League
- LaLiga
- Serie A
- Bundesliga
- Champions League

## Functional Requirements

### 1. Competition Navigation

The product must allow switching between supported competitions from the header navigation.

Requirements:

- show all supported competitions in top navigation
- visually highlight the active competition
- update all downstream sections when the competition changes

### 2. Club Selection

The product must allow users to choose a club within the active competition.

Requirements:

- show a club selector in the hero/control area
- populate selector options based on the active competition
- use a dropdown interaction
- for Champions League, only show clubs still active in the current tournament stage

### 3. League Table

For domestic league competitions, the product must show a left-side league table.

Requirements:

- show `Pos`, `Club`, `MP`, and `Pts`
- allow clicking a row to switch the selected club
- highlight the selected club
- highlight the top team as `Leader`
- show `CL` beside teams still active in the Champions League

### 4. Club Summary

The product must show a club summary card for the selected team.

Requirements:

- club crest and club name
- manager
- stadium
- current rank
- points
- goals scored
- clean sheets
- average goals per game
- average goals conceded

### 5. Form Guide

The product must show a compact form guide panel.

Requirements:

- played matches
- goal difference
- form momentum
- last 5 result chips
- current Champions League round when applicable

### 6. Live Match Context

The product must show current live-match context when available.

Requirements:

- show live match card for the selected club when a match is in progress
- show current score
- show live match time
- fall back gracefully when there is no live match

### 7. Upcoming Match

The product must show the next upcoming match for the selected club.

Requirements:

- show one primary upcoming match card
- show opponent, home/away, kickoff time, venue, and outcome probability model
- if the upcoming match is live, title should switch to `Currently Live`

### 8. Upcoming Cup & European Competitions

The product must show additional upcoming competition fixtures relevant to the selected club.

Requirements:

- show upcoming FA Cup and EFL Cup fixtures when available
- show upcoming Champions League fixtures for clubs still active in Europe
- support manual fallback fixtures where the API plan does not expose domestic cup data
- show competition name and round on each card

### 9. Last Match Result

The product must show the latest completed match for the selected club.

Requirements:

- show opponent, score, result, and kickoff time
- include a YouTube highlights search link

### 10. Form Analysis

The product must show chart-based form analysis for the selected club.

Requirements:

- points trend over last 5 matches
- win / draw / loss distribution
- goals scored vs conceded trend
- scoring consistency
- home form
- away form
- 5-win streak count
- clean sheet rate

### 11. League Insight Panels

The product must show supporting left-side insight cards.

Requirements:

- top 4 comparison chart
- current top scorers
- most goals
- most clean sheets
- last 3 winners for supported domestic leagues

## Data Requirements

### Primary Source

- `football-data.org`

Used for:

- standings
- team fixtures
- competition match feeds
- team details
- scorers

### Fallback Data

Manual fallback data is currently required for some domestic cup fixtures because API coverage may not expose `FAC` and `FLC` consistently on the active plan.

## Error Handling Requirements

- errors must be scoped per competition or per team, not shared globally
- if cached data exists, prefer stale cached data over a full empty-state failure
- show user-friendly fallback text instead of raw API errors
- first-load state should not show the wrong competition’s error content

## Performance Requirements

- avoid duplicate API calls for the same resource
- reuse competition-wide match feeds where possible
- cache responses locally in the browser
- reduce upstream rate-limit pressure in deployed environments
- use Netlify function caching in production

## Design Requirements

- dark, premium football-dashboard aesthetic
- product-style card system with consistent spacing and borders
- clear visual hierarchy between sidebar, summary, and detail sections
- responsive layout for desktop, laptop, tablet, and mobile
- polished typography suitable for portfolio presentation

## Technical Requirements

### Frontend

- React
- JSX
- Tailwind CSS
- Vite

### Deployment

- Netlify
- Netlify function proxy for `football-data.org`

### Repository

- GitHub-hosted
- README should support portfolio presentation with screenshots

## Known Limitations

- domestic cup data is not fully dynamic on the current API plan
- player event data such as scorer names and goal timestamps is unavailable from the current live API
- some recent winners are maintained manually
- some public-source fallback fixtures are manually maintained

## Future Opportunities

- add a stronger dynamic source for domestic cup fixtures
- support richer live event data
- add season history / historical tables
- add player-level advanced stats
- improve deployment reliability further with stronger backend caching

## Success Criteria

The product is successful if:

- a user can select a club and understand its status within seconds
- the interface feels polished enough for portfolio/demo presentation
- major league and club insights are visible without extra navigation
- deployed usage is resilient enough to avoid frequent rate-limit failures

## Current Status

The product is already implemented as a functioning dashboard and deployed flow, with continued improvements focused on:

- reliability
- polish
- data coverage
- portfolio presentation
