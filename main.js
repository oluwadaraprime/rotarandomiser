/**
 * Church rota generator — plain JS, localStorage, html2canvas export.
 *
 * ========== PASTE YOUR TEAM HERE (array of strings) ==========
 * Default is used only if localStorage has no saved team yet.
 */
const DEFAULT_TEAM = [
  "Bro Victor",
  "Bro Simon",
  "Bro Emmanuel",
  "Bro Michael",
  "Bro Caleb",
  "Bro Isaac",
  "Bro Dami Keys",
  "Bro Kenny",
  "Bro David",
  "Bro TJ",
  "Bro Dara",
  "Bro Enoch",
  "Bro Taiwo",
  "Bro Adedayo",
  "Bro Abiola",
  "Bro Osaze",
  "Bro Ebenezer",
  "Bro Israel",
  "Bro Ife",
  "Bro Alex",
  "Bro Roni",
  "Bro Samuel",
  "Bro Sam",
  "Bro Tawo",
  "Sis Marvelous",
  "Sis Eri",
  "Sis Janelle",
];

/**
 * ========== SATURDAY ROLES (edit this list as needed) ==========
 */
const SATURDAY_ROLES = [
  "PREPARATION FOR SUNDAY/CHOIR REHEARSALS",
  "SETUP BEGINS BY 11AM PROMPT",
  "PRESENTATION AND LYRICS",
  "LYRICS CHECK",
  "SERVICE SCHEDULING",
  "PRODUCER/SWITCHING",
  "AUDIO (FOH)",
  "AUDIO (STAGE)",
  "LIGHTS CHECK",
  "BACK CAM (FREE SLOT CHECK)",
  "SIDE CAM PRACTICE/CHECK",
  "MOBILE CAM PRACTICE/CHECK",
  "PHOTOGRAPHY PRACTICE",
];

/**
 * ========== SUNDAY ROLES (edit this list as needed) ==========
 */
const SUNDAY_ROLES = [
  "PRESENTATION",
  "VISION MIXER",
  "LIVE STREAM DIRECTOR",
  "BROADCAST",
  "AUDIO (FOH)",
  "AUDIO (STAGE)",
  "LIGHTS",
  "BACK CAM",
  "SIDE CAM",
  "MOBILE CAM",
  "PHOTOGRAPHY",
  // Keep these four rows at the bottom to match your sample layout.
  "POWER/SYSTEM ADMINISTRATION",
  "PHOTO UPLOAD",
  "SERVICE TECH DIRECTOR",
  "SERMON SUMMARY",
];

/**
 * === Role groups (edit here to update eligibility) ===
 * Values must match the exact strings used in your `teamMembers` list.
 */
const ROLE_GROUPS = {
  presentationAndLyrics: [
    "Bro Emmanuel",
    "Bro Simon",
    "Sis Marvelous",
    "Sis Eri",
    "Bro Caleb",
    "Bro Michael",
    "Bro Victor",
    "Bro Dami Keys",
  ],
  // AUDIO (FOH) + AUDIO (STAGE)
  audioRoles: [
    "Bro Ebenezer",
    "Bro Taiwo",
    "Bro Isaac",
    "Bro Alex",
    "Bro Adedayo",
  ],
  // BACK CAM + SIDE CAM (not mobile)
  cameraRoles: [
    "Bro Kenny",
    "Bro TJ",
    "Bro Caleb",
    "Bro Dara",
    "Bro Abiola",
    "Bro Isaac",
    "Bro Taiwo",
    "Bro Simon",
    "Bro Enoch",
    "Bro Adedayo",
  ],
  // VISION MIXER (Bro Ebenezer is never assigned to this role)
  visionMixer: [
    "Bro Adedayo",
    "Bro Simon",
    "Bro Alex",
    "Bro Abiola",
    "Bro Dara",
    "Bro David",
    "Bro Caleb",
    "Sis Marvelous",
    "Sis Janelle",
    "Bro Emmanuel",
    "Bro Dami Keys",
    "Bro Taiwo",
    "Bro Kenny",
    "Bro Isaac",
    "Bro Israel",
    "Bro Enoch",
  ],
  mobileCam: [
    "Bro Dara",
    "Bro David",
    "Bro Osaze",
    "Bro Israel",
  ],
  lights: [
    "Bro Alex",
    "Bro Israel",
  ],
  photographyTeam: [
    "Bro Abiola",
    "Bro Israel",
    "Sis Janelle",
    "Bro Ife",
  ],
  // SERVICE TECH DIRECTOR pool (always paired with Bro Ebenezer in the merged cell)
  serviceTechDirectors: [
    "Bro Kenny",
    "Bro Ebenezer",
    "Bro Osaze",
    "Bro Israel",
    "Bro Taiwo",
    "Bro Alex",
    "Sis Marvelous",
  ],
};

/** Always shown as the second name for SERVICE TECH DIRECTOR (e.g. Bro Kenny / Bro Ebenezer). */
const SERVICE_TECH_DIRECTOR_CO_DIRECTOR = "Bro Ebenezer";

/**
 * === Sunday worship/ministration exclusions ===
 * These people may serve in other roles, but never inside:
 * - PRAISE & WORSHIP column
 * - OFFERING column
 * - MINISTRATION column
 */
