/* Online safety risk assessment tool. Runs entirely in the browser. */
(function () {
  "use strict";

  const D = window.OSRA_DATA;
  const STORE_KEY = "osra.assessments.v1";
  const LARGE_THRESHOLD = 7000000; // average monthly active UK users
  const app = document.getElementById("app");

  const STEPS = [
    { id: "service", name: "Your service", short: "Service" },
    { id: "factors", name: "Risk factors", short: "Risk factors" },
    { id: "harms", name: "Assess the risks", short: "Assess" },
    { id: "measures", name: "Safety measures", short: "Measures" },
    { id: "review", name: "Record and review", short: "Review" },
    { id: "report", name: "Report", short: "Report" },
  ];

  const MATRIX = {
    low: { low: "low", medium: "low", high: "medium" },
    medium: { low: "low", medium: "medium", high: "high" },
    high: { low: "medium", medium: "high", high: "high" },
  };

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
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: { kinds: { u2u: true, search: false }, startDate: today() },
      factors: {},
      factorsReviewed: false,
      harms: {},
      measures: {},
      customMeasures: [],
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
  function factorsForHarm(a, harmId) {
    return activeFactors(a).filter((f) => f.raises.includes(D.ALL) || f.raises.includes(harmId));
  }
  function harmLevel(entry) {
    if (!entry) return null;
    if (entry.negligible) return "negligible";
    if (entry.override) return entry.override;
    if (entry.likelihood && entry.impact) return MATRIX[entry.likelihood][entry.impact];
    return null;
  }
  function suggestedLevel(entry) {
    if (!entry || !entry.likelihood || !entry.impact) return null;
    return MATRIX[entry.likelihood][entry.impact];
  }
  function levelsMap(a) {
    const m = {};
    D.harms.forEach((x) => (m[x.id] = harmLevel(a.harms[x.id])));
    return m;
  }
  function isLarge(a) {
    const n = Number(String((a.profile && a.profile.ukUsers) || "").replace(/[^0-9.]/g, ""));
    return n > LARGE_THRESHOLD;
  }
  function multiRiskCount(a) {
    const m = levelsMap(a);
    return D.harms.filter((x) => x.id !== "other" && (m[x.id] === "medium" || m[x.id] === "high")).length;
  }
  function isMulti(a) {
    return multiRiskCount(a) >= 2;
  }

  // Returns a reason string if the measure is recommended, otherwise null.
  function recommendation(a, m) {
    const ks = kinds(a);
    if (!m.services.some((s) => ks.includes(s))) return null;
    const large = isLarge(a);
    const multi = isMulti(a);
    const lv = levelsMap(a);
    const atRisk = (m.harms || []).filter((id) => lv[id] === "medium" || lv[id] === "high");
    const atHigh = (m.harms || []).filter((id) => lv[id] === "high");
    const names = (ids) => ids.map((id) => harmById[id].name).join("; ");
    switch (m.when) {
      case "all":
        return "Recommended for all services";
      case "largeOrMulti":
        if (large && multi) return "Your service is large and multi-risk";
        if (large) return "Your service is large";
        if (multi) return "Your service is multi-risk";
        return null;
      case "largeAndMulti":
        return large && multi ? "Your service is large and multi-risk" : null;
      case "harm":
        return atRisk.length ? "Medium or high risk of: " + names(atRisk) : null;
      case "highHarm":
        return atHigh.length ? "High risk of: " + names(atHigh) : null;
      case "largeOrHarm":
        if (atRisk.length) return "Medium or high risk of: " + names(atRisk);
        if (large) return "Your service is large";
        return null;
      case "largeAndHarm":
        return large && atRisk.length ? "Large service with medium or high risk of: " + names(atRisk) : null;
    }
    return null;
  }
  function measuresFor(a) {
    const ks = kinds(a);
    return D.measures
      .filter((m) => m.services.some((s) => ks.includes(s)))
      .map((m) => ({ m, reason: recommendation(a, m) }));
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
        return D.harms.every((x) => harmLevel(a.harms[x.id]) && (a.harms[x.id].rationale || "").trim());
      case "measures": {
        const rec = measuresFor(a).filter((r) => r.reason);
        return rec.length > 0 && rec.every((r) => (a.measures[r.m.id] || {}).status);
      }
      case "review":
        return !!(a.review.approver && a.review.approvedOn && a.review.nextReview);
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
          <a href="#/a/${a.id}/${s.id}"${cur ? ' aria-current="step"' : ""}>
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
      ${prev ? `<a class="btn btn-secondary" href="#/a/${a.id}/${prev.id}">← ${h(prev.name)}</a>` : "<span></span>"}
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
          helps you assess all 17 kinds of priority illegal harm, and produces a written record you can keep, share and review.</p>
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
          <label class="btn btn-secondary btn-file">Import a saved file<input type="file" accept="application/json,.json" data-action="import" class="sr-only"></label>
        </div>
        ${
          list.length
            ? `<ul class="cards">${list
                .map((a) => {
                  const pct = progress(a);
                  return `<li class="card">
                    <div class="card-main">
                      <h3><a href="#/a/${a.id}/service">${h(a.profile.serviceName || "Untitled service")}</a></h3>
                      <p class="muted">${h(a.profile.orgName || "No organisation name")} · Updated ${h(fmtDate(a.updatedAt))}</p>
                      <div class="meter" role="progressbar" aria-label="Progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
                      <p class="small muted">${pct}% complete</p>
                    </div>
                    <div class="card-actions">
                      <a class="btn btn-small" href="#/a/${a.id}/${pct === 100 ? "report" : "service"}">${pct === 100 ? "View report" : "Continue"}</a>
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
          <p>Keep it up to date: review it regularly (many services do this every year), and before you make a significant change to your service.
          You should also review it if Ofcom changes its Risk Profiles in a way that affects your service.</p></details>
        <details><summary>What's a "large" or "multi-risk" service?</summary>
          <p>In Ofcom's Codes, a <strong>large</strong> service has more than 7 million monthly active UK users on average.
          A <strong>multi-risk</strong> service has a medium or high risk for at least two kinds of illegal harm. Some measures only apply to these services,
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
      ${field({ a, path: "profile.startDate", label: "Date assessment started", type: "date", narrow: true })}`;
  }

  function viewFactors(a) {
    const groups = groupsFor(a);
    const count = activeFactors(a).length;
    return `
      <h2>Identify your risk factors</h2>
      <p class="lede">Ofcom's Risk Profiles list features that are linked to a higher risk of illegal harm.
      Tick everything that applies to your service. Having a risk factor doesn't mean the risk is high: it tells you where to look closely in the next step.</p>
      <p class="callout"><strong>${count}</strong> risk factor${count === 1 ? "" : "s"} selected.</p>
      ${groups
        .map(
          (g) => `<fieldset class="field factor-group">
            <legend>${h(g.name)}</legend>
            <p class="hint">${h(g.hint)}</p>
            <div class="factor-grid">
              ${g.factors
                .map((f) => {
                  const n = f.raises.includes(D.ALL) ? "all harms" : f.raises.length + " harm" + (f.raises.length === 1 ? "" : "s");
                  return checkbox(a, "factors." + f.id, f.name, "Linked to " + n);
                })
                .join("")}
            </div>
          </fieldset>`
        )
        .join("")}
      ${field({
        a,
        path: "factorsNotes",
        label: "Other characteristics that affect risk",
        type: "textarea",
        optional: true,
        hint: "Anything else about your service, users or business model that could make illegal harm more or less likely.",
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
    const multi = multiRiskCount(a);
    return `
      <h2>Assess the risk of each kind of illegal harm</h2>
      <p class="lede">For each harm, consider how likely it is to happen on your service and how severe the impact would be, using the evidence you have.
      We suggest a risk level from your answers. You can change it, but explain why.</p>
      <div class="summary-bar" aria-label="Risk level summary">
        <span>${badge("high")} ${counts.high}</span>
        <span>${badge("medium")} ${counts.medium}</span>
        <span>${badge("low")} ${counts.low}</span>
        <span>${badge("negligible")} ${counts.negligible}</span>
        <span>${badge(null)} ${counts.none}</span>
      </div>
      ${multi >= 2 ? `<p class="callout callout-warn">Your service is <strong>multi-risk</strong>: it has a medium or high risk for ${multi} kinds of priority illegal harm.</p>` : ""}
      <div class="harm-list">
        ${D.harms
          .map((x) => {
            const e = a.harms[x.id] || {};
            const level = lv[x.id];
            const sug = suggestedLevel(e);
            const facs = factorsForHarm(a, x.id);
            const complete = level && (e.rationale || "").trim();
            const open = openHarms.has(x.id);
            return `<details class="harm" data-harm="${x.id}"${open ? " open" : ""}>
              <summary>
                <span class="harm-name">${h(x.name)}</span>
                <span class="harm-meta">${facs.length ? `<span class="pill">${facs.length} risk factor${facs.length === 1 ? "" : "s"}</span>` : ""}${badge(level)}${
              complete ? '<span class="tick" aria-label="Complete">✓</span>' : ""
            }</span>
              </summary>
              <div class="harm-body">
                <p>${h(x.summary)}</p>
                ${
                  facs.length
                    ? `<div class="factors-hit"><p class="mini-legend">Your risk factors linked to this harm</p><ul>${facs.map((f) => `<li>${h(f.name)}</li>`).join("")}</ul></div>`
                    : `<p class="muted small">None of your selected risk factors are linked to this harm. You still need to assess it, but the risk may be lower.</p>`
                }
                ${checkbox(
                  a,
                  `harms.${x.id}.negligible`,
                  "There is no realistic possibility of this harm on our service",
                  "For example, because users can't share the kind of content involved. The risk level will be negligible.",
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
                      hint: "How likely is it that users encounter this content, or that the service is used to commit or facilitate the offence?",
                      options: [
                        { id: "low", name: "Low", hint: "Unlikely, few risk factors, little or no evidence of it happening" },
                        { id: "medium", name: "Medium", hint: "Could happen; some risk factors or occasional evidence" },
                        { id: "high", name: "High", hint: "Likely, or there is evidence it happens regularly" },
                      ],
                    })}
                    ${radios({
                      a,
                      path: `harms.${x.id}.impact`,
                      label: "Impact",
                      hint: "How severe would the harm be, how many people could be affected, and how vulnerable are they?",
                      options: [
                        { id: "low", name: "Low", hint: "Limited harm to few people" },
                        { id: "medium", name: "Medium", hint: "Significant harm, or harm to many people" },
                        { id: "high", name: "High", hint: "Severe or lasting harm, or harm to children or vulnerable users" },
                      ],
                    })}
                  </div>
                  ${sug ? `<p class="callout">Suggested risk level: ${badge(sug)}</p>` : ""}
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
                  hint: "Measures already in place that reduce this risk.",
                })}
                ${field({
                  a,
                  path: `harms.${x.id}.rationale`,
                  id: `rat-${x.id}`,
                  label: "Why you've assigned this risk level",
                  type: "textarea",
                  rows: 4,
                  hint: "Summarise the evidence and your reasoning. This is the core of your written record.",
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
        <h4>${h(m.name)}</h4>
        ${reason ? `<span class="pill pill-accent">${h(reason)}</span>` : ""}
      </div>
      <p class="small">${h(m.desc)}</p>
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
      list.forEach((r) => (g[r.m.group] = g[r.m.group] || []).push(r));
      return g;
    };
    const renderGroups = (list) =>
      Object.entries(groupBy(list))
        .map(([name, items]) => `<section class="measure-group"><h3>${h(name)}</h3>${items.map((r) => measureRow(a, r.m, r.reason)).join("")}</section>`)
        .join("");
    const unassessed = D.harms.filter((x) => !harmLevel(a.harms[x.id])).length;
    const done = rec.filter((r) => (a.measures[r.m.id] || {}).status).length;
    return `
      <h2>Decide your safety measures</h2>
      <p class="lede">Based on your answers, these measures from Ofcom's Illegal Content Codes of Practice are recommended for your service.
      Following the Codes is one way to show you meet your safety duties. Record what you have in place, what you plan, and anything you do differently.</p>
      <p class="callout">${isLarge(a) ? "Large service" : "Not a large service"} · ${isMulti(a) ? "Multi-risk" : "Not multi-risk"} · <strong>${done} of ${rec.length}</strong> recommended measures have a status.</p>
      ${unassessed ? `<p class="callout callout-warn">${unassessed} harm${unassessed === 1 ? " hasn't" : "s haven't"} been given a risk level yet, so this list may be incomplete. <a href="#/a/${a.id}/harms">Finish assessing the risks</a>.</p>` : ""}
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

  function viewReview(a) {
    const r = a.review;
    const triggers = [
      ["significant_change", "Before making a significant change to the service's design or operation"],
      ["profiles", "When Ofcom makes a significant change to its Risk Profiles that affects the service"],
      ["incident", "After a serious incident or a sharp rise in a kind of illegal content"],
      ["growth", "If user numbers grow so the service becomes 'large'"],
      ["annual", "At least once a year"],
    ];
    return `
      <h2>Record, sign off and plan your review</h2>
      <p class="lede">You must keep a written record of your risk assessment and keep it up to date.
      Record who approved it and when you'll review it.</p>
      <div class="form-grid">
        ${field({ a, path: "review.approver", label: "Approved by", hint: "Name and role of the person accountable, for example the named person for illegal content safety." })}
        ${field({ a, path: "review.approvedOn", label: "Date approved", type: "date", rerender: true })}
        ${field({ a, path: "review.nextReview", label: "Next review date", type: "date", hint: r.approvedOn && !r.nextReview ? "Most services review every 12 months." : "" })}
      </div>
      ${r.approvedOn && !r.nextReview ? `<button class="btn btn-secondary btn-small" data-action="set-review" data-date="${addMonths(r.approvedOn, 12)}">Set to ${fmtDate(addMonths(r.approvedOn, 12))}</button>` : ""}
      <fieldset class="field">
        <legend>What will trigger an earlier review?</legend>
        ${triggers.map(([id, label]) => checkbox(a, "review.triggers." + id, label)).join("")}
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
    const triggerNames = {
      significant_change: "Before a significant change to the service",
      profiles: "When Ofcom changes its Risk Profiles in a relevant way",
      incident: "After a serious incident or sharp rise in illegal content",
      growth: "If the service becomes 'large'",
      annual: "At least once a year",
    };
    const evNames = Object.fromEntries([...D.evidence.core, ...D.evidence.enhanced].map((e) => [e.id, e.name]));
    return `
      <div class="report-actions no-print">
        ${missing.length ? `<p class="callout callout-warn">Some steps aren't finished: ${missing.map((s) => `<a href="#/a/${a.id}/${s.id}">${h(s.name)}</a>`).join(", ")}. You can still print a draft.</p>` : `<p class="callout callout-ok">All steps are complete.</p>`}
        <div class="actions">
          <button class="btn" data-action="print">Print or save as PDF</button>
          <button class="btn btn-secondary" data-action="export" data-id="${a.id}">Export as a file</button>
        </div>
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
          <dt>Classification</dt><dd>${isLarge(a) ? "Large service" : "Not a large service"}; ${isMulti(a) ? `multi-risk (${multiRiskCount(a)} harms at medium or high)` : "not multi-risk"}</dd>
          <dt>Assessed by</dt><dd>${h(p.assessor) || "<em>Not given</em>"}</dd>
          <dt>Started</dt><dd>${h(fmtDate(p.startDate))}</dd>
        </dl>

        <h3>2. Risk factors</h3>
        ${factors.length ? `<ul class="columns">${factors.map((f) => `<li>${h(f.name)}</li>`).join("")}</ul>` : "<p><em>No risk factors selected.</em></p>"}
        ${a.factorsNotes ? `<p><strong>Other characteristics:</strong> ${h(a.factorsNotes)}</p>` : ""}

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
              ${facs.length ? `<p class="small"><strong>Risk factors:</strong> ${facs.map((f) => h(f.name)).join("; ")}</p>` : ""}
              ${ev.length ? `<p class="small"><strong>Evidence:</strong> ${ev.map(h).join("; ")}</p>` : ""}
              ${e.controls ? `<p class="small"><strong>Existing controls:</strong> ${h(e.controls)}</p>` : ""}
            </section>`;
          })
          .join("")}

        <h3>5. Safety measures</h3>
        <table class="table">
          <thead><tr><th scope="col">Measure</th><th scope="col">Why</th><th scope="col">Status</th><th scope="col">Owner</th><th scope="col">Target</th></tr></thead>
          <tbody>
            ${adopted
              .map((r) => {
                const st = a.measures[r.m.id] || {};
                return `<tr><th scope="row">${h(r.m.name)}${st.notes ? `<div class="small muted">${h(st.notes)}</div>` : ""}</th><td class="small">${h(r.reason || "Adopted voluntarily")}</td><td>${h(statusName[st.status] || "Not recorded")}</td><td>${h(st.owner)}</td><td>${h(fmtDate(st.due))}</td></tr>`;
              })
              .join("")}
            ${custom
              .map((c) => `<tr><th scope="row">${h(c.name)}${c.desc ? `<div class="small muted">${h(c.desc)}</div>` : ""}</th><td class="small">Own measure</td><td>${h(statusName[c.status] || "Not recorded")}</td><td>${h(c.owner)}</td><td></td></tr>`)
              .join("")}
          </tbody>
        </table>

        <h3>6. Sign-off and review</h3>
        <dl class="dl">
          <dt>Approved by</dt><dd>${h(a.review.approver) || "<em>Not approved</em>"}</dd>
          <dt>Date approved</dt><dd>${h(fmtDate(a.review.approvedOn)) || "<em>–</em>"}</dd>
          <dt>Next review</dt><dd>${h(fmtDate(a.review.nextReview)) || "<em>–</em>"}</dd>
          <dt>Review triggers</dt><dd>${triggers.length ? triggers.map(([k]) => h(triggerNames[k])).join("; ") : "<em>None recorded</em>"}</dd>
          ${a.review.governance ? `<dt>Governance reporting</dt><dd>${h(a.review.governance)}</dd>` : ""}
          ${a.review.notes ? `<dt>Notes</dt><dd>${h(a.review.notes)}</dd>` : ""}
        </dl>
        <p class="small muted report-foot">Record generated ${h(fmtDate(new Date().toISOString()))}. Prepared with reference to Ofcom's Risk Assessment Guidance, Risk Profiles and Illegal Content Codes of Practice under the Online Safety Act 2023.</p>
      </article>`;
  }

  function viewNotFound() {
    return `<section class="panel"><h1>Assessment not found</h1><p>It may have been deleted, or saved in a different browser.</p><p><a class="btn" href="#/">Go to your assessments</a></p></section>`;
  }

  // ---------- routing ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    if (parts[0] === "a" && parts[1]) {
      const a = store[parts[1]];
      if (!a) return { view: "notfound" };
      const step = STEPS.find((s) => s.id === parts[2]) ? parts[2] : "service";
      return { view: "step", a, step };
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
    if (path === "profile.children" && (val === "yes" || val === "unsure")) a.factors.u_children = true;
    if (path === "profile.ukUsers") a.factors.u_large = isLarge(a) || a.factors.u_large;
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
    if (el.getAttribute("data-action") === "import") return importFile(el);
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
        location.hash = `#/a/${n.id}/service`;
        break;
      }
      case "example": {
        const n = exampleAssessment();
        store[n.id] = n;
        persistNow();
        location.hash = `#/a/${n.id}/harms`;
        break;
      }
      case "next":
        if (a) {
          if (route().step === "factors") a.factorsReviewed = true;
          touch(a);
          persistNow();
          location.hash = `#/a/${a.id}/${btn.getAttribute("data-next")}`;
        }
        break;
      case "export":
        exportFile(store[btn.getAttribute("data-id")]);
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
        const name = (store[id].profile.serviceName || "this assessment");
        if (confirm(`Delete "${name}"? This can't be undone. Export it first if you want to keep a copy.`)) {
          delete store[id];
          persistNow();
          render();
        }
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
    }
  });

  function exportFile(a) {
    if (!a) return;
    const blob = new Blob([JSON.stringify({ format: "osra", version: 1, assessment: a }, null, 2)], { type: "application/json" });
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

  function importFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const a = data && data.format === "osra" ? data.assessment : data;
        if (!a || typeof a !== "object" || !a.profile || !a.harms) throw new Error("bad");
        const fresh = Object.assign(blankAssessment(), a);
        if (store[fresh.id] && !confirm("You already have this assessment on this device. Replace it with the imported version?")) {
          fresh.id = uid();
        }
        store[fresh.id] = fresh;
        persistNow();
        location.hash = `#/a/${fresh.id}/service`;
        render();
      } catch (err) {
        alert("That file couldn't be read. Choose a file exported from this tool.");
      }
    };
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
    ["t_forum", "u_children", "f_profiles", "f_anonymous", "f_groups", "f_dm", "f_images", "f_links", "f_comments", "f_search", "b_early"].forEach((id) => (a.factors[id] = true));
    a.factorsReviewed = true;
    a.harms = {
      harassment: { likelihood: "medium", impact: "medium", rationale: "We receive a few reports of abusive messages each month, mostly in private messages. Users can be anonymous and can message anyone.", evidence: { e_profile: true, e_complaints: true }, controls: "Volunteer moderators; users can report posts." },
      grooming: { likelihood: "medium", impact: "high", rationale: "Some users may be under 18 and anyone can send a private message to anyone. No incidents reported, but the risk factors are present and the impact would be severe.", evidence: { e_profile: true, e_userdata: true } },
      csam_image: { likelihood: "low", impact: "high", rationale: "Users can upload images. No incidents in the last three years; images are visible to moderators.", evidence: { e_profile: true, e_incidents: true } },
      immigration: { negligible: true, rationale: "No marketplace, listings or payments. The forum's niche topic and moderated threads give no realistic route for this harm." },
    };
    return a;
  }

  window.addEventListener("hashchange", () => render());
  if (!storageOk) {
    const b = document.getElementById("storage-warning");
    if (b) b.hidden = false;
  }
  render({ initial: true });
})();
