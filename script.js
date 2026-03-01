const API_BASE = 'http://localhost:3001';

let chartHD = null;

/* =========================
   LOAD DASHBOARD
========================= */
async function loadDashboard() {
  const shift = document.getElementById('shift').value;

  try {
    /* ========= DASHBOARD ========= */
    const dashRes = await fetch(`${API_BASE}/api/dashboard${shift ? `?shift=${shift}` : ''}`);
    const dash = await dashRes.json();

    document.getElementById('totalPasien').textContent = dash.totalPasien;
    document.getElementById('totalHD').textContent = dash.totalTindakan;
    document.getElementById('rawatInap').textContent = dash.rawatInap;
    document.getElementById('rawatJalan').textContent = dash.rawatJalan;
    document.getElementById('bed').textContent = `${dash.totalPasien} / 29`;

    /* ========= DETAIL DATA ========= */
    const lapRes = await fetch(`${API_BASE}/api/laporan`);
    const lap = await lapRes.json();

    let av = 0;
    let dl = 0;

    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    lap.data
      .filter(d => !shift || d.shift === shift)
      .forEach(d => {
        if (d.vaskuler === 'AV-Shunt') av++;
        if (d.vaskuler === 'DLP' || d.vaskuler === 'DLT') dl++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${d.nama}</td>
          <td>${d.mr}</td>
          <td>${d.shift}</td>
          <td style="color:${d.hb < 8 ? 'red' : 'black'}">${d.hb}</td>
          <td>${d.status}</td>
          <td>${d.ruang || '-'}</td>
        `;
        tbody.appendChild(tr);
      });

    document.getElementById('av').textContent = av;
    document.getElementById('dl').textContent = dl;

    /* ========= GRAFIK ========= */
    buildChart(lap.data);

  } catch (err) {
    console.error(err);
    alert('Gagal memuat data dashboard');
  }
}

/* =========================
   GRAFIK 7 HARI
========================= */
function buildChart(data) {
  const last7 = {};

  data.forEach(d => {
    if (!last7[d.tanggal]) last7[d.tanggal] = 0;
    last7[d.tanggal]++;
  });

  const labels = Object.keys(last7).slice(-7);
  const values = Object.values(last7).slice(-7);

  const ctx = document.getElementById('chartHD');

  if (chartHD) chartHD.destroy();

  chartHD = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Jumlah Tindakan HD',
        data: values,
        backgroundColor: '#0ea5e9'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/* =========================
   AUTO LOAD
========================= */
loadDashboard();
