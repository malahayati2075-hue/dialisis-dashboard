const API_BASE = "http://localhost:3001";
let globalChartData = []; 
let chartHD = null;
let masterPasienData = []; // Cache data master

// ... (Helper Date, Navigasi, Toggle Ruang sama seperti sebelumnya) ...

/* =========================
   LOAD MASTER PASIEN & SETUP AUTOCOMPLETE
========================= */
async function loadMasterPasien() {
  try {
    // Cek cache, jika sudah ada tidak perlu load ulang
    if (masterPasienData.length === 0) {
      const res = await fetch(`${API_BASE}/api/master-pasien`);
      const result = await res.json();
      masterPasienData = result.data || [];
      
      // Update Total Master di Dashboard jika elemen ada
      const totalEl = document.getElementById("masterTotal");
      if(totalEl) totalEl.textContent = result.total || 0;
    }

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

// Fungsi Sinkronisasi Nama <-> MR (VLOOKUP)
function setupAutoComplete() {
  const inputNama = document.getElementById("input-nama");
  const inputMr = document.getElementById("input-mr");

  if (inputNama) {
    inputNama.addEventListener('input', function() {
      // Cari di master data nama yang sama persis (case insensitive)
      const found = masterPasienData.find(p => p.nama.toLowerCase() === this.value.toLowerCase());
      if (found) {
        inputMr.value = found.mr;
      }
    });
  }

  if (inputMr) {
    inputMr.addEventListener('input', function() {
      const found = masterPasienData.find(p => p.mr === this.value);
      if (found) {
        inputNama.value = found.nama;
      }
    });
  }
}

/* =========================
   LOAD TABLE (Urutan Baru)
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
   SUBMIT PASIEN (Dengan Logika Baru)
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
    jarum: document.getElementById("input-jarum").value, // Text
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
      
      // Reset Form
      document.getElementById("form-pasien").reset();
      
      // Set Kembali Nilai Default Setelah Reset
      document.getElementById("input-tanggal").value = getLocalDate();
      document.getElementById("input-jarum").value = "25/32 (1/1)"; // Default Jarum
      document.getElementById("input-ak1").value = "0.5";           // Default AK1
      document.getElementById("input-bicarb").value = "1";          // Default Bicarb
      document.getElementById("input-ktv").value = "1.4";           // Default Kt/V
      
      toggleRuang(); // Reset status ruang
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
   AUTO LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const today = getLocalDate();
  document.getElementById("filter-start").value = today;
  document.getElementById("filter-end").value = today;
  
  // Set Default Form Input
  if(document.getElementById("input-tanggal")) document.getElementById("input-tanggal").value = today;
  if(document.getElementById("input-jarum")) document.getElementById("input-jarum").value = "25/32 (1/1)";
  if(document.getElementById("input-ak1")) document.getElementById("input-ak1").value = "0.5";
  if(document.getElementById("input-bicarb")) document.getElementById("input-bicarb").value = "1";
  if(document.getElementById("input-ktv")) document.getElementById("input-ktv").value = "1.4";

  // Setup Autocomplete listener
  setupAutoComplete();
  
  showDashboard();
});
