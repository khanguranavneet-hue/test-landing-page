(function () {
  "use strict";

  /* ---------- CONFIG ---------- */
  // Paste a YouTube/Vimeo embed URL (https://www.youtube.com/embed/...) or an .mp4 path/URL here.
  var VIDEO_URL = "";
  var PASS_MARK = 80;

  /* ---------- CONTENT ---------- */
  var KC = {
    kc1: { q: "Which description fits a star?",
      o: ["A tall candle that engulfs the previous one", "A small real body whose body does not overlap the prior long body", "Any candle with a long upper shadow", "Two candles with identical highs"],
      a: 1, f: "A star is defined by a small body that gaps away from the preceding long body; shadows may still overlap." },
    kc2: { q: "Which sequence is a morning star?",
      o: ["Long white, small body above, long black", "Long black, small body below, white closing well into the black body", "Three small bodies in a row", "Long black, long black, long white"],
      a: 1, f: "Morning star = long black, small star, then a white body that rises well into the first body." },
    kc3: { q: "Where does an evening star's resistance zone sit?",
      o: ["At the lowest low of the three candles", "At the close of candle 3", "Around the highest high of the three candles", "At the open of candle 1"],
      a: 2, f: "The highest high of the pattern marks the resistance area." },
    kc4: { q: "What makes a doji star an abandoned baby?",
      o: ["The doji has very long shadows", "The doji's shadows do not touch the shadows of the candles on either side", "Volume is very low", "The third candle is a doji too"],
      a: 1, f: "A gap before and after the doji, measured in shadows, makes it an abandoned baby." },
    kc5: { q: "On a 15-minute chart a morning star has touching bodies. What is the sensible reading?",
      o: ["Ignore it: touching bodies always invalidate the pattern", "Accept it as a possible morning star, since intraday opens sit near prior closes", "Treat it as a bearish signal", "Wait for a gap of at least 5%"],
      a: 1, f: "In markets and timeframes where open and close nearly coincide, the rule is relaxed." },
    kc6: { q: "A morning star completes after a big bounce. Which approach can improve risk/reward?",
      o: ["Buy immediately at any price", "Wait for a pullback toward the pattern's support and place the stop just below its low", "Place the stop far above the entry", "Skip stops entirely"],
      a: 1, f: "Entering near the support zone with a stop just under the pattern's low shrinks the risk." }
  };

  var FINAL = [
    { q: "A star's real body must:", o: ["Be a doji", "Be the same colour as the prior candle", "Not overlap the preceding long real body", "Have no shadows"], a: 2,
      f: "The defining test is that the star's body gaps away from the preceding body." },
    { q: "A morning star appears after:", o: ["An uptrend", "A downtrend", "A sideways range only", "A gap up"], a: 1,
      f: "It is a bottom reversal, so it needs a prior decline." },
    { q: "The third candle of a good evening star:", o: ["Is a small doji", "Is white and above the star", "Is black and closes well into the first white body", "Must open at a new high"], a: 2,
      f: "A deep close into candle 1's body is what confirms the turn." },
    { q: "Which factor increases the odds that a morning or evening star works?", o: ["Heavy volume on candle 1, light on candle 3", "Light volume on candle 1, heavy on candle 3", "Equal volume on all three", "Volume is irrelevant"], a: 1,
      f: "Fading force in the old trend and growing force in the new one." },
    { q: "How is an evening star different from a Western island top?", o: ["It needs no prior trend", "It needs only the middle real body (not the whole session) to sit above the neighbours", "It needs three gaps", "It is always bullish"], a: 1,
      f: "The island top requires shadows to gap too; the evening star only requires the bodies to." },
    { q: "Which pattern is described as very rare?", o: ["Morning star", "Evening star", "Abandoned baby", "Star in a downtrend"], a: 2,
      f: "Gaps on both sides of a doji, shadows included, rarely happen." },
    { q: "Where is touching-body flexibility most justified?", o: ["Thinly traded small caps", "Forex and short intraday charts", "Weekly charts of single stocks", "Only monthly charts"], a: 1,
      f: "Where the open is usually about the prior close, strict gaps are uncommon." },
    { q: "A star pattern is complete only at the close of candle 3. What is the main consequence?", o: ["The signal can arrive after a big move, hurting risk/reward", "The signal always arrives before the turn", "Volume no longer matters", "You can ignore stops"], a: 0,
      f: "Late completion is why waiting for a pullback to the pattern's zone can be useful." }
  ];

  /* ---------- STATE ---------- */
  var pages, cur = 0, visited = {}, best = 0, passed = false;
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- CHARTS (original SVG diagrams) ---------- */
  function drawChart(el) {
    var cfg = JSON.parse(el.getAttribute("data-chart"));
    var c = cfg.c, n = c.length, H = cfg.h || 220, pad = 30, W = n * 64 + 30;
    var lo = Infinity, hi = -Infinity;
    c.forEach(function (k) { lo = Math.min(lo, k[2]); hi = Math.max(hi, k[1]); });
    (cfg.lines || []).forEach(function (l) { lo = Math.min(lo, l.y); hi = Math.max(hi, l.y); });
    var span = (hi - lo) || 1;
    function Y(v) { return pad + (hi - v) / span * (H - 2 * pad - 14); }
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + (cfg.alt || "Candlestick diagram") + '">';
    (cfg.lines || []).forEach(function (l) {
      var ly = Y(l.y), tw = l.t.length * 7.2 + 14, cls = l.k === "r" ? "chip-r" : "chip-s";
      s += '<line class="lvl" x1="6" x2="' + (W - 6) + '" y1="' + ly + '" y2="' + ly + '"/>';
      // label chip (colour is reinforced by the word and by its position)
      s += '<g class="' + cls + '"><rect x="12" y="' + (l.k === "r" ? ly + 5 : ly - 21) + '" width="' + tw + '" height="16"/>' +
           '<text x="19" y="' + (l.k === "r" ? ly + 17 : ly - 9) + '">' + l.t + "</text></g>";
    });
    c.forEach(function (k, i) {
      var x = 40 + i * 64, o = k[0], h = k[1], l = k[2], cl = k[3];
      var top = Y(Math.max(o, cl)), bot = Y(Math.min(o, cl));
      var ht = Math.max(bot - top, 2.5);
      s += '<g class="candle ' + (cl >= o ? "up" : "down") + '">';
      s += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(h) + '" y2="' + Y(l) + '"/>';
      s += '<rect x="' + (x - 14) + '" y="' + top + '" width="28" height="' + ht + '"/></g>';
      if (cfg.labels && cfg.labels[i]) s += '<text class="lbl" x="' + x + '" y="' + (H - 6) + '">' + cfg.labels[i] + "</text>";
    });
    el.innerHTML = s + "</svg>";
  }

  /* ---------- KNOWLEDGE CHECKS ---------- */
  function buildKC(el) {
    var d = KC[el.getAttribute("data-kc")];
    el.className = "kc-card";
    var L = "ABCD";
    var h = '<div class="kc-head"><span>Knowledge check ' + (el.getAttribute("data-n") || "") + '</span><span>Not scored</span></div><div class="kc-body"><p><b>' + d.q + '</b></p><div class="opts">';
    d.o.forEach(function (t, i) { h += '<button type="button" data-i="' + i + '"><span class="k">' + L[i] + '</span><span>' + t + "</span></button>"; });
    el.innerHTML = h + '</div><p class="fb" hidden></p></div>';
    $$("button", el).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.getAttribute("data-i"), ok = i === d.a;
        $$("button", el).forEach(function (x, j) {
          x.disabled = true;
          if (j === d.a) x.classList.add("right");
          else if (j === i) x.classList.add("wrong");
        });
        var fb = $(".fb", el);
        fb.hidden = false;
        fb.innerHTML = "<b>" + (ok ? "Correct" : "Not quite") + "</b><br>" + d.f;
      });
    });
  }

  /* ---------- RISK / REWARD ---------- */
  function setupCalc() {
    var e = $("#in-entry"), s = $("#in-stop"), t = $("#in-target");
    // Trade map: the three levels from the InvestED mark (target / entry / stop), drawn to scale from the inputs.
    function drawMap(tv, ev, sv) {
      var vals = [tv, ev, sv];
      if (vals.some(function (v) { return !isFinite(v); })) return;
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1;
      var H = 190, top = 30, bot = H - 30;
      function Y(v) { return top + (hi - v) / span * (bot - top); }
      var yt = Y(tv), ye = Y(ev), ys = Y(sv);
      var lv = [["tgt", "TARGET", tv, yt], ["ent", "ENTRY", ev, ye], ["stp", "STOP", sv, ys]];
      var g = '<svg viewBox="0 0 560 ' + H + '" role="img" aria-label="Target, entry and stop levels drawn to scale">';
      lv.forEach(function (l) {
        g += '<line class="lvl ' + l[0] + '" x1="130" x2="540" y1="' + l[3] + '" y2="' + l[3] + '"/>';
        g += '<text class="lt ' + l[0] + '" x="14" y="' + (l[3] + 4) + '">' + l[1] + " " + l[2] + "</text>";
      });
      var a = Math.min(yt, ye, ys) - 12, b = Math.max(yt, ye, ys) + 12;
      g += '<line class="spine" x1="335" x2="335" y1="' + a + '" y2="' + b + '"/>';
      g += '<rect class="body" x="325" y="' + Math.min(ye, ys) + '" width="20" height="' + Math.max(Math.abs(ye - ys), 4) + '"/>';
      $("#tradeline").innerHTML = g + "</svg>";
    }
    function upd() {
      drawMap(+t.value, +e.value, +s.value);
      var risk = Math.abs(+e.value - +s.value), rew = Math.abs(+t.value - +e.value);
      if (!risk) { $("#rr").textContent = "–"; $("#rrnote").textContent = "Stop and entry cannot be equal."; return; }
      var r = rew / risk;
      $("#rr").textContent = r.toFixed(2) + " : 1";
      $("#rrnote").textContent = "Risk " + risk.toFixed(2) + " points, reward " + rew.toFixed(2) + " points. " +
        (r >= 3 ? "A comfortable ratio on paper." : r >= 2 ? "Acceptable on paper, but ask how likely the target really is." : "Thin: consider a better entry or a closer stop.");
    }
    [e, s, t].forEach(function (x) { x.addEventListener("input", upd); });
    upd();
  }

  /* ---------- VIDEO ---------- */
  function setupVideo() {
    var slot = $("#videoslot");
    if (!VIDEO_URL) {
      slot.innerHTML = "<div><b>Video placeholder</b><br>Set <code>VIDEO_URL</code> at the top of <code>js/course.js</code> to a YouTube/Vimeo embed link or an .mp4 file.</div>";
    } else if (/\.mp4($|\?)/i.test(VIDEO_URL)) {
      slot.innerHTML = '<video controls src="' + VIDEO_URL + '"></video>';
    } else {
      slot.innerHTML = '<iframe src="' + VIDEO_URL + '" allowfullscreen title="Lesson video"></iframe>';
    }
  }

  /* ---------- FINAL QUIZ ---------- */
  function buildQuiz() {
    var f = $("#quizform"), h = "";
    FINAL.forEach(function (q, i) {
      h += '<div class="quiz-q"><span class="qn">QUESTION ' + (i + 1) + " / " + FINAL.length + "</span><p><b>" + q.q + "</b></p>";
      q.o.forEach(function (t, j) {
        h += '<label><input type="radio" name="q' + i + '" value="' + j + '"><span>' + t + "</span></label>";
      });
      h += "</div>";
    });
    f.innerHTML = h;
    $("#submitq").addEventListener("click", submitQuiz);
  }

  function submitQuiz() {
    var correct = 0, review = "", missing = 0;
    FINAL.forEach(function (q, i) {
      var sel = $('input[name="q' + i + '"]:checked');
      if (!sel) { missing++; return; }
      var ok = +sel.value === q.a;
      if (ok) correct++;
      review += '<div class="rv ' + (ok ? "ok" : "bad") + '">' + (i + 1) + ". " + q.f + "</div>";
    });
    var box = $("#qresult");
    if (missing) { box.innerHTML = '<div class="result fail">Please answer all questions (' + missing + " left).</div>"; return; }
    var score = Math.round(correct / FINAL.length * 100), ok = score >= PASS_MARK;
    best = Math.max(best, score);
    if (ok) passed = true;

    SCORM.set("cmi.core.score.min", 0);
    SCORM.set("cmi.core.score.max", 100);
    SCORM.set("cmi.core.score.raw", score);
    if (ok) SCORM.set("cmi.core.lesson_status", "passed");
    else if (!passed) SCORM.set("cmi.core.lesson_status", "failed");
    save();

    box.innerHTML = '<div class="result ' + (ok ? "pass" : "fail") + '"><div class="status">' + (ok ? "Passed" : "Not yet passed") + '</div><div class="big">' + score + "%</div>" +
      "<p>" + (ok ? "You know what a star is telling you. Next: see it on real charts." : "Below the " + PASS_MARK + "% pass mark. Read the explanations, review the lesson and try again.") + "</p>" +
      review + (ok ? "" : '<p><button class="btn" id="retry" type="button">Retry quiz</button></p>') + "</div>";
    var r = $("#retry");
    if (r) r.addEventListener("click", function () { $("#quizform").reset(); box.innerHTML = ""; window.scrollTo(0, 0); });
    box.scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- NAV & PERSISTENCE ---------- */
  function save() {
    var v = pages.map(function (p, i) { return visited[i] ? 1 : 0; }).join("");
    SCORM.set("cmi.core.lesson_location", cur);
    SCORM.set("cmi.suspend_data", JSON.stringify({ p: cur, v: v, b: best, ok: passed ? 1 : 0 }));
    SCORM.commit();
  }

  function render() {
    pages.forEach(function (p, i) { p.classList.toggle("show", i === cur); });
    visited[cur] = true;
    $$("#menu button").forEach(function (b, i) {
      b.classList.toggle("on", i === cur);
      b.classList.toggle("done", !!visited[i]);
      $(".tick", b).textContent = visited[i] ? "✓" : "";
    });
    var seen = Object.keys(visited).length;
    $("#barfill").style.width = Math.round(seen / pages.length * 100) + "%";
    $("#proglabel").textContent = "Progress " + seen + "/" + pages.length;
    $("#pagelabel").textContent = pad2(cur + 1) + " / " + pad2(pages.length);
    $("#prev").disabled = cur === 0;
    $("#next").disabled = cur === pages.length - 1;
    window.scrollTo(0, 0);
    save();
  }

  function go(i) { if (i >= 0 && i < pages.length) { cur = i; render(); } }

  function init() {
    SCORM.init();
    pages = $$(".page");

    var menu = $("#menu");
    pages.forEach(function (p, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="n">' + pad2(i + 1) + "</span><span>" + p.getAttribute("data-title") + '</span><span class="tick"></span>';
      b.addEventListener("click", function () { go(i); });
      menu.appendChild(b);
    });

    $$(".chart").forEach(drawChart);
    $$(".kc").forEach(buildKC);
    setupCalc();
    setupVideo();
    buildQuiz();

    var st = SCORM.get("cmi.core.lesson_status");
    if (!st || st === "not attempted") SCORM.set("cmi.core.lesson_status", "incomplete");
    try {
      var sd = JSON.parse(SCORM.get("cmi.suspend_data") || "{}");
      if (sd.v) sd.v.split("").forEach(function (ch, i) { if (ch === "1") visited[i] = true; });
      if (typeof sd.p === "number" && sd.p < pages.length) cur = sd.p;
      best = sd.b || 0;
      passed = !!sd.ok || st === "passed";
    } catch (e) {}

    $("#prev").addEventListener("click", function () { go(cur - 1); });
    $("#next").addEventListener("click", function () { go(cur + 1); });
    window.addEventListener("beforeunload", function () { save(); SCORM.finish(); });
    window.addEventListener("unload", function () { SCORM.finish(); });
    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
