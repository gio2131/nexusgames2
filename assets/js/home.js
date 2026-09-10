(function () {
  "use strict";

  function init() {
    var grid = document.getElementById("featured");
    var total = document.getElementById("total");
    if (total) total.textContent = String(GAMES.length);
    if (grid) Site.renderGrid(grid, GAMES.slice(0, 8));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

