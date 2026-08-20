/* ---------------------------------------------------------------
   Shared behaviour: theme toggle, mobile nav, card rendering.
   Loaded on every page. No dependencies.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  /* ---------------------------- theme ---------------------------- */

  var root = document.documentElement;

  function currentTheme() {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  }

  /* ---------------------------- nav ------------------------------ */

  function wireChrome() {
    var toggle = document.querySelector(".theme-toggle");
    if (toggle) toggle.addEventListener("click", toggleTheme);

    var menuBtn = document.querySelector(".menu-btn");
    var nav = document.querySelector(".nav");
    if (menuBtn && nav) {
      menuBtn.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
      });
    }

    // mark the current page in the nav
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(function (a) {
      var target = a.getAttribute("href");
      if (target === here) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------------------------- cards ---------------------------- */

  // Stable, muted colour per title so lettered tiles stay consistent.
  var PALETTE = [
    "#3f6ea8", "#4a8a7b", "#8a5f7d", "#a06a4a",
    "#5a6b9e", "#4f8562", "#96604f", "#6b5f9e"
  ];

  function tileColor(text) {
    var sum = 0;
    for (var i = 0; i < text.length; i++) sum = (sum + text.charCodeAt(i) * (i + 1)) % 9973;
    return PALETTE[sum % PALETTE.length];
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function gameCard(game) {
    var a = document.createElement("a");
    a.className = "card";
    a.href = "play.html?id=" + encodeURIComponent(game.id);

    var art = game.thumb
      ? '<img src="' + esc(game.thumb) + '" alt="" loading="lazy">'
      : '<span class="letter" style="background:' + tileColor(game.title) + '">' +
        esc(game.title.charAt(0).toUpperCase()) + "</span>";

    a.innerHTML =
      '<div class="thumb">' + art + "</div>" +
      '<div class="meta">' +
        '<p class="title">' + esc(game.title) + "</p>" +
        '<span class="cat">' + esc(game.category || "Game") + "</span>" +
      "</div>";

    return a;
  }

  function renderGrid(target, list) {
    target.innerHTML = "";
    if (!list.length) {
      target.className = "empty";
      target.textContent = "No games match that search.";
      return;
    }
    target.className = "grid";
    var frag = document.createDocumentFragment();
    list.forEach(function (g) { frag.appendChild(gameCard(g)); });
    target.appendChild(frag);
  }

  window.Site = {
    esc: esc,
    gameCard: gameCard,
    renderGrid: renderGrid,
    findGame: function (id) {
      for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i];
      return null;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireChrome);
  } else {
    wireChrome();
  }
})();
