(function () {
  "use strict";

  function featuredGames() {
    return GAMES.filter(function (game) { return game.featured === true; });
  }

  function lastPlayed() {
    var id = "";
    try { id = localStorage.getItem("nexus:lastPlayed") || ""; } catch (error) {}
    return Site.findGame(id);
  }

  function setSpotlight(game, isRecent) {
    var spotlight = document.getElementById("spotlight");
    if (!spotlight || !game) return;

    if (game.thumb) {
      spotlight.style.backgroundImage =
        'linear-gradient(90deg, rgba(7,7,7,.92) 0%, rgba(7,7,7,.5) 58%, rgba(7,7,7,.22) 100%), url("' +
        game.thumb.replace(/"/g, "%22") + '")';
      spotlight.style.backgroundSize = "cover";
      spotlight.style.backgroundPosition = "center";
    }

    spotlight.querySelector(".feature-copy").innerHTML =
      "<h1>" + Site.esc(game.title) + "</h1>" +
      "<p>" + Site.esc(isRecent ? "Pick up where you left off." : (game.category || "Featured game")) + "</p>" +
      '<a class="button" href="play.html?id=' + encodeURIComponent(game.id) + '">Play now <span aria-hidden="true">↗</span></a>';
  }

  function init() {
    var catalog = document.getElementById("featured");
    var row = document.getElementById("featured-row");
    var total = document.getElementById("total");
    var count = document.getElementById("spotlight-count");
    var featured = featuredGames();
    var recent = lastPlayed();
    var spotlightGames = featured.slice();

    if (recent && !spotlightGames.some(function (game) { return game.id === recent.id; })) {
      spotlightGames.unshift(recent);
    }

    if (total) total.textContent = String(GAMES.length);
    if (count) count.textContent = spotlightGames.length + (spotlightGames.length === 1 ? " game" : " games");
    if (catalog) Site.renderGrid(catalog, GAMES.slice(0, 8));

    if (spotlightGames.length) {
      setSpotlight(recent || spotlightGames[0], Boolean(recent));
      spotlightGames.forEach(function (game) { row.appendChild(Site.gameCard(game)); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

