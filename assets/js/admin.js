(function () {
  "use strict";

  var BROKER = "https://ntfy.sh";
  var TOPIC = "nexusgames2-1a4c7dea8781db7fb90af42a7790a6c1cf74";
  var EXPECTED_CODE_HASH = "fb0acaee5923560814b286247054daa162f012f6fa965368d9314da849323f2e";
  var sessions = Object.create(null);
  var socket;
  var redirectTarget = "";
  var imageTarget = "";
  var refreshTimer;
  var list = document.getElementById("session-list");
  var summary = document.getElementById("session-summary");
  var activeCount = document.getElementById("active-count");
  var connection = document.getElementById("admin-connection");
  var dialog = document.getElementById("redirect-dialog");
  var gameSelect = document.getElementById("redirect-game");
  var imageDialog = document.getElementById("image-dialog");
  var imageUrl = document.getElementById("image-url");

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function publish(payload) {
    return fetch(BROKER + "/" + TOPIC + "?cache=no", {
      method: "POST",
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  function command(target, action, details) {
    var payload = {
      app: "nexusgames2",
      type: "command",
      commandId: makeId(),
      target: target,
      action: action,
      sentAt: Date.now()
    };
    Object.keys(details || {}).forEach(function (key) { payload[key] = details[key]; });
    return publish(payload);
  }

  function absorb(payload, fromHistory) {
    if (!payload || payload.app !== "nexusgames2" || !payload.sessionId) return;
    if (["join", "presence", "ack"].indexOf(payload.type) === -1) return;
    var current = sessions[payload.sessionId] || {};
    sessions[payload.sessionId] = {
      id: payload.sessionId,
      username: payload.username || current.username || "Unknown",
      page: payload.page || current.page || "Nexus Games",
      joinedAt: current.joinedAt || payload.sentAt || Date.now(),
      lastSeen: fromHistory ? (current.lastSeen || 0) : Date.now()
    };
    render();
  }

  function isActive(session) {
    return session.lastSeen && Date.now() - session.lastSeen < 45000;
  }

  function render() {
    var entries = Object.keys(sessions).map(function (id) { return sessions[id]; });
    entries.sort(function (a, b) {
      return Number(isActive(b)) - Number(isActive(a)) || b.joinedAt - a.joinedAt;
    });
    var online = entries.filter(isActive).length;
    activeCount.textContent = String(online);
    summary.textContent = entries.length + (entries.length === 1 ? " logged username" : " logged usernames") + " · " + online + " active";

    if (!entries.length) {
      list.innerHTML = '<div class="admin-empty"><h2>No usernames yet</h2><p>New visitors will appear here after entering the site.</p></div>';
      return;
    }

    list.innerHTML = "";
    entries.forEach(function (session) {
      var active = isActive(session);
      var row = document.createElement("article");
      row.className = "session-row" + (active ? " is-active" : "");
      row.innerHTML =
        '<span class="session-dot"></span><div class="session-info"><strong>' + Site.esc(session.username) + "</strong>" +
        "<span>" + Site.esc(active ? session.page : "Last seen " + new Date(session.joinedAt).toLocaleString()) + "</span></div>" +
        '<div class="session-actions"><button type="button" data-action="redirect"' + (active ? "" : " disabled") + ">Redirect</button>" +
        '<button type="button" data-action="image"' + (active ? "" : " disabled") + ">Show image</button>" +
        '<button type="button" class="danger-action" data-action="close"' + (active ? "" : " disabled") + ">Force close</button></div>";
      row.querySelector('[data-action="redirect"]').addEventListener("click", function () {
        redirectTarget = session.id;
        document.getElementById("redirect-name").textContent = "Redirect " + session.username;
        dialog.showModal();
      });
      row.querySelector('[data-action="image"]').addEventListener("click", function () {
        imageTarget = session.id;
        imageUrl.value = "";
        document.getElementById("image-url-error").textContent = "";
        document.getElementById("image-name").textContent = "Show an image to " + session.username;
        imageDialog.showModal();
      });
      row.querySelector('[data-action="close"]').addEventListener("click", function () {
        if (confirm("Force close " + session.username + "'s Nexus tab?")) command(session.id, "close");
      });
      list.appendChild(row);
    });
  }

  function probe() {
    publish({ app: "nexusgames2", type: "probe", nonce: makeId(), sentAt: Date.now() });
    setTimeout(render, 2200);
  }

  function connect() {
    connection.textContent = "live";
    socket = new WebSocket("wss://ntfy.sh/" + TOPIC + "/ws");
    socket.addEventListener("open", function () {
      connection.textContent = "live";
      probe();
    });
    socket.addEventListener("message", function (event) {
      try {
        var outer = JSON.parse(event.data);
        if (outer.event === "message") absorb(JSON.parse(outer.message), false);
      } catch (error) {}
    });
    socket.addEventListener("close", function () {
      connection.textContent = "retrying";
      setTimeout(connect, 3000);
    });
    socket.addEventListener("error", function () { socket.close(); });
  }

  function loadHistory() {
    fetch(BROKER + "/" + TOPIC + "/json?poll=1&since=12h")
      .then(function (response) { return response.text(); })
      .then(function (text) {
        text.trim().split("\n").forEach(function (line) {
          try {
            var outer = JSON.parse(line);
            if (outer.event === "message") absorb(JSON.parse(outer.message), true);
          } catch (error) {}
        });
      })
      .catch(function () {})
      .finally(probe);
  }

  async function hash(value) {
    var bytes = new TextEncoder().encode(value);
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function unlock() {
    document.getElementById("admin-lock").remove();
    GAMES.forEach(function (game) {
      var option = document.createElement("option");
      option.value = game.id;
      option.textContent = game.title;
      gameSelect.appendChild(option);
    });
    connect();
    loadHistory();
    refreshTimer = setInterval(probe, 20000);
  }

  document.getElementById("admin-code-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    var input = document.getElementById("admin-code");
    var enteredHash = await hash(input.value);
    if (enteredHash !== EXPECTED_CODE_HASH) {
      document.getElementById("admin-code-error").textContent = "Incorrect code.";
      input.select();
      return;
    }
    unlock();
  });

  document.getElementById("refresh-sessions").addEventListener("click", probe);
  document.getElementById("redirect-form").addEventListener("submit", function (event) {
    if (event.submitter && event.submitter.value === "confirm" && redirectTarget) {
      command(redirectTarget, "redirect", { gameId: gameSelect.value });
    }
    redirectTarget = "";
  });

  document.getElementById("image-form").addEventListener("submit", function (event) {
    if (!event.submitter || event.submitter.value !== "confirm" || !imageTarget) {
      imageTarget = "";
      return;
    }
    var value = imageUrl.value.trim();
    try {
      var parsed = new URL(value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("protocol");
    } catch (error) {
      event.preventDefault();
      document.getElementById("image-url-error").textContent = "Enter a complete http:// or https:// image URL.";
      return;
    }
    command(imageTarget, "image", { imageUrl: value });
    imageTarget = "";
  });

  window.addEventListener("beforeunload", function () { clearInterval(refreshTimer); });
  render();
})();
