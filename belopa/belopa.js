(function() {
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.onkeydown = function(e) {
        if (e.keyCode === 123) return false;
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) return false;
        if (e.ctrlKey && e.keyCode === 85) return false;
        if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 85)) return false;
    };
})();

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTrsWbW5MWUJgMp2wdCjS1_GKvCId2IQiJ_KKkRMbPcVU8_JPFyACch-k9DjaAeNti_A/exec'; 
const LOKASI_MPP = "BELOPA";

const opdRegistry = [
    { id: "DISDUKCAPIL", tag: "Kependudukan & Catatan Sipil", icon: "fa-id-card" },
    { id: "SAMSAT", tag: "Pajak & Administrasi Kendaraan", icon: "fa-car-side" },
    { id: "BAPENDA", tag: "Pajak & Retribusi Daerah", icon: "fa-file-invoice-dollar" },
    { id: "BPJS KESEHATAN", tag: "Jaminan Kesehatan Nasional", icon: "fa-heart-pulse" },
    { id: "BPJS KETENAGAKERJAAN", tag: "Perlindungan Tenaga Kerja", icon: "fa-shield-halved" },
    { id: "DPMPTSP", tag: "Perizinan & Penanaman Modal", icon: "fa-briefcase" },
    { id: "IMIGRASI", tag: "Paspor & Dokumen Luar Negeri", icon: "fa-passport" },
    { id: "KPP PRATAMA", tag: "Perpajakan Pajak Pusat", icon: "fa-landmark" },
    { id: "BANK SULSELBAR", tag: "Transaksi & Perbankan Daerah", icon: "fa-building-columns" },
    { id: "DINAS KESEHATAN", tag: "Rekomendasi & Izin Kesehatan", icon: "fa-user-doctor" },
    { id: "DISNAKERTRANS", tag: "Ketenagakerjaan & Transmigrasi", icon: "fa-users-gear" },
    { id: "PDAM", tag: "Pelayanan Air Bersih Daerah", icon: "fa-faucet" },
    { id: "DINAS PUTR", tag: "Rekomendasi Tata Ruang & PU", icon: "fa-city" },
    { id: "DINAS PERIKANAN", tag: "Izin & Rekomendasi Nelayan", icon: "fa-fish" },
    { id: "KOMINFO", tag: "Layanan Informasi & Digital", icon: "fa-tower-broadcast" },
    { id: "DINAS SOSIAL", tag: "Bantuan & Jaminan Sosial", icon: "fa-hand-holding-heart" },
    { id: "KEJAKSAAN NEGERI", tag: "Konsultasi & Layanan Hukum", icon: "fa-scale-balanced" },
    { id: "BPS", tag: "Data & Statistik Wilayah", icon: "fa-chart-area" },
    { id: "DEKRANASDA", tag: "Kerajinan & UMKM Binaan", icon: "fa-basket-shopping" },
    { id: "PT ALIYAH", tag: "Sektor Swasta / Mitra Kerja", icon: "fa-handshake" },
    { id: "PT NATA ENVINUSA", tag: "Sektor Swasta / Lingkungan", icon: "fa-leaf" },
    { id: "HAS INT. CENTER", tag: "Sektor Swasta / Mitra Luar", icon: "fa-globe" }
];

let barChartInstance = null;

window.onload = () => {
    document.getElementById('dynamicYear').textContent = new Date().getFullYear();

    const getLocalDateString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentDate = new Date();
    document.getElementById('operasionalDate').value = getLocalDateString(currentDate);
    
    let mondayOffset = new Date();
    mondayOffset.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
    
    document.getElementById('datetimeStart').value = getLocalDateString(mondayOffset);
    document.getElementById('datetimeEnd').value = getLocalDateString(currentDate);

    const grid = document.getElementById('cardContainerOPD');
    opdRegistry.forEach((opd, i) => {
        grid.innerHTML += `
            <div class="opd-card" id="cardOPD_${i}">
                <div class="opd-icon-container"><i class="fa-solid ${opd.icon}"></i></div>
                <div class="opd-meta">
                    <span class="opd-title" title="${opd.id}">${opd.id}</span>
                    <span class="opd-subtitle">${opd.tag}</span>
                </div>
                <div class="counter-system">
                    <button class="btn-incrementor" onclick="modifyCounter(${i}, -1)">-</button>
                    <input type="number" id="numField_${i}" class="input-numerical" placeholder="0" min="0" oninput="recalculateMetrics(${i})">
                    <button class="btn-incrementor" onclick="modifyCounter(${i}, 1)">+</button>
                </div>
            </div>
        `;
    });
};

