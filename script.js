const API = "http://localhost:3001";

async function loadDashboard() {
  const shift = document.getElementById('shift').value;
  const res = await fetch(`${API}/api/dashboard${shift ? `?shift=${shift}` : ''}`);
  const data = await res.json();

  document.getElementById('totalPasien').textContent = data.totalPasien;
  document.getElementById('totalHD').textContent = data.totalTindakanHD;
  document.getElementById('rawatInap').textContent = data.rawatInap;
  document.getElementById('rawatJalan').textContent = data.rawatJalan;
  document.getElementById('av').textContent = data.vaskuler.avShunt;
  document.getElementById('dl').textContent = data.vaskuler.doubleLumen;
  document.getElementById('bed').textContent =
    (data.bed.tim1.terpakai + data.bed.tim2.terpakai) + " / 29";
}

async function loadTable() {
  const res = await fetch(`${API}/api/laporan`);
  const json = await res.json();

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  json.data.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.nama}</td>
      <td>${r.mr}</td>
      <td>${r.shift}</td>
      <td style="color:${r.hb < 8 ? 'red' : 'black'}">${r.hb}</td>
      <td>${r.status}</td>
      <td>${r.ruang}</td>
    `;
    tbody.appendChild(tr);
  });
}

loadDashboard();
loadTable();
