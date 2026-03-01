/* =========================
   KONFIGURASI
========================= */
const API_BASE = "http://localhost:3001"; 
// kalau backend sudah online, ganti ke URL backend kamu

let chartHD = null;

/* =========================
   NAVIGASI SLIDE
========================= */
function showDashboard() {
  document.getElementById("slide-dashboard").style.display = "block";
  document.getElementById("slide-pasien").style.display = "none";
}

function showPasien() {
  document.getElementById("slide-dashboard").style.display = "none";
  document.getElementById("slide-pasien").style.display = "block";
  loadTable();
}

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {
  try {
    const shift = document.getElementById("shift").value;
    const url = `${API_BASE}/api/dashboard${shift ? `?shift=${shift}` : ""}`;

    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("totalPasien").textContent = data.totalPasien || 0;
    document.getElementById("totalHD").textContent = data.totalTindakan || 0;
    document.getElementById("rawatInap").textContent = data.rawatInap || 0;
    document.getElementById("rawatJalan").textContent = data.rawatJalan || 0;
    document.getElementById("av").textContent = data.av || 0;
    document.getElementById("dl").textContent = data.dl || 0;
    document.getElementById("bed").textContent = `${data.totalPasien || 0} / 29`;

    renderChart(data.chart || []);

  } catch (err) {
    console.error("Gagal load dashboard:", err);
    alert("Dashboard gagal dimuat");
  }
}

/* =========================
   LOAD TABEL PASIEN
========================= */
async function loadTable() {
  try {
    const res = await fetch(`${API_BASE}/api/laporan`);
    const json = await res.json();

    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    json.data.forEach(row => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${row.nama || ""}</td>
        <td>${row.mr || ""}</td>
        <td>${row.shift || ""}</td>
        <td style="color:${row.hb < 8 ? "red" : "black"}">${row.hb ?? ""}</td>
        <td>${row.status || ""}</td>
        <td>${row.ruang || ""}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Gagal load tabel:", err);
    alert("Data pasien gagal dimuat");
  }
}

/* =========================
   GRAFIK CHART.JS
========================= */
function renderChart(chartData) {
  const ctx = document.getElementById("chartHD");

  if (!ctx) return;

  if (chartHD) {
    chartHD.destroy();
  }

  // dummy fallback kalau backend belum kirim chart
  if (chartData.length === 0) {
    chartData = [
      { label: "H-6", value: 0 },
      { label: "H-5", value: 0 },
      { label: "H-4", value: 0 },
      { label: "H-3", value: 0 },
      { label: "H-2", value: 0 },
      { label: "H-1", value: 0 },
      { label: "Hari ini", value: 0 }
    ];
  }

  chartHD = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.map(d => d.label),
      datasets: [{
        label: "Jumlah Tindakan HD",
        data: chartData.map(d => d.value),
        backgroundColor: "#0ea5e9"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

/* =========================
   AUTO LOAD SAAT PAGE BUKA
========================= */
document.addEventListener("DOMContentLoaded", () => {
  showDashboard();
  loadDashboard();
});
