const APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_URL";
const BASELINE_CSV_URL = "data/restrooms_baseline_public.csv";
const UPDATES_CSV_URL = "YOUR_UPDATES_CSV_URL";

/* MAP */
const map = L.map("map").setView([32.7157, -117.1611], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

/* PANEL */
const panel = document.getElementById("panel");
const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

function openPanel() {
  if (isMobile()) panel.classList.add("open");
  setTimeout(() => map.invalidateSize(), 250);
}

document.getElementById("drawerHeader")
  ?.addEventListener("click", () => panel.classList.toggle("open"));

document.getElementById("newRestroomBtn")
  .addEventListener("click", () => {
    document.getElementById("surveyForm").reset();
    place_id.value = "";
    action.value = "new";
    openPanel();
  });

/* CSV */
async function loadCsv(url) {
  const t = await (await fetch(url)).text();
  return Papa.parse(t, { header:true, skipEmptyLines:true }).data;
}

/* MARKERS */
function drawMarkers(rows) {
  markersLayer.clearLayers();
  rows.forEach(r => {
    if (!r.latitude || !r.longitude) return;
    const m = L.marker([+r.latitude, +r.longitude]).addTo(markersLayer);
    m.bindPopup(`<strong>${r.restroom_name || r.name}</strong><br>${r.address || ""}<br><button data-update>Suggest change</button>`);
    m.on("popupopen", e => {
      e.popup.getElement().querySelector("[data-update]").onclick = () => {
        fillForm(r);
        openPanel();
      };
    });
  });
}

function fillForm(r) {
  action.value = "update";
  place_id.value = r.globalid || "";
  for (const k in r) {
    const el = document.getElementById(k);
    if (el) el.value = r[k];
  }
}

/* MAP CLICK */
map.on("click", e => {
  latitude.value = e.latlng.lat;
  longitude.value = e.latlng.lng;
  openPanel();
});

/* SUBMIT */
surveyForm.onsubmit = async e => {
  e.preventDefault();
  const data = {};
  surveyForm.querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id) data[el.id] = el.value;
  });

  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(data)
  });

  status.textContent = "Thank you! Submission received.";
  surveyForm.reset();
};

/* INIT */
(async () => {
  const baseline = await loadCsv(BASELINE_CSV_URL);
  drawMarkers(baseline);
})();
