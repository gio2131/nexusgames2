import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const STORAGE_KEY = "nexus:studyAi:history:v2";
const MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const MAX_HISTORY = 20;
const WIKIPEDIA_ENDPOINT = "https://en.wikipedia.org/w/api.php";

let history = [];
let engine = null;
let enginePromise = null;
let busy = false;

const list = document.getElementById("ai-messages");
const form = document.getElementById("ai-form");
const input = document.getElementById("ai-prompt");
const send = document.getElementById("ai-send");
const clear = document.getElementById("ai-clear");
const status = document.getElementById("ai-status");

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) {
      history = saved.filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string").slice(-MAX_HISTORY);
    }
  } catch (_) {
    history = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch (_) {}
}

function render() {
  list.innerHTML = "";
  if (!history.length) {
    const welcome = document.createElement("div");
    welcome.className = "ai-welcome";
    welcome.innerHTML = "<strong>What are you working on?</strong><p>Ask for explanations, study guides, outlines, or source-backed research help.</p>";
    list.appendChild(welcome);
    return;
  }

  history.forEach((item) => {
    const article = document.createElement("article");
    article.className = `ai-message is-${item.role}`;
    const label = document.createElement("strong");
    label.textContent = item.role === "user" ? "You" : "Study AI";
    const bubble = document.createElement("p");
    bubble.textContent = item.content;
    article.append(label, bubble);
    list.appendChild(article);
  });
  list.scrollTop = list.scrollHeight;
}

function setBusy(value, message) {
  busy = value;
  send.disabled = value;
  input.disabled = value;
  status.textContent = message || (value
    ? "Working…"
    : "Runs on your device with no account or hosted AI quota. Check important facts and sources.");
}

async function getEngine() {
  if (engine) return engine;
  if (!navigator.gpu) {
    throw new Error("This browser does not support WebGPU. Try current Chrome or Edge with hardware acceleration enabled.");
  }
  if (!enginePromise) {
    enginePromise = CreateMLCEngine(MODEL, {
      initProgressCallback(report) {
        const progress = Number.isFinite(report.progress) ? ` ${Math.round(report.progress * 100)}%` : "";
        setBusy(true, `${report.text || "Preparing the local model"}${progress}`);
      }
    }).then((loaded) => {
      engine = loaded;
      return loaded;
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

function cleanText(value, limit = 1400) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

async function searchWikipedia(query) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "4",
    prop: "extracts|info",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
    format: "json",
    origin: "*"
  });
  const response = await fetch(`${WIKIPEDIA_ENDPOINT}?${params}`);
  if (!response.ok) throw new Error("Search unavailable");
  const data = await response.json();
  const pages = Object.values(data.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  return pages.map((page) => ({
    title: cleanText(page.title, 120),
    url: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
    extract: cleanText(page.extract)
  })).filter((page) => page.extract);
}

function sourceContext(sources) {
  if (!sources.length) return "No live reference snippets were available. Do not invent citations.";
  return `Wikipedia reference snippets:\n${sources.map((source, index) =>
    `${index + 1}. ${source.title} — ${source.url}\n${source.extract}`
  ).join("\n\n")}\n\nUse only these URLs for factual source links. If they do not answer the question, say so.`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = input.value.trim();
  if (!prompt || busy) return;

  history.push({ role: "user", content: prompt });
  history = history.slice(-MAX_HISTORY);
  input.value = "";
  saveHistory();
  render();
  setBusy(true, engine ? "Searching Wikipedia…" : "Preparing local AI for its first use…");

  try {
    const [localEngine, sources] = await Promise.all([
      getEngine(),
      searchWikipedia(prompt).catch(() => [])
    ]);
    setBusy(true, "Writing an answer on your device…");
    const messages = [{
      role: "system",
      content: "You are Study AI, a concise academic tutor. Teach clearly, break down difficult ideas, distinguish evidence from inference, and admit uncertainty. Never invent facts, quotations, or citations. When reference snippets are supplied, cite relevant claims using markdown links and end with a short Sources section. Help the learner understand rather than pretending to have completed experiments or original research."
    }, {
      role: "system",
      content: sourceContext(sources)
    }, ...history.slice(-10)];

    const response = await localEngine.chat.completions.create({
      messages,
      temperature: 0.35,
      max_tokens: 700
    });
    const answer = response.choices?.[0]?.message?.content?.trim() || "I couldn't produce an answer. Try rephrasing the question.";
    history.push({ role: "assistant", content: answer });
    history = history.slice(-MAX_HISTORY);
    saveHistory();
    render();
    setBusy(false);
  } catch (error) {
    setBusy(false, error?.message || "The local AI could not start on this device.");
  }
  input.focus();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clear.addEventListener("click", () => {
  history = [];
  saveHistory();
  render();
  status.textContent = "Chat cleared. The local model stays cached on this device.";
  input.focus();
});

loadHistory();
render();
input.focus();
