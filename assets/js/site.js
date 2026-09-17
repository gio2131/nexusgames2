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
    var broker = "https://ntfy.sh/nexusgames2-chat-9edc4a71f86b42e1-";
    var lastRoom = "";
    var unread = false;
    var polling = false;

    function roomKey() {
      return new Date().toISOString().slice(0, 13).replace(/[-T]/g, "");
    }

    function readKey() {
      return "nexus:chat:lastRead:v1:" + roomKey();
    }

    function isReading() {
      return drawer.classList.contains("is-open") ||
        (location.pathname.split("/").pop() === "chat.html" &&
          !document.getElementById("chat-room")?.hidden);
    }

    function display(value) {
      unread = value;
      chatLinks.forEach(function (link) {
        link.classList.toggle("has-unread", value);
        if (value) link.setAttribute("aria-label", "Chat, unread messages");
        else link.setAttribute("aria-label", "Chat");
      });
    }

    function markRead() {
      try { localStorage.setItem(readKey(), String(Date.now())); } catch (error) {}
      display(false);
    }

    function poll() {
      var room = roomKey();
      if (room !== lastRoom) {
        lastRoom = room;
        display(false);
      }
      if (isReading()) markRead();
      if (polling) return;
      polling = true;
      fetch(broker + room + "/json?poll=1&since=1h", { cache: "no-store" })
        .then(function (response) {
          if (!response.ok) throw new Error("Chat check failed");
          return response.text();
        })
        .then(function (text) {
          if (room !== roomKey()) return;
          if (isReading()) { markRead(); return; }
          var lastRead = 0;
          try { lastRead = Number(localStorage.getItem(readKey())) || 0; } catch (error) {}
          var hasNew = text.trim().split("\n").some(function (line) {
            try {
              var outer = JSON.parse(line);
              if (outer.event !== "message") return false;
              var message = JSON.parse(outer.message);
              return message.app === "nexusgames2-chat" && message.type === "message" &&
                message.room === room && Number(message.sentAt) > lastRead;
            } catch (error) { return false; }
          });
          display(hasNew);
        })
        .catch(function () {})
        .finally(function () { polling = false; });
    }

    window.addEventListener("storage", function (event) {
      if (event.key === readKey()) poll();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) poll();
    });
    window.addEventListener("focus", poll);
    poll();
    setInterval(poll, 5000);
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
          event.data && event.data.type === "nexus-chat-read") markChatRead();
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

