# Nexus Games

A clean, dark static front end for a curated browser-game catalog. The repository currently ships with an empty catalog, ready for a new lineup.

## Structure

- `index.html` — continue-playing and featured-game screen
- `games.html` — searchable game catalog
- `play.html` — in-browser game player
- `assets/css/style.css` — the complete visual system
- `assets/js/games-data.js` — the game catalogue
- `games/` — one folder per future game

## Add a game

1. Put the build in `games/your-slug/` with an `index.html` at its root.
2. Add an item to `assets/js/games-data.js`:

```js
{
  id: "your-slug",
  title: "Your Game",
  category: "Puzzle",
  url: "games/your-slug/index.html",
  thumb: "assets/img/your-slug.jpg",
  featured: true
}
```

The thumbnail and `featured` flag are optional. The home page, filters, game count and player update automatically.

## Preview

Serve the repository root with any static web server, then open `index.html`. There is no build step and no framework.

