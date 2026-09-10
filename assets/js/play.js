(function () {
  "use strict";

  function parameter(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function showMissing(stage) {
    stage.innerHTML = '<div class="missing">This game is no longer in the Nexus library.</div>';
  }

  function init() {
    var stage = document.getElementById("stage");
    var game = Site.findGame(parameter("id"));
    if (!stage) return;

    if (!game) {
      document.getElementById("game-title").textContent = "Game unavailable";
      document.getElementById("game-cat").textContent = "Library";
      document.getElementById("fullscreen").hidden = true;
      showMissing(stage);
      return;
    }

    document.title = game.title + " — Nexus Games";
    document.getElementById("game-title").textContent = game.title;
    document.getElementById("game-cat").textContent = game.category || "Game";

    var frame = document.createElement("iframe");
    frame.src = game.url;
    frame.title = game.title;
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("allow", "fullscreen; autoplay; gamepad");
    stage.appendChild(frame);

    document.getElementById("fullscreen").addEventListener("click", function () {
      if (frame.requestFullscreen) frame.requestFullscreen();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

