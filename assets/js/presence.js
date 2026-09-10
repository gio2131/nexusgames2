(function () {
  "use strict";

  var counters = document.querySelectorAll("[data-online-count]");
  var endpoint = window.NEXUS_PRESENCE_URL || "";
  var retryTimer;

  function show(value, label) {
    counters.forEach(function (counter) {
      counter.textContent = String(value);
      counter.parentElement.title = label;
    });
  }

  function connect() {
    if (!endpoint) {
      show(1, "1 user online on this device");
      return;
    }

    var socket = new WebSocket(endpoint);

    socket.addEventListener("message", function (event) {
      try {
        var message = JSON.parse(event.data);
        if (Number.isFinite(message.count)) {
          var count = Math.max(0, Math.round(message.count));
          show(count, count + (count === 1 ? " user online" : " users online"));
        }
      } catch (error) {}
    });

    socket.addEventListener("close", function () {
      show("—", "Reconnecting to live user count");
      clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, 3000);
    });

    socket.addEventListener("error", function () {
      socket.close();
    });
  }

  connect();
})();


