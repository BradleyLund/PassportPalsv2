// Passport Pals — combined visa-requirement map.
// Colours each destination by the toughest requirement anyone in the
// selected group of passports would face.

// Requirement categories, worst → best. Day-limited visa-free stays (e.g.
// "90") sit between "visa on arrival" and "visa free" and share one colour;
// the exact day count is shown in the tooltip. "-1" means the passport's own
// country, which is never the binding constraint when combining.
const REQUIREMENTS = [
  { value: "no admission", label: "No admission", color: "#8c2323" },
  { value: "visa required", label: "Visa required", color: "#d03b3b" },
  { value: "e-visa", label: "E-visa", color: "#e98d8b" },
  { value: "eta", label: "eTA", color: "#86b6ef" },
  { value: "visa on arrival", label: "Visa on arrival", color: "#5598e7" },
  { value: "day-limited", label: "Visa free (limited stay)", color: "#256abf" },
  { value: "visa free", label: "Visa free", color: "#0d366b" },
];
const NO_DATA_COLOR = "#eceae4";
const DEFAULT_PASSPORTS = ["USA", "ZAF"];
const MRZ_LENGTH = 64;

const baseRank = new Map(REQUIREMENTS.map((r, i) => [r.value, i * 1000]));
const colorByValue = new Map(REQUIREMENTS.map((r) => [r.value, r.color]));

function isDayLimited(requirement) {
  return /^\d+$/.test(requirement);
}

// Lower rank = tougher requirement. Day counts order themselves within the
// day-limited band (a 7-day stay is tougher than a 360-day one).
function rankOf(requirement) {
  if (requirement === undefined) return Infinity;
  if (requirement === "-1") return Infinity; // home country never binds
  if (isDayLimited(requirement)) {
    return baseRank.get("day-limited") + Number(requirement);
  }
  const rank = baseRank.get(requirement);
  return rank === undefined ? Infinity : rank;
}

function colorOf(requirement) {
  if (requirement === undefined || requirement === Infinity) return NO_DATA_COLOR;
  if (requirement === "-1") return colorByValue.get("visa free");
  if (isDayLimited(requirement)) return colorByValue.get("day-limited");
  return colorByValue.get(requirement) || NO_DATA_COLOR;
}

function labelOf(requirement) {
  if (requirement === undefined) return "No data";
  if (requirement === "-1") return "Home country";
  if (isDayLimited(requirement)) return `Visa free · ${requirement}-day stay`;
  const match = REQUIREMENTS.find((r) => r.value === requirement);
  return match ? match.label : requirement;
}

Promise.all([
  d3.csv("passport-index-tidy-iso3.csv"),
  d3.json("countries-land-10km.geo.json"),
  d3.json("country-names.json"),
  d3.json("data-meta.json").catch(() => null),
]).then(([visaRows, geo, countryNames, meta]) => {
  init(visaRows, geo, countryNames, meta);
}).catch((error) => {
  console.error("Error loading map data:", error);
  document.getElementById("map").textContent =
    "The map data failed to load. Try refreshing the page.";
});