const SUNDAY_WORSHIP_MINISTRY_FORBIDDEN = new Set([
  "Bro Dami Keys",
  "Bro Victor",
  "Bro Ife",
]);
const SUNDAY_WORSHIP_MINISTRY_SEGMENTS = new Set([
  "PRAISE & WORSHIP",
  "OFFERING",
  "MINISTRATION",
]);

/**
 * Musicians and others who must not be assigned to the THANKSGIVING column.
 */
const SUNDAY_THANKSGIVING_FORBIDDEN = new Set([
  "Bro Victor",
  "Bro Ife",
  "Bro Roni",
  "Bro Dami Keys",
]);

// Keep Sunday row positioning fixed to match your sample layout.
const SUNDAY_ROW_ORDER = SUNDAY_ROLES.slice();

/**
 * === Role -> assignment rule mapping ===
 * For roles not present here, the default is "any" (from the whole team).
 *
 * `candidates`: either "any" or a key in ROLE_GROUPS.
 * `exclude`: optional array of names that must never be picked for this role.
 *
 * `singular: true` (Sunday-only use): only place this role into `preferredSegment`.
 * We keep this to satisfy: SERVICE TECH DIRECTOR = only 1 person per Sunday, and
 * SERMON SUMMARY = only 1 person (placed into the SERMON column when available).
 */
const ROLE_TO_RULE = {
  // Saturday/Sunday Presentation/Lyrics
  "PRESENTATION": { candidates: "presentationAndLyrics" },
  "PRESENTATION AND LYRICS": { candidates: "presentationAndLyrics" },
  "LYRICS CHECK": { candidates: "presentationAndLyrics" },

  // AUDIO
  "AUDIO (FOH)": { candidates: "audioRoles" },
  "AUDIO (STAGE)": { candidates: "audioRoles" },

  // CAMERA (Back/Side, not mobile)
  "BACK CAM (FREE SLOT CHECK)": { candidates: "cameraRoles" },
  "SIDE CAM PRACTICE/CHECK": { candidates: "cameraRoles" },
  "BACK CAM": { candidates: "cameraRoles" },
  "SIDE CAM": { candidates: "cameraRoles" },

  // MOBILE CAM
  "MOBILE CAM PRACTICE/CHECK": { candidates: "mobileCam" },
  "MOBILE CAM": { candidates: "mobileCam" },

  // LIGHTS
  "LIGHTS CHECK": { candidates: "lights" },
  "LIGHTS": { candidates: "lights" },

  // PHOTOGRAPHY
  "PHOTOGRAPHY PRACTICE": { candidates: "photographyTeam" },
  "PHOTOGRAPHY": { candidates: "photographyTeam" },
  "PHOTO UPLOAD": { candidates: "photographyTeam" },

  "VISION MIXER": { candidates: "visionMixer" },
  // POWER/SYSTEM ADMINISTRATION: anyone can be used.
  "POWER/SYSTEM ADMINISTRATION": { candidates: "any" },

  // Sunday-only singular roles
  "SERVICE TECH DIRECTOR": {
    candidates: "serviceTechDirectors",
    singular: true,
    preferredSegment: "SERMON",
  },
  "SERMON SUMMARY": {
    candidates: "any",
    singular: true,
    preferredSegment: "SERMON",
  },
};

/**
 * Sunday rows that should render as ONE merged cell across all segments,
 * and also be scheduled as ONE person for the whole day for that role.
 */
const SUNDAY_MERGED_ROWS = new Set([
  "POWER/SYSTEM ADMINISTRATION",
  "PHOTO UPLOAD",
  "SERVICE TECH DIRECTOR",
  "SERMON SUMMARY",
]);

/** localStorage keys */
const LS_TEAM = "churchRota_team_v1";
const LS_COUNTS = "churchRota_counts_v1";
const LS_THEME = "churchRota_theme_v1";
const LS_SATURDAY_POOL = "churchRota_saturdayPool_v1";
const LS_SUNDAY_POOL = "churchRota_sundayPool_v1";
const LS_USE_POOLS = "churchRota_useSelectedPools_v1";
const LS_TEAM_LIST_VISIBLE = "churchRota_teamListVisible_v1";

/** Sunday segment columns by service type (optional THANKSGIVING etc.) */
const SUNDAY_SEGMENT_PRESETS = {
  standard: {
    label: "Standard",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "PRAISE & WORSHIP",
      "OFFERING",
      "MINISTRATION",
      "SERMON",
    ],
  },
  prayer: {
    label: "Prayer Sunday",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "PRAISE & WORSHIP",
      "OFFERING",
      "HYMN",
      "PRAYERS",
    ],
  },
  family: {
    label: "Family Sunday",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "PRAISE & WORSHIP",
      "OFFERING",
      "MINISTRATION",
      "SERMON",
    ],
  },
  youth: {
    label: "Electus Sunday",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "MOMENT OF WORSHIP",
      "HYMN",
      "THEME EXPLORATION",
      "OFFERING",
      "PRAISE OVERFLOW",
      "MINISTRATION",
      "SERMON",
    ],
  },
  thanksgiving: {
    label: "Thanksgiving Sunday",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "PRAISE & WORSHIP",
      "TESTIMONY",
      "OFFERING",
      "MINISTRATION",
      "SERMON",
      "THANKSGIVING",
    ],
  },
  children: {
    label: "Children's Sunday",
    segments: [
      "SUNDAY SCHOOL",
      "OPENING PRAYER",
      "PRAISE & WORSHIP",
      "HYMN",
      "CHILDREN MINISTRATIONS",
      "OFFERING",
      "CHOIR MINISTRATION",
      "SERMON",
    ],
  },
};

