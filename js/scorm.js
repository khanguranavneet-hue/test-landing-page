/* Minimal SCORM 1.2 runtime wrapper.
   Finds the LMS-provided API object; falls back to localStorage when opened outside an LMS. */
var SCORM = (function () {
  var api = null, ready = false, standalone = false, finished = false, store = {}, t0 = new Date();

  function find(w) {
    var n = 0;
    while (w && !w.API && w.parent && w.parent !== w && n < 10) { n++; w = w.parent; }
    return (w && w.API) || null;
  }

  function init() {
    try { api = find(window); } catch (e) { api = null; }
    if (!api && window.opener) { try { api = find(window.opener); } catch (e) {} }
    if (api) { ready = String(api.LMSInitialize("")) === "true"; }
    if (!ready) {
      standalone = true;
      try { store = JSON.parse(localStorage.getItem("scorm_demo") || "{}"); } catch (e) { store = {}; }
    }
    return ready;
  }

  function get(k) { return ready ? String(api.LMSGetValue(k)) : (store[k] || ""); }

  function set(k, v) {
    if (ready) return String(api.LMSSetValue(k, String(v))) === "true";
    store[k] = String(v);
    try { localStorage.setItem("scorm_demo", JSON.stringify(store)); } catch (e) {}
    return true;
  }

  function commit() { if (ready) api.LMSCommit(""); }

  function pad(n, l) { n = String(n); while (n.length < l) n = "0" + n; return n; }

  function sessionTime() {
    var s = Math.round((new Date() - t0) / 1000);
    return pad(Math.floor(s / 3600), 4) + ":" + pad(Math.floor((s % 3600) / 60), 2) + ":" + pad(s % 60, 2);
  }

  function finish() {
    if (finished) return;
    finished = true;
    set("cmi.core.session_time", sessionTime());
    if (ready) { api.LMSCommit(""); api.LMSFinish(""); ready = false; }
  }

  return { init: init, get: get, set: set, commit: commit, finish: finish, isStandalone: function () { return standalone; } };
})();
