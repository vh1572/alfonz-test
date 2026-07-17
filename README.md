# Board Game Collection Catalog

A private Node.js website for cataloging a board game collection. It stores games in a local JSON file and can enrich each game with internet search results for current prices, awards won, and official rules.

## Features

- Add title, publisher, year, player count, play time, condition, storage location, and notes.
- Browse, filter, and delete games from a responsive web interface.
- Collect internet data per game for prices, awards, and rules using DuckDuckGo HTML search.
- Persist collection data locally in `data/games.json`.

## Getting started

```bash
npm install
npm start
```

Open <http://localhost:3000> and start adding games.

## Testing

```bash
npm test
```

## Notes

Internet enrichment depends on public search result pages and should be treated as a starting point for manual verification before buying, selling, or relying on rule documents.