// Sunday banner subtitle (edit as needed).
const SUNDAY_BANNER_NOTE =
  "The workers prayer starts at 9:45am in the children's room. Sunday school begins at 10am in the main auditorium";

let teamMembers = [];
/** @type {Record<string, number>} */
let serveCounts = {};

/** Names eligible for the rota currently being generated (full team or selected pool). */
let activeRotaTeam = [];

/** Admin-selected subsets used when `useSelectedPools` is true. */
let saturdayRotaPool = [];
let sundayRotaPool = [];
let useSelectedPools = false;
let teamListVisible = true;

let lastSaturdayAssignments = null;
let lastSundayAssignments = null;

function loadTeamFromStorage() {
  try {
    const raw = localStorage.getItem(LS_TEAM);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(String);
      }
    }
  } catch (_) {
    /* ignore */
  }
  return DEFAULT_TEAM.slice();
}

function saveTeamToStorage() {
  localStorage.setItem(LS_TEAM, JSON.stringify(teamMembers));
}

function loadCountsFromStorage() {
  try {
    const raw = localStorage.getItem(LS_COUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (_) {
    /* ignore */
  }
  return {};
}

function saveCountsToStorage() {
  localStorage.setItem(LS_COUNTS, JSON.stringify(serveCounts));
}

function loadPoolFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch (_) {
    /* ignore */
  }
  return [];
}

function saveSaturdayPoolToStorage() {
  localStorage.setItem(LS_SATURDAY_POOL, JSON.stringify(saturdayRotaPool));
}

function saveSundayPoolToStorage() {
  localStorage.setItem(LS_SUNDAY_POOL, JSON.stringify(sundayRotaPool));
}

function savePoolSettingsToStorage() {
  localStorage.setItem(LS_USE_POOLS, JSON.stringify(useSelectedPools));
  localStorage.setItem(LS_TEAM_LIST_VISIBLE, JSON.stringify(teamListVisible));
}

function sanitizePoolsWithMasterTeam() {
  saturdayRotaPool = saturdayRotaPool.filter((n) => teamMembers.includes(n));
  sundayRotaPool = sundayRotaPool.filter((n) => teamMembers.includes(n));
  saveSaturdayPoolToStorage();
  saveSundayPoolToStorage();
}

/** Who is available when generating a rota for the given day. */
function getRotaTeam(day) {
  if (!useSelectedPools) return teamMembers.slice();
  const pool = day === "sunday" ? sundayRotaPool : saturdayRotaPool;
  return pool.filter((n) => teamMembers.includes(n));
}

function setActiveRotaTeamFor(day) {
  activeRotaTeam = getRotaTeam(day);
}

function poolLabelForDay(day) {
  return day === "sunday" ? "Sunday" : "Saturday";
}

function validateRotaTeamForGeneration(day) {
  setActiveRotaTeamFor(day);
  if (!teamMembers.length) {
    alert("Team list is empty. Add at least one name under Team members.");
    return false;
  }
  if (!activeRotaTeam.length) {
    if (useSelectedPools) {
      alert(
        `${poolLabelForDay(day)} pool is empty. Select members in the rota assignment pool, or turn off "Use selected members only".`
      );
    } else {
      alert("Team list is empty. Add at least one name under Team members.");
    }
    return false;
  }
  return true;
}

function ensureCountsForTeam() {
  const next = { ...serveCounts };
  for (const name of teamMembers) {
    if (typeof next[name] !== "number" || Number.isNaN(next[name])) {
      next[name] = 0;
    }
  }
  for (const key of Object.keys(next)) {
    if (!teamMembers.includes(key)) {
      delete next[key];
    }
  }
  serveCounts = next;
}

/**
 * Fair pick: prefer people with lower serveCounts; random tie-break.
 * Removes chosen from `availablePool` (mutates copy).
 */
function pickFair(availablePool, counts) {
  if (!availablePool.length) return null;
  const sorted = [...availablePool].sort((a, b) => {
    const ca = counts[a] ?? 0;
    const cb = counts[b] ?? 0;
    if (ca !== cb) return ca - cb;
    return Math.random() - 0.5;
  });
  const minCount = sorted[0] ? counts[sorted[0]] ?? 0 : 0;
  const least = sorted.filter((n) => (counts[n] ?? 0) === minCount);
  const choice = least[Math.floor(Math.random() * least.length)];
  const idx = availablePool.indexOf(choice);
  if (idx !== -1) availablePool.splice(idx, 1);
  return choice;
}

function getRoleRule(roleName) {
  return ROLE_TO_RULE[roleName] || { candidates: "any" };
}

function getCandidatesForRole(roleName) {
  const rule = getRoleRule(roleName);
  if (rule.candidates === "any") return activeRotaTeam.slice();
  const group = ROLE_GROUPS[rule.candidates];
  if (!Array.isArray(group)) return activeRotaTeam.slice();
  return group.filter((n) => activeRotaTeam.includes(n));
}

function getSundayColumnExclusions(segmentName) {
  const excluded = new Set();
  if (SUNDAY_WORSHIP_MINISTRY_SEGMENTS.has(segmentName)) {
    for (const name of SUNDAY_WORSHIP_MINISTRY_FORBIDDEN) excluded.add(name);
  }
  if (segmentName === "THANKSGIVING") {
    for (const name of SUNDAY_THANKSGIVING_FORBIDDEN) excluded.add(name);
  }
  return excluded;
}

/**
 * Pick SERVICE TECH DIRECTOR as "Partner / Bro Ebenezer" from the serviceTechDirectors pool.
 */
function pickServiceTechDirector(usedGlobal) {
  const coDirector = SERVICE_TECH_DIRECTOR_CO_DIRECTOR;
  const pool = ROLE_GROUPS.serviceTechDirectors.filter(
    (n) => n !== coDirector && activeRotaTeam.includes(n)
  );

  if (!pool.length) return "—";
  if (!activeRotaTeam.includes(coDirector)) {
    const solo = pickFair(pool.filter((n) => !usedGlobal.has(n)).length
      ? pool.filter((n) => !usedGlobal.has(n))
      : pool.slice(), serveCounts);
    return solo ?? "—";
  }

  const eligible = pool.filter((n) => !usedGlobal.has(n));
  const partner = pickFair(eligible.length ? [...eligible] : [...pool], serveCounts);
  if (!partner) return "—";
  return `${partner} / ${coDirector}`;
}

function parseAssignmentNames(text) {
  if (!text || text === "—") return [];
  return text.split("/").map((part) => part.trim()).filter(Boolean);
}

function applyNameExclusions(candidates, excludeList) {
  if (!excludeList || !excludeList.length) return candidates;
  const excluded = new Set(excludeList);
  return candidates.filter((n) => !excluded.has(n));
}

/**
 * Pick one eligible person for a specific Saturday slot.
 * Enforces:
 * - role group eligibility
 * - no duplicates across the whole rota (via `used`)
 * - fairness by `serveCounts`
 */
function pickForSaturdaySlot(roleName, used) {
  const rule = getRoleRule(roleName);
  const base = getCandidatesForRole(roleName);
  const excludedByRole = rule.exclude || [];

  // Primary attempt: role-eligible candidates, excluding already-used names.
  const eligible1 = applyNameExclusions(base, excludedByRole).filter((n) => !used.has(n));
  let choice = pickFair(eligible1, serveCounts);
  if (choice) return choice;

  // Fallback: allow any team member (still no duplicates).
  const eligible2 = activeRotaTeam.filter((n) => !used.has(n) && !new Set(excludedByRole).has(n));
  choice = pickFair(eligible2, serveCounts);
  return choice;
}

/**
 * Pick one eligible person for a Sunday cell (role row + segment column).
 * Enforces:
 * - role group eligibility
 * - no duplicates across the whole rota (via `used`)
 * - fairness by `serveCounts`
 * - Sunday worship/ministration column restriction
 */
function pickForSundayCell(roleName, segmentName, usedGlobal, usedRow) {
  const rule = getRoleRule(roleName);
  const base = getCandidatesForRole(roleName);
  const excludedByRole = rule.exclude || [];

  const forbiddenByColumn = getSundayColumnExclusions(segmentName);

  const excluded = new Set([...excludedByRole, ...forbiddenByColumn]);

  // First try: avoid repeats across the whole table AND within the row.
  const eligible1 = base.filter((n) => !excluded.has(n) && !usedGlobal.has(n) && !usedRow.has(n));
  let choice = pickFair(eligible1, serveCounts);
  if (choice) return choice;

  // Second try: allow reuse globally, but avoid repeating within the same row.
  const eligible2 = base.filter((n) => !excluded.has(n) && !usedRow.has(n));
  choice = pickFair(eligible2, serveCounts);
  if (choice) return choice;

  // Final fallback: any team member (still apply column restriction).
  const eligible3 = activeRotaTeam.filter((n) => !excluded.has(n) && !usedRow.has(n));
  choice = pickFair(eligible3, serveCounts);
  return choice;
}

/**
 * Saturday: one primary + one backup per role; each person appears at most once
 * in the whole table (no duplicate names across primary/backup and all rows).
 */
function generateSaturdayAssignments() {
  setActiveRotaTeamFor("saturday");
  const roles = SATURDAY_ROLES;
  const rows = [];
  let warning = "";

  if (activeRotaTeam.length < 2) {
    return {
      rows: roles.map((role) => ({ role, primary: "—", backup: "—" })),
      warning: useSelectedPools
        ? "Saturday pool needs at least two people for primary and backup."
        : "Need at least two people on the team for primary and backup.",
    };
  }

  const needed = roles.length * 2;
  if (activeRotaTeam.length < needed) {
    warning = `Not enough people for unique primary and backup on every row (need ${needed}, have ${activeRotaTeam.length}). Remaining slots show —.`;
  }

  const used = new Set();

  for (const role of roles) {
    // Saturday sample format: first row is a band header; setup row has a fixed \"SKILL DEVELOPMENT\" in the 3rd column.
    if (role === "PREPARATION FOR SUNDAY/CHOIR REHEARSALS" || role === "PREPARATIONS FOR SUNDAY/ CHOIR RHEARSALS" || role === "PREPARATIONS FOR SUNDAY/ CHOIR REHEARSALS") {
      rows.push({ role, primary: "", backup: "", isBand: true });
      continue;
    }
    if (role.startsWith("SETUP BEGINS BY")) {
      rows.push({ role, primary: "", backup: "SKILL DEVELOPMENT" });
      continue;
    }

    const primary = pickForSaturdaySlot(role, used);
    if (primary) used.add(primary);

    const backup = pickForSaturdaySlot(role, used);
    if (backup) used.add(backup);

    rows.push({
      role,
      primary: primary ?? "—",
      backup: backup ?? "—",
    });
  }

  return { rows, warning: warning || undefined };
}

/**
 * Sunday: one person per role row; same name in every segment column.
 * No person is assigned to more than one role (row) in the same rota.
 */
function generateSundayAssignments() {
  setActiveRotaTeamFor("sunday");
  const roles = SUNDAY_ROW_ORDER;
  const rows = [];
  let warning = "";

  const presetKey = document.getElementById("sunday-service-type").value;
  const preset = SUNDAY_SEGMENT_PRESETS[presetKey] || SUNDAY_SEGMENT_PRESETS.standard;
  const segments = preset.segments;

  if (!activeRotaTeam.length) {
    return {
      rows: roles.map((role) => ({ role, cells: segments.map(() => "—"), merged: false })),
      segments,
      serviceTypeKey: presetKey,
      serviceLabel: preset.label,
      warning: useSelectedPools ? "Sunday pool is empty." : "Team list is empty.",
    };
  }

  // Soft constraint: try not to repeat names across the whole Sunday table.
  // If not possible for a given cell, fallback allows reuse.
  const usedGlobal = new Set();

  for (const role of roles) {
    // Merged rows: one person for the whole day in this role; render as colspan.
    if (SUNDAY_MERGED_ROWS.has(role)) {
      let person;
      if (role === "SERVICE TECH DIRECTOR") {
        person = pickServiceTechDirector(usedGlobal);
      } else {
        const usedRow = new Set();
        person = pickForSundayCell(role, "SERMON", usedGlobal, usedRow) ?? "—";
      }
      if (person !== "—") {
        for (const name of parseAssignmentNames(person)) usedGlobal.add(name);
      }
      rows.push({ role, merged: true, person });
      continue;
    }

    const usedRow = new Set();
    const cells = [];
    for (const segment of segments) {
      const person = pickForSundayCell(role, segment, usedGlobal, usedRow);
      const finalPerson = person ?? "—";
      cells.push(finalPerson);
      if (finalPerson !== "—") {
        usedRow.add(finalPerson);
        usedGlobal.add(finalPerson);
      }
    }

    rows.push({ role, merged: false, cells });
  }

  return {
    rows,
    segments,
    serviceTypeKey: presetKey,
    serviceLabel: preset.label,
    warning: warning || undefined,
  };
}

function applyServeIncrementsForSaturday(rows) {
  for (const row of rows) {
    if (row.primary && row.primary !== "—") {
      serveCounts[row.primary] = (serveCounts[row.primary] ?? 0) + 1;
    }
    if (row.backup && row.backup !== "—") {
      serveCounts[row.backup] = (serveCounts[row.backup] ?? 0) + 1;
    }
  }
  saveCountsToStorage();
}

function applyServeIncrementsForSunday(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.merged) {
      for (const name of parseAssignmentNames(row.person)) {
        if (name && name !== "—" && !seen.has(name)) {
          serveCounts[name] = (serveCounts[name] ?? 0) + 1;
          seen.add(name);
        }
      }
      continue;
    }
    for (const cell of row.cells || []) {
      if (!cell || cell === "—") continue;
      if (seen.has(cell)) continue;
      serveCounts[cell] = (serveCounts[cell] ?? 0) + 1;
      seen.add(cell);
    }
  }
  saveCountsToStorage();
}

