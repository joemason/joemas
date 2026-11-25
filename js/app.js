/* Online safety risk assessment tool. Runs entirely in the browser. */
(function () {
  "use strict";

  const D = window.OSRA_DATA;
  const STORE_KEY = "osra.assessments.v1";
  const LARGE_THRESHOLD = 7000000; // average monthly active UK users
  const app = document.getElementById("app");
  let framed = false;
  try {
    framed = window.self !== window.top;
  } catch (e) {
    framed = true;
  }

  const STEPS = [
    { id: "service", name: "Your service", short: "Service" },
    { id: "factors", name: "Risk factors", short: "Risk factors" },
    { id: "harms", name: "Assess the risks", short: "Assess" },
    { id: "measures", name: "Safety measures", short: "Measures" },
    { id: "review", name: "Record and review", short: "Review" },
    { id: "report", name: "Report", short: "Report" },
  ];

  const ORDER = { negligible: 0, low: 1, medium: 2, high: 3 };
  const higher = (x, y) => (ORDER[x] >= ORDER[y] ? x : y);

  // ---------- storage ----------
  let storageOk = true;
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
  } catch (e) {
    storageOk = false;
    store = {};
  }

  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 250);
  }
  function persistNow() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      storageOk = true;
    } catch (e) {
      storageOk = false;
    }
    const s = document.getElementById("save-status");
    if (s) s.textContent = storageOk ? "Saved on this device" : "Not saved: export a file to keep your work";
  }
  window.addEventListener("beforeunload", persistNow);

  // ---------- helpers ----------
  function h(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function addMonths(iso, n) {
    const d = iso ? new Date(iso) : new Date();
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  }
  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, val) {
    const keys = path.split(".");
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null || typeof o[keys[i]] !== "object") o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }
  const harmById = Object.fromEntries(D.harms.map((x) => [x.id, x]));
  const levelName = Object.fromEntries(D.levels.map((x) => [x.id, x.name]));
  const statusName = Object.fromEntries(D.statuses.map((x) => [x.id, x.name]));
  const allFactors = D.factorGroups.flatMap((g) => g.factors.map((f) => Object.assign({ group: g.id }, f)));
  const factorById = Object.fromEntries(allFactors.map((f) => [f.id, f]));

  function blankAssessment() {
    return {
      id: uid(),
      version: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: { kinds: { u2u: true, search: false }, startDate: today() },
      factors: {},
      factorsReviewed: false,
      harms: {},
      measures: {},
      customMeasures: [],
      questions: {},
      general: {},
      review: {},
    };
  }

  // ---------- derived state ----------
  function kinds(a) {
    const k = (a.profile && a.profile.kinds) || {};
    const out = [];
    if (k.u2u) out.push("u2u");
    if (k.search) out.push("search");
    return out.length ? out : ["u2u"];
  }
  function groupsFor(a) {
    const ks = kinds(a);
    return D.factorGroups.filter((g) => g.services.some((s) => ks.includes(s)));
  }
  function activeFactors(a) {
    const visible = new Set(groupsFor(a).flatMap((g) => g.factors.map((f) => f.id)));
    return allFactors.filter((f) => visible.has(f.id) && a.factors[f.id]);
  }
  function hasFactor(a) {
    const set = {};
    activeFactors(a).forEach((f) => (set[f.id] = true));
    return set;
  }
  function factorsForHarm(a, harmId) {
    return activeFactors(a).filter((f) => (f.raises || []).includes(harmId));
  }
  function profileCount(harmId) {
    return (D.profileLinks[harmId] || []).length;
  }
  function users(a) {
    return Number(String((a.profile && a.profile.ukUsers) || "").replace(/[^0-9.]/g, "")) || 0;
  }
  function childrenCanAccess(a) {
    const c = a.profile && a.profile.children;
    return c === "yes" || c === "unsure";
  }

  // Indicative levels from Ofcom's CSEA Risk Level Tables (RAG Tables
  // 13.1 to 13.3). Ofcom says not to apply them mechanically, so these are
  // shown as guidance alongside the user's own judgement.
  function cseaIndicative(a, harmId) {
    if (!kinds(a).includes("u2u")) return null;
    const f = hasFactor(a);
    const q = a.questions || {};
    const ev = ((a.harms[harmId] || {}).occurrence) || "";
    const count = (ids) => ids.filter((id) => (id === "noaccount" ? q.q_images_noaccount : f[id])).length;
    const fromEvidence = ev === "significant" ? "high" : ev === "some" ? "medium" : null;
    let level, why;
    if (harmId === "csam_image") {
      const images = f["5e"] || f["1d"] || f["1g"] || f["5a"];
      const list = ["2", "1a", "1b", "1e", "4b", "5a", "5b", "5c", "noaccount"];
      const n = count(list);
      if (!images) { level = "negligible"; why = "Users can't generate, upload or share images or videos."; }
      else if (f["1g"] || f["1d"]) { level = "high"; why = "Image sharing on a file-storage, file-sharing or adult service is normally high risk."; }
      else if (n >= 5) { level = "high"; why = `You have ${n} of the 9 risk factors in Ofcom's table ('a lot').`; }
      else if (n >= 2) { level = "medium"; why = `You have ${n} of the 9 risk factors in Ofcom's table ('several').`; }
      else { level = "low"; why = `You have ${n} of the 9 risk factors in Ofcom's table, and no evidence of image-based CSAM.`; }
    } else if (harmId === "csam_url") {
      const text = ["1a", "1b", "1c", "1e", "4b", "5b", "5d", "7b"].some((id) => f[id]) || q.q_text_noaccount;
      const list = ["2", "1a", "1b", "1e", "4b", "5b", "5c"];
      const n = count(list);
      if (!text) { level = "negligible"; why = "Users can't share text or hyperlinks."; }
      else if (q.q_text_noaccount) { level = "high"; why = "Users can share text or links without an account, which is normally high risk."; }
      else if (n >= 2) { level = "medium"; why = `You have ${n} of the 7 risk factors in Ofcom's table ('several').`; }
      else { level = "low"; why = `You have ${n} of the 7 risk factors in Ofcom's table, and no evidence of CSAM URLs.`; }
    } else if (harmId === "grooming") {
      const list = ["1a", "1b", "1c", "5a", "5c", "5d"];
      const n = count(list);
      if (!childrenCanAccess(a)) { level = "negligible"; why = "Children can't access the service."; }
      else if (!f["5b"]) { level = "low"; why = "Children can access the service, but users can't message them one-to-one."; }
      else if (q.q_nep_children || q.q_connection_lists || q.q_profiles_reveal) { level = "high"; why = "Children can be messaged one-to-one and can be identified or suggested to other users, which is normally high risk."; }
      else if (n >= 4) { level = "high"; why = `Children can be messaged one-to-one and you have ${n} of the 6 risk factors in Ofcom's table ('a lot').`; }
      else if (n >= 2) { level = "medium"; why = `Children can be messaged one-to-one and you have ${n} of the 6 risk factors in Ofcom's table ('several').`; }
      else { level = "low"; why = "Children can be messaged one-to-one, but you have few of the risk factors in Ofcom's table."; }
    } else return null;
    if (fromEvidence && ORDER[fromEvidence] >= ORDER[level]) {
      level = fromEvidence;
      why = ev === "significant" ? "There is evidence it has occurred to a significant extent, which is the strongest indicator of high risk." : "There is evidence it has occurred, but not to a significant extent, which is a strong indicator of medium risk.";
    }
    return { level, why };
  }
  // Ofcom: where evidence isn't conclusive, err on the side of caution and
  // choose the higher level (RAG 3.3). So suggest the higher of the two.
  function suggestedLevel(a, harmId) {
    const e = a.harms[harmId] || {};
    let s = e.likelihood && e.impact ? higher(e.likelihood, e.impact) : null;
    const ind = harmById[harmId] && harmById[harmId].csea ? cseaIndicative(a, harmId) : null;
    if (ind && s) s = higher(s, ind.level);
    else if (ind && !s && (e.likelihood || e.impact)) s = null;
    return s;
  }
  function harmLevelOf(a, harmId) {
    const e = a.harms[harmId];
    if (!e) return null;
    if (e.negligible) return "negligible";
    if (e.override) return e.override;
    return suggestedLevel(a, harmId);
  }
  function levelsMap(a) {
    const m = {};
    D.harms.forEach((x) => (m[x.id] = harmLevelOf(a, x.id)));
    return m;
  }
  function isLarge(a) {
    return users(a) > LARGE_THRESHOLD;
  }
  // Multi-risk: medium or high for 2+ kinds of harm in the Codes' Table C,
  // counting CSEA once (ICU 5.6). Cyberflashing and other content don't count.
  function multiRiskKinds(a) {
    const m = levelsMap(a);
    const mh = (id) => m[id] === "medium" || m[id] === "high";
    const kindsList = D.harms.filter((x) => x.codes !== false && !x.csea).filter((x) => mh(x.id)).map((x) => x.name);
    if (D.harms.some((x) => x.csea && mh(x.id))) kindsList.unshift("CSEA");
    return kindsList;
  }
  function multiRiskCount(a) {
    return multiRiskKinds(a).length;
  }
  function isMulti(a) {
    return multiRiskCount(a) >= 2;
  }
  function codesContext(a) {
    const m = levelsMap(a);
    const list = (ids) => (Array.isArray(ids) ? ids : [ids]);
    const f = hasFactor(a);
    return {
      large: isLarge(a),
      largeGeneral: isLarge(a) && !!f.s1a,
      over700k: users(a) > 700000,
      multi: isMulti(a),
      f,
      q: a.questions || {},
      images: !!(f["5e"] || f["1d"] || f["1g"] || f["5a"]),
      category: a.profile.category || "",
      likelyChildren: childrenCanAccess(a),
      anyMedHigh: D.harms.some((x) => !x.other && (m[x.id] === "medium" || m[x.id] === "high")),
      medHigh: (ids) => list(ids).some((id) => m[id] === "medium" || m[id] === "high"),
      high: (ids) => list(ids).some((id) => m[id] === "high"),
      medium: (ids) => list(ids).some((id) => m[id] === "medium"),
      countMedHigh: (groups) => groups.filter((g) => g.some((id) => m[id] === "medium" || m[id] === "high")).length,
    };
  }
  function measuresFor(a) {
    const ks = kinds(a);
    const c = codesContext(a);
    return D.measures
      .filter((m) => ks.includes(m.service))
      .map((m) => ({ m, reason: m.applies(c) ? m.rule : null }));
  }

  // ---------- progress ----------
  function stepDone(a, step) {
    const p = a.profile || {};
    switch (step) {
      case "service":
        return !!(p.orgName && p.serviceName && p.ukUsers && p.children && (p.kinds.u2u || p.kinds.search));
      case "factors":
        return !!a.factorsReviewed;
      case "harms":
        return D.harms.every((x) => harmLevelOf(a, x.id) && (a.harms[x.id].rationale || "").trim());
      case "measures": {
        const rec = measuresFor(a).filter((r) => r.reason);
        return rec.length > 0 && rec.every((r) => (a.measures[r.m.id] || {}).status);
      }
      case "review":
        return !!(a.review.responsible && a.review.approver && a.review.approvedOn && a.review.nextReview);
      case "report":
        return STEPS.slice(0, 5).every((s) => stepDone(a, s.id));
    }
    return false;
  }
  function progress(a) {
    const done = STEPS.slice(0, 5).filter((s) => stepDone(a, s.id)).length;
    return Math.round((done / 5) * 100);
  }

  // ---------- view helpers ----------
  function field(opts) {
    const id = opts.id || "f-" + opts.path.replace(/\./g, "-");
    const val = getPath(opts.a, opts.path);
    const hint = opts.hint ? `<p class="hint" id="${id}-hint">${opts.hint}</p>` : "";
    const describedBy = opts.hint ? ` aria-describedby="${id}-hint"` : "";
    let control;
    if (opts.type === "textarea") {
      control = `<textarea id="${id}" data-path="${opts.path}" rows="${opts.rows || 4}"${describedBy}>${h(val)}</textarea>`;
    } else if (opts.type === "select") {
      control = `<select id="${id}" data-path="${opts.path}" data-rerender${describedBy}>
        <option value="">Choose…</option>
        ${opts.options.map((o) => `<option value="${o.id}"${val === o.id ? " selected" : ""}>${h(o.name)}</option>`).join("")}
      </select>`;
    } else {
      control = `<input id="${id}" type="${opts.type || "text"}" data-path="${opts.path}" value="${h(val)}"${
        opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""
      }${opts.rerender ? " data-rerender" : ""}${describedBy}${opts.autocomplete ? ` autocomplete="${opts.autocomplete}"` : ""}>`;
    }
    return `<div class="field${opts.narrow ? " narrow" : ""}">
      <label for="${id}">${h(opts.label)}${opts.optional ? ' <span class="optional">(optional)</span>' : ""}</label>
      ${hint}${control}
    </div>`;
  }
  function radios(opts) {
    const val = getPath(opts.a, opts.path);
    const name = "r-" + opts.path.replace(/\./g, "-");
    return `<fieldset class="field radios${opts.inline ? " inline" : ""}">
      <legend>${h(opts.label)}</legend>
      ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ""}
      ${opts.options
        .map(
          (o) => `<label class="choice"><input type="radio" id="${name}-${o.id}" name="${name}" value="${o.id}" data-path="${opts.path}" data-rerender${
            val === o.id ? " checked" : ""
          }><span>${h(o.name)}${o.hint ? `<small>${h(o.hint)}</small>` : ""}</span></label>`
        )
        .join("")}
    </fieldset>`;
  }
  function checkbox(a, path, label, hint, id) {
    const val = getPath(a, path);
    const cid = id || "c-" + path.replace(/\./g, "-");
    return `<label class="choice"><input type="checkbox" id="${cid}" data-path="${path}" data-rerender${val ? " checked" : ""}><span>${h(label)}${
      hint ? `<small>${h(hint)}</small>` : ""
    }</span></label>`;
  }
  function badge(level) {
    if (!level) return `<span class="badge badge-none">Not assessed</span>`;
    return `<span class="badge badge-${level}">${levelName[level]}</span>`;
  }

  function stepNav(a, current) {
    return `<nav class="steps" aria-label="Assessment steps"><ol>
      ${STEPS.map((s, i) => {
        const done = stepDone(a, s.id);
        const cur = s.id === current;
        return `<li class="${cur ? "current" : ""}${done ? " done" : ""}">
          <a href="#${s.id}-${a.id}"${cur ? ' aria-current="step"' : ""}>
            <span class="num" aria-hidden="true">${done ? "✓" : i + 1}</span>
            <span class="label">${h(s.short)}</span>
            ${done ? '<span class="sr-only">(complete)</span>' : ""}
          </a></li>`;
      }).join("")}
    </ol></nav>`;
  }
  function pager(a, current) {
    const i = STEPS.findIndex((s) => s.id === current);
    const prev = STEPS[i - 1];
    const next = STEPS[i + 1];
    return `<div class="pager">
      ${prev ? `<a class="btn btn-secondary" href="#${prev.id}-${a.id}">← ${h(prev.name)}</a>` : "<span></span>"}
      ${next ? `<button class="btn" data-action="next" data-next="${next.id}">Save and continue: ${h(next.name)} →</button>` : ""}
    </div>`;
  }
  function shell(a, step, body) {
    const title = (a.profile.serviceName || "Untitled service") + (a.profile.orgName ? " · " + a.profile.orgName : "");
    return `<div class="assessment-head">
        <div>
          <p class="eyebrow">Illegal content risk assessment</p>
          <h1 class="assessment-title">${h(title)}</h1>
        </div>
        <p class="save-status" id="save-status" role="status">${storageOk ? "Saved on this device" : "Not saved: export a file to keep your work"}</p>
      </div>
      ${stepNav(a, step)}
      <div class="step-body">${body}</div>
      ${pager(a, step)}`;
  }

  // ---------- views ----------
  function viewHome() {
    const list = Object.values(store).sort((x, y) => (y.updatedAt || "").localeCompare(x.updatedAt || ""));
    return `
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">Online Safety Act 2023</p>
          <h1>Complete your illegal content risk assessment</h1>
          <p class="lede">A step-by-step guide for user-to-user and search services. It follows Ofcom's four-step method,
          helps you assess every kind of priority illegal harm, and produces a written record you can keep, share and review.</p>
          <div class="actions">
            <button class="btn btn-large" data-action="new">Start a new assessment</button>
            <button class="btn btn-secondary" data-action="example">Try a worked example</button>
          </div>
          <p class="small">Your answers stay in this browser. Nothing is sent to a server.</p>
        </div>
        <ol class="method" aria-label="Ofcom's four-step method">
          <li><span>1</span><div><strong>Understand the harms</strong><p>Describe your service and identify the risk factors from Ofcom's Risk Profiles.</p></div></li>
          <li><span>2</span><div><strong>Assess the risk</strong><p>Judge the likelihood and impact of each kind of illegal harm, using evidence, and give each a risk level.</p></div></li>
          <li><span>3</span><div><strong>Decide measures</strong><p>See which Codes of Practice measures apply to you, and record what you have in place or plan.</p></div></li>
          <li><span>4</span><div><strong>Report, review, update</strong><p>Record the assessment, get it signed off, and set when you will review it.</p></div></li>
        </ol>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>Your assessments</h2>
          <button class="btn btn-secondary" data-action="open-import">Import</button>
        </div>
        ${
          list.length
            ? `<ul class="cards">${list
                .map((a) => {
                  const pct = progress(a);
                  return `<li class="card">
                    <div class="card-main">
                      <h3><a href="#service-${a.id}">${h(a.profile.serviceName || "Untitled service")}</a></h3>
                      <p class="muted">${h(a.profile.orgName || "No organisation name")} · Updated ${h(fmtDate(a.updatedAt))}</p>
                      <div class="meter" role="progressbar" aria-label="Progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
                      <p class="small muted">${pct}% complete</p>
                    </div>
                    <div class="card-actions">
                      <a class="btn btn-small" href="#${pct === 100 ? "report" : "service"}-${a.id}">${pct === 100 ? "View report" : "Continue"}</a>
                      <button class="btn btn-small btn-secondary" data-action="export" data-id="${a.id}">Export</button>
                      <button class="btn btn-small btn-ghost" data-action="duplicate" data-id="${a.id}">Duplicate</button>
                      <button class="btn btn-small btn-danger" data-action="delete" data-id="${a.id}">Delete</button>
                    </div>
                  </li>`;
                })
                .join("")}</ul>`
            : `<p class="muted">You haven't started an assessment on this device yet.</p>`
        }
      </section>

      <section class="panel faq">
        <h2>Before you start</h2>
        <details><summary>Who needs to do this?</summary>
          <p>Providers of user-to-user services (where users can share content or interact) and search services that have links with the UK
          must carry out a suitable and sufficient illegal content risk assessment, keep a written record of it, and keep it up to date.</p></details>
        <details><summary>When should I review it?</summary>
          <p>Ofcom recommends reviewing it at least every 12 months. You must also carry out a new assessment before making a significant change to your service,
          and you should review it if Ofcom changes its Risk Profiles in a way that affects your service.</p></details>
        <details><summary>What's a "large" or "multi-risk" service?</summary>
          <p>In Ofcom's Codes, a <strong>large</strong> service has more than 7 million monthly active UK users on average.
          A <strong>multi-risk</strong> service has a medium or high risk for at least two kinds of illegal harm (CSEA counts once, and cyberflashing doesn't count). Some measures only apply to these services,
          and this tool works that out from your answers.</p></details>
        <details><summary>What about children's risk assessments?</summary>
          <p>Services likely to be accessed by children must also carry out a children's access assessment and a children's risk assessment.
          This tool covers the illegal content risk assessment only.</p></details>
      </section>`;
  }

  function viewService(a) {
    const p = a.profile;
    const large = isLarge(a);
    return `
      <h2>Tell us about your service</h2>
      <p class="lede">This identifies the service and decides which parts of the assessment apply.
      If you run several services, do a separate assessment for each.</p>
      <div class="form-grid">
        ${field({ a, path: "profile.orgName", label: "Organisation name", autocomplete: "organization" })}
        ${field({ a, path: "profile.serviceName", label: "Name of the service" })}
        ${field({ a, path: "profile.serviceUrl", label: "Website or app link", type: "url", optional: true })}
        ${field({ a, path: "profile.assessor", label: "Who is carrying out this assessment?", hint: "Name and role." })}
      </div>
      ${field({
        a,
        path: "profile.description",
        label: "Describe the service",
        type: "textarea",
        hint: "What it does, who it's for and how people use it. Think about the user journey from signing up to sharing content.",
      })}
      <fieldset class="field">
        <legend>What kind of service is it?</legend>
        <p class="hint">Tick both if your service includes a search engine and lets users share content.</p>
        ${checkbox(a, "profile.kinds.u2u", "User-to-user service", "Users can post, upload, share or send content that other users can encounter.")}
        ${checkbox(a, "profile.kinds.search", "Search service", "Users can search more than one website or database.")}
      </fieldset>
      ${field({
        a,
        path: "profile.ukUsers",
        label: "Average monthly active UK users",
        hint: "An estimate is fine. Services with more than 7 million are 'large' services in Ofcom's Codes.",
        inputmode: "numeric",
        rerender: true,
        narrow: true,
      })}
      ${p.ukUsers ? `<p class="callout ${large ? "callout-warn" : ""}">${large ? "This is a <strong>large service</strong>. More of Ofcom's Codes measures will apply to you." : "This is not a large service under Ofcom's Codes."}</p>` : ""}
      ${radios({
        a,
        path: "profile.children",
        label: "Do children (under 18) use the service, or are they likely to?",
        options: [
          { id: "yes", name: "Yes" },
          { id: "no", name: "No", hint: "For example, you use highly effective age assurance to keep children out." },
          { id: "unsure", name: "Not sure" },
        ],
      })}
      ${p.children === "yes" || p.children === "unsure" ? `<p class="callout">You'll also need a children's access assessment and, if children can access the service, a children's risk assessment. We've ticked the child users risk factor for you on the next step.</p>` : ""}
      ${field({
        a,
        path: "profile.category",
        label: "Is the service a categorised service?",
        type: "select",
        hint: "Ofcom keeps a register of categorised services. Most services aren't categorised.",
        options: [
          { id: "none", name: "No, or not yet" },
          { id: "1", name: "Category 1" },
          { id: "2A", name: "Category 2A" },
          { id: "2B", name: "Category 2B" },
        ],
        narrow: true,
      })}
      ${field({ a, path: "profile.startDate", label: "Date assessment started", type: "date", narrow: true })}`;
  }

  function viewFactors(a) {
    const groups = groupsFor(a);
    const count = activeFactors(a).length;
    const ks = kinds(a);
    const qs = D.questions.filter((q) => q.services.some((s) => ks.includes(s)));
    return `
      <h2>Identify your risk factors</h2>
      <p class="lede">These are the questions from Ofcom's Risk Profiles. Tick everything that applies to your service, in any version (for example web and app).
      Having a risk factor doesn't mean the risk is high: it shows you where to look closely in the next step.</p>
      <p class="callout"><strong>${count}</strong> specific risk factor${count === 1 ? "" : "s"} selected.</p>
      ${groups
        .map(
          (g) => `<fieldset class="field factor-group">
            <legend>${h(g.name)}</legend>
            ${g.hint ? `<p class="hint">${h(g.hint)}</p>` : ""}
            <div class="factor-grid">
              ${g.factors
                .map((f) => {
                  const linked = f.raises.length
                    ? (f.hint ? f.hint + " " : "") + "Ofcom links it to " + f.raises.length + " of the harms you'll assess."
                    : f.hint || "";
                  return checkbox(a, "factors." + f.id, `${f.ref}. ${f.name}`, linked, "c-factors-" + f.id);
                })
                .join("")}
            </div>
          </fieldset>`
        )
        .join("")}
      <section class="factor-group-section">
        <h3>General risk factors</h3>
        <p class="hint">Every service must take account of these. Describe how each applies to your service.</p>
        ${D.generalFactors
          .map((g) => field({ a, path: "general." + g.id, id: "g-" + g.id, label: g.name, type: "textarea", rows: 3, hint: h(g.hint) }))
          .join("")}
      </section>
      ${
        qs.length
          ? `<fieldset class="field factor-group">
        <legend>A few more questions</legend>
        <p class="hint">Ofcom's risk level tables for child sexual exploitation and abuse, and some Codes measures, depend on these.</p>
        ${qs.map((q) => checkbox(a, "questions." + q.id, q.label, "Used for: " + q.why, "q-" + q.id)).join("")}
      </fieldset>`
          : ""
      }
      ${field({
        a,
        path: "factorsNotes",
        label: "Other characteristics you've considered",
        type: "textarea",
        optional: true,
        hint: "Anything else about your user base, business model, functionalities, governance or systems that could make illegal harm more or less likely.",
      })}`;
  }

  function evidenceList(a, harmId, group, title) {
    return `<div><p class="mini-legend">${title}</p>${D.evidence[group]
      .map((e) => checkbox(a, `harms.${harmId}.evidence.${e.id}`, e.name, null, `ev-${harmId}-${e.id}`))
      .join("")}</div>`;
  }

  const openHarms = new Set();
  function viewHarms(a) {
    const lv = levelsMap(a);
    const counts = { high: 0, medium: 0, low: 0, negligible: 0, none: 0 };
    D.harms.forEach((x) => counts[lv[x.id] || "none"]++);
    const multiKinds = multiRiskKinds(a);
    const searchOnly = !kinds(a).includes("u2u");
    return `
      <h2>Assess the risk of each kind of illegal harm</h2>
      <p class="lede">For each kind of harm, judge how likely it is and how severe the impact would be, using your evidence and taking account of your existing controls.
      Where the evidence isn't conclusive, Ofcom expects you to choose the higher level, so we suggest the higher of the two. You can assign a different level, but explain why.</p>
      <div class="summary-bar" aria-label="Risk level summary">
        <span>${badge("high")} ${counts.high}</span>
        <span>${badge("medium")} ${counts.medium}</span>
        <span>${badge("low")} ${counts.low}</span>
        <span>${badge("negligible")} ${counts.negligible}</span>
        <span>${badge(null)} ${counts.none}</span>
      </div>
      ${multiKinds.length >= 2 ? `<p class="callout callout-warn">Your service is <strong>multi-risk</strong>: it has a medium or high risk for ${multiKinds.length} kinds of illegal harm (${h(multiKinds.join(", "))}).</p>` : ""}
      <div class="harm-list">
        ${D.harms
          .map((x) => {
            const e = a.harms[x.id] || {};
            const level = lv[x.id];
            const sug = suggestedLevel(a, x.id);
            const facs = factorsForHarm(a, x.id);
            const total = profileCount(x.id);
            const ind = x.csea ? cseaIndicative(a, x.id) : null;
            const complete = level && (e.rationale || "").trim();
            const open = openHarms.has(x.id);
            let factorBox;
            if (x.other) factorBox = `<p class="muted small">Ofcom's Risk Profiles don't cover other illegal content. Assess it if you have evidence or reason to believe it may occur on your service; the Register of Risks describes some non-priority offences.</p>`;
            else if (searchOnly) factorBox = `<p class="muted small">For search services, Ofcom doesn't link risk factors to particular harms. Use the Register of Risks and your own evidence to judge likelihood.</p>`;
            else if (facs.length) factorBox = `<div class="factors-hit"><p class="mini-legend">You have ${facs.length} of the ${total} risk factors Ofcom links to this harm</p><ul>${facs.map((f) => `<li>${h(f.ref + ". " + f.name)}</li>`).join("")}</ul></div>`;
            else factorBox = `<p class="muted small">You have none of the ${total} risk factors Ofcom links to this harm. You still need to assess it, but the risk may be lower.</p>`;
            return `<details class="harm" data-harm="${x.id}"${open ? " open" : ""}>
              <summary>
                <span class="harm-name">${h(x.name)}</span>
                <span class="harm-meta">${!x.other && !searchOnly ? `<span class="pill">${facs.length} of ${total} risk factors</span>` : ""}${badge(level)}${
              complete ? '<span class="tick" aria-label="Complete">✓</span>' : ""
            }</span>
              </summary>
              <div class="harm-body">
                <p>${h(x.summary)}</p>
                ${factorBox}
                ${
                  x.csea && !searchOnly
                    ? radios({
                        a,
                        path: `harms.${x.id}.occurrence`,
                        label: "Is there evidence it has happened on your service?",
                        hint: "For example from user reports, moderation, hotline takedown notices (such as the IWF) or law enforcement.",
                        options: [
                          { id: "none", name: "No evidence" },
                          { id: "some", name: "Yes, but not to a significant extent" },
                          { id: "significant", name: "Yes, to a significant extent" },
                        ],
                      }) +
                      (ind ? `<p class="callout">Ofcom's ${h(x.id === "grooming" ? "Grooming" : x.id === "csam_url" ? "CSAM URLs" : "Image-based CSAM")} Risk Level Table indicates ${badge(ind.level)}. ${h(ind.why)} Ofcom says the tables inform your judgement and shouldn't be applied mechanically.</p>` : "")
                    : ""
                }
                ${checkbox(
                  a,
                  `harms.${x.id}.negligible`,
                  "It is not possible, or extremely unlikely, for this harm to take place by means of our service",
                  "The risk level will be negligible. If you have relevant risk factors, you'll normally need comprehensive evidence for this.",
                  `neg-${x.id}`
                )}
                ${
                  e.negligible
                    ? ""
                    : `<div class="two-col">
                    ${radios({
                      a,
                      path: `harms.${x.id}.likelihood`,
                      label: "Likelihood",
                      hint: "How likely is it that users encounter this content" + (searchOnly ? "?" : ", or that the service is used to commit or facilitate the offence?"),
                      options: D.levelGuide.likelihood,
                    })}
                    ${radios({
                      a,
                      path: `harms.${x.id}.impact`,
                      label: "Impact",
                      hint: "How severe would the harm be, how many people could be affected, and how vulnerable are they?",
                      options: D.levelGuide.impact,
                    })}
                  </div>
                  ${sug ? `<p class="callout">Suggested risk level: ${badge(sug)}${ind && ORDER[ind.level] > ORDER[higher(e.likelihood, e.impact)] ? " (raised to match Ofcom's risk level table)" : ""}</p>` : ""}
                  ${field({
                    a,
                    path: `harms.${x.id}.override`,
                    id: `ov-${x.id}`,
                    label: "Risk level you're assigning",
                    type: "select",
                    hint: "Leave as 'Choose…' to use the suggested level.",
                    options: D.levels.filter((l) => l.id !== "negligible"),
                    narrow: true,
                  })}`
                }
                <fieldset class="field">
                  <legend>Evidence used</legend>
                  <p class="hint">Use all the core inputs. ${isLarge(a) ? "As a large service, Ofcom generally expects you to use enhanced inputs too." : "Use enhanced inputs as well if you have several risk factors for this harm or aren't confident in your assessment."}</p>
                  <div class="two-col">${evidenceList(a, x.id, "core", "Core inputs")}${evidenceList(a, x.id, "enhanced", "Enhanced inputs")}</div>
                </fieldset>
                ${field({
                  a,
                  path: `harms.${x.id}.controls`,
                  id: `ctl-${x.id}`,
                  label: "Existing controls",
                  type: "textarea",
                  rows: 3,
                  optional: true,
                  hint: "What controls are in place, which risks they address, how they work, and how they affected the level you've assigned.",
                })}
                ${field({
                  a,
                  path: `harms.${x.id}.rationale`,
                  id: `rat-${x.id}`,
                  label: "Why you've assigned this risk level",
                  type: "textarea",
                  rows: 4,
                  hint: "Summarise the evidence and your reasoning about likelihood and impact. This is the core of your written record.",
                })}
              </div>
            </details>`;
          })
          .join("")}
      </div>`;
  }

  const openNotes = new Set();
  function measureRow(a, m, reason) {
    const st = a.measures[m.id] || {};
    const warn = reason && st.status === "not_adopted";
    return `<div class="measure${reason ? " recommended" : ""}">
      <div class="measure-head">
        <h4><span class="code">${h(m.code)}</span> ${h(m.name)}</h4>
        ${reason ? `<span class="pill pill-accent">Recommended for you</span>` : ""}
      </div>
      <p class="small muted">Applies to: ${h(m.rule)}</p>
      <div class="measure-fields">
        ${field({ a, path: `measures.${m.id}.status`, id: `ms-${m.id}`, label: "Status", type: "select", options: D.statuses })}
        ${field({ a, path: `measures.${m.id}.owner`, id: `mo-${m.id}`, label: "Owner", optional: true })}
        ${field({ a, path: `measures.${m.id}.due`, id: `md-${m.id}`, label: "Target date", type: "date", optional: true })}
      </div>
      ${
        (reason && (st.status === "not_adopted" || st.status === "alternative")) || st.notes || openNotes.has(m.id)
          ? field({
              a,
              path: `measures.${m.id}.notes`,
              id: `mn-${m.id}`,
              label: warn ? "Why you haven't adopted it, and how you'll still meet your duties" : "Notes",
              type: "textarea",
              rows: 2,
              hint: warn ? "If you don't follow a recommended measure, record how you protect users in another way." : st.status === "alternative" ? "Describe the alternative measure." : "",
            })
          : `<button class="link-btn" data-action="add-note" data-id="${m.id}">Add a note</button>`
      }
    </div>`;
  }

  function viewMeasures(a) {
    const rows = measuresFor(a);
    const rec = rows.filter((r) => r.reason);
    const other = rows.filter((r) => !r.reason);
    const groupBy = (list) => {
      const g = {};
      const both = kinds(a).length > 1;
      list.forEach((r) => {
        const key = (both ? (r.m.service === "search" ? "Search: " : "User-to-user: ") : "") + r.m.group;
        (g[key] = g[key] || []).push(r);
      });
      return g;
    };
    const renderGroups = (list) =>
      Object.entries(groupBy(list))
        .map(([name, items]) => `<section class="measure-group"><h3>${h(name)}</h3>${items.map((r) => measureRow(a, r.m, r.reason)).join("")}</section>`)
        .join("");
    const unassessed = D.harms.filter((x) => !harmLevelOf(a, x.id)).length;
    const done = rec.filter((r) => (a.measures[r.m.id] || {}).status).length;
    return `
      <h2>Decide your safety measures</h2>
      <p class="lede">Based on your answers, these measures from Ofcom's Illegal Content Codes of Practice apply to your service.
      If you implement the measures recommended to you, you're treated as complying with the related duties. You can use alternative measures instead, but you must record what they are and how they meet your duties.</p>
      <p class="callout">${isLarge(a) ? "Large service" : "Not a large service"} · ${isMulti(a) ? "Multi-risk" : "Not multi-risk"} · <strong>${done} of ${rec.length}</strong> recommended measures have a status.</p>
      ${unassessed ? `<p class="callout callout-warn">${unassessed} harm${unassessed === 1 ? " hasn't" : "s haven't"} been given a risk level yet, so this list may be incomplete. <a href="#harms-${a.id}">Finish assessing the risks</a>.</p>` : ""}
      ${renderGroups(rec)}
      ${
        other.length
          ? `<details class="panel"><summary><strong>Other measures you could consider (${other.length})</strong></summary>
            <p class="small muted">These aren't recommended for your service based on your answers, but you may choose to adopt them.</p>${renderGroups(other)}</details>`
          : ""
      }
      <section class="measure-group">
        <h3>Your own measures</h3>
        <p class="small muted">Add measures you use that aren't listed above, or alternatives to Codes measures.</p>
        ${(a.customMeasures || [])
          .map(
            (c, i) => `<div class="measure">
            <div class="measure-fields">
              ${field({ a, path: `customMeasures.${i}.name`, id: `cm-n-${i}`, label: "Measure" })}
              ${field({ a, path: `customMeasures.${i}.status`, id: `cm-s-${i}`, label: "Status", type: "select", options: D.statuses })}
              ${field({ a, path: `customMeasures.${i}.owner`, id: `cm-o-${i}`, label: "Owner", optional: true })}
            </div>
            ${field({ a, path: `customMeasures.${i}.desc`, id: `cm-d-${i}`, label: "What it does and which harms it addresses", type: "textarea", rows: 2 })}
            <button class="link-btn danger" data-action="remove-custom" data-index="${i}">Remove this measure</button>
          </div>`
          )
          .join("")}
        <button class="btn btn-secondary" data-action="add-custom">Add a measure</button>
      </section>`;
  }

  const TRIGGERS = [
    ["significant_change", "Before making a significant change to the service (a legal duty: carry out a new assessment before the change)"],
    ["annual", "At least every 12 months, as Ofcom recommends"],
    ["profiles", "When Ofcom makes a significant change to its Risk Profiles that affects the service"],
    ["evidence", "When new evidence suggests the risk has changed, such as a serious incident, a rise in a kind of illegal content, or changing user behaviour"],
    ["growth", "If user numbers cross a threshold in the Codes (700,000 or 7 million monthly UK users)"],
  ];
  function viewReview(a) {
    const r = a.review;
    return `
      <h2>Record, sign off and plan your review</h2>
      <p class="lede">You must keep a written record of your risk assessment and take steps to keep it up to date.
      Keep earlier versions too: Ofcom expects records that are no longer current to be kept for at least three years.</p>
      <div class="form-grid">
        ${field({ a, path: "review.responsible", label: "Named person responsible for the risk assessment", hint: "Name and role." })}
        ${field({ a, path: "review.completedOn", label: "Date the assessment was completed", type: "date" })}
        ${field({ a, path: "review.approver", label: "Approved by", hint: "Name and role, for example the person accountable for illegal content safety duties." })}
        ${field({ a, path: "review.approvedOn", label: "Date approved", type: "date", rerender: true })}
        ${field({ a, path: "review.nextReview", label: "Next review date", type: "date", hint: "Ofcom recommends reviewing at least every 12 months." })}
      </div>
      ${r.approvedOn && !r.nextReview ? `<button class="btn btn-secondary btn-small" data-action="set-review" data-date="${addMonths(r.approvedOn, 12)}">Set to ${fmtDate(addMonths(r.approvedOn, 12))}</button>` : ""}
      <fieldset class="field">
        <legend>When will you review or redo the assessment?</legend>
        ${TRIGGERS.map(([id, label]) => checkbox(a, "review.triggers." + id, label)).join("")}
      </fieldset>
      ${field({
        a,
        path: "review.policy",
        label: "How you keep the assessment up to date",
        type: "textarea",
        hint: "Your policy for reviewing it: who does it, how new evidence is collected, and how changes to the service are checked for significance.",
      })}
      <fieldset class="field">
        <legend>Governance</legend>
        ${checkbox(a, "review.reported", "The findings have been reported and recorded through our governance channels")}
      </fieldset>
      ${field({
        a,
        path: "review.governance",
        label: "How the assessment is reported to your senior governance body",
        type: "textarea",
        optional: true,
        hint: "For example, quarterly board updates, or an annual review by the board.",
      })}
      ${field({ a, path: "review.notes", label: "Other notes", type: "textarea", optional: true })}`;
  }

  function viewReport(a) {
    const p = a.profile;
    const lv = levelsMap(a);
    const missing = STEPS.slice(0, 5).filter((s) => !stepDone(a, s.id));
    const order = { high: 0, medium: 1, low: 2, negligible: 3 };
    const harmsSorted = D.harms.slice().sort((x, y) => (order[lv[x.id]] ?? 4) - (order[lv[y.id]] ?? 4));
    const rows = measuresFor(a);
    const adopted = rows.filter((r) => r.reason || (a.measures[r.m.id] || {}).status);
    const custom = (a.customMeasures || []).filter((c) => c.name);
    const factors = activeFactors(a);
    const triggers = Object.entries(a.review.triggers || {}).filter(([, v]) => v);
    const triggerNames = Object.fromEntries(TRIGGERS);
    triggerNames.incident = "After a serious incident or sharp rise in illegal content";
    const evNames = Object.fromEntries([...D.evidence.core, ...D.evidence.enhanced].map((e) => [e.id, e.name]));
    return `
      <div class="report-actions no-print">
        ${missing.length ? `<p class="callout callout-warn">Some steps aren't finished: ${missing.map((s) => `<a href="#${s.id}-${a.id}">${h(s.name)}</a>`).join(", ")}. You can still copy a draft.</p>` : `<p class="callout callout-ok">All steps are complete.</p>`}
        <div class="actions">
          <button class="btn" data-action="copy-report">Copy report</button>
          ${framed ? "" : `<button class="btn btn-secondary" data-action="print">Print or save as PDF</button>`}
          <button class="btn btn-secondary" data-action="export" data-id="${a.id}">Export</button>
        </div>
        <p class="small muted">Copy the report and paste it into Word or Google Docs to save, share or print it.</p>
      </div>
      <article class="report">
        <header>
          <p class="eyebrow">Illegal content risk assessment${missing.length ? " · Draft" : ""}</p>
          <h2>${h(p.serviceName || "Untitled service")}</h2>
          <p>${h(p.orgName)}${p.serviceUrl ? " · " + h(p.serviceUrl) : ""}</p>
        </header>

        <h3>1. Service</h3>
        <dl class="dl">
          <dt>Description</dt><dd>${h(p.description) || "<em>Not given</em>"}</dd>
          <dt>Type</dt><dd>${kinds(a).map((k) => (k === "u2u" ? "User-to-user" : "Search")).join(" and ")}</dd>
          <dt>Monthly active UK users</dt><dd>${h(p.ukUsers) || "<em>Not given</em>"}</dd>
          <dt>Children likely to use it</dt><dd>${h({ yes: "Yes", no: "No", unsure: "Not sure" }[p.children] || "Not given")}</dd>
          <dt>Classification</dt><dd>${isLarge(a) ? "Large service" : "Not a large service"}; ${isMulti(a) ? `multi-risk (${h(multiRiskKinds(a).join(", "))})` : "not multi-risk"}${a.profile.category && a.profile.category !== "none" ? "; Category " + h(a.profile.category) : ""}</dd>
          <dt>Assessed by</dt><dd>${h(p.assessor) || "<em>Not given</em>"}</dd>
          <dt>Started</dt><dd>${h(fmtDate(p.startDate))}</dd>
        </dl>

        <h3>2. Risk factors</h3>
        <p>We consulted Ofcom's ${kinds(a).map((k) => (k === "u2u" ? "U2U" : "Search")).join(" and ")} Risk Profile${kinds(a).length > 1 ? "s" : ""}${a.factorsReviewed ? "" : " <em>(not yet confirmed)</em>"}. Specific risk factors that apply:</p>
        ${factors.length ? `<ul class="columns">${factors.map((f) => `<li>${h(f.ref + ". " + f.name)}</li>`).join("")}</ul>` : "<p><em>None selected.</em></p>"}
        <h4>General risk factors</h4>
        <dl class="dl">${D.generalFactors.map((g) => `<dt>${h(g.name)}</dt><dd>${h((a.general || {})[g.id]) || "<em>Not recorded</em>"}</dd>`).join("")}</dl>
        ${a.factorsNotes ? `<p><strong>Other characteristics considered:</strong> ${h(a.factorsNotes)}</p>` : ""}

        <h3>3. Risk levels</h3>
        <table class="table">
          <thead><tr><th scope="col">Kind of illegal harm</th><th scope="col">Likelihood</th><th scope="col">Impact</th><th scope="col">Risk level</th></tr></thead>
          <tbody>${harmsSorted
            .map((x) => {
              const e = a.harms[x.id] || {};
              return `<tr><th scope="row">${h(x.name)}</th><td>${e.negligible ? "–" : h(levelName[e.likelihood] || "")}</td><td>${e.negligible ? "–" : h(levelName[e.impact] || "")}</td><td>${badge(lv[x.id])}</td></tr>`;
            })
            .join("")}</tbody>
        </table>

        <h3>4. Reasoning and evidence</h3>
        ${harmsSorted
          .map((x) => {
            const e = a.harms[x.id] || {};
            const ev = Object.entries(e.evidence || {}).filter(([, v]) => v).map(([k]) => evNames[k]);
            const facs = factorsForHarm(a, x.id);
            return `<section class="report-harm">
              <h4>${h(x.name)} ${badge(lv[x.id])}</h4>
              <p>${h(e.rationale) || "<em>No reasoning recorded.</em>"}</p>
              ${facs.length ? `<p class="small"><strong>Risk factors (${facs.length} of ${profileCount(x.id)}):</strong> ${facs.map((f) => h(f.ref + ". " + f.name)).join("; ")}</p>` : ""}
              ${x.csea && cseaIndicative(a, x.id) ? `<p class="small"><strong>Ofcom risk level table indicates:</strong> ${h(levelName[cseaIndicative(a, x.id).level])}. ${h(cseaIndicative(a, x.id).why)}</p>` : ""}
              ${ev.length ? `<p class="small"><strong>Evidence:</strong> ${ev.map(h).join("; ")}</p>` : ""}
              ${e.controls ? `<p class="small"><strong>Existing controls:</strong> ${h(e.controls)}</p>` : ""}
            </section>`;
          })
          .join("")}

        <h3>5. Safety measures</h3>
        <table class="table">
          <thead><tr><th scope="col">Code</th><th scope="col">Measure</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col">Target</th></tr></thead>
          <tbody>
            ${adopted
              .map((r) => {
                const st = a.measures[r.m.id] || {};
                return `<tr><td class="nowrap">${h(r.m.code)}</td><th scope="row">${h(r.m.name)}${r.reason ? "" : ' <span class="small muted">(adopted voluntarily)</span>'}${st.notes ? `<div class="small muted">${h(st.notes)}</div>` : ""}</th><td>${h(statusName[st.status] || "Not recorded")}</td><td>${h(st.owner)}</td><td>${h(fmtDate(st.due))}</td></tr>`;
              })
              .join("")}
            ${custom
              .map((c) => `<tr><td>Own</td><th scope="row">${h(c.name)}${c.desc ? `<div class="small muted">${h(c.desc)}</div>` : ""}</th><td>${h(statusName[c.status] || "Not recorded")}</td><td>${h(c.owner)}</td><td></td></tr>`)
              .join("")}
          </tbody>
        </table>

        <h3>6. Sign-off and review</h3>
        <dl class="dl">
          <dt>Named person responsible</dt><dd>${h(a.review.responsible) || "<em>Not recorded</em>"}</dd>
          <dt>Completed by</dt><dd>${h(p.assessor) || "<em>Not recorded</em>"}</dd>
          <dt>Date completed</dt><dd>${h(fmtDate(a.review.completedOn)) || "<em>–</em>"}</dd>
          <dt>Approved by</dt><dd>${h(a.review.approver) || "<em>Not approved</em>"}</dd>
          <dt>Date approved</dt><dd>${h(fmtDate(a.review.approvedOn)) || "<em>–</em>"}</dd>
          <dt>Next review</dt><dd>${h(fmtDate(a.review.nextReview)) || "<em>–</em>"}</dd>
          <dt>Review triggers</dt><dd>${triggers.length ? triggers.map(([k]) => h(triggerNames[k])).join("; ") : "<em>None recorded</em>"}</dd>
          <dt>Keeping it up to date</dt><dd>${h(a.review.policy) || "<em>Not recorded</em>"}</dd>
          <dt>Reported through governance</dt><dd>${a.review.reported ? "Yes" : "<em>Not confirmed</em>"}${a.review.governance ? ". " + h(a.review.governance) : ""}</dd>
          ${a.review.notes ? `<dt>Notes</dt><dd>${h(a.review.notes)}</dd>` : ""}
        </dl>
        <p class="small muted report-foot">Record generated ${h(fmtDate(new Date().toISOString()))}. Prepared with reference to ${kinds(a).map((k) => h(k === "u2u" ? D.SOURCES.icu : D.SOURCES.ics)).concat([h(D.SOURCES.rag), h(D.SOURCES.rkr)]).join("; ")}.</p>
      </article>`;
  }

  function viewNotFound() {
    return `<section class="panel"><h1>Assessment not found</h1><p>It may have been deleted, or saved in a different browser.</p><p><a class="btn" href="#assessments">Go to your assessments</a></p></section>`;
  }

  // ---------- routing ----------
  function route() {
    // Hashes look like #harms-<assessment id>. Plain names only, so the
    // page also works where hosts only pass simple #names through.
    const m = location.hash.replace(/^#/, "").match(/^(service|factors|harms|measures|review|report)-([A-Za-z0-9-]+)$/);
    if (m) {
      const a = store[m[2]];
      if (!a) return { view: "notfound" };
      return { view: "step", a, step: m[1] };
    }
    return { view: "home" };
  }

  let lastRouteKey = "";
  function render(opts) {
    const r = route();
    const key = r.view + (r.a ? r.a.id + r.step : "");
    const focusId = document.activeElement && document.activeElement.id;
    const scroll = window.scrollY;
    let html;
    if (r.view === "home") html = viewHome();
    else if (r.view === "notfound") html = viewNotFound();
    else {
      const views = { service: viewService, factors: viewFactors, harms: viewHarms, measures: viewMeasures, review: viewReview, report: viewReport };
      html = shell(r.a, r.step, views[r.step](r.a));
    }
    app.innerHTML = html;
    if (key !== lastRouteKey) {
      lastRouteKey = key;
      window.scrollTo(0, 0);
      const h1 = app.querySelector("h2, h1");
      if (h1 && !(opts && opts.initial)) {
        h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
      document.title = (r.a ? (r.a.profile.serviceName || "Assessment") + " · " + STEPS.find((s) => s.id === r.step).name + " · " : "") + "Online Safety Risk Assessment";
    } else {
      window.scrollTo(0, scroll);
      if (focusId) {
        const el = document.getElementById(focusId);
        if (el) el.focus({ preventScroll: true });
      }
    }
  }

  function current() {
    const r = route();
    return r.a || null;
  }
  function touch(a) {
    a.updatedAt = new Date().toISOString();
    persist();
  }

  // ---------- events ----------
  function onValue(e) {
    const el = e.target;
    const path = el.getAttribute && el.getAttribute("data-path");
    if (!path) return;
    const a = current();
    if (!a) return;
    let val;
    if (el.type === "checkbox") val = el.checked;
    else val = el.value;
    setPath(a, path, val);
    // Side effects
    if (path === "profile.children" && (val === "yes" || val === "unsure")) a.factors["2"] = true;
    touch(a);
    const needsRerender = el.hasAttribute("data-rerender") || el.tagName === "SELECT";
    if (needsRerender && e.type === "change") render();
  }
  app.addEventListener("input", (e) => {
    const el = e.target;
    if (el.type === "radio" || el.type === "checkbox" || el.tagName === "SELECT") return; // handled on change
    onValue(e);
  });
  app.addEventListener("change", (e) => {
    const el = e.target;
    if (el.type === "radio" || el.type === "checkbox" || el.tagName === "SELECT" || el.hasAttribute("data-rerender")) onValue(e);
  });
  app.addEventListener(
    "toggle",
    (e) => {
      const d = e.target;
      if (d.matches && d.matches("details.harm")) {
        const id = d.getAttribute("data-harm");
        if (d.open) openHarms.add(id);
        else openHarms.delete(id);
      }
    },
    true
  );

  app.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.tagName === "INPUT") return;
    const action = btn.getAttribute("data-action");
    const a = current();
    switch (action) {
      case "new": {
        const n = blankAssessment();
        store[n.id] = n;
        persistNow();
        location.hash = `#service-${n.id}`;
        break;
      }
      case "example": {
        const n = exampleAssessment();
        store[n.id] = n;
        persistNow();
        location.hash = `#harms-${n.id}`;
        break;
      }
      case "next":
        if (a) {
          if (route().step === "factors") a.factorsReviewed = true;
          touch(a);
          persistNow();
          location.hash = `#${btn.getAttribute("data-next")}-${a.id}`;
        }
        break;
      case "export":
        showExport(store[btn.getAttribute("data-id")]);
        break;
      case "duplicate": {
        const src = store[btn.getAttribute("data-id")];
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = uid();
        copy.createdAt = copy.updatedAt = new Date().toISOString();
        copy.profile.serviceName = (copy.profile.serviceName || "Untitled service") + " (copy)";
        copy.review = {};
        store[copy.id] = copy;
        persistNow();
        render();
        break;
      }
      case "delete": {
        const id = btn.getAttribute("data-id");
        const name = store[id].profile.serviceName || "this assessment";
        openModal(`<h2 id="modal-title">Delete ${h(name)}?</h2>
          <p>This can't be undone. Export it first if you want to keep a copy.</p>
          <div class="actions">
            <button class="btn btn-delete" data-modal-action="confirm-delete" data-id="${h(id)}">Delete assessment</button>
            <button class="btn btn-secondary" data-modal-close>Cancel</button>
          </div>`);
        break;
      }
      case "add-note":
        if (a) {
          openNotes.add(btn.getAttribute("data-id"));
          render();
          const t = document.getElementById("mn-" + btn.getAttribute("data-id"));
          if (t) t.focus();
        }
        break;
      case "add-custom":
        if (a) {
          a.customMeasures = a.customMeasures || [];
          a.customMeasures.push({ name: "", status: "", owner: "", desc: "" });
          touch(a);
          render();
          const el = document.getElementById("cm-n-" + (a.customMeasures.length - 1));
          if (el) el.focus();
        }
        break;
      case "remove-custom":
        if (a) {
          a.customMeasures.splice(Number(btn.getAttribute("data-index")), 1);
          touch(a);
          render();
        }
        break;
      case "set-review":
        if (a) {
          a.review.nextReview = btn.getAttribute("data-date");
          touch(a);
          render();
        }
        break;
      case "print":
        window.print();
        break;
      case "copy-report":
        copyReport(btn);
        break;
      case "open-import":
        showImport();
        break;
    }
  });

  // ---------- dialogs ----------
  const modal = document.createElement("dialog");
  modal.className = "modal";
  modal.setAttribute("aria-labelledby", "modal-title");
  document.body.appendChild(modal);
  function openModal(html) {
    modal.innerHTML = `<div class="modal-inner">${html}</div>`;
    if (!modal.open) modal.showModal();
    const first = modal.querySelector("[autofocus], textarea, input, button");
    if (first) first.focus();
  }
  function closeModal() {
    if (modal.open) modal.close();
  }
  function showMessage(title, text) {
    openModal(`<h2 id="modal-title">${h(title)}</h2><p>${h(text)}</p><div class="actions"><button class="btn" data-modal-close>OK</button></div>`);
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal) return closeModal(); // backdrop
    const close = e.target.closest("[data-modal-close]");
    if (close) return closeModal();
    const btn = e.target.closest("[data-modal-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-modal-action");
    if (action === "confirm-delete") {
      delete store[btn.getAttribute("data-id")];
      persistNow();
      closeModal();
      render();
    } else if (action === "download") {
      downloadFile(store[btn.getAttribute("data-id")]);
    } else if (action === "copy-export") {
      copyText(document.getElementById("export-text").value, btn, document.getElementById("export-text"));
    } else if (action === "import-text") {
      importText(document.getElementById("import-text").value);
    }
  });
  modal.addEventListener("change", (e) => {
    if (e.target.id === "import-file") importFile(e.target);
  });

  function exportJson(a) {
    return JSON.stringify({ format: "osra", version: 1, assessment: a }, null, 2);
  }
  function showExport(a) {
    if (!a) return;
    openModal(`<h2 id="modal-title">Export ${h(a.profile.serviceName || "assessment")}</h2>
      <p>Save a copy to keep it safe, move it to another device or share it with a colleague. Bring it back with <strong>Import</strong>.</p>
      <div class="actions">
        <button class="btn" data-modal-action="download" data-id="${h(a.id)}">Download file</button>
        <button class="btn btn-secondary" data-modal-action="copy-export">Copy to clipboard</button>
      </div>
      <label for="export-text" class="mini-legend">Or copy this text and save it as a .json file</label>
      <textarea id="export-text" rows="6" readonly class="code">${h(exportJson(a))}</textarea>
      <div class="actions"><button class="btn btn-ghost" data-modal-close>Close</button></div>`);
  }
  function downloadFile(a) {
    const blob = new Blob([exportJson(a)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safe = (a.profile.serviceName || "assessment").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    link.href = url;
    link.download = `risk-assessment-${safe}-${today()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function flash(btn, text) {
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = old), 2000);
  }
  function copyText(text, btn, fallbackEl) {
    const fallback = () => {
      if (fallbackEl) {
        fallbackEl.focus();
        fallbackEl.select();
        flash(btn, "Press Ctrl+C to copy");
      }
    };
    try {
      navigator.clipboard.writeText(text).then(() => flash(btn, "Copied"), fallback);
    } catch (e) {
      fallback();
    }
  }
  function copyReport(btn) {
    const el = app.querySelector(".report");
    if (!el) return;
    const html = `<meta charset="utf-8">${el.outerHTML}`;
    const text = el.innerText;
    try {
      if (window.ClipboardItem) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        navigator.clipboard.write([item]).then(
          () => flash(btn, "Copied: paste it into a document"),
          () => copyText(text, btn)
        );
      } else copyText(text, btn);
    } catch (e) {
      copyText(text, btn);
    }
  }

  function showImport() {
    openModal(`<h2 id="modal-title">Import an assessment</h2>
      <p>Choose a file exported from this tool, or paste its contents below.</p>
      <div class="field"><label for="import-file">File</label><input type="file" id="import-file" accept="application/json,.json"></div>
      <div class="field"><label for="import-text">Or paste the text</label><textarea id="import-text" rows="5" class="code"></textarea></div>
      <p class="error" id="import-error" role="alert"></p>
      <div class="actions">
        <button class="btn" data-modal-action="import-text">Import pasted text</button>
        <button class="btn btn-secondary" data-modal-close>Cancel</button>
      </div>`);
  }
  function importText(text) {
    try {
      const data = JSON.parse(text);
      const a = data && data.format === "osra" ? data.assessment : data;
      if (!a || typeof a !== "object" || !a.profile || !a.harms) throw new Error("bad");
      const fresh = Object.assign(blankAssessment(), migrate(a));
      if (store[fresh.id]) {
        // Keep the existing one and add the import alongside it.
        fresh.id = uid();
        fresh.profile.serviceName = (fresh.profile.serviceName || "Untitled service") + " (imported)";
      }
      store[fresh.id] = fresh;
      persistNow();
      closeModal();
      location.hash = `#service-${fresh.id}`;
      render();
    } catch (err) {
      const e = document.getElementById("import-error");
      if (e) e.textContent = "That couldn't be read. Use a file or text exported from this tool.";
    }
  }
  function importFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importText(reader.result);
    reader.readAsText(file);
  }

  function exampleAssessment() {
    const a = blankAssessment();
    a.profile = {
      orgName: "Example Hobbies Ltd",
      serviceName: "Makers' Forum (example)",
      serviceUrl: "https://example.com",
      description: "A discussion forum for people who build model railways. Users create a profile, post threads and replies with photos, and send private messages. Around 40,000 UK users a month. No payments between users.",
      kinds: { u2u: true, search: false },
      ukUsers: "40000",
      children: "unsure",
      assessor: "A. Example, Head of Community",
      startDate: today(),
    };
    ["1e", "2", "3a", "3b", "4b", "5b", "5d", "5e", "7a", "7b"].forEach((id) => (a.factors[id] = true));
    a.factorsReviewed = true;
    a.general = {
      demographics: "Mostly adults aged 40 and over, but some teenage members join with their parents. We don't collect protected characteristics.",
      business: "Funded by member donations. No advertising, boosted posts or engagement-based ranking.",
      commercial: "Run by two part-time staff and around 15 volunteer moderators, so our capacity to moderate is limited.",
    };
    a.harms = {
      harassment: { likelihood: "medium", impact: "medium", rationale: "We receive a few reports of abusive messages each month, mostly in private messages. Users can be anonymous and can message anyone.", evidence: { e_profile: true, e_complaints: true }, controls: "Volunteer moderators; users can report posts." },
      grooming: { likelihood: "medium", impact: "high", rationale: "Some users may be under 18 and anyone can send a private message to anyone. No incidents reported, but the risk factors are present and the impact would be severe.", evidence: { e_profile: true, e_userdata: true } },
      csam_image: { likelihood: "low", impact: "high", rationale: "Users can upload images. No incidents in the last three years; images are visible to moderators.", evidence: { e_profile: true, e_incidents: true } },
      immigration: { likelihood: "low", impact: "low", rationale: "We have several linked risk factors, but no marketplace or listings, no reports of this content, and every thread is visible to moderators.", evidence: { e_profile: true, e_complaints: true } },
    };
    return a;
  }

  // Older saves used different ids for risk factors and harms.
  const OLD_FACTORS = {
    t_social: "1a", t_messaging: "1b", t_gaming: "1c", t_adult: "1d", t_forum: "1e", t_marketplace: "1f", t_filesharing: "1g",
    u_children: "2", f_profiles: "3a", f_anonymous: "3b", f_connections: "4a", f_groups: "4b",
    f_livestream: "5a", f_dm: "5b", f_encrypted: "5c", f_comments: "5d", f_images: "5e", f_location: "5f", f_reposting: "5g",
    f_sale: "6", f_search: "7a", f_links: "7b", f_recommender: "8c", f_suggestions: "8n",
    s_general: "s1a", s_vertical: "s1b", s_predictive: "s3a", s_image: "s3b",
  };
  function migrate(a) {
    if (!a || (a.version || 1) >= 2) return a;
    const f = {};
    Object.entries(a.factors || {}).forEach(([k, v]) => {
      if (v && OLD_FACTORS[k]) f[OLD_FACTORS[k]] = true;
      else if (v && !k.includes("_")) f[k] = true;
    });
    a.factors = f;
    if (a.harms && a.harms.self_harm && !a.harms.suicide) a.harms.suicide = a.harms.self_harm;
    if (a.harms) delete a.harms.self_harm;
    a.questions = a.questions || {};
    a.general = a.general || {};
    a.version = 2;
    return a;
  }
  Object.values(store).forEach(migrate);

  window.addEventListener("hashchange", () => render());
  document.addEventListener("click", (e) => {
    const skip = e.target.closest(".skip-link");
    if (skip) {
      e.preventDefault();
      const h1 = app.querySelector("h1, h2");
      (h1 || app).setAttribute("tabindex", "-1");
      (h1 || app).focus();
    }
  });
  if (!storageOk) {
    const b = document.getElementById("storage-warning");
    if (b) b.hidden = false;
  }
  render({ initial: true });
})();
