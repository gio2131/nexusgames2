(function () {
  "use strict";

  var BROKER = "https://ntfy.sh";
  var TOPIC_PREFIX = "nexusgames2-chat-9edc4a71f86b42e1";
  var username = "";
  var currentRoom = "";
  var socket;
  var reconnectTimer;
  var pollTimer;
  var roomTimer;
  var lastSent = 0;
  var seen = Object.create(null);
  var messages = [];

  var gate = document.getElementById("chat-gate");
  var gateForm = document.getElementById("chat-name-form");
  var nameInput = document.getElementById("chat-username");
  var nameError = document.getElementById("chat-name-error");
  var room = document.getElementById("chat-room");
  var list = document.getElementById("chat-messages");
  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-message");
  var send = document.getElementById("chat-send");
  var status = document.getElementById("chat-status");
  var roomNote = document.getElementById("chat-room-note");

  function makeId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function roomKey(date) {
    return (date || new Date()).toISOString().slice(0, 13).replace(/[-T]/g, "");
  }

  function topic() {
    return TOPIC_PREFIX + "-" + currentRoom;
  }

  function nextClearTime() {
    var next = new Date();
    next.setMinutes(60, 0, 0);
    return next;
  }

  function render() {
    var wasNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 90;
    list.innerHTML = "";
    messages.sort(function (a, b) { return a.sentAt - b.sentAt; });
    messages.forEach(function (item) {
      var article = document.createElement("article");
      article.className = "chat-message" + (item.username.toLocaleLowerCase() === username.toLocaleLowerCase() ? " is-own" : "");
      var author = document.createElement("strong");
      author.textContent = item.username;
      var bubble = document.createElement("p");
      bubble.textContent = item.text;
      article.appendChild(author);
      article.appendChild(bubble);
      list.appendChild(article);
    });
    if (wasNearBottom || messages.length < 3) list.scrollTop = list.scrollHeight;
  }

  function absorb(payload) {
    if (!payload || payload.app !== "nexusgames2-chat" || payload.type !== "message") return;
    if (payload.room !== currentRoom || !payload.id || seen[payload.id]) return;
    var text = String(payload.text || "").trim().slice(0, 300);
    var author = String(payload.username || "Anonymous").trim().replace(/\s+/g, " ").slice(0, 24);
    if (!text || !author) return;
    seen[payload.id] = true;
    messages.push({ id: payload.id, username: author, text: text, sentAt: Number(payload.sentAt) || Date.now() });
    render();
    if (!room.hidden && window.Site && window.Site.markChatRead) window.Site.markChatRead();
    if (!room.hidden && window.parent !== window) {
      try { window.parent.postMessage({ type: "nexus-chat-read" }, location.origin); } catch (error) {}
    }
  }

  function readStream(text) {
    var payloads = [];
    text.trim().split("\n").forEach(function (line) {
      try {
        var outer = JSON.parse(line);
        if (outer.event === "message") payloads.push(JSON.parse(outer.message));
      } catch (error) {}
    });
    payloads.sort(function (a, b) { return (Number(a.sentAt) || 0) - (Number(b.sentAt) || 0); });
    payloads.forEach(absorb);
  }

  function poll() {
    fetch(BROKER + "/" + topic() + "/json?poll=1&since=1h", { cache: "no-store" })
      .then(function (response) { return response.text(); })
      .then(readStream)
      .catch(function () {});
  }

  function connect() {
    clearTimeout(reconnectTimer);
    var connectingRoom = currentRoom;
    try {
      socket = new WebSocket("wss://ntfy.sh/" + topic() + "/ws");
    } catch (error) {
      status.textContent = "Connected by polling";
      reconnectTimer = setTimeout(connect, 5000);
      return;
    }
    socket.addEventListener("open", function () { status.textContent = "Live"; });
    socket.addEventListener("message", function (event) {
      try {
        var outer = JSON.parse(event.data);
        if (outer.event === "message") absorb(JSON.parse(outer.message));
      } catch (error) {}
    });
    socket.addEventListener("close", function () {
      if (connectingRoom !== currentRoom) return;
      status.textContent = "Connected by polling";
      reconnectTimer = setTimeout(connect, 3000);
    });
    socket.addEventListener("error", function () { socket.close(); });
  }

  function startRoom() {
    clearTimeout(reconnectTimer);
    clearInterval(pollTimer);
    if (socket) {
      try { socket.close(); } catch (error) {}
    }
    currentRoom = roomKey();
    seen = Object.create(null);
    messages = [];
    render();
    roomNote.textContent = "Messages clear at " + nextClearTime().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    status.textContent = "Connecting…";
    poll();
    connect();
    pollTimer = setInterval(poll, 5000);
  }

  gateForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = nameInput.value.trim().replace(/\s+/g, " ");
    if (value.length < 2 || value.length > 24) {
      nameError.textContent = "Use between 2 and 24 characters.";
      return;
    }
    username = value;
    gate.hidden = true;
    room.hidden = false;
    if (window.Site && window.Site.markChatRead) window.Site.markChatRead();
    input.focus();
    startRoom();
    roomTimer = setInterval(function () {
      if (roomKey() !== currentRoom) startRoom();
    }, 1000);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var now = Date.now();
    var text = input.value.trim();
    if (!text || now - lastSent < 1000) return;
    lastSent = now;
    var payload = {
      app: "nexusgames2-chat",
      type: "message",
      id: makeId(),
      room: currentRoom,
      username: username,
      text: text.slice(0, 300),
      sentAt: now
    };
    input.value = "";
    absorb(payload);
    send.disabled = true;
    setTimeout(function () { send.disabled = false; }, 1000);
    fetch(BROKER + "/" + topic(), { method: "POST", body: JSON.stringify(payload) })
      .then(function (response) {
        if (!response.ok) throw new Error("send failed");
      })
      .catch(function () { status.textContent = "Message could not be sent"; });
  });

  window.addEventListener("beforeunload", function () {
    clearInterval(pollTimer);
    clearInterval(roomTimer);
    clearTimeout(reconnectTimer);
  });
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) location.reload();
  });

  setTimeout(function () { nameInput.focus(); }, 50);
})();
