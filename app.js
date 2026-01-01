document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("demandForm");

  /* =========================
     FORM SUBMIT (INDEX PAGE)
     ========================= */
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const payload = {
        city: document.getElementById("city").value,
        datetime: document.getElementById("datetime").value,
        weather: document.getElementById("weather").value,
        traffic: document.getElementById("traffic").value,
        event: document.getElementById("event").checked,
      };

      localStorage.setItem("payload", JSON.stringify(payload));
      window.location.href = "result.html";
    });
  }

  /* =========================
     RESULT PAGE LOGIC
     ========================= */
  const resultsDiv = document.getElementById("results");
  const chartCanvas = document.getElementById("hourlyChart");

  if (!resultsDiv || !chartCanvas) return;

  const payloadStr = localStorage.getItem("payload");

  if (!payloadStr) {
    resultsDiv.innerHTML =
      "<p style='font-size:14px;'>No input data found. Please create a new prediction.</p>";
    return;
  }

  const payload = JSON.parse(payloadStr);

  resultsDiv.innerHTML =
    "<p class='loading-text'>Loading prediction...</p>";

  fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      /* 🔴 FIX: backend does NOT send success flag */
      if (!data.predicted_demand) {
        resultsDiv.innerHTML =
          "<p style='font-size:14px;'>No prediction found.</p>";
        return;
      }

      const predictedRides = data.predicted_demand;
      const recommendedTaxis = data.taxis_required;

      /* Simple demand level logic */
      let demandLevel = "Low";
      if (predictedRides > 100) demandLevel = "High";
      else if (predictedRides > 60) demandLevel = "Medium";

      /* ================= LEFT CARD ================= */
      resultsDiv.innerHTML = `
        <div class="status-pill">
          <span class="status-dot"></span>
          Prediction generated successfully
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Demand Level</span>
            <span class="stat-value">${demandLevel}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Predicted Rides</span>
            <span class="stat-value">${predictedRides}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Recommended Taxis</span>
            <span class="stat-value">${recommendedTaxis}</span>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-row"><span>City:</span><p>${payload.city}</p></div>
          <div class="detail-row"><span>Date & Time:</span><p>${payload.datetime}</p></div>
          <div class="detail-row"><span>Weather:</span><p>${payload.weather}</p></div>
          <div class="detail-row"><span>Traffic:</span><p>${payload.traffic}</p></div>
          <div class="detail-row"><span>Special Event:</span><p>${payload.event ? "Yes" : "No"}</p></div>
        </div>
      `;

      /* ================= RIGHT CARD (CHART) ================= */

      // Generate fake hourly data from prediction
      const hourlyDemand = [];
      for (let i = 1; i <= 6; i++) {
        hourlyDemand.push({
          hour: `+${i}h`,
          rides: Math.round(predictedRides * (0.8 + i * 0.05)),
        });
      }

      const ctx = chartCanvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

      new Chart(ctx, {
        type: "line",
        data: {
          labels: hourlyDemand.map((h) => h.hour),
          datasets: [
            {
              data: hourlyDemand.map((h) => h.rides),
              borderColor: "rgba(96, 165, 250, 1)",
              backgroundColor: gradient,
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#9ca3af" } },
            y: { beginAtZero: true, ticks: { color: "#9ca3af" } },
          },
        },
      });
    })
    .catch((err) => {
      resultsDiv.innerHTML =
        `<p style="color:red;">Error fetching prediction: ${err}</p>`;
    });
});
