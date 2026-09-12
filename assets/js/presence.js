(function () {
  "use strict";

  var counters = document.querySelectorAll("[data-online-count]");
  function show(value, label) {
    counters.forEach(function (counter) {
      counter.textContent = String(value);
      counter.parentElement.title = label;
    });
  }

  show("—", "Connecting to live users");
  window.addEventListener("nexus:presence", function (event) {
    var count = Math.max(1, Math.round(event.detail.count || 1));
    show(count, count + (count === 1 ? " user online" : " users online"));
  });
})();


