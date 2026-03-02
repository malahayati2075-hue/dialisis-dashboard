const API_BASE = "http://localhost:3001";
let globalChartData = []; 
let chartHD = null;

/* =========================
   FUNGSI HELPER TANGGAL LOKAL
   Untuk mengisi default tanggal hari ini
========================= */
function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* =========================
   NAVIGASI SLIDE
========================= */
function showDashboard(e) {
  document.getElementById("slide-dashboard").style.display = "block";
  document.getElementById("slide-pasien").style.display = "none";
  
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  if(e && e.target) e.target.classList.add('active');
  
  loadDashboard();
}

function showPasien(e) {
  document.getElementById("slide-dashboard").style.display = "none";
  document.getElementById("slide-pasien").style.display = "block";
  
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  if(e && e.target) e.target.classList.add('active');
  
  loadTable();
}

/* =========================
   FUNGSI LOGIKA RUANG
========================= */
function toggleRuang() {
  const status = document.getElementById("input-status").value;
  const ruangInput = document.getElementById("input-ruang");
  
  if (status === "Rawat Jalan") {
    ruangInput.disabled = true;
    ruangInput.value = "";
  } else {
    ruangInput.disabled = false;
  }
}

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {
  try {
    const shift = document.getElementById("shift").value;
    const tim = document.getElementById("filter-tim").value;
    const start = document.getElementById("filter-start").value;
    const end = document.getElementById("filter-end").value;

    let url = `${API_BASE}/api/dashboard?`;
    if (shift) url += `shift=${shift}&`;
    if (tim) url += `tim=${tim}&`;
    if (start) url += `start=${start}&`;
    if (end) url += `end=${end}&`;

    const res = await fetch(url);
    const data = await res.json();

    globalChartData = data.chart || [];

    document.getElementById("totalPasien").textContent = data.totalPasien || 0;
    document.getElementById("totalHD").textContent = data.totalPasien || 0; 
    document.getElementById("rawatInap").textContent = data.rawatInap || 0;
    document.getElementById("rawatJalan").textContent = data.rawatJalan || 0;
    document.getElementById("av").textContent = data.vaskuler?.avShunt || 0;
    document.getElementById("dl").textContent = data.vaskuler?.doubleLumen || 0;
    
    const terpakai = data.bed?.tim1?.terpakai + data.bed?.tim2?.terpakai;
    const totalBed = data.bed?.total || 29;
    document.getElementById("bed").textContent = `${terpakai || 0} / ${totalBed}`;

    // Default grafik menampilkan Total Pasien
    changeChart('total', 'Total Pasien');

  } catch (err) {
    console.error("Gagal load dashboard:", err);
  }
}

/* =========================
   FUNGSI GANTI GRAFIK
   Logika Batas Atas (Max Y) berdasarkan Tim
========================= */
function changeChart(type, label) {
  const tim = document.getElementById("filter-tim").value;
  let maxY = 29; // Default (Semua Tim)

  if (tim === "Tim 1") maxY = 15;
  else if (tim === "Tim 2") maxY = 14;

  renderChart(globalChartData, type, label, maxY);
}

// ... (bagian awal script.js sama) ...