function init(visaRows, geo, countryNames, meta) {
  // ---- data shaping ----
  const visaByPassport = {};
  for (const row of visaRows) {
    (visaByPassport[row.Passport] ??= {})[row.Destination] = row.Requirement;
  }

  const nameOf = (code) => countryNames[code] || code;
  const passportCodes = Object.keys(visaByPassport)
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  // Antarctica has no visa regime and dominates the projection; drop it.
  const features = geo.features.filter((f) => f.properties.A3 !== "ATA");

  // ---- state (shareable via ?p=USA,ZAF) ----
  const params = new URLSearchParams(location.search);
  let selected = (params.get("p") || "").split(",")
    .filter((code) => visaByPassport[code]);
  if (selected.length === 0) selected = [...DEFAULT_PASSPORTS];

  // ---- map skeleton ----
  const width = 960;
  const height = 500;
  const projection = d3.geoNaturalEarth1().fitSize([width, height], {
    type: "FeatureCollection",
    features,
  });
  const path = d3.geoPath(projection);

  const svg = d3.select("#map")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const tooltip = document.getElementById("tooltip");

  const countries = svg.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .style("stroke", "#ffffff")
    .style("stroke-width", "0.5")
    .on("mousemove", (event, d) => showTooltip(event, d))
    .on("mouseleave", () => { tooltip.hidden = true; });

  // ---- passport selectors ----
  const row = document.getElementById("passport-row");
  const addButton = document.getElementById("add-passport");
  addButton.addEventListener("click", () => {
    selected.push(pickNextPassport());
    renderSelectors();
    update();
  });

  function pickNextPassport() {
    return passportCodes.find((code) => !selected.includes(code)) || selected[0];
  }

  function renderSelectors() {
    row.querySelectorAll(".passport").forEach((el) => el.remove());
    selected.forEach((code, index) => {
      const wrap = document.createElement("span");
      wrap.className = "passport";

      const select = document.createElement("select");
      select.setAttribute("aria-label", `Passport ${index + 1}`);
      for (const option of passportCodes) {
        select.add(new Option(nameOf(option), option, false, option === code));
      }
      select.addEventListener("change", () => {
        selected[index] = select.value;
        update();
      });
      wrap.append(select);

      if (selected.length > 1) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Remove ${nameOf(code)} passport`);
        remove.addEventListener("click", () => {
          selected.splice(index, 1);
          renderSelectors();
          update();
        });
        wrap.append(remove);
      }

      row.insertBefore(wrap, addButton);
    });
  }

  // ---- combined map + chrome updates ----
  function combinedRequirement(destination) {
    let worst;
    for (const code of selected) {
      const requirement = visaByPassport[code][destination];
      if (worst === undefined || rankOf(requirement) < rankOf(worst)) {
        worst = requirement;
      }
    }
    return worst;
  }

  function update() {
    countries
      .transition()
      .duration(300)
      .style("fill", (d) => colorOf(combinedRequirement(d.properties.A3)));

    const mrz = `P<${selected.join("<")}<<WHERE<CAN<WE<ALL<GO`;
    document.getElementById("mrz").textContent =
      mrz.padEnd(MRZ_LENGTH, "<").slice(0, MRZ_LENGTH);

    history.replaceState(null, "", `?p=${selected.join(",")}`);
  }

  function showTooltip(event, d) {
    const destination = d.properties.A3;
    const rows = selected.map((code) =>
      `<tr><td>${nameOf(code)}</td><td>${labelOf(visaByPassport[code][destination])}</td></tr>`
    ).join("");
    const combined = combinedRequirement(destination);
    const verdict = selected.length > 1
      ? `<p class="verdict">Together: ${labelOf(combined)}</p>`
      : "";

    tooltip.innerHTML =
      `<h3>${nameOf(destination)}</h3><table>${rows}</table>${verdict}`;
    tooltip.hidden = false;

    const pad = 14;
    const box = tooltip.getBoundingClientRect();
    let x = event.clientX + pad;
    let y = event.clientY + pad;
    if (x + box.width > window.innerWidth - pad) x = event.clientX - box.width - pad;
    if (y + box.height > window.innerHeight - pad) y = event.clientY - box.height - pad;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  // ---- legend ----
  const legend = document.getElementById("legend");
  for (const { label, color } of REQUIREMENTS) {
    legend.insertAdjacentHTML("beforeend",
      `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${label}</span>`);
  }
  legend.insertAdjacentHTML("beforeend",
    `<span class="legend-item"><span class="legend-swatch no-data" style="background:${NO_DATA_COLOR}"></span>No data</span>`);

  // ---- footer ----
  if (meta && meta.lastUpdated) {
    document.getElementById("last-updated").textContent = meta.lastUpdated;
  }

  renderSelectors();
  update();
}
