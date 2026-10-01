# Nexus proxy

This is an adaptation of the supplied `ra/proxy` Interstellar source. It keeps its Ultraviolet proxy, BareMux/Epoxy transport and Wisp server, with a plain black Nexus browser UI. Original source: https://github.com/UseInterstellar/Interstellar. Adapted server, worker and browser integration: GPL-3.0-or-later; see LICENSE. Dependency licenses remain their own.

Run `npm ci` then `npm start` in this directory. It listens on `PORT` or 8080. Use HTTPS in production (localhost is supported for testing). GitHub Pages cannot run this server.

Deploy the root `render.yaml` as a Render Blueprint, or create a free Node web service from this repo with root directory `proxy-server`, build command `npm ci`, start command `npm start`, and health check `/health`. After deployment set `window.NEXUS_PROXY_URL` in `assets/js/proxy-config.js` to the HTTPS origin. The Proxy tab then embeds the server.

The server blocks requests to loopback and private IPs. It does not add the original source's analytics, ads, popup cloaking or admin features.
