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

window.addEventListener("load", () => {
  window.setTimeout(() => {
    if (!document.hidden) {
      locateButton.focus();
    }
  }, 700);
});
