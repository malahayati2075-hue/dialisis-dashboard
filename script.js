const API_BASE = "http://localhost:3001";
let chartHD = null;

/* =========================
   NAVIGASI SLIDE
========================= */
function showDashboard() {
  document.getElementById("slide-dashboard").style.display = "block";
  document.getElementById("slide-pasien").style.display = "none";
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  // Fix event target undefined jika dipanggil dari domcontentloaded
  if(event && event.target) event.target.classList.add('active');
  loadDashboard();
}

function showPasien() {
  document.getElementById("slide-dashboard").style.display = "none";
  document.getElementById("slide-pasien").style.display = "block";
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  if(event && event.target) event.target.classList.add('active');
  loadTable();
}

/* =========================
   FUNGSI LOGIKA RUANG (BARU)
========================= */
function toggleRuang() {
  const status = document.getElementById("input-status").value;
  const ruangInput = document.getElementById("input-ruang");
  
  if (status === "Rawat Jalan") {
    ruangInput.disabled = true;
    ruangInput.value = ""; // Kosongkan nilai
  } else {
    ruangInput.disabled = false;
  }
}

/* =========================
   LOAD DASHBOARD (DENGAN FILTER BARU)
========================= */
async function loadDashboard() {
  try {
    // Ambil nilai filter
    const shift = document.getElementById("shift").value;
    const tim = document.getElementById("filter-tim").value;
    const start = document.getElementById("filter-start").value;
    const end = document.getElementById("filter-end").value;

    // Bangun URL dengan query parameter
    let url = `${API_BASE}/api/dashboard?`;
    if (shift) url += `shift=${shift}&`;
    if (tim) url += `tim=${tim}&`;
    if (start) url += `start=${start}&`;
    if (end) url += `end=${end}&`;

    const res = await fetch(url);
    const data = await res.json();

    document.getElementById("totalPasien").textContent = data.totalPasien || 0;
    // Total Tindakan = Total Pasien sesuai permintaan
    document.getElementById("totalHD").textContent = data.totalPasien || 0; 
    
    document.getElementById("rawatInap").textContent = data.rawatInap || 0;
    document.getElementById("rawatJalan").textContent = data.rawatJalan || 0;
    document.getElementById("av").textContent = data.vaskuler?.avShunt || 0;
    document.getElementById("dl").textContent = data.vaskuler?.doubleLumen || 0;
    
    const terpakai = data.bed?.tim1?.terpakai + data.bed?.tim2?.terpakai;
    document.getElementById("bed").textContent = `${terpakai || 0} / 29`;

    renderChart(data.chart || []);

  } catch (err) {
    console.error("Gagal load dashboard:", err);
  }
}

/* =========================
   LOAD TABEL PASIEN
========================= */
async function loadTable() {
  try {
    // Untuk tabel di slide 2, kita bisa ambil semua data atau filter tanggal juga
    // Disini ambil semua data terbaru
    const res = await fetch(`${API_BASE}/api/laporan`);
    const json = await res.json();

    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='14' style='text-align:center'>Tidak ada data</td></tr>";
      return;
    }

    json.data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.tanggal || "-"}</td>
        <td>${row.nama || "-"}</td>
        <td>${row.mr || "-"}</td>
        <td>${row.shift || "-"}</td>
        <td>${row.tim || "-"}</td>
        <td>${row.bayar || "-"}</td>
        <td>${row.hf || "-"}</td>
        <td>${row.vaskuler || "-"}</td>
        <td>${row.ak1 || "-"}</td>
        <td>${row.bicarb || "-"}</td>
        <td>${row.obat || "-"}</td>
        <td style="color:${parseFloat(row.hb) < 8 ? "red" : "inherit"}">${row.hb || "-"}</td>
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
   SUBMIT DATA PASIEN
========================= */
async function submitPasien(e) {
  e.preventDefault();

  // Pastikan logika ruang berjalan sebelum kirim
  toggleRuang(); 

  const data = {
    nama: document.getElementById("input-nama").value,
    mr: document.getElementById("input-mr").value,
    shift: document.getElementById("input-shift").value,
    tim: document.getElementById("input-tim").value,
    bayar: document.getElementById("input-bayar").value,
    hf: document.getElementById("input-hf").value,
    vaskuler: document.getElementById("input-vaskuler").value,
    ak1: document.getElementById("input-ak1").value,
    bicarbonate: document.getElementById("input-bicarb").value,
    obat: document.getElementById("input-obat").value,
    hb: document.getElementById("input-hb").value,
    status: document.getElementById("input-status").value,
    ruang: document.getElementById("input-ruang").value,
    tanggal: new Date().toISOString().split('T')[0]
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
      toggleRuang(); // Reset state ruang ke default (disable)
      loadTable(); 
    } else {
      alert("Gagal simpan: " + (result.error || "Error unknown"));
    }

  } catch (err) {
    console.error(err);
    alert("Gagal menghubungi server.");
  }
}

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
========================= */
function renderChart(chartData) {
  const ctx = document.getElementById("chartHD");
  if (!ctx) return;
  if (chartHD) chartHD.destroy();

  if (chartData.length === 0) {
    chartData = [{ label: "Tidak ada data", value: 0 }];
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
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

/* =========================
   AUTO LOAD & DEFAULT DATE
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Set tanggal default ke hari ini
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("filter-start").value = today;
  document.getElementById("filter-end").value = today;

  // Init logika ruang
  toggleRuang();
  
  showDashboard();
});
