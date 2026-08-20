/* Home page: show a handful of games, link out to the full list. */

(function () {
  "use strict";

  function init() {
    var grid = document.getElementById("featured");
    if (!grid) return;
    Site.renderGrid(grid, GAMES.slice(0, 10));

    var total = document.getElementById("total");
    if (total) total.textContent = String(GAMES.length);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
