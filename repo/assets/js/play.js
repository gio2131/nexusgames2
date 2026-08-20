/* Player page: reads ?id= from the URL and loads that game in the stage. */

(function () {
  "use strict";

  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
  }

  function missing(stage, message) {
    stage.innerHTML = '<div class="missing"></div>';
    stage.firstChild.textContent = message;
  }

  function load(stage, game) {
    var frame = document.createElement("iframe");
    frame.src = game.url;
    frame.title = game.title;
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("allow", "fullscreen; autoplay; gamepad; clipboard-write");
    stage.innerHTML = "";
    stage.appendChild(frame);
  }

  function init() {
    var stage = document.getElementById("stage");
    if (!stage) return;

    var game = Site.findGame(param("id"));

    if (!game) {
      document.getElementById("game-title").textContent = "Game not found";
      document.getElementById("game-cat").hidden = true;
      document.getElementById("fullscreen").hidden = true;
      missing(stage, "That game is not in the list. Head back to the games page.");
      return;
    }

    document.title = game.title + " - Arcade";
    document.getElementById("game-title").textContent = game.title;
    document.getElementById("game-cat").textContent = game.category || "Game";

    document.getElementById("fullscreen").addEventListener("click", function () {
      var el = stage.querySelector("iframe") || stage;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    });

    // On a real server, check the file exists first so an empty slot shows a
    // useful message instead of a 404 page inside the frame.
    if (location.protocol === "http:" || location.protocol === "https:") {
      fetch(game.url, { method: "HEAD" })
        .then(function (res) {
          if (res.ok) load(stage, game);
          else missing(stage, "No files here yet. Drop the game into " + game.url.replace(/index\.html$/, "") + " and reload.");
        })
        .catch(function () { load(stage, game); });
    } else {
      load(stage, game);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
