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
    link.addEventListener("click", function () {
      try { localStorage.setItem("nexus:lastPlayed", game.id); } catch (error) {}
    });
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

  function initializeChangelog() {
    var key = "nexus:changelog:games-september-2026";
    try {
      if (localStorage.getItem(key) === "seen") return;
    } catch (error) {}

    var overlay = document.createElement("div");
    overlay.className = "changelog-overlay";
    overlay.innerHTML =
      '<section class="changelog-modal" role="dialog" aria-modal="true" aria-labelledby="changelog-title">' +
      '<span class="eyebrow">Latest update</span>' +
      '<h2 id="changelog-title">Changelogs</h2>' +
      '<div class="changelog-copy"><p><strong>New games:</strong> How to Fish, Ages of Conflict, Clustertruck</p>' +
      '<p><strong>Quick Notes:</strong> How to Fish is multiplayer—host a code and have another person join it. Gorilla Tag works the same way.</p></div>' +
      '<button class="button changelog-close" type="button">Got it</button>' +
      '</section>';
    document.body.appendChild(overlay);

    var closeButton = overlay.querySelector(".changelog-close");
    function dismiss() {
      try { localStorage.setItem(key, "seen"); } catch (error) {}
      overlay.remove();
      document.removeEventListener("keydown", onKeydown);
    }
    function onKeydown(event) {
      if (event.key === "Escape") dismiss();
    }

    closeButton.addEventListener("click", dismiss);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) dismiss();
    });
    document.addEventListener("keydown", onKeydown);
    closeButton.focus();
  }

  function initializeChatUnread(chatLinks, drawer) {
    var topicPrefix = "nexusgames2-chat-9edc4a71f86b42e1-";
    var currentRoom = "";
    var socket;
    var reconnectTimer;
    var lastEventId = "";
    var knownIds = Object.create(null);
    var retryDelay = 3000;

    function roomKey() {
      return new Date().toISOString().slice(0, 13).replace(/[-T]/g, "");
    }

    function readKey() {
      return "nexus:chat:readIds:v2:" + currentRoom;
    }

    function isReading() {
      return drawer.classList.contains("is-open") ||
        (location.pathname.split("/").pop() === "chat.html" &&
          !document.getElementById("chat-room")?.hidden);
    }

    function display(value) {
      chatLinks.forEach(function (link) {
        link.classList.toggle("has-unread", value);
        if (value) link.setAttribute("aria-label", "Chat, unread messages");
        else link.setAttribute("aria-label", "Chat");
      });
    }

    function readIds() {
      try {
        var saved = JSON.parse(localStorage.getItem(readKey()) || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch (error) { return []; }
    }

    function markRead(id) {
      var ids = readIds();
      Object.keys(knownIds).forEach(function (knownId) {
        if (ids.indexOf(knownId) === -1) ids.push(knownId);
      });
      if (id && ids.indexOf(id) === -1) ids.push(id);
      try { localStorage.setItem(readKey(), JSON.stringify(ids.slice(-300))); } catch (error) {}
      display(false);
    }

    function refreshUnread() {
      if (isReading()) { markRead(); return; }
      var read = readIds();
      display(Object.keys(knownIds).some(function (id) { return read.indexOf(id) === -1; }));
    }

    function absorb(outer) {
      if (!outer || outer.event !== "message") return;
      try {
        var message = JSON.parse(outer.message);
        if (message.app !== "nexusgames2-chat" || message.type !== "message" ||
            message.room !== currentRoom || !message.id) return;
        knownIds[message.id] = true;
        if (outer.id) lastEventId = outer.id;
        refreshUnread();
      } catch (error) {}
    }

    function pollFallback() {
      if (socket && socket.readyState === WebSocket.OPEN) return;
      var room = currentRoom;
      var since = lastEventId || "1h";
      fetch("https://ntfy.sh/" + topicPrefix + room + "/json?poll=1&since=" + encodeURIComponent(since), { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("Chat check failed: " + response.status);
          return response.text();
        })
        .then(function (text) {
          if (room !== currentRoom) return;
          text.trim().split("\n").forEach(function (line) {
            try { absorb(JSON.parse(line)); } catch (error) {}
          });
        })
        .catch(function () {});
    }

    function connect() {
      clearTimeout(reconnectTimer);
      if (socket) { try { socket.close(); } catch (error) {} }
      var room = currentRoom;
      var since = lastEventId || "1h";
      try {
        socket = new WebSocket("wss://ntfy.sh/" + topicPrefix + room + "/ws?since=" + encodeURIComponent(since));
      } catch (error) {
        reconnectTimer = setTimeout(connect, retryDelay);
        return;
      }
      socket.addEventListener("open", function () { retryDelay = 3000; });
      socket.addEventListener("message", function (event) {
        if (room !== currentRoom) return;
        try { absorb(JSON.parse(event.data)); } catch (error) {}
      });
      socket.addEventListener("close", function () {
        if (room !== currentRoom) return;
        reconnectTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
      });
      socket.addEventListener("error", function () { socket.close(); });
    }

    function startRoom() {
      var room = roomKey();
      if (room === currentRoom) return;
      currentRoom = room;
      lastEventId = "";
      knownIds = Object.create(null);
      display(false);
      connect();
    }

    window.addEventListener("storage", function (event) {
      if (event.key === readKey()) refreshUnread();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) { startRoom(); refreshUnread(); }
    });
    window.addEventListener("focus", function () { startRoom(); refreshUnread(); });
    startRoom();
    setInterval(startRoom, 1000);
    setInterval(pollFallback, 60000);
    return markRead;
  }

  function initializeChrome() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-page]").forEach(function (link) {
      if (link.getAttribute("data-page") === current) link.setAttribute("aria-current", "page");
    });

    if (document.documentElement.dataset.chatPanel === "true") return;
    initializeChangelog();

    var chatLinks = document.querySelectorAll('[data-page="chat.html"]');
    if (!chatLinks.length) return;

    var drawer = document.createElement("section");
    drawer.className = "chat-drawer";
    drawer.id = "chat-drawer";
    drawer.setAttribute("aria-label", "Nexus chat");
    drawer.setAttribute("aria-hidden", "true");
    drawer.innerHTML = '<iframe title="Nexus live chat" loading="lazy"></iframe>';
    document.body.appendChild(drawer);

    var frame = drawer.querySelector("iframe");
    var markChatRead = initializeChatUnread(chatLinks, drawer);
    window.Site.markChatRead = markChatRead;
    window.addEventListener("message", function (event) {
      if (event.origin === location.origin && event.source === frame.contentWindow &&
          event.data && event.data.type === "nexus-chat-read") markChatRead(event.data.id);
    });

    function openChat(event) {
      if (event) event.preventDefault();
      if (drawer.classList.contains("is-open")) {
        closeChat();
        return;
      }
      frame.src = "chat.html?panel=1&opened=" + Date.now();
      drawer.classList.add("is-open");
      markChatRead();
      drawer.setAttribute("aria-hidden", "false");
      chatLinks.forEach(function (link) { link.setAttribute("aria-expanded", "true"); });
    }

    function closeChat() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      chatLinks.forEach(function (link) { link.setAttribute("aria-expanded", "false"); });
      frame.src = "about:blank";
    }

    chatLinks.forEach(function (link) {
      link.setAttribute("aria-controls", "chat-drawer");
      link.setAttribute("aria-expanded", "false");
      link.addEventListener("click", openChat);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) closeChat();
    });
  }

  window.Site = { esc: esc, gameCard: gameCard, renderGrid: renderGrid, findGame: findGame };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeChrome);
  } else {
    initializeChrome();
  }
})();

