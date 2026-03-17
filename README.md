# Football League Tracker

Football League Tracker is a multi-league football dashboard built as a product-style frontend experience for tracking club performance, live context, and league-wide insights.

It is designed to help a fan pick a club and instantly understand:

- where the club stands in the table
- current points, goals, and clean sheets
- recent form and momentum
- upcoming matches and recent results
- league-wide top scorers
- clubs with the most goals
- clubs with the most clean sheets
- recent league winners

## What The Product Does

The app provides a live football analysis experience across multiple competitions:

- Premier League
- LaLiga
- Serie A
- Bundesliga
- Champions League

For league competitions, the dashboard includes:

- live league table
- top 4 title-race comparison
- club summary metrics
- current top scorers
- most goals leaderboard
- most clean sheets leaderboard
- last 3 league winners
- recent match analysis
- upcoming fixture analysis

For the selected club, the app shows:

- manager
- stadium
- current rank
- points
- goals scored
- average goals per game
- average goals conceded
- clean sheets
- form guide
- form momentum
- form analysis charts
- last match result
- next upcoming match
- YouTube highlights search link for the last match

## Product Highlights

- Built with a modern dashboard-style UI
- Uses live competition and club data
- Supports multiple domestic leagues plus Champions League
- Includes visual analysis such as:
  - points trend
  - goals scored vs conceded trend
  - scoring consistency
  - win/draw/loss distribution
  - home and away form
- Designed as a portfolio-ready football product rather than a simple stats page

## Tech Stack

- JavaScript
- React
- JSX
- Tailwind CSS
- Vite

## API Integration

The app uses [football-data.org](https://www.football-data.org/documentation/api) for live data.

Current API-powered features include:

- competition standings
- club fixtures and results
- team details
- top scorers by competition

The app uses a local proxy during development so the API key is not exposed directly in frontend requests.

## Local Setup

1. Install dependencies

```powershell
npm.cmd install
```

2. Create a local environment file

```powershell
FOOTBALL_DATA_API_KEY=your_football_data_api_key_here
```

Save that in:

```powershell
.env.local
```

3. Start the development server

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

4. Open:

[http://127.0.0.1:4173](http://127.0.0.1:4173)

## Auto Push Workflow

If you want local changes in this project to auto-commit and auto-push to GitHub, run:

```powershell
npm.cmd run auto-push
```

What it does:

- watches this repo for file changes
- waits briefly for edits to settle
- runs `git add -A`
- creates an automatic commit
- pushes to `origin/main`
- logs each automatic push to `push-log.csv`

Use this carefully. It is best for solo development because it will also push work-in-progress changes.

The push log is Excel-friendly, so you can open [push-log.csv](C:/Users/omkes/Downloads/Leauge%20football%20details/push-log.csv) in Excel and track:

- date
- time
- branch
- commit hash
- commit message

## Project Structure

- `src/App.jsx` contains the main application UI and dashboard logic
- `src/lib/footballApi.js` contains the live football API helpers
- `src/data/teams.js` contains local club metadata used to enrich the UI
- `src/index.css` contains global styles and visual design rules
- `vite.config.js` contains the Vite setup and development proxy

## Notes

- `.env.local` is ignored by git and should not be committed
- some historical winners are currently maintained manually in the frontend
- production deployment will need a production-safe proxy or backend for the football API

## Future Improvements

- production deployment with serverless API proxy
- historical season support
- more advanced player-level analytics
- injury and assist data through additional APIs
- mobile-specific UI refinement

## Repository Goal

This repository is intended to present Football League Tracker as a polished football analytics product concept, suitable for portfolio, product showcase, and continued feature expansion.
