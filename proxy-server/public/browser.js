// Adapted from Interstellar's search.js transport, URL codec and worker setup.
import { BareMuxConnection } from '/baremux/index.mjs';
const frame = document.getElementById('browser-frame');
const start = document.getElementById('start');
const status = document.getElementById('status');
const address = document.getElementById('address');
let ready = false;
const history = [];
let historyIndex = -1;
const startup = (async () => {
  try {
    if (!('serviceWorker' in navigator)) throw new Error('This browser does not support the proxy.');
    await navigator.serviceWorker.register('/sw.js', { scope: '/uv/' });
    // navigator.serviceWorker.ready waits for the current document's scope;
    // the proxy worker intentionally only controls /uv/, so wait on registration.
    const registration = await navigator.serviceWorker.getRegistration('/uv/');
    if (!registration.active) await new Promise((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) return reject(new Error('The browser worker could not start.'));
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') resolve();
        if (worker.state === 'redundant') reject(new Error('The browser worker could not start.'));
      });
    });
    const connection = new BareMuxConnection('/baremux/worker.js');
    await connection.setTransport('/epoxy/index.mjs', [{ wisp: (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/wisp/' }]);
    ready = true;
    status.textContent = 'Ready to browse';
    parent.postMessage({ type: 'nexus-proxy-ready' }, '*');
  } catch (error) { status.textContent = 'Could not connect. Reload to try again.'; console.error(error); }
})();
function destination(value) {
  value = value.trim();
  if (!value) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter an HTTP or HTTPS address.');
    return url.href;
  }
  if (!/\s/.test(value) && (value.includes('.') || value === 'localhost')) return new URL('https://' + value).href;
  return 'https://search.brave.com/search?q=' + encodeURIComponent(value);
}
async function navigate(value, record = true) {
  await startup;
  if (!ready) return;
  try {
    const url = destination(value);
    if (!url) return;
    if (record) { history.splice(historyIndex + 1); history.push(url); historyIndex = history.length - 1; }
    address.value = url;
    frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
    start.hidden = true; frame.hidden = false; updateButtons();
  } catch (error) { status.textContent = error.message; start.hidden = false; frame.hidden = true; }
}
function updateButtons() { document.getElementById('back').disabled = historyIndex <= 0; document.getElementById('forward').disabled = historyIndex >= history.length - 1; }
document.getElementById('address-form').addEventListener('submit', event => { event.preventDefault(); navigate(address.value); });
document.getElementById('search-form').addEventListener('submit', event => { event.preventDefault(); navigate(document.getElementById('search').value); });
document.getElementById('back').addEventListener('click', () => { if (historyIndex > 0) navigate(history[--historyIndex], false); });
document.getElementById('forward').addEventListener('click', () => { if (historyIndex < history.length - 1) navigate(history[++historyIndex], false); });
document.getElementById('reload').addEventListener('click', () => { if (frame.src) frame.src = frame.src; });
document.getElementById('home').addEventListener('click', () => { frame.hidden = true; start.hidden = false; address.value = ''; });
updateButtons();
