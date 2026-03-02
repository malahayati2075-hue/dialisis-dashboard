const API_BASE = "http://localhost:3001";
let globalChartData = []; 
let chartHD = null;
let masterPasienData = []; 

/* =========================
   HELPER DATE
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
function hideAllSlides() {
  document.getElementById("slide-dashboard").style.display = "none";
  document.getElementById("slide-pasien").style.display = "none";
  document.getElementById("slide-master").style.display = "none";
  document.getElementById("filter-section").style.display = "none";
}

function setActiveNav(e) {
  document.querySelectorAll('.nav-slide button').forEach(btn => btn.classList.remove('active'));
  if(e && e.target) e.target.classList.add('active');
}

function showDashboard(e) {
  hideAllSlides();
  document.getElementById("slide-dashboard").style.display = "block";
  document.getElementById("filter-section").style.display = "flex";
  setActiveNav(e);
  loadDashboard();
}

function showPasien(e) {
  hideAllSlides();
  document.getElementById("slide-pasien").style.display = "block";
  setActiveNav(e);
  loadTable();
  loadMasterPasien(); // Load data untuk autocomplete
}

function showMaster(e) {
  hideAllSlides();
  document.getElementById("slide-master").style.display = "block";
  setActiveNav(e);
}

/* =========================
   LOGIKA RUANG
========================= */
function toggleRuang() {
  const status = document.getElementById("input-status").value;
  const ruangInput = document.getElementById("input-ruang");
  if(ruangInput){ // Cek apakah elemen ada
    ruangInput.disabled = status === "Rawat Jalan";
    if (status === "Rawat Jalan") ruangInput.value = "";
  }
}

/* =========================
   MASTER PASIEN & AUTOCOMPLETE
========================= */
async function loadMasterPasien() {
  try {
    const res = await fetch(`${API_BASE}/api/master-pasien`);
    const result = await res.json();
    
    masterPasienData = result.data || [];
    
    // Update total di dashboard jika elemen ada
    const totalEl = document.getElementById("masterTotal");
    if(totalEl) totalEl.textContent = result.total || 0;

    // Isi Datalist Nama
    const listNama = document.getElementById("list-nama");
    if(listNama){
      listNama.innerHTML = "";
      masterPasienData.forEach(p => {
        const option = document.createElement("option");
        option.value = p.nama;
        listNama.appendChild(option);
      });
    }

    // Isi Datalist MR
    const listMr = document.getElementById("list-mr");
    if(listMr){
      listMr.innerHTML = "";
      masterPasienData.forEach(p => {
        const option = document.createElement("option");
        option.value = p.mr;
        listMr.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Gagal load master pasien:", err);
  }
}

function setupAutoComplete() {
  const inputNama = document.getElementById("input-nama");
  const inputMr = document.getElementById("input-mr");

  if (inputNama) {
    inputNama.addEventListener('input', function() {
      const found = masterPasienData.find(p => p.nama.toLowerCase() === this.value.toLowerCase());
      if (found && inputMr) inputMr.value = found.mr;
    });
  }

  if (inputMr) {
    inputMr.addEventListener('input', function() {
      const found = masterPasienData.find(p => p.mr === this.value);
      if (found && inputNama) inputNama.value = found.nama;
    });
  }
}

async function submitMaster(e) {
  e.preventDefault();
  const data = {
    mr: document.getElementById("master-mr").value,
    nama: document.getElementById("master-nama").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/master-pasien`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message || "Berhasil!");
    document.getElementById("form-master").reset();
    masterPasienData = []; 
    loadMasterPasien();
  } catch (err) {
    alert("Gagal menambah pasien baru.");
  }
}

/* =========================
   DASHBOARD & CHART
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
    document.getElementById("bed").textContent = `${terpakai || 0} / 29`;

    changeChart('total', 'Total Pasien');
    loadMasterTotal(); // Update total master pasien

  } catch (err) {
    console.error("Gagal load dashboard:", err);
  }
}

async function loadMasterTotal() {
  try {
    // Kita gunakan fungsi loadMasterPasien tapi hanya untuk update angka total
    // agar hemat kode, tapi di sini kita panggil simple saja
    const res = await fetch(`${API_BASE}/api/master-pasien`);
    const result = await res.json();
    const totalEl = document.getElementById("masterTotal");
    if(totalEl) totalEl.textContent = result.total || 0;
  } catch(e){}
}

function changeChart(type, label) {
  const tim = document.getElementById("filter-tim").value;
  let maxY = 29; 
  if (tim === "Tim 1") maxY = 15;
  else if (tim === "Tim 2") maxY = 14;
  renderChart(globalChartData, type, label, maxY);
}

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
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { font: { size: 10 } } } },
      scales: { 
        y: { beginAtZero: true, max: maxY, ticks: { precision: 0, font: { size: 10 } } }, 
        x: { ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true } }
      }
    }
  });
}

/* =========================
   TABEL & SUBMIT
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
    jarum: document.getElementById("input-jarum").value,
    ak1: document.getElementById("input-ak1").value,
    bicarbonate: document.getElementById("input-bicarb").value,
    obat: document.getElementById("input-obat").value,
    hb: document.getElementById("input-hb").value,
    ktv: document.getElementById("input-ktv").value,
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
      
      // Set Default Values Kembali
      document.getElementById("input-tanggal").value = getLocalDate();
      document.getElementById("input-jarum").value = "25/32 (1/1)";
      document.getElementById("input-ak1").value = "0.5";
      document.getElementById("input-bicarb").value = "1";
      document.getElementById("input-ktv").value = "1.4";
      
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
   AUTO LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const today = getLocalDate();
  document.getElementById("filter-start").value = today;
  document.getElementById("filter-end").value = today;
  
  // Set Default Form
  if(document.getElementById("input-tanggal")) document.getElementById("input-tanggal").value = today;
  if(document.getElementById("input-jarum")) document.getElementById("input-jarum").value = "25/32 (1/1)";
  if(document.getElementById("input-ak1")) document.getElementById("input-ak1").value = "0.5";
  if(document.getElementById("input-bicarb")) document.getElementById("input-bicarb").value = "1";
  if(document.getElementById("input-ktv")) document.getElementById("input-ktv").value = "1.4";

  setupAutoComplete();
  showDashboard();
});