function formatDateLine(prefix, isoDate) {
  if (!isoDate) return `${prefix} — select a date`;
  const d = new Date(isoDate + "T12:00:00");
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return `${prefix} — ${d.toLocaleDateString(undefined, opts)}`;
}

function getSundaySegments() {
  const key = document.getElementById("sunday-service-type").value;
  const preset = SUNDAY_SEGMENT_PRESETS[key] || SUNDAY_SEGMENT_PRESETS.standard;
  return preset;
}

function formatShortDate(iso) {
  if (!iso) return "No date selected";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getServiceTypeLabel() {
  const key = document.getElementById("sunday-service-type").value;
  const preset = SUNDAY_SEGMENT_PRESETS[key] || SUNDAY_SEGMENT_PRESETS.standard;
  return preset.label || "Standard";
}

function updateSundayPreviewMeta() {
  const meta = document.getElementById("sunday-preview-meta");
  if (!meta) return;
  meta.textContent = `${getServiceTypeLabel()} · ${formatShortDate(document.getElementById("rota-date").value)}`;
}

function updateSaturdayPreviewMeta() {
  const meta = document.getElementById("saturday-preview-meta");
  if (!meta) return;
  meta.textContent = formatShortDate(document.getElementById("rota-date").value);
}

function setSaturdayPreviewReady(ready) {
  const card = document.getElementById("saturday-preview-card");
  if (!card) return;
  card.classList.toggle("is-ready", ready);
  document.getElementById("saturday-preview-status").textContent = ready ? "Ready" : "Not generated";
  updateSaturdayPreviewMeta();
}

function setSundayPreviewReady(ready) {
  const card = document.getElementById("sunday-preview-card");
  if (!card) return;
  card.classList.toggle("is-ready", ready);
  document.getElementById("sunday-preview-status").textContent = ready ? "Ready" : "Not generated";
  updateSundayPreviewMeta();
}
function renderSaturdayTable(result) {
  const tbody = document.getElementById("saturday-tbody");
  tbody.innerHTML = "";
  const iso = document.getElementById("rota-date").value;
  document.getElementById("saturday-date-line").textContent = formatDateLine("Saturday", iso);

  for (const row of result.rows) {
    const tr = document.createElement("tr");
    if (row.isBand) tr.classList.add("band-row");
    tr.innerHTML = `
      <th scope="row" class="role-cell">${escapeHtml(row.role)}</th>
      <td>${escapeHtml(row.primary)}</td>
      <td>${escapeHtml(row.backup)}</td>
    `;
    tbody.appendChild(tr);
  }

  if (result.warning) {
    console.warn(result.warning);
  }

  setSaturdayPreviewReady(true);
}

function renderSundayTable(result) {
  const thead = document.getElementById("sunday-thead");
  const tbody = document.getElementById("sunday-tbody");
  const colgroup = document.getElementById("sunday-colgroup");
  thead.innerHTML = "";
  tbody.innerHTML = "";
  colgroup.innerHTML = "";

  const segments = result.segments || (getSundaySegments() ? getSundaySegments().segments : []);
  const bannerTitleEl = document.getElementById("sunday-banner-title");
  const bannerSubtitleEl = document.getElementById("sunday-banner-subtitle");
  const title =
    result.serviceLabel && result.serviceLabel !== "Standard"
      ? `TECH TEAM ROTA FOR ${String(result.serviceLabel).toUpperCase()}.`
      : "TECH TEAM ROTA";
  bannerTitleEl.textContent = title;
  bannerSubtitleEl.textContent = SUNDAY_BANNER_NOTE;

  colgroup.appendChild(Object.assign(document.createElement("col"), { className: "col-role" }));
  for (let i = 0; i < segments.length; i++) {
    colgroup.appendChild(document.createElement("col"));
  }

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th scope="col" class="role-cell">Role</th>${segments
    .map((s) => `<th scope="col">${escapeHtml(s)}</th>`)
    .join("")}`;
  thead.appendChild(headerRow);

  for (const row of result.rows) {
    const tr = document.createElement("tr");
    if (row.merged) {
      tr.innerHTML = `<th scope="row" class="role-cell">${escapeHtml(row.role)}</th><td class="merged-cell" colspan="${segments.length}">${escapeHtml(row.person || "—")}</td>`;
    } else {
      const cells = segments
        .map((_, idx) => `<td>${escapeHtml((row.cells && row.cells[idx]) || "—")}</td>`)
        .join("");
      tr.innerHTML = `<th scope="row" class="role-cell">${escapeHtml(row.role)}</th>${cells}`;
    }
    tbody.appendChild(tr);
  }

  if (result.warning) {
    console.warn(result.warning);
  }

  setSundayPreviewReady(true);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runSaturday(generateNew) {
  if (!validateRotaTeamForGeneration("saturday")) return;

  let result;
  if (!generateNew && lastSaturdayAssignments) {
    result = lastSaturdayAssignments;
  } else {
    result = generateSaturdayAssignments();
    lastSaturdayAssignments = result;
    applyServeIncrementsForSaturday(result.rows);
  }

  renderSaturdayTable(result);
  document.getElementById("btn-regenerate-saturday").disabled = false;
  document.getElementById("btn-export-saturday").disabled = false;
}

function runSunday(generateNew) {
  if (!validateRotaTeamForGeneration("sunday")) return;

  const presetKey = document.getElementById("sunday-service-type").value;
  let result;
  if (!generateNew && lastSundayAssignments && lastSundayAssignments.serviceTypeKey === presetKey) {
    result = lastSundayAssignments;
  } else {
    result = generateSundayAssignments();
    lastSundayAssignments = result;
    applyServeIncrementsForSunday(result.rows);
  }

  renderSundayTable(result);
  document.getElementById("btn-regenerate-sunday").disabled = false;
  document.getElementById("btn-export-sunday").disabled = false;
}

/** Regenerate: new random fair assignment without double-counting the same snapshot */
function regenerateSaturday() {
  lastSaturdayAssignments = null;
  runSaturday(true);
}

function regenerateSunday() {
  lastSundayAssignments = null;
  runSunday(true);
}

function filenameFromDate(prefix) {
  const iso = document.getElementById("rota-date").value;
  const part = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : new Date().toISOString().slice(0, 10);
  return `${prefix}-${part}.png`;
}

async function exportRota(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el || typeof html2canvas !== "function") {
    alert("html2canvas not loaded. Check your network and try again.");
    return;
  }
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (e) {
    console.error(e);
    alert("Export failed. See console for details.");
  }
}

function initThemeFromStorage() {
  const saved = localStorage.getItem(LS_THEME);
  const body = document.body;
  const select = document.getElementById("theme-select");
  const allowed = ["theme-purple", "theme-orange", "theme-green", "theme-red", "theme-blue"];
  if (saved && allowed.includes(saved)) {
    body.className = saved;
    select.value = saved;
  } else {
    select.value = body.className.trim() || "theme-purple";
  }
}

function syncTeamTextarea() {
  document.getElementById("team-textarea").value = teamMembers.join("\n");
}

function parseTeamFromTextarea() {
  const raw = document.getElementById("team-textarea").value;
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function persistTeam() {
  sanitizePoolsWithMasterTeam();
  saveTeamToStorage();
  ensureCountsForTeam();
  saveCountsToStorage();
  syncTeamTextarea();
  renderTeamList();
  renderPoolChecklists();
}

function updatePoolCountLabels() {
  const satCount = document.getElementById("saturday-pool-count");
  const sunCount = document.getElementById("sunday-pool-count");
  if (satCount) satCount.textContent = String(saturdayRotaPool.length);
  if (sunCount) sunCount.textContent = String(sundayRotaPool.length);
}

function renderPoolChecklist(containerId, pool, day) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!teamMembers.length) {
    const empty = document.createElement("p");
    empty.className = "pool-checklist-empty";
    empty.textContent = "Add team members first.";
    container.appendChild(empty);
    return;
  }

  for (const name of teamMembers) {
    const label = document.createElement("label");
    label.className = "pool-check-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = pool.includes(name);
    input.addEventListener("change", () => {
      if (input.checked) {
        if (!pool.includes(name)) pool.push(name);
      } else {
        const idx = pool.indexOf(name);
        if (idx !== -1) pool.splice(idx, 1);
      }
      if (day === "sunday") saveSundayPoolToStorage();
      else saveSaturdayPoolToStorage();
      updatePoolCountLabels();
    });

    const text = document.createElement("span");
    text.textContent = name;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  }
}

function renderPoolChecklists() {
  renderPoolChecklist("saturday-pool-list", saturdayRotaPool, "saturday");
  renderPoolChecklist("sunday-pool-list", sundayRotaPool, "sunday");
  updatePoolCountLabels();

  const usePoolsEl = document.getElementById("use-selected-pools");
  const poolsPanel = document.getElementById("rota-pools-panel");
  if (usePoolsEl) usePoolsEl.checked = useSelectedPools;
  if (poolsPanel) poolsPanel.hidden = !useSelectedPools;
}

function setPoolSelection(day, selectAll) {
  const pool = day === "sunday" ? sundayRotaPool : saturdayRotaPool;
  if (selectAll) {
    pool.length = 0;
    pool.push(...teamMembers);
  } else {
    pool.length = 0;
  }
  if (day === "sunday") saveSundayPoolToStorage();
  else saveSaturdayPoolToStorage();
  renderPoolChecklists();
}

function applyTeamListVisibility() {
  const panel = document.getElementById("team-list-panel");
  const btn = document.getElementById("btn-toggle-team-list");
  if (!panel || !btn) return;

  panel.classList.toggle("is-collapsed", !teamListVisible);
  btn.setAttribute("aria-expanded", String(teamListVisible));
  btn.textContent = teamListVisible ? "Hide list" : "Show list";
}

function toggleTeamListVisibility() {
  teamListVisible = !teamListVisible;
  applyTeamListVisibility();
  savePoolSettingsToStorage();
}

function renderTeamList() {
  const list = document.getElementById("team-list");
  const countEl = document.getElementById("team-count");
  list.innerHTML = "";
  if (countEl) countEl.textContent = String(teamMembers.length);

  if (!teamMembers.length) {
    const empty = document.createElement("li");
    empty.className = "team-list-empty";
    empty.textContent = "No team members yet. Add a name above.";
    list.appendChild(empty);
    return;
  }

  for (const name of teamMembers) {
    const li = document.createElement("li");
    li.className = "team-list-item";

    const label = document.createElement("span");
    label.textContent = name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-ghost";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => removeTeamMember(name));

    li.appendChild(label);
    li.appendChild(removeBtn);
    list.appendChild(li);
  }
}

function addTeamMember(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return;

  if (teamMembers.includes(trimmed)) {
    alert(`"${trimmed}" is already on the team list.`);
    return;
  }

  teamMembers.push(trimmed);
  serveCounts[trimmed] = serveCounts[trimmed] ?? 0;
  persistTeam();
}

function removeTeamMember(name) {
  if (!confirm(`Remove "${name}" from the team list?`)) return;

  teamMembers = teamMembers.filter((member) => member !== name);
  delete serveCounts[name];
  persistTeam();
}

function init() {
  teamMembers = loadTeamFromStorage();
  serveCounts = loadCountsFromStorage();
  saturdayRotaPool = loadPoolFromStorage(LS_SATURDAY_POOL);
  sundayRotaPool = loadPoolFromStorage(LS_SUNDAY_POOL);

  try {
    useSelectedPools = JSON.parse(localStorage.getItem(LS_USE_POOLS) || "false") === true;
  } catch (_) {
    useSelectedPools = false;
  }

  try {
    const visible = JSON.parse(localStorage.getItem(LS_TEAM_LIST_VISIBLE) || "true");
    teamListVisible = visible !== false;
  } catch (_) {
    teamListVisible = true;
  }

  ensureCountsForTeam();
  sanitizePoolsWithMasterTeam();

  // First-time pool setup: default to all team members selected.
  if (!saturdayRotaPool.length && teamMembers.length) {
    saturdayRotaPool = teamMembers.slice();
    saveSaturdayPoolToStorage();
  }
  if (!sundayRotaPool.length && teamMembers.length) {
    sundayRotaPool = teamMembers.slice();
    saveSundayPoolToStorage();
  }

  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("rota-date").value = today;

  initThemeFromStorage();
  syncTeamTextarea();
  renderTeamList();
  renderPoolChecklists();
  applyTeamListVisibility();
  setSaturdayPreviewReady(false);
  setSundayPreviewReady(false);
  updateSaturdayPreviewMeta();
  updateSundayPreviewMeta();

  document.getElementById("btn-toggle-team-list").addEventListener("click", toggleTeamListVisibility);

  document.getElementById("use-selected-pools").addEventListener("change", (e) => {
    useSelectedPools = e.target.checked;
    document.getElementById("rota-pools-panel").hidden = !useSelectedPools;
    savePoolSettingsToStorage();
  });

  document.getElementById("btn-saturday-pool-all").addEventListener("click", () => setPoolSelection("saturday", true));
  document.getElementById("btn-saturday-pool-none").addEventListener("click", () => setPoolSelection("saturday", false));
  document.getElementById("btn-sunday-pool-all").addEventListener("click", () => setPoolSelection("sunday", true));
  document.getElementById("btn-sunday-pool-none").addEventListener("click", () => setPoolSelection("sunday", false));

  document.getElementById("rota-date").addEventListener("change", () => {
    updateSaturdayPreviewMeta();
    updateSundayPreviewMeta();
  });

  document.getElementById("btn-add-team").addEventListener("click", () => {
    const input = document.getElementById("team-add-input");
    addTeamMember(input.value);
    input.value = "";
    input.focus();
  });

  document.getElementById("team-add-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btn-add-team").click();
    }
  });

  document.getElementById("btn-save-team").addEventListener("click", () => {
    teamMembers = parseTeamFromTextarea();
    if (!teamMembers.length) {
      alert("No names found. Enter one name per line.");
      return;
    }
    persistTeam();
    alert("Team list updated from pasted names.");
  });

  document.getElementById("btn-reset-counts").addEventListener("click", () => {
    if (!confirm("Reset serve counts to zero for everyone on the team?")) return;
    serveCounts = {};
    for (const name of teamMembers) {
      serveCounts[name] = 0;
    }
    saveCountsToStorage();
    alert("Counts reset.");
  });

  document.getElementById("theme-select").addEventListener("change", (e) => {
    document.body.className = e.target.value;
    localStorage.setItem(LS_THEME, e.target.value);
  });

  document.getElementById("btn-generate-saturday").addEventListener("click", () => {
    lastSaturdayAssignments = null;
    runSaturday(true);
  });

  document.getElementById("btn-generate-sunday").addEventListener("click", () => {
    lastSundayAssignments = null;
    runSunday(true);
  });

  document.getElementById("btn-regenerate-saturday").addEventListener("click", regenerateSaturday);
  document.getElementById("btn-regenerate-sunday").addEventListener("click", regenerateSunday);

  document.getElementById("sunday-service-type").addEventListener("change", () => {
    lastSundayAssignments = null;
    setSundayPreviewReady(false);
    document.getElementById("btn-regenerate-sunday").disabled = true;
    document.getElementById("btn-export-sunday").disabled = true;

    document.getElementById("sunday-thead").innerHTML = "";
    document.getElementById("sunday-tbody").innerHTML = "";
    const preset = SUNDAY_SEGMENT_PRESETS[document.getElementById("sunday-service-type").value] || SUNDAY_SEGMENT_PRESETS.standard;
    document.getElementById("sunday-banner-title").textContent =
      preset.label && preset.label !== "Standard" ? `TECH TEAM ROTA FOR ${preset.label.toUpperCase()}.` : "TECH TEAM ROTA";
    document.getElementById("sunday-banner-subtitle").textContent = SUNDAY_BANNER_NOTE;
    updateSundayPreviewMeta();
  });

  document.getElementById("btn-export-saturday").addEventListener("click", () => {
    exportRota("saturday-rota", filenameFromDate("saturday-rota"));
  });

  document.getElementById("btn-export-sunday").addEventListener("click", () => {
    exportRota("sunday-rota", filenameFromDate("sunday-rota"));
  });
}

init();
