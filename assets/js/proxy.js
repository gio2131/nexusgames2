(function(){
  "use strict";
  var frame=document.getElementById("proxy-frame"), waiting=document.getElementById("proxy-waiting"), status=document.getElementById("proxy-status"), retry=document.getElementById("proxy-retry");
  var configured=window.NEXUS_PROXY_URL;
  if(!configured) return;
  var origin;
  try { var url=new URL(configured); if(url.protocol!=="https:" && !(url.protocol==="http:" && ["localhost","127.0.0.1"].includes(url.hostname))) throw new Error(); origin=url.origin; } catch(error){status.textContent="The proxy connection needs an update. Please check back soon.";return;}
  var timer;
  function connect(){ retry.hidden=true; status.textContent="Connecting to the proxy. It may take a minute to wake up."; frame.hidden=false; frame.src=origin+"/"; clearTimeout(timer); timer=setTimeout(function(){status.textContent="The proxy is still waking up, or is temporarily unavailable.";retry.hidden=false;},90000); }
  window.addEventListener("message",function(event){if(event.origin===origin&&event.source===frame.contentWindow&&event.data?.type==="nexus-proxy-ready"){clearTimeout(timer);waiting.hidden=true;}});
  retry.addEventListener("click",connect); connect();
})();
