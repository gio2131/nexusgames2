(function () {
  "use strict";

  var STORAGE_KEY = "nexus:studyAi:history:v1";
  var MODEL = "openai/gpt-5.6-luna";
  var MAX_HISTORY = 24;
  var history = [];
  var busy = false;

  var list = document.getElementById("ai-messages");
  var form = document.getElementById("ai-form");
  var input = document.getElementById("ai-prompt");
  var send = document.getElementById("ai-send");
  var clear = document.getElementById("ai-clear");
  var status = document.getElementById("ai-status");

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        history = saved.filter(function (item) {
          return item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
        }).slice(-MAX_HISTORY);
      }
    } catch (error) {
      history = [];
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch (error) {}
  }

  function render() {
    list.innerHTML = "";
    if (!history.length) {
      var welcome = document.createElement("div");
      welcome.className = "ai-welcome";
      welcome.innerHTML = "<strong>What are you working on?</strong><p>Ask for explanations, research help, study guides, outlines, or source-backed answers.</p>";
      list.appendChild(welcome);
      return;
    }

    history.forEach(function (item) {
      var article = document.createElement("article");
      article.className = "ai-message is-" + item.role;
      var label = document.createElement("strong");
      label.textContent = item.role === "user" ? "You" : "Study AI";
      var bubble = document.createElement("p");
      bubble.textContent = item.content;
      article.appendChild(label);
      article.appendChild(bubble);
      list.appendChild(article);
    });
    list.scrollTop = list.scrollHeight;
  }

  function textFrom(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(textFrom).filter(Boolean).join("\n");
    if (!value || typeof value !== "object") return "";
    if (typeof value.text === "string") return value.text;
    if (typeof value.content === "string") return value.content;
    if (value.content) return textFrom(value.content);
    return "";
  }

  function responseText(response) {
    if (typeof response === "string") return response;
    if (!response) return "";
    return textFrom(response.message && response.message.content) ||
      textFrom(response.content) ||
      textFrom(response.text);
  }

  function setBusy(value) {
    busy = value;
    send.disabled = value;
    input.disabled = value;
    status.textContent = value
      ? "Searching and thinking…"
      : "Uses a lightweight model with web search. AI can make mistakes—check important sources.";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var prompt = input.value.trim();
    if (!prompt || busy) return;
    if (!window.puter || !puter.ai || !puter.ai.chat) {
      status.textContent = "The AI service could not load on this network.";
      return;
    }

    history.push({ role: "user", content: prompt });
    history = history.slice(-MAX_HISTORY);
    input.value = "";
    save();
    render();
    setBusy(true);

    var messages = [{
      role: "system",
      content: "You are Study AI, a clear academic assistant. Explain concepts accurately, help users learn instead of doing dishonest work for them, use web search for current or source-dependent questions, and include useful source names or links when search informs the answer. Clearly label uncertainty."
    }].concat(history);

    puter.ai.chat(messages, {
      model: MODEL,
      tools: [{ type: "web_search" }]
    }).then(function (response) {
      var answer = responseText(response).trim() || "I couldn't produce an answer. Please try rephrasing the question.";
      history.push({ role: "assistant", content: answer });
      history = history.slice(-MAX_HISTORY);
      save();
      render();
      setBusy(false);
      input.focus();
    }).catch(function (error) {
      setBusy(false);
      status.textContent = "The AI request failed. Sign in if prompted, then try again.";
      input.focus();
    });
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  clear.addEventListener("click", function () {
    history = [];
    save();
    render();
    input.focus();
  });

  load();
  render();
  input.focus();
})();