/* =========================
   LOAD TABLE (URUTAN BARU)
========================= */
async function loadTable() {
  try {
    const res = await fetch(`${API_BASE}/api/laporan`);
    const json = await res.json();

    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='16' style='text-align:center'>Tidak ada data</td></tr>";
      return;
    }

    json.data.forEach(row => {
      const tr = document.createElement("tr");
      // Urutan: Tgl, Nama, MR, Shift, Tim, Bayar, HF, Vaskuler, Jarum, AK1, Bicarb, Obat, Hb, Kt/V, Status, Ruang
      tr.innerHTML = `
        <td>${row.tanggal || "-"}</td>
        <td>${row.nama || "-"}</td>
        <td>${row.mr || "-"}</td>
        <td>${row.shift || "-"}</td>
        <td>${row.tim || "-"}</td>
        <td>${row.bayar || "-"}</td>
        <td>${row.hf || "-"}</td>
        <td>${row.vaskuler || "-"}</td>
        <td>${row.jarum || "-"}</td>
        <td>${row.ak1 || "-"}</td>
        <td>${row.bicarb || "-"}</td>
        <td>${row.obat || "-"}</td>
        <td style="color:${parseFloat(row.hb) < 8 ? "red" : "inherit"}">${row.hb || "-"}</td>
        <td>${row.ktv || "-"}</td>
        <td>${row.status || "-"}</td>
        <td>${row.ruang || "-"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Gagal load tabel:", err);
  }
}
/* =========================
   SUBMIT PASIEN (Dengan Jarum)
========================= */
async function submitPasien(e) {
  e.preventDefault();
  toggleRuang(); 

  const data = {
    nama: document.getElementById("input-nama").value,
    mr: document.getElementById("input-mr").value,
    shift: document.getElementById("input-shift").value,
    tim: document.getElementById("input-tim").value,
    bayar: document.getElementById("input-bayar").value,
    hf: document.getElementById("input-hf").value,
    vaskuler: document.getElementById("input-vaskuler").value,
    jarum: document.getElementById("input-jarum").value, // Kirim data jarum
    ak1: document.getElementById("input-ak1").value,
    bicarbonate: document.getElementById("input-bicarb").value,
    obat: document.getElementById("input-obat").value,
    hb: document.getElementById("input-hb").value,
    status: document.getElementById("input-status").value,
    ruang: document.getElementById("input-ruang").value,
    tanggal: document.getElementById("input-tanggal").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/laporan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    
    if (res.ok) {
      alert("Data berhasil disimpan!");
      document.getElementById("form-pasien").reset();
      document.getElementById("input-tanggal").value = getLocalDate();
      toggleRuang();
      loadTable(); 
    } else {
      alert("Gagal simpan: " + (result.error || "Error unknown"));
    }

  } catch (err) {
    console.error(err);
    alert("Gagal menghubungi server.");
  }
}

// ... (Sisa kode sama) ...

/* =========================
   EXPORT PDF
========================= */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const element = document.getElementById("area-cetak");
  const btn = event.target;

  const oldText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

  html2canvas(element, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4'); 
    const imgWidth = 280; 
    const pageHeight = 210; 
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const today = new Date().toLocaleDateString('id-ID');
    pdf.save(`Laporan_Dialisis_${today}.pdf`);

    btn.innerText = oldText;
    btn.disabled = false;
  });
}

/* =========================
   GRAFIK CHART.JS
   Pengaturan responsif dan font kecil
========================= */
function renderChart(chartData, type, label, maxY) {
  const ctx = document.getElementById("chartHD");
  if (!ctx) return;
  if (chartHD) chartHD.destroy();

  if (chartData.length === 0) {
    chartData = [{ label: "Tidak ada data", total: 0, rawatInap: 0, rawatJalan: 0, avShunt: 0, doubleLumen: 0 }];
  }

  let values = chartData.map(d => d[type] || 0);

  chartHD = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.map(d => d.label),
      datasets: [{
        label: label,
        data: values,
        backgroundColor: "#0ea5e9"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Mengikuti tinggi container CSS
      plugins: { 
        legend: { 
          display: true,
          labels: { font: { size: 10 } }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true, 
          max: maxY,
          ticks: { precision: 0, font: { size: 10 } } 
        },
        x: {
          ticks: {
            font: { size: 10 },
            maxRotation: 0,
            autoSkip: true
          }
        }
      }
    }
  });
}

/* =========================
   AUTO LOAD
   Set default tanggal
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const today = getLocalDate();
  
  // Set Filter Dashboard
  document.getElementById("filter-start").value = today;
  document.getElementById("filter-end").value = today;

  // Set Default Input Form Tanggal
  document.getElementById("input-tanggal").value = today;

  toggleRuang();
  showDashboard();
});
