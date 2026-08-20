/* ---------------------------------------------------------------
   The game list. This is the only file you edit to add a game.

   id       - unique slug, used in the URL: play.html?id=snake
   title    - display name
   category - free text; the filter chips are built from these
   url      - path (or full https:// URL) that gets loaded in the player
   thumb    - optional image path. Leave it out and a lettered
              tile is drawn instead, so nothing ever looks broken.
   --------------------------------------------------------------- */

const GAMES = [
  {
    id: "demo",
    title: "Block Breaker",
    category: "Arcade",
    url: "games/demo/index.html"
  },
  {
    id: "2048",
    title: "2048",
    category: "Puzzle",
    url: "games/2048/index.html"
  },
  {
    id: "snake",
    title: "Snake",
    category: "Arcade",
    url: "games/snake/index.html"
  },
  {
    id: "tetra",
    title: "Tetra Blocks",
    category: "Puzzle",
    url: "games/tetra/index.html"
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    category: "Classic",
    url: "games/minesweeper/index.html"
  },
  {
    id: "solitaire",
    title: "Solitaire",
    category: "Classic",
    url: "games/solitaire/index.html"
  },
  {
    id: "chess",
    title: "Chess",
    category: "Strategy",
    url: "games/chess/index.html"
  },
  {
    id: "sudoku",
    title: "Sudoku",
    category: "Puzzle",
    url: "games/sudoku/index.html"
  },
  {
    id: "hoops",
    title: "Street Hoops",
    category: "Sports",
    url: "games/hoops/index.html"
  },
  {
    id: "drift",
    title: "Drift Circuit",
    category: "Racing",
    url: "games/drift/index.html"
  },
  {
    id: "hill-racer",
    title: "Hill Racer",
    category: "Racing",
    url: "games/hill-racer/index.html"
  },
  {
    id: "pong",
    title: "Pong",
    category: "Classic",
    url: "games/pong/index.html"
  }
];
