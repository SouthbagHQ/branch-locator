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
  if (!navigator.geolocation) {
    showError("This browser does not support location access.");
    return;
  }

  showOnly(loadingPanel);
  const loadingTimer = startLoadingMessages();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      window.setTimeout(() => {
        window.clearInterval(loadingTimer);
        showResult(latitude, longitude, accuracy);
      }, 2400);
    },
    (error) => {
      window.setTimeout(() => {
        window.clearInterval(loadingTimer);
        showError(
          `SouthBag could not access your location. Browser said: ${error.message}`,
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

  if (!window.L) {
    showError(
      "The map library could not load. Your nearest branch is still where you are.",
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
  }

  map.setView([latitude, longitude], 17);

  if (marker) {
    marker.setLatLng([latitude, longitude]);
  } else {
    marker = L.marker([latitude, longitude]).addTo(map);
  }

  marker.bindPopup("<strong>Nearest SouthBag Branch</strong>").openPopup();

  window.setTimeout(() => map.invalidateSize(), 50);
}

function showError(message) {
  showOnly(errorPanel);
  document.getElementById("errorCopy").textContent = message;
}

locateButton.addEventListener("click", locateBranch);
retryButton.addEventListener("click", locateBranch);

function showOnMap(branch) {
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

  resultsDiv.textContent = errors[Math.floor(Math.random() * errors.length)];
}

function getDirections() {
  const directionsDiv = document.getElementById("directions");
  const userAddress = document.getElementById("userAddress").value;

  if (!userAddress) {
    alert("Please enter your address");
    return;
  }

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
      window.location.href = target;
    }
  });
});

setTimeout(() => {
  alert(
    'Tip: You can also find us by searching "Southbag Bank" on any map app!',
  );
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
