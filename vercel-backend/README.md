# Football League Tracker Backend

Tiny Vercel backend for the Football League Tracker frontend.

## What it does

- proxies requests to `football-data.org`
- stores shared snapshots in Vercel Blob
- serves cached data to all users for up to 1 hour
- falls back to the last stored snapshot if the live upstream request fails

## Environment variables

- `FOOTBALL_DATA_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `ALLOWED_ORIGINS`

Example `ALLOWED_ORIGINS`:

```text
https://football-league-tracker.vercel.app,http://127.0.0.1:4175
```

## API route

```text
/api/football-data?path=v4/competitions/PL/standings
```

## Deploy

1. Create a new Vercel project from this folder or a separate repo.
2. Add the environment variables.
3. Connect a Blob store.
4. Deploy.
