(function () {
  "use strict";

  var THEME_KEY = "nexus:theme";
  var IMAGE_KEY = "nexus:themeImage";

  function safeImage(value) {
    try {
      var url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function apply(theme, imageUrl) {
    var selected = ["galaxy", "rgb", "custom"].indexOf(theme) === -1 ? "default" : theme;
    var image = selected === "custom" ? safeImage(imageUrl) : "";
    if (selected === "custom" && !image) selected = "default";

    document.documentElement.dataset.theme = selected;
    document.documentElement.style.removeProperty("--theme-image");
    if (image) document.documentElement.style.setProperty("--theme-image", 'url("' + image.replace(/["\\]/g, "\\$&") + '")');

    try {
      localStorage.setItem(THEME_KEY, selected);
      if (image) localStorage.setItem(IMAGE_KEY, image);
      else if (selected !== "custom") localStorage.removeItem(IMAGE_KEY);
    } catch (error) {}
    window.dispatchEvent(new CustomEvent("nexus:theme", { detail: { theme: selected, imageUrl: image } }));
    return selected;
  }

  function read() {
    var theme = "default";
    var imageUrl = "";
    try {
      theme = localStorage.getItem(THEME_KEY) || "default";
      imageUrl = localStorage.getItem(IMAGE_KEY) || "";
    } catch (error) {}
    return { theme: theme, imageUrl: imageUrl };
  }

  var saved = read();
  apply(saved.theme, saved.imageUrl);
  window.NexusTheme = { apply: apply, read: read, safeImage: safeImage };
})();
