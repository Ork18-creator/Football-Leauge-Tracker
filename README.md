# Premier League Club Explorer

This project now uses the stack:

- JavaScript
- React
- JSX
- Tailwind CSS
- Vite

## Run locally

1. Install dependencies:

```powershell
npm.cmd install
```

2. Start the development server:

```powershell
npm.cmd run dev
```

3. Open the local URL Vite prints in the terminal.

## Live Premier League data

To show the current Premier League standing, last 5 matches, and next 5
matches for the selected club, create a `.env.local` file in the project root:

```powershell
FOOTBALL_DATA_API_KEY=your_football_data_api_key_here
```

This app is wired for [football-data.org](https://www.football-data.org/documentation/api),
which documents Premier League standings via the competition standings resource
and team match lists via the team matches resource.

The token is sent through the Vite dev server proxy, which avoids common
browser-side CORS issues and keeps the API key out of frontend requests.

## Project structure

- `src/App.jsx` contains the main interface.
- `src/data/teams.js` contains the team data.
- `src/index.css` loads Tailwind and app-wide styles.
- `src/main.jsx` mounts the React app.

