const locateButton = document.getElementById("locateButton");
const retryButton = document.getElementById("retryButton");
const permissionPanel = document.getElementById("permissionPanel");
const loadingPanel = document.getElementById("loadingPanel");
const resultPanel = document.getElementById("resultPanel");
const errorPanel = document.getElementById("errorPanel");
const loadingMessage = document.getElementById("loadingMessage");
const coords = document.getElementById("coords");

let map;
let marker;

// Palantir (PostHog) events. Clicks that navigate away are sent instantly.
function track(event, props, instant) {
  if (!window.posthog) return;
  window.posthog.capture(
    event,
    props || {},
    instant ? { send_instantly: true } : undefined,
  );
}

const loadingMessages = [
  "Finding nearest branch.",
  "Checking current location.",
  "Confirming branch address.",
];

function showOnly(panel) {
  [permissionPanel, loadingPanel, resultPanel, errorPanel].forEach((item) => {
    item.classList.toggle("hidden", item !== panel);
  });
}

function startLoadingMessages() {
  let index = 0;
  loadingMessage.textContent = loadingMessages[index];
  return window.setInterval(() => {
    index = (index + 1) % loadingMessages.length;
    loadingMessage.textContent = loadingMessages[index];
  }, 650);
}

function locateBranch() {
  track("branch_locate_started", { supported: Boolean(navigator.geolocation) });
  if (!navigator.geolocation) {
    showError("This browser does not support location access.", "unsupported");
    return;
  }

  showOnly(loadingPanel);
  const loadingTimer = startLoadingMessages();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      track("branch_location_granted", { accuracy_m: Math.round(accuracy) });

      window.setTimeout(() => {
        window.clearInterval(loadingTimer);
        showResult(latitude, longitude, accuracy);
      }, 2400);
    },
    (error) => {
      track("branch_location_denied", {
        code: error.code,
        message: error.message,
      });
      window.setTimeout(() => {
        window.clearInterval(loadingTimer);
        showError(
          `SouthBag could not access your location. Browser said: ${error.message}`,
          "geolocation",
        );
      }, 1300);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    },
  );
}

function showResult(latitude, longitude, accuracy) {
  showOnly(resultPanel);

  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  coords.textContent = `Branch coordinates: ${lat}, ${lng}.`;
  // The nearest branch is, of course, wherever the visitor is standing.
  track("branch_found", { accuracy_m: Math.round(accuracy), map_loaded: Boolean(window.L) });

  if (!window.L) {
    showError(
      "The map library could not load. Your nearest branch is still where you are.",
      "map-library",
    );
    return;
  }

  if (!map) {
    map = L.map("map", {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("zoomend", () => track("branch_map_zoomed", { zoom: map.getZoom() }));
    map.on("dragend", () => track("branch_map_panned", { zoom: map.getZoom() }));
    map.on("popupopen", () => track("branch_map_popup_opened"));
    map.on("click", () => track("branch_map_clicked"));
  }

  map.setView([latitude, longitude], 17);

  if (marker) {
    marker.setLatLng([latitude, longitude]);
  } else {
    marker = L.marker([latitude, longitude]).addTo(map);
  }

  marker.bindPopup("<strong>Nearest Southbag Branch</strong>").openPopup();

  window.setTimeout(() => map.invalidateSize(), 50);
}

function showError(message, reason) {
  showOnly(errorPanel);
  document.getElementById("errorCopy").textContent = message;
  track("branch_locate_failed", { reason: reason || "unknown", message });
}

locateButton.addEventListener("click", locateBranch);
retryButton.addEventListener("click", () => {
  track("branch_locate_retried");
  locateBranch();
});

function showOnMap(branch) {
  track("branch_selected", { branch });
  alert("Error: Unable to load map. Please refresh the page and try again.");
}

function searchBranches(event) {
  event.preventDefault();
  const resultsDiv = document.getElementById("searchResults");

  const errors = [
    "Branches not found",
    "Connection timeout. Please try again later.",
    "Invalid format",
    "Found in your area",
    "Service temporarily.",
    "Please enter a valid.",
    "Search exceeded. Try again in hours.",
  ];

  const outcome = errors[Math.floor(Math.random() * errors.length)];
  resultsDiv.textContent = outcome;

  const [zipInput, radiusInput] = event.target.querySelectorAll("input");
  track("branch_search", {
    query: zipInput ? zipInput.value.trim() : "",
    radius: radiusInput ? radiusInput.value.trim() : "",
    results_count: 0,
    outcome,
  });
}

function getDirections() {
  const directionsDiv = document.getElementById("directions");
  const userAddress = document.getElementById("userAddress").value;

  if (!userAddress) {
    track("branch_directions_requested", { has_address: false });
    alert("Please enter your address");
    return;
  }

  track("branch_directions_requested", {
    has_address: true,
    address_length: userAddress.length,
  });
  directionsDiv.style.display = "block";

  setTimeout(() => {
    alert(
      "Note: These directions may not be accurate. Please use the website for best results.",
    );
  }, 1000);
}

// Match banking.southbag.cc: buttons with href navigate on click.
document.querySelectorAll("button[href]").forEach((btn) => {
  btn.setAttribute("type", "button");
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("href");
    if (target) {
      track(
        "branch_help_link_click",
        { href: target, text: btn.textContent.trim() },
        true,
      );
      window.location.href = target;
    }
  });
});

setTimeout(() => {
  track("branch_tip_alert_shown");
  alert(
    'Tip: You can also find us by searching "Southbag Bank" on any map app!',
  );
  track("branch_tip_alert_dismissed");
}, 5000);

setInterval(() => {
  if (Math.random() > 0.7) {
    console.error("Map loading error: Invalid API key");
  }
}, 3000);

window.showOnMap = showOnMap;
window.searchBranches = searchBranches;
window.getDirections = getDirections;

window.addEventListener("load", () => {
  window.setTimeout(() => {
    if (!document.hidden) {
      locateButton.focus();
    }
  }, 700);
});
