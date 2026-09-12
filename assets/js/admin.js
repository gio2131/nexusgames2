(function () {
  "use strict";

  var BROKER = "https://ntfy.sh";
  var TOPIC = "nexusgames2-1a4c7dea8781db7fb90af42a7790a6c1cf74";
  var EXPECTED_CODE_HASH = "fb0acaee5923560814b286247054daa162f012f6fa965368d9314da849323f2e";
  var users = Object.create(null);
  var deletedAt = Object.create(null);
  var suppressedSessions = Object.create(null);
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

  function usernameKey(value) {
    return String(value || "Unknown").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  }

  function publish(payload, keepHistory) {
    return fetch(BROKER + "/" + TOPIC + (keepHistory ? "" : "?cache=no"), {
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
    return publish(payload, false);
  }

  function isTabActive(tab) {
    return tab.lastSeen && Date.now() - tab.lastSeen < 45000;
  }

  function activeTabs(user) {
    return Object.keys(user.tabs).map(function (id) { return user.tabs[id]; }).filter(isTabActive);
  }

  function isUserActive(user) {
    return activeTabs(user).length > 0;
  }

  function newestTab(user, activeOnly) {
    var tabs = Object.keys(user.tabs).map(function (id) { return user.tabs[id]; });
    if (activeOnly) tabs = tabs.filter(isTabActive);
    tabs.sort(function (a, b) { return (b.lastSeen || b.sentAt) - (a.lastSeen || a.sentAt); });
    return tabs[0] || null;
  }

  function absorbDelete(payload) {
    var key = payload.usernameKey || usernameKey(payload.username);
    var timestamp = Number(payload.sentAt) || Date.now();
    if (!key || timestamp < (deletedAt[key] || 0)) return;
    deletedAt[key] = timestamp;
    (payload.sessionIds || []).forEach(function (id) { suppressedSessions[id] = true; });
    delete users[key];
  }

  function absorb(payload, fromHistory) {
    if (!payload || payload.app !== "nexusgames2") return;
    if (payload.type === "delete-user") {
      absorbDelete(payload);
      render();
      return;
    }
    if (!payload.sessionId) return;

    if (payload.type === "leave") {
      Object.keys(users).some(function (key) {
        if (!users[key].tabs[payload.sessionId]) return false;
        users[key].tabs[payload.sessionId].lastSeen = 0;
        return true;
      });
      render();
      return;
    }
    if (["join", "presence", "ack"].indexOf(payload.type) === -1) return;

    var key = usernameKey(payload.username);
    var timestamp = Number(payload.sentAt) || Date.now();
    if (suppressedSessions[payload.sessionId]) return;
    if (timestamp <= (deletedAt[key] || 0)) return;

    var user = users[key];
    if (!user) {
      user = users[key] = {
        key: key,
        username: String(payload.username || "Unknown").trim().replace(/\s+/g, " "),
        joinedAt: timestamp,
        tabs: Object.create(null)
      };
    }
    var current = user.tabs[payload.sessionId] || {};
    user.tabs[payload.sessionId] = {
      id: payload.sessionId,
      page: payload.page || current.page || "Nexus Games",
      sentAt: timestamp,
      lastSeen: fromHistory ? (current.lastSeen || 0) : Date.now()
    };
    user.joinedAt = Math.min(user.joinedAt, timestamp);
    render();
  }

  function commandUser(key, action, details) {
    var user = users[key];
    if (!user) return;
    activeTabs(user).forEach(function (tab) { command(tab.id, action, details); });
  }

  function deleteUser(key) {
    var user = users[key];
    if (!user) return;
    var sessionIds = Object.keys(user.tabs);
    sessionIds.forEach(function (id) { suppressedSessions[id] = true; });
    var payload = {
      app: "nexusgames2",
      type: "delete-user",
      username: user.username,
      usernameKey: key,
      sessionIds: sessionIds,
      sentAt: Date.now()
    };
    delete users[key];
    deletedAt[key] = payload.sentAt;
    render();
    publish(payload, true);
  }

  function render() {
    var entries = Object.keys(users).map(function (key) { return users[key]; });
    entries.sort(function (a, b) {
      return Number(isUserActive(b)) - Number(isUserActive(a)) || b.joinedAt - a.joinedAt;
    });
    var online = entries.filter(isUserActive).length;
    activeCount.textContent = String(online);
    summary.textContent = entries.length + (entries.length === 1 ? " logged username" : " logged usernames") + " · " + online + " active";

    if (!entries.length) {
      list.innerHTML = '<div class="admin-empty"><h2>No usernames yet</h2><p>New visitors will appear here after entering the site.</p></div>';
      return;
    }

    list.innerHTML = "";
    entries.forEach(function (user) {
      var active = isUserActive(user);
      var latest = newestTab(user, active);
      var row = document.createElement("article");
      row.className = "session-row" + (active ? " is-active" : "");
      row.innerHTML =
        '<span class="session-dot"></span><div class="session-info"><strong>' + Site.esc(user.username) + "</strong>" +
        "<span>" + Site.esc(active && latest ? latest.page : "Last seen " + new Date(user.joinedAt).toLocaleString()) + "</span></div>" +
        '<div class="session-actions"><button type="button" data-action="redirect"' + (active ? "" : " disabled") + ">Redirect</button>" +
        '<button type="button" data-action="image"' + (active ? "" : " disabled") + ">Show image</button>" +
        '<button type="button" class="danger-action" data-action="close"' + (active ? "" : " disabled") + ">Force close</button>" +
        '<button type="button" class="delete-action" data-action="delete">Delete</button></div>';
      row.querySelector('[data-action="redirect"]').addEventListener("click", function () {
        redirectTarget = user.key;
        document.getElementById("redirect-name").textContent = "Redirect " + user.username;
        dialog.showModal();
      });
      row.querySelector('[data-action="image"]').addEventListener("click", function () {
        imageTarget = user.key;
        imageUrl.value = "";
        document.getElementById("image-url-error").textContent = "";
        document.getElementById("image-name").textContent = "Show an image to " + user.username;
        imageDialog.showModal();
      });
      row.querySelector('[data-action="close"]').addEventListener("click", function () {
        if (confirm("Force close every active Nexus tab for " + user.username + "?")) commandUser(user.key, "close");
      });
      row.querySelector('[data-action="delete"]').addEventListener("click", function () {
        if (confirm("Delete " + user.username + " from the username log?")) deleteUser(user.key);
      });
      list.appendChild(row);
    });
  }

  function probe() {
    publish({ app: "nexusgames2", type: "probe", nonce: makeId(), sentAt: Date.now() }, false);
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
        var messages = [];
        text.trim().split("\n").forEach(function (line) {
          try {
            var outer = JSON.parse(line);
            if (outer.event === "message") messages.push(JSON.parse(outer.message));
          } catch (error) {}
        });
        messages.sort(function (a, b) { return (Number(a.sentAt) || 0) - (Number(b.sentAt) || 0); });
        messages.forEach(function (payload) { absorb(payload, true); });
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
      commandUser(redirectTarget, "redirect", { gameId: gameSelect.value });
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
    commandUser(imageTarget, "image", { imageUrl: value });
    imageTarget = "";
  });

  window.addEventListener("beforeunload", function () { clearInterval(refreshTimer); });
  render();
})();
