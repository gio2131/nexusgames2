/* Games page: search box + category chips over the GAMES list. */

(function () {
  "use strict";

  var grid, input, chips, count;
  var query = "";
  var category = "All";

  function categories() {
    var seen = [];
    GAMES.forEach(function (g) {
      var c = g.category || "Game";
      if (seen.indexOf(c) === -1) seen.push(c);
    });
    seen.sort();
    return ["All"].concat(seen);
  }

  function matches(game) {
    var inCat = category === "All" || (game.category || "Game") === category;
    var inQuery = !query || game.title.toLowerCase().indexOf(query) !== -1;
    return inCat && inQuery;
  }

  function apply() {
    var list = GAMES.filter(matches);
    Site.renderGrid(grid, list);
    count.textContent =
      list.length + (list.length === 1 ? " game" : " games") +
      (category === "All" ? "" : " in " + category);
  }

  function buildChips() {
    categories().forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = name;
      b.setAttribute("aria-pressed", String(name === category));
      b.addEventListener("click", function () {
        category = name;
        chips.querySelectorAll(".chip").forEach(function (c) {
          c.setAttribute("aria-pressed", String(c === b));
        });
        apply();
      });
      chips.appendChild(b);
    });
  }

  function init() {
    grid = document.getElementById("grid");
    input = document.getElementById("search");
    chips = document.getElementById("chips");
    count = document.getElementById("count");
    if (!grid) return;

    buildChips();

    input.addEventListener("input", function () {
      query = input.value.trim().toLowerCase();
      apply();
    });

    // "/" focuses the search box, Escape clears it
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      } else if (e.key === "Escape" && document.activeElement === input) {
        input.value = "";
        query = "";
        apply();
        input.blur();
      }
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
