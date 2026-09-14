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
  var processedCommands = Object.create(null);

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

  function beacon(payload, keepHistory) {
    var blob = new Blob([JSON.stringify(payload)], { type: "text/plain" });
    navigator.sendBeacon(BROKER + "/" + TOPIC + (keepHistory ? "" : "?cache=no"), blob);
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

  function announce(type, extra, keepHistory) {
    knownSessions[sessionId] = Date.now();
    updateCount();
    publish(message(type, extra), Boolean(keepHistory));
  }

  function closeSession(commandId) {
    beacon(message("ack", { action: "close", commandId: commandId }), false);
    beacon(message("leave"), true);
    try { if (socket) socket.close(); } catch (error) {}
    window.close();
    setTimeout(function () { location.replace("about:blank"); }, 120);
  }

  function showImage(url) {
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
    } catch (error) { return; }

    var existing = document.querySelector(".remote-image-display");
    if (existing) existing.remove();
    var display = document.createElement("div");
    display.className = "remote-image-display";
    display.innerHTML = '<img alt="Image sent by the Nexus administrator">';
    display.querySelector("img").src = url;
    document.body.appendChild(display);
    setTimeout(function () { display.remove(); }, 5000);
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
      announce("presence", { nonce: payload.nonce || "" }, false);
    } else if (payload.type === "command" && payload.target === sessionId) {
      var commandId = payload.commandId || [payload.target, payload.action, payload.sentAt].join(":");
      if (processedCommands[commandId]) return;
      processedCommands[commandId] = true;
      try {
        var savedCommands = JSON.parse(sessionStorage.getItem("nexus:commands") || "{}");
        savedCommands[commandId] = Date.now();
        Object.keys(savedCommands).forEach(function (id) {
          if (Date.now() - savedCommands[id] > 300000) delete savedCommands[id];
        });
        sessionStorage.setItem("nexus:commands", JSON.stringify(savedCommands));
      } catch (error) {}
      if (payload.action === "redirect" && window.Site) {
        var game = Site.findGame(payload.gameId);
        if (game) {
          publish(message("ack", { action: "redirect", commandId: payload.commandId }), false);
          location.href = "play.html?id=" + encodeURIComponent(game.id);
        }
      } else if (payload.action === "close") {
        closeSession(payload.commandId);
      } else if (payload.action === "image" && payload.imageUrl) {
        publish(message("ack", { action: "image", commandId: payload.commandId }), false);
        showImage(payload.imageUrl);
      }
    }
  }

  function pollMessages() {
    fetch(BROKER + "/" + TOPIC + "/json?poll=1&since=2m", { cache: "no-store" })
      .then(function (response) { return response.text(); })
      .then(function (text) {
        var messages = [];
        text.trim().split("\n").forEach(function (line) {
          try {
            var outer = JSON.parse(line);
            if (outer.event === "message") messages.push(JSON.parse(outer.message));
          } catch (error) {}
        });
        messages.sort(function (a, b) { return (Number(a.sentAt) || 0) - (Number(b.sentAt) || 0); });
        messages.forEach(handlePayload);
      })
      .catch(function () {});
  }

  function connect() {
    clearTimeout(reconnectTimer);
    try {
      socket = new WebSocket(SOCKET_URL);
    } catch (error) {
      reconnectTimer = setTimeout(connect, 5000);
      return;
    }

    socket.addEventListener("open", function () {
      var firstJoin = sessionStorage.getItem("nexus:joined") !== "yes";
      if (firstJoin) sessionStorage.setItem("nexus:joined", "yes");
      announce(firstJoin ? "join" : "presence", null, true);
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
    try {
      var savedCommands = JSON.parse(sessionStorage.getItem("nexus:commands") || "{}");
      Object.keys(savedCommands).forEach(function (id) { processedCommands[id] = true; });
    } catch (error) {}
    announce("presence", null, true);
    connect();
    pollMessages();
    setInterval(function () {
      announce("presence", null, true);
    }, 30000);
    setInterval(pollMessages, 5000);
  }

  function showManagedLauncher() {
    document.title = "Nexus Games launched";
    document.body.innerHTML =
      '<main class="closed-session launcher-session"><div class="rail-mark">N</div>' +
      "<h1>Nexus opened</h1><p>Your managed Nexus tab is ready. This launcher tab can be closed.</p>" +
      '<a class="button" href="index.html">Open another session <span aria-hidden="true">↗</span></a></main>';
  }

  function openManagedSession(name, error) {
    username = name;
    sessionId = makeId();
    sessionStorage.setItem("nexus:username", username);
    sessionStorage.setItem("nexus:sessionId", sessionId);
    sessionStorage.setItem("nexus:managed", "yes");
    sessionStorage.removeItem("nexus:joined");

    var target = new URL(location.href);
    target.searchParams.set("nexusManaged", "1");
    var managedTab = window.open(target.href, "_blank");
    if (!managedTab) {
      sessionStorage.removeItem("nexus:username");
      sessionStorage.removeItem("nexus:sessionId");
      sessionStorage.removeItem("nexus:managed");
      username = "";
      sessionId = "";
      error.textContent = "Allow pop-ups for Nexus, then try again. This is required so Force close can close the tab.";
      return false;
    }

    sessionStorage.removeItem("nexus:username");
    sessionStorage.removeItem("nexus:sessionId");
    sessionStorage.removeItem("nexus:managed");
    sessionStorage.removeItem("nexus:joined");
    username = "";
    sessionId = "";
    showManagedLauncher();
    return true;
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
      if (openManagedSession(name, error)) gate.remove();
    });
  }

  var savedName = "";
  try { savedName = sessionStorage.getItem("nexus:username") || ""; } catch (error) {}
  if (savedName) start(savedName);
  else showGate();

  document.addEventListener("visibilitychange", function () {
    if (sessionId && document.visibilityState === "visible") announce("presence", null, true);
  });
  window.addEventListener("focus", function () {
    if (sessionId) announce("presence", null, true);
  });

  window.addEventListener("pagehide", function () {
    if (!sessionId) return;
    beacon(message("leave"), true);
  });
})();
