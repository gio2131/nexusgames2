(function () {
  "use strict";

  var BROKER = "https://ntfy.sh";
  var TOPIC = "nexusgames2-1a4c7dea8781db7fb90af42a7790a6c1cf74";
  var SOCKET_URL = "wss://ntfy.sh/" + TOPIC + "/ws";
  var username = "";
  var sessionId = "";
  var socket;
  var reconnectTimer;
  var knownSessions = Object.create(null);

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function currentPage() {
    var gameId = new URLSearchParams(location.search).get("id");
    var game = gameId && window.Site ? Site.findGame(gameId) : null;
    return game ? game.title : (document.title.split("—")[0].trim() || "Nexus Games");
  }

  function publish(payload, keepHistory) {
    var url = BROKER + "/" + TOPIC + (keepHistory ? "" : "?cache=no");
    return fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {});
  }

  function message(type, extra) {
    var payload = {
      app: "nexusgames2",
      type: type,
      sessionId: sessionId,
      username: username,
      page: currentPage(),
      sentAt: Date.now()
    };
    Object.keys(extra || {}).forEach(function (key) { payload[key] = extra[key]; });
    return payload;
  }

  function updateCount() {
    var cutoff = Date.now() - 210000;
    Object.keys(knownSessions).forEach(function (id) {
      if (knownSessions[id] < cutoff) delete knownSessions[id];
    });
    knownSessions[sessionId] = Date.now();
    window.dispatchEvent(new CustomEvent("nexus:presence", {
      detail: { count: Object.keys(knownSessions).length }
    }));
  }

  function announce(type, extra) {
    knownSessions[sessionId] = Date.now();
    updateCount();
    publish(message(type, extra), type === "join");
  }

  function lockSession() {
    try { window.open("", "_self"); window.close(); } catch (error) {}
    document.title = "Session closed — Nexus Games";
    document.body.innerHTML =
      '<main class="closed-session"><div class="rail-mark">N</div>' +
      "<h1>Session closed</h1><p>This Nexus Games tab was closed by the site administrator.</p></main>";
  }

  function handlePayload(payload) {
    if (!payload || payload.app !== "nexusgames2") return;

    if ((payload.type === "join" || payload.type === "presence") && payload.sessionId) {
      knownSessions[payload.sessionId] = Date.now();
      updateCount();
    } else if (payload.type === "leave" && payload.sessionId) {
      delete knownSessions[payload.sessionId];
      updateCount();
    } else if (payload.type === "probe") {
      announce("presence", { nonce: payload.nonce || "" });
    } else if (payload.type === "command" && payload.target === sessionId) {
      if (payload.action === "redirect" && window.Site) {
        var game = Site.findGame(payload.gameId);
        if (game) {
          publish(message("ack", { action: "redirect", commandId: payload.commandId }), false);
          location.href = "play.html?id=" + encodeURIComponent(game.id);
        }
      } else if (payload.action === "close") {
        publish(message("ack", { action: "close", commandId: payload.commandId }), false);
        publish(message("leave"), false);
        lockSession();
      }
    }
  }

  function connect() {
    clearTimeout(reconnectTimer);
    socket = new WebSocket(SOCKET_URL);

    socket.addEventListener("open", function () {
      var firstJoin = sessionStorage.getItem("nexus:joined") !== "yes";
      if (firstJoin) sessionStorage.setItem("nexus:joined", "yes");
      announce(firstJoin ? "join" : "presence");
      publish({ app: "nexusgames2", type: "probe", nonce: makeId(), sentAt: Date.now() }, false);
    });

    socket.addEventListener("message", function (event) {
      try {
        var outer = JSON.parse(event.data);
        if (outer.event === "message") handlePayload(JSON.parse(outer.message));
      } catch (error) {}
    });

    socket.addEventListener("close", function () {
      reconnectTimer = setTimeout(connect, 3000);
    });

    socket.addEventListener("error", function () { socket.close(); });
  }

  function start(name) {
    username = name;
    sessionId = sessionStorage.getItem("nexus:sessionId") || makeId();
    sessionStorage.setItem("nexus:username", username);
    sessionStorage.setItem("nexus:sessionId", sessionId);
    connect();
    setInterval(function () {
      publish({ app: "nexusgames2", type: "probe", nonce: makeId(), sentAt: Date.now() }, false);
      updateCount();
    }, 180000);
  }

  function showGate() {
    var gate = document.createElement("div");
    gate.className = "session-gate";
    gate.innerHTML =
      '<form class="session-card"><span class="session-mark">N</span>' +
      "<p class=\"eyebrow\">Welcome to Nexus</p><h1>Choose a username</h1>" +
      "<p>Your username identifies this browser tab to the site operator while you play.</p>" +
      '<label for="session-username">Username</label><input id="session-username" name="username" maxlength="24" minlength="2" autocomplete="off" required placeholder="Enter a username">' +
      '<button class="button" type="submit">Enter Nexus <span aria-hidden="true">↗</span></button>' +
      '<small id="username-error" aria-live="polite"></small></form>';
    document.body.appendChild(gate);
    var form = gate.querySelector("form");
    var input = gate.querySelector("input");
    var error = gate.querySelector("small");
    setTimeout(function () { input.focus(); }, 50);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = input.value.trim().replace(/\s+/g, " ");
      if (name.length < 2 || name.length > 24) {
        error.textContent = "Use between 2 and 24 characters.";
        return;
      }
      gate.remove();
      start(name);
    });
  }

  var savedName = "";
  try { savedName = sessionStorage.getItem("nexus:username") || ""; } catch (error) {}
  if (savedName) start(savedName);
  else showGate();

  window.addEventListener("pagehide", function () {
    if (!sessionId) return;
    var blob = new Blob([JSON.stringify(message("leave"))], { type: "text/plain" });
    navigator.sendBeacon(BROKER + "/" + TOPIC + "?cache=no", blob);
  });
})();
