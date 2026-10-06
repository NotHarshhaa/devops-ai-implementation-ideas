/* DevOps AI Implementation Ideas — catalog rendering & interactions */
(function () {
  "use strict";

  var REPO = "https://github.com/NotHarshhaa/devops-ai-implementation-ideas";
  var BRANCH = "master";
  var IDEAS = window.IDEAS || [];

  var AREA_ORDER = [
    "CI/CD", "Kubernetes", "IaC", "Cloud", "Observability & SRE", "SRE",
    "DevSecOps", "Developer Experience", "Platform Engineering", "Agentic DevOps"
  ];

  var state = { area: "All", query: "", view: "grid" };
  var lastFocus = null;

  /* ---------- helpers ---------- */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function dirName(idea) { return pad(idea.num) + "-" + idea.slug; }

  function ghUrl(idea, file) {
    return REPO + "/blob/" + BRANCH + "/" + dirName(idea) + "/" + file;
  }

  function areaCount(area) {
    return IDEAS.filter(function (i) { return i.area === area; }).length;
  }

  /* ---------- filtering ---------- */

  function haystack(idea) {
    if (!idea._hay) {
      idea._hay = [
        idea.name, idea.tldr, idea.area, idea.problem_intro, idea.solution,
        (idea.problem || []).join(" "),
        (idea.integrations || []).map(function (x) { return x[0] + " " + x[1]; }).join(" "),
        (idea.platforms || []).map(function (x) { return x[0] + " " + x[1]; }).join(" "),
        (idea.context || []).join(" ")
      ].join(" ").toLowerCase();
    }
    return idea._hay;
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    return IDEAS.filter(function (i) {
      if (state.area !== "All" && i.area !== state.area) return false;
      if (q && haystack(i).indexOf(q) === -1) return false;
      return true;
    });
  }

  /* ---------- area tabs ---------- */

  function renderTabs() {
    var tabs = [{ area: "All", count: IDEAS.length }].concat(
      AREA_ORDER
        .filter(function (a) { return areaCount(a) > 0; })
        .map(function (a) { return { area: a, count: areaCount(a) }; })
    );
    var el = $("area-tabs");
    el.innerHTML = tabs.map(function (t) {
      var active = state.area === t.area ? " active" : "";
      return '<button role="tab" aria-selected="' + (active ? "true" : "false") + '" data-area="' +
        esc(t.area) + '" class="' + active.trim() + '">' + esc(t.area) +
        ' <span class="count">' + t.count + "</span></button>";
    }).join("");
    el.onclick = function (e) {
      var btn = e.target.closest("button[data-area]");
      if (!btn) return;
      state.area = btn.getAttribute("data-area");
      renderTabs();
      renderResults();
    };
  }

  /* ---------- results ---------- */

  function renderResults() {
    var list = filtered();
    var box = $("results");
    $("result-count").textContent =
      "showing " + list.length + " of " + IDEAS.length + " ideas" +
      (state.area !== "All" ? " · area: " + state.area : "") +
      (state.query ? ' · query: "' + state.query + '"' : "");

    if (!list.length) {
      box.innerHTML =
        '<div class="empty-state">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8.5 11h5"/></svg>' +
        '<p style="margin:0">No ideas match that filter combination.</p>' +
        '<button class="btn btn-square" id="reset-filters">Reset filters</button></div>';
      $("reset-filters").onclick = function () {
        state.area = "All"; state.query = ""; $("search").value = "";
        renderTabs(); renderResults();
      };
      return;
    }

    box.innerHTML = state.view === "grid" ? gridHtml(list) : indexHtml(list);
  }

  function gridHtml(list) {
    // pad the last row of the 3-column grid so the gray grid background
    // doesn't show through as a solid block after the final card
    var fillers = (3 - (list.length % 3)) % 3;
    var fillerHtml = "";
    for (var f = 0; f < fillers; f++) fillerHtml += '<div class="card-filler" aria-hidden="true"></div>';
    return '<div class="cards-grid">' + list.map(function (i, idx) {
      return '<button class="card" data-idea="' + i.num + '" style="--i:' + idx + '">' +
        '<div class="card-top"><span class="num">' + pad(i.num) + "</span>" +
        '<span class="area-tag">' + esc(i.area) + "</span></div>" +
        "<h3>" + esc(i.name) + "</h3>" +
        '<p class="tldr">' + esc(i.tldr) + "</p>" +
        '<div class="card-meta"><span>' + esc(i.complexity) + "</span><span>" +
        esc(i.automation) + "</span></div></button>";
    }).join("") + fillerHtml + "</div>";
  }

  function indexHtml(list) {
    return '<div class="index-table">' + list.map(function (i) {
      return '<button class="index-row" data-idea="' + i.num + '">' +
        '<span class="i-num">' + pad(i.num) + "</span>" +
        '<span class="i-name">' + esc(i.name) + "</span>" +
        '<span class="i-area">' + esc(i.area) + "</span>" +
        '<span class="i-meta">' + esc(i.complexity.toLowerCase()) + " · " +
        esc(i.automation.toLowerCase()) + "</span></button>";
    }).join("") + "</div>";
  }

  /* ---------- modal ---------- */

  function tableHtml(headers, rows) {
    if (!rows || !rows.length) return "";
    var head = "<tr>" + headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr>";
    var body = rows.map(function (r) {
      return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return '<table class="m-table">' + head + body + "</table>";
  }

  function listHtml(items) {
    return "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
  }

  function modalHtml(i) {
    var h = "";

    h += '<div class="modal-head"><div>' +
      '<div class="m-num">IDEA ' + pad(i.num) + " · " + esc(dirName(i)) + "</div>" +
      '<h2 id="modal-title">' + esc(i.name) + "</h2>" +
      '<div class="m-tags"><span class="area-tag">' + esc(i.area) + "</span>" +
      '<span class="area-tag">Complexity: ' + esc(i.complexity) + "</span>" +
      '<span class="area-tag">Automation: ' + esc(i.automation) + "</span></div></div>" +
      '<button class="modal-close" id="modal-close" aria-label="Close">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>';

    h += '<div class="modal-body">';

    h += '<div class="m-section"><h4>TL;DR</h4><p>' + esc(i.tldr) + "</p>" +
      '<p class="impact-note"><b>Why it matters:</b> ' + esc(i.impact) + "</p></div>";

    h += '<div class="m-section"><h4>Problem</h4><p>' + esc(i.problem_intro) + "</p>" +
      listHtml(i.problem) + "</div>";

    h += '<div class="m-section"><h4>AI Opportunity</h4>' +
      tableHtml(["AI capability", "How it helps"], i.capabilities) + "</div>";

    h += '<div class="m-section"><h4>Proposed Solution</h4><p>' + esc(i.solution) + "</p><ol>" +
      i.steps.map(function (s) { return "<li><b>" + esc(s[0]) + "</b> — " + esc(s[1]) + "</li>"; }).join("") +
      "</ol><p class='dim'><b>Human-in-the-loop:</b> " + esc(i.hitl) + "</p></div>";

    h += '<div class="m-section"><h4>Architecture</h4>' +
      '<div class="m-diagram"><div class="diag-title">high-level flow</div><pre>' + esc(i.diagram) + "</pre></div></div>";

    h += '<div class="m-section"><h4>Components</h4>' +
      tableHtml(["Component", "Responsibility"], i.components) +
      "<h4 style='margin-top:24px'>Data Flow</h4><ol>" +
      i.flow.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ol></div>";

    h += '<div class="m-section"><h4>AI Platforms</h4>' +
      tableHtml(["Category", "Options", "Role"], i.platforms) + "</div>";

    h += '<div class="m-section"><h4>DevOps Integrations</h4>' +
      tableHtml(["System / tool", "Integration point"], i.integrations) + "</div>";

    h += '<div class="m-section"><h4>Context &amp; Data Sources</h4><div class="chips">' +
      i.context.map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") + "</div></div>";

    if (i.tools && i.tools.length) {
      h += '<div class="m-section"><h4>Tools the AI may call</h4>' + listHtml(i.tools) + "</div>";
    }

    h += '<div class="m-section"><h4>Expected Benefits</h4>' + listHtml(i.benefits) + "</div>";
    h += '<div class="m-section"><h4>Safety &amp; Guardrails</h4>' + listHtml(i.security) + "</div>";

    if (i.variations) {
      h += '<div class="m-section"><h4>Alternative Approaches</h4>' + listHtml(i.variations) + "</div>";
    }
    if (i.cost) {
      h += '<div class="m-section"><h4>Cost Considerations</h4><p class="dim">' + esc(i.cost) + "</p></div>";
    }

    h += '<div class="m-section"><h4>Future Implementation</h4>' + listHtml(i.future) + "</div>";

    if (i.related && i.related.length) {
      h += '<div class="m-section"><h4>Related Ideas</h4><div class="chips">' +
        i.related.map(function (r) {
          return '<button class="chip clickable" data-related="' + r.num + '">' +
            pad(r.num) + " · " + esc(r.name) + "</button>";
        }).join("") + "</div></div>";
    }

    h += "</div>";

    h += '<div class="modal-foot"><span class="result-count" style="margin:0">📐 architecture documented · no implementation yet</span>' +
      '<div class="links">' +
      '<a class="pill" href="' + ghUrl(i, "README.md") + '" target="_blank" rel="noopener">README.md ↗</a>' +
      '<a class="pill" href="' + ghUrl(i, "architecture/architecture.md") + '" target="_blank" rel="noopener">architecture.md ↗</a>' +
      "</div></div>";

    return h;
  }

  function openModal(num, pushHash) {
    var idea = IDEAS.find(function (x) { return x.num === num; });
    if (!idea) return;
    if (!document.body.classList.contains("modal-open")) lastFocus = document.activeElement;
    $("modal-content").innerHTML = modalHtml(idea);
    $("modal-overlay").classList.add("open");
    document.body.classList.add("modal-open");
    $("modal").scrollTop = 0;
    $("modal-close").focus();
    if (pushHash !== false) {
      history.replaceState(null, "", "#idea-" + pad(idea.num));
    }
  }

  function closeModal() {
    $("modal-overlay").classList.remove("open");
    document.body.classList.remove("modal-open");
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- UI polish: mobile menu, scroll-spy, reveal, counters, terminal ---------- */

  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initMobileMenu() {
    var toggle = $("nav-toggle");
    var menu = $("mobile-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function initScrollSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".site-nav a.nav-link[href^='#']")
    );
    var byId = {};
    links.forEach(function (l) { byId[l.getAttribute("href").slice(1)] = l; });
    if (!("IntersectionObserver" in window)) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          link.classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  function initReveal() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;
    var targets = document.querySelectorAll(
      ".hero-badges, .hero .display, .hero-sub, .hero-actions, .terminal, " +
      ".section-head, .hairline-grid, .catalog-toolbar, .cta"
    );
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(targets, function (el, idx) {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", Math.min(idx % 4, 3) * 60 + "ms");
      observer.observe(el);
    });
  }

  function initStatCounters() {
    if (prefersReducedMotion) return;
    var nums = document.querySelectorAll(".stat .num");
    if (!nums.length || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      observer.disconnect();
      Array.prototype.forEach.call(nums, function (el) {
        var m = el.innerHTML.match(/^\s*(\d+)([\s\S]*)$/);
        if (!m) return;
        var target = parseInt(m[1], 10);
        var rest = m[2];
        var start = null;
        var duration = 900;
        function tick(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.innerHTML = Math.round(target * eased) + rest;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    observer.observe(document.querySelector(".stats"));
  }

  function initTerminalReveal() {
    if (prefersReducedMotion) return;
    var body = document.querySelector(".terminal-body");
    if (!body) return;
    var nodes = Array.prototype.slice.call(body.childNodes);
    var lines = [[]];
    nodes.forEach(function (n) {
      if (n.nodeName === "BR") lines.push([]);
      else lines[lines.length - 1].push(n);
    });
    body.innerHTML = "";
    lines.forEach(function (lineNodes, idx) {
      var span = document.createElement("span");
      span.className = "t-line";
      span.style.setProperty("--l", idx);
      lineNodes.forEach(function (n) { span.appendChild(n); });
      body.appendChild(span);
      if (idx < lines.length - 1) body.appendChild(document.createElement("br"));
    });
  }



  function delegateResults(e) {
    var card = e.target.closest("[data-idea]");
    if (card) openModal(parseInt(card.getAttribute("data-idea"), 10));
  }

  function init() {
    renderTabs();
    renderResults();

    initMobileMenu();
    initScrollSpy();
    initReveal();
    initStatCounters();
    initTerminalReveal();

    $("results").addEventListener("click", delegateResults);

    var searchTimer = null;
    $("search").addEventListener("input", function (e) {
      clearTimeout(searchTimer);
      var v = e.target.value;
      searchTimer = setTimeout(function () {
        state.query = v;
        renderResults();
      }, 120);
    });

    $("view-grid").addEventListener("click", function () { setView("grid"); });
    $("view-index").addEventListener("click", function () { setView("index"); });

    $("modal-overlay").addEventListener("click", function (e) {
      if (e.target === $("modal-overlay")) closeModal();
    });

    $("modal-content").addEventListener("click", function (e) {
      if (e.target.closest("#modal-close")) { closeModal(); return; }
      var rel = e.target.closest("[data-related]");
      if (rel) openModal(parseInt(rel.getAttribute("data-related"), 10));
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("modal-open")) closeModal();
      if (e.key === "/" && document.activeElement !== $("search") &&
          !document.body.classList.contains("modal-open")) {
        e.preventDefault();
        $("search").focus();
      }
    });

    var header = document.querySelector(".site-header");
    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }, { passive: true });

    // deep link: #idea-07
    var m = location.hash.match(/^#idea-(\d{2})$/);
    if (m) openModal(parseInt(m[1], 10), false);
  }

  function setView(v) {
    state.view = v;
    $("view-grid").classList.toggle("active", v === "grid");
    $("view-index").classList.toggle("active", v === "index");
    $("view-grid").setAttribute("aria-pressed", v === "grid");
    $("view-index").setAttribute("aria-pressed", v === "index");
    renderResults();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
