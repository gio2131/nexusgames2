# games/

One folder per game, each with an `index.html` at its root:

```
games/
  demo/index.html          <- sample game, playable now
  2048/index.html
  snake/index.html
```

The folder name is the `id` you put in `assets/js/games-data.js`. Nothing here
is scanned automatically — a folder only shows up on the site once it has an
entry in that file.
