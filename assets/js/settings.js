(function () {
  "use strict";

  var choices = document.querySelectorAll("[data-theme-choice]");
  var form = document.getElementById("custom-theme-form");
  var input = document.getElementById("custom-image-url");
  var feedback = document.getElementById("theme-feedback");
  var reset = document.getElementById("reset-theme");

  function showSelected() {
    var current = NexusTheme.read();
    choices.forEach(function (choice) {
      choice.setAttribute("aria-pressed", String(choice.dataset.themeChoice === current.theme));
    });
    if (current.imageUrl) input.value = current.imageUrl;
    feedback.textContent = current.theme === "default"
      ? "Dark theme"
      : current.theme.charAt(0).toUpperCase() + current.theme.slice(1) + " theme applied";
  }

  choices.forEach(function (choice) {
    choice.addEventListener("click", function () {
      NexusTheme.apply(choice.dataset.themeChoice);
      showSelected();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = NexusTheme.safeImage(input.value.trim());
    if (!value) {
      feedback.textContent = "Enter a complete http:// or https:// image URL.";
      input.focus();
      return;
    }
    NexusTheme.apply("custom", value);
    showSelected();
  });

  reset.addEventListener("click", function () {
    NexusTheme.apply("default");
    input.value = "";
    showSelected();
  });

  showSelected();
})();