function showToast(type, message) {
    const toast = document.getElementById('dispatchToast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMsg');
    
    toast.className = 'toast-dispatch'; 
    toast.classList.add(type === 'success' ? 'toast-success' : 'toast-error');
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation';
    msg.innerText = message;
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

function executeLocalSearch() {		
    const keyword = document.getElementById('opdSearchInput').value.toUpperCase().trim();						
    opdRegistry.forEach((opd, i) => {
        const cardElement = document.getElementById('cardOPD_' + i);
        if (cardElement) {					
            cardElement.style.display = (opd.id.toUpperCase().includes(keyword) || opd.tag.toUpperCase().includes(keyword)) ? 'flex' : 'none';
        }
    });
}

function modifyCounter(index, delta) {
    let field = document.getElementById('numField_'+index);
    let targetValue = (parseInt(field.value) || 0) + delta;
    field.value = targetValue > 0 ? targetValue : '';
    recalculateMetrics(index);
}

function recalculateMetrics(index) {
    let val = parseInt(document.getElementById('numField_'+index).value) || 0;
    let componentCard = document.getElementById('cardOPD_'+index);
    if(val > 0) componentCard.classList.add('active'); else componentCard.classList.remove('active');
    
    let currentTotal = 0;
    opdRegistry.forEach((_, x) => currentTotal += (parseInt(document.getElementById('numField_'+x).value) || 0));
    document.getElementById('labelLiveCalculatedTotal').innerText = currentTotal.toLocaleString('id-ID');
}

function dispatchDataToCloud() {
    if (window.location.protocol === 'file:') {
        return showToast('error', "AKSES DITOLAK: Transmisi ilegal dari penyimpanan lokal terdeteksi!");
    }

    let totalVal = document.getElementById('labelLiveCalculatedTotal').innerText;
    if(totalVal === "0") return showToast('error', "Kuantitas entri tidak boleh nihil, Bos.");
    
    const btn = document.getElementById('btnTriggerCloudSave');
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> TRANSMISI DATA...`; 
    btn.disabled = true;

    const packetPayload = { 
        token: "MPP_LUWU_ENTERPRISE_2026", 
        lokasi: LOKASI_MPP, 
        tanggal: document.getElementById('operasionalDate').value, 
        detail: {} 
    };
    
    opdRegistry.forEach((opd, i) => {
        let numericalValue = parseInt(document.getElementById('numField_'+i).value) || 0;
        if(numericalValue > 0) packetPayload.detail[opd.id] = numericalValue;
    });

    fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(packetPayload) })
    .then(() => {
        showToast('success', `Data Pencatatan Berhasil Disimpan!`);
        setTimeout(() => { 
            opdRegistry.forEach((_, i) => { document.getElementById('numField_'+i).value = ''; document.getElementById('cardOPD_'+i).classList.remove('active'); });
            recalculateMetrics(0);
            const searchField = document.getElementById('opdSearchInput');
            if (searchField) { searchField.value = ''; executeLocalSearch(); }
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> SIMPAN DATA`; 
            btn.disabled = false;
        }, 1500);
    }).catch(() => {
        showToast('error', "Gagal terhubung ke awan. Periksa koneksi internet.");
        btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> SIMPAN DATA`; 
        btn.disabled = false;
    });
}

function changeSection(sectionId) {
    document.querySelectorAll('.nav-btn, .page-section').forEach(el => el.classList.remove('active'));
    if(sectionId === 'input') {
        document.getElementById('tabIncrementor').classList.add('active');
        document.getElementById('sectionInput').classList.add('active');
        document.getElementById('stickyFooterInput').style.display = 'flex';
    } else {
        document.getElementById('tabSynthesizer').classList.add('active');
        document.getElementById('sectionReport').classList.add('active');
        document.getElementById('stickyFooterInput').style.display = 'none';
    }
}

function formatTanggalPremium(dateString) {
    if (!dateString) return "-";
    const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]} ${bulanIndo[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

function executeCloudQuery() {
    if (window.location.protocol === 'file:') {
        return showToast('error', "AKSES DITOLAK: Sinkronisasi ilegal dari penyimpanan lokal terdeteksi!");
    }

    const btn = document.getElementById('btnRunQuery');
    document.getElementById('labelQueryBtn').style.display = 'none';
    document.getElementById('queryLoader').style.display = 'block';
    btn.disabled = true;

    const urlAntiBasi = GOOGLE_SCRIPT_URL + "?t=" + new Date().getTime();

    fetch(urlAntiBasi)
    .then(response => response.json())
    .then(packet => {
        if(packet.status === 'success') {
            compileAnalyticReporting(packet.data);
        } else {
            showToast('error', "Gagal menarik data gabungan dari peladen.");
        }
    })
    .catch(() => showToast('error', "Koneksi ke pangkalan data terputus."))
    .finally(() => {
        document.getElementById('labelQueryBtn').style.display = 'block';
        document.getElementById('queryLoader').style.display = 'none';
        btn.disabled = false;
    });
}

function compileAnalyticReporting(rawCollection) {
    let internalMatrix = {};
    opdRegistry.forEach(o => internalMatrix[o.id] = { belopa: 0, walmas: 0, total: 0 });
    let collectiveSum = 0;
    let sumBelopa = 0;
    let sumWalmas = 0;

    let filterStartVal = document.getElementById('datetimeStart').value;
    let filterEndVal = document.getElementById('datetimeEnd').value;

    if(!filterStartVal || !filterEndVal) return showToast('error', "Mohon tetapkan parameter rentang waktu terlebih dahulu.");

    let startTime = new Date(filterStartVal + "T00:00:00").getTime();
    let endTime = new Date(filterEndVal + "T23:59:59").getTime();

    rawCollection.forEach(row => {
        if(row.tanggal) {
            let rowTime = new Date(row.tanggal + "T00:00:00").getTime();
            if(rowTime >= startTime && rowTime <= endTime) {
                opdRegistry.forEach(o => {
                    let cellValue = parseInt(row[o.id]) || 0;
                    if(cellValue > 0) {
                        if(row.lokasi === "MPP_WALMAS") {
                            internalMatrix[o.id].walmas += cellValue;
                            sumWalmas += cellValue;
                        } else {
                            internalMatrix[o.id].belopa += cellValue;
                            sumBelopa += cellValue;
                        }
                        
                        internalMatrix[o.id].total += cellValue;
                        collectiveSum += cellValue;
                    }
                });
            }
        }
    });

    document.getElementById('analyticsVisualizerArea').style.display = 'block';
    document.getElementById('btnPrintTrigger').style.display = 'flex'; 
    document.getElementById('valKpiGrandTotal').innerText = collectiveSum.toLocaleString('id-ID');
    
    let formatStart = formatTanggalPremium(filterStartVal);
    let formatEnd = formatTanggalPremium(filterEndVal);
    document.getElementById('labelTemporalScope').innerText = "PERIODE PELAPORAN: " + formatStart + " s.d. " + formatEnd;

    let processedSequence = opdRegistry.map(o => ({ 
        id: o.id, icon: o.icon, 
        belopa: internalMatrix[o.id].belopa, 
        walmas: internalMatrix[o.id].walmas, 
        total: internalMatrix[o.id].total 
    })).sort((a,b) => b.total - a.total);

    let dataInjectorHtml = '';
    processedSequence.forEach((item, index) => {
        dataInjectorHtml += `
            <div class="table-row-premium">
                <div class="col-rank">${index + 1}</div>
                <div class="col-identity"><i class="fa-solid ${item.icon}"></i> ${item.id}</div>
                <div class="col-belopa">${item.belopa > 0 ? item.belopa.toLocaleString('id-ID') : '-'}</div>
                <div class="col-walmas">${item.walmas > 0 ? item.walmas.toLocaleString('id-ID') : '-'}</div>
                <div class="col-total">${item.total.toLocaleString('id-ID')}</div>
            </div>
        `;
    });

    dataInjectorHtml += `
        <div class="table-row-premium" style="background: #F1F5F9; font-weight: 800; text-transform: uppercase;">
            <div class="col-rank"></div>
            <div class="col-identity">TOTAL KESELURUHAN</div>
            <div class="col-belopa">${sumBelopa > 0 ? sumBelopa.toLocaleString('id-ID') : '-'}</div>
            <div class="col-walmas">${sumWalmas > 0 ? sumWalmas.toLocaleString('id-ID') : '-'}</div>
            <div class="col-total">${collectiveSum.toLocaleString('id-ID')}</div>
        </div>
    `;

    document.getElementById('analyticsTableDataInjector').innerHTML = dataInjectorHtml;

    renderExecutiveBarChart(processedSequence);
}

function renderExecutiveBarChart(sortedSequence) {
    const canvasElement = document.getElementById('analyticsBarChartEngine').getContext('2d');
    let subsetData = sortedSequence.slice(0, 10); 
    
    let horizontalLabels = subsetData.map(i => i.id);
    let valBelopa = subsetData.map(i => i.belopa);
    let valWalmas = subsetData.map(i => i.walmas);

    if(barChartInstance) barChartInstance.destroy();

    barChartInstance = new Chart(canvasElement, {
        type: 'bar',
        data: {
            labels: horizontalLabels,
            datasets: [
                {
                    label: 'MPP Belopa', data: valBelopa, backgroundColor: '#1E3A8A', 
                    borderWidth: 0, borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 4, bottomRight: 4 }, maxBarThickness: 36
                },
                {
                    label: 'MPP Walmas', data: valWalmas, backgroundColor: '#0D9488', 
                    borderWidth: 0, borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 }, maxBarThickness: 36
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'top', labels: { usePointStyle: true, font: { family: 'Plus Jakarta Sans', weight: '700' } } },
                tooltip: { backgroundColor: '#0F172A', titleColor: '#FFFFFF', bodyColor: '#F8FAFC', padding: 12, cornerRadius: 8, mode: 'index', intersect: false }
            },
            scales: {
                y: { stacked: true, beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { color: '#475569', font: { family: 'Plus Jakarta Sans', weight: '600', size: 10 } } },
                x: { stacked: true, grid: { display: false }, ticks: { color: '#0F172A', font: { size: 9, weight: '700', family: 'Plus Jakarta Sans' }, maxRotation: 30, minRotation: 30 } }
            }
        }
    });
}
