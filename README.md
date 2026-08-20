# Arcade

A clean, static front end for a browser-games site. Plain HTML, CSS and
JavaScript — no build step, no framework, no dependencies. Drop it in a repo,
turn on Pages, done.

```
index.html          home
games.html          the library: search + category filter
play.html           the player (play.html?id=slug)
about.html          short explainer
404.html            self-contained, works at any depth
assets/css/         one stylesheet
assets/js/          games-data.js (the list) + page scripts
games/              one folder per game
```

## Run it locally

Open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

A server is closer to production — the player checks that a game's files exist
before loading the frame, and that check only runs over http/https.

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

Then **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
It goes live at `https://YOUR-USER.github.io/YOUR-REPO/` in a minute or two.

`.nojekyll` is already in the repo so Pages serves every file as-is, including
folders that start with an underscore — some game exports use those.

Works the same on Netlify, Vercel or Cloudflare Pages: no build command, publish
directory is the repo root.

## Adding a game

1. Put the build in `games/your-slug/` with an `index.html` at its root.
2. Add an entry to `assets/js/games-data.js`:

```js
{
  id: "your-slug",
  title: "Your Game",
  category: "Puzzle",
  url: "games/your-slug/index.html",
  thumb: "assets/img/your-slug.png"   // optional
}
```

That's the whole workflow. Category chips are built from whatever `category`
values exist, so a new category needs no other change. Without a `thumb`, the
card draws a lettered tile instead — the grid never shows a broken image.

`url` also takes a full `https://` URL if you'd rather point at a game hosted
somewhere else, though some hosts refuse to be framed.

The entries shipped in `games-data.js` are placeholders apart from
`games/demo/` — a small Block Breaker so the player page works on first load.
Empty slots show a "drop the files here" message rather than a broken frame.

## Customising

- **Name and logo** — search for `Arcade` in the four HTML files, and the `A` in
  `<span class="mark">`.
- **Colours** — the `:root` block at the top of `assets/css/style.css`. Dark
  values live in the two blocks right under it.
- **Theme** — follows the OS by default; the toggle in the header overrides it
  and remembers the choice.
