(function () {
  "use strict";

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function gameCard(game) {
    var link = document.createElement("a");
    link.className = "card";
    link.href = "play.html?id=" + encodeURIComponent(game.id);
    var art = game.thumb
      ? '<img src="' + esc(game.thumb) + '" alt="" loading="lazy">'
      : '<span class="letter">' + esc(game.title.charAt(0).toUpperCase()) + "</span>";

    link.innerHTML =
      '<div class="thumb">' + art + "</div>" +
      '<div class="meta"><p class="title">' + esc(game.title) + "</p>" +
      '<span class="cat">' + esc(game.category || "Game") + "</span></div>";
    return link;
  }

  function renderGrid(target, games) {
    target.innerHTML = "";
    if (!games.length) {
      target.className = "empty";
      target.innerHTML =
        '<div><span class="empty-icon" aria-hidden="true">+</span>' +
        "<h3>No games in the catalog</h3>" +
        "<p>The catalog is cleared and ready for what comes next.</p></div>";
      return;
    }

    target.className = "game-grid";
    var fragment = document.createDocumentFragment();
    games.forEach(function (game) { fragment.appendChild(gameCard(game)); });
    target.appendChild(fragment);
  }

  function findGame(id) {
    for (var i = 0; i < GAMES.length; i += 1) {
      if (GAMES[i].id === id) return GAMES[i];
    }
    return null;
  }

  function initializeChrome() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-page]").forEach(function (link) {
      if (link.getAttribute("data-page") === current) link.setAttribute("aria-current", "page");
    });
  }

  window.Site = { esc: esc, gameCard: gameCard, renderGrid: renderGrid, findGame: findGame };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChrome);
  } else {
    initializeChrome();
  }
})();

