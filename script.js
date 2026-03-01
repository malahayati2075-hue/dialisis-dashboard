/* =========================
   KONFIGURASI
========================= */
const API_BASE = "http://localhost:3001"; 
// Ganti dengan URL backend Anda jika sudah online

let chartHD = null;

/* =========================
   NAVIGASI SLIDE
========================= */
function showDashboard() {
  document.getElementById("slide-dashboard").style.display = "block";
  document.getElementById("slide-pasien").style.display = "none";
  
  // Toggle active class untuk styling
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  loadDashboard();
}

function showPasien() {
  document.getElementById("slide-dashboard").style.display = "none";
  document.getElementById("slide-pasien").style.display = "block";
  
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  loadTable();
}

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {
  try {
    const shift = document.getElementById("shift").value;
    // Pastikan endpoint backend Anda sesuai
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
    // alert("Dashboard gagal dimuat"); // Uncomment jika ingin alert
  }
}

/* =========================
   LOAD TABEL PASIEN (Perbaikan)
========================= */
async function loadTable() {
  try {
    // Endpoint untuk mendapatkan semua laporan/data pasien
    const res = await fetch(`${API_BASE}/api/laporan`);
    const json = await res.json();

    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    if (!json.data || json.data.length === 0) {
      tbody.innerHTML = "<tr><td colspan='13' style='text-align:center'>Tidak ada data</td></tr>";
      return;
    }

    json.data.forEach(row => {
      const tr = document.createElement("tr");

      // Sesuaikan key 'row' dengan data dari backend Anda
      // Saya asumsikan key backend sama dengan field form (case sensitive)
      tr.innerHTML = `
        <td>${row.nama || "-"}</td>
        <td>${row.mr || "-"}</td>
        <td>${row.shift || "-"}</td>
        <td>${row.tim || "-"}</td>
        <td>${row.bayar || "-"}</td>
        <td>${row.hf || "-"}</td>
        <td>${row.vaskuler || "-"}</td>
        <td>${row.ak1 || "-"}</td>
        <td>${row.bicarbonate || row.bicarb || "-"}</td>
        <td>${row.obat || "-"}</td>
        <td style="color:${parseFloat(row.hb) < 8 ? "red" : "inherit"}; font-weight:${parseFloat(row.hb) < 8 ? "bold" : "normal"}">
          ${row.hb || "-"}
        </td>
        <td>${row.status || "-"}</td>
        <td>${row.ruang || "-"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Gagal load tabel:", err);
    alert("Data pasien gagal dimuat. Pastikan backend berjalan di " + API_BASE);
  }
}

/* =========================
   SUBMIT DATA PASIEN (BARU)
========================= */
async function submitPasien(e) {
  e.preventDefault();

  // Kumpulkan data dari form
  const data = {
    nama: document.getElementById("input-nama").value,
    mr: document.getElementById("input-mr").value,
    shift: document.getElementById("input-shift").value,
    tim: document.getElementById("input-tim").value,
    bayar: document.getElementById("input-bayar").value,
    hf: document.getElementById("input-hf").value,
    vaskuler: document.getElementById("input-vaskuler").value,
    ak1: document.getElementById("input-ak1").value,
    bicarbonate: document.getElementById("input-bicarb").value, // sesuaikan nama key backend
    obat: document.getElementById("input-obat").value,
    hb: document.getElementById("input-hb").value,
    status: document.getElementById("input-status").value,
    ruang: document.getElementById("input-ruang").value,
    tanggal: new Date().toISOString().split('T')[0] // Tambahkan tanggal hari ini
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
      document.getElementById("form-pasien").reset(); // Kosongkan form
      loadTable(); // Refresh tabel
    } else {
      alert("Gagal simpan: " + (result.message || "Error unknown"));
    }

  } catch (err) {
    console.error(err);
    alert("Gagal menghubungi server.");
  }
}

/* =========================
   EXPORT PDF (BARU)
========================= */
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const element = document.getElementById("area-cetak"); // Area yang akan dicetak

  // Tampilkan loading sederhana
  const oldText = event.target.innerText;
  event.target.innerText = "Processing...";
  event.target.disabled = true;

  html2canvas(element, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    
    // Orientasi landscape agar tabel muat
    const pdf = new jsPDF('l', 'mm', 'a4'); 
    const imgWidth = 280; // Lebar A4 landscape dalam mm
    const pageHeight = 210; 
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Jika tabel panjang, buat halaman baru
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const today = new Date().toLocaleDateString('id-ID');
    pdf.save(`Laporan_Dialisis_${today}.pdf`);

    // Kembalikan tombol
    event.target.innerText = oldText;
    event.target.disabled = false;
  });
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

  if (chartData.length === 0) {
    chartData = [
      { label: "H-6", value: 0 }, { label: "H-5", value: 0 },
      { label: "H-4", value: 0 }, { label: "H-3", value: 0 },
      { label: "H-2", value: 0 }, { label: "H-1", value: 0 },
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
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

/* =========================
   AUTO LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  showDashboard();
});
