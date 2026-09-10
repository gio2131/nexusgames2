(function () {
  "use strict";

  var query = "";
  var category = "All";
  var grid, input, chips, count;

  function categories() {
    return ["All"].concat(GAMES.reduce(function (list, game) {
      var name = game.category || "Game";
      if (list.indexOf(name) === -1) list.push(name);
      return list;
    }, []).sort());
  }

  function render() {
    var games = GAMES.filter(function (game) {
      var matchesCategory = category === "All" || (game.category || "Game") === category;
      var matchesQuery = !query || game.title.toLowerCase().indexOf(query) !== -1;
      return matchesCategory && matchesQuery;
    });
    Site.renderGrid(grid, games);
    count.textContent = games.length + (games.length === 1 ? " game" : " games");
  }

  function init() {
    grid = document.getElementById("grid");
    input = document.getElementById("search");
    chips = document.getElementById("chips");
    count = document.getElementById("count");
    if (!grid) return;

    if (GAMES.length) {
      categories().forEach(function (name) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "chip";
        button.textContent = name;
        button.setAttribute("aria-pressed", String(name === category));
        button.addEventListener("click", function () {
          category = name;
          chips.querySelectorAll(".chip").forEach(function (chip) {
            chip.setAttribute("aria-pressed", String(chip === button));
          });
          render();
        });
        chips.appendChild(button);
      });
    }

    input.addEventListener("input", function () {
      query = input.value.trim().toLowerCase();
      render();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
      } else if (event.key === "Escape" && document.activeElement === input) {
        input.value = "";
        query = "";
        input.blur();
        render();
      }
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

