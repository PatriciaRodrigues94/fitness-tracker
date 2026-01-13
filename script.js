// TROCAR DE TELA
function openScreen(id) {
    var screens = document.getElementsByClassName('screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    document.getElementById(id).classList.add('active');
}

// TABS
function openTab(tabId, btn) {
    var tabs = document.getElementsByClassName('tab-content');
    var buttons = document.getElementsByClassName('tab-button');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    for (var i = 0; i < buttons.length; i++) buttons[i].classList.remove('active');
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// CARREGAR ARQUIVOS E SALVAR LOCALSTORAGE
function previewFiles(input, day) {
    const container = document.getElementById(`preview-${day}`);
    Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            const item = createPreviewItem(day, file.type, base64, '', '', false);
            container.appendChild(item);
            saveToStorage(day);
        }
        reader.readAsDataURL(file);
    });
}

// CRIAR ELEMENTO DE PREVIEW
function createPreviewItem(day, type, src, title, notes, checked) {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.dataset.type = type;
    item.dataset.src = src;
    item.dataset.title = title;
    item.dataset.notes = notes;
    item.dataset.checked = checked;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checked;
    checkbox.onchange = () => {
        item.dataset.checked = checkbox.checked;
        saveToStorage(day);
    }

    let media;
    if(type.startsWith("image/")) {
        media = document.createElement("img");
        media.src = src;
    } else {
        media = document.createElement("video");
        media.src = src;
        media.controls = false;
    }

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Título";
    titleInput.value = title;
    titleInput.oninput = () => {
        item.dataset.title = titleInput.value;
        saveToStorage(day);
    }

    const contentDiv = document.createElement("div");
    contentDiv.className = "checkbox-title";
    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(media);
    contentDiv.appendChild(titleInput);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerText = "×";
    removeBtn.onclick = (e) => {
        e.stopPropagation();
        item.remove();
        saveToStorage(day);
    }

    media.onclick = () => openLightboxDetailed(item, day);

    item.appendChild(contentDiv);
    item.appendChild(removeBtn);

    return item;
}

// ABRIR LIGHTBOX DETALHADO
function openLightboxDetailed(item, day) {
    const lightbox = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    const video = document.getElementById("lightbox-video");
    const titleElem = document.getElementById("lightbox-title");
    const notes = document.getElementById("lightbox-notes");

    img.style.display = "none";
    video.style.display = "none";

    titleElem.innerText = item.dataset.title;
    notes.value = item.dataset.notes;

    if(item.dataset.type.startsWith("image/")) {
        img.src = item.dataset.src;
        img.style.display = "block";
    } else {
        video.src = item.dataset.src;
        video.style.display = "block";
    }

    notes.oninput = () => {
        item.dataset.notes = notes.value;
        saveToStorage(day);
    }

    lightbox.style.display = "flex";
}

// FECHAR LIGHTBOX
function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    const video = document.getElementById("lightbox-video");
    video.pause();
    lightbox.style.display = "none";
}

// SALVAR NO LOCALSTORAGE
function saveToStorage(day) {
    const container = document.getElementById(`preview-${day}`);
    const data = [];
    container.querySelectorAll('.preview-item').forEach(item => {
        data.push({
            type: item.dataset.type,
            src: item.dataset.src,
            title: item.dataset.title,
            notes: item.dataset.notes,
            checked: item.dataset.checked === 'true'
        });
    });
    localStorage.setItem(day, JSON.stringify(data));
}

// CARREGAR DO LOCALSTORAGE AO INICIAR
function loadFromStorage() {
    ['dia1','dia2','dia3'].forEach(day => {
        const container = document.getElementById(`preview-${day}`);
        const data = JSON.parse(localStorage.getItem(day) || '[]');
        data.forEach(f => {
            const item = createPreviewItem(day, f.type, f.src, f.title, f.notes, f.checked);
            container.appendChild(item);
        });
    });
}

// ---------------- PROGRESSO ----------------
const addRecordBtn = document.getElementById('add-record-btn');
const progressForm = document.getElementById('progress-form');
const cancelBtn = document.getElementById('cancel-btn');

addRecordBtn.addEventListener('click', () => {
    progressForm.style.display = 'flex';
    addRecordBtn.style.display = 'none';
});

cancelBtn.addEventListener('click', () => {
    progressForm.style.display = 'none';
    addRecordBtn.style.display = 'block';
});

let weightChart;

function loadProgress() {
    let data = JSON.parse(localStorage.getItem('progress') || '[]');

    // Ordenar do mais recente para o mais antigo
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    const listContainer = document.getElementById('progress-list');
    listContainer.innerHTML = '';

    data.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <div>
                <strong>${entry.date}</strong> - ${entry.weight} kg | ${entry.notes || ''}
            </div>
            <button class="remove-btn">×</button>
        `;
        div.querySelector('button').onclick = () => {
            data.splice(index, 1);
            localStorage.setItem('progress', JSON.stringify(data));
            loadProgress();
            updateChart();
        };
        listContainer.appendChild(div);
    });

    updateChart();
}

progressForm.addEventListener('submit', function(e){
    e.preventDefault();
    const date = document.getElementById('date').value;
    const weight = parseFloat(document.getElementById('weight').value);
    const notes = document.getElementById('notes').value;

    if(!date || !weight) return alert('Preencha data e peso');

    const data = JSON.parse(localStorage.getItem('progress') || '[]');
    data.push({ date, weight, notes });
    localStorage.setItem('progress', JSON.stringify(data));

    this.reset();
    this.style.display = 'none';
    addRecordBtn.style.display = 'block';

    loadProgress();
});

function updateChart() {
    const data = JSON.parse(localStorage.getItem('progress') || '[]');
    const sorted = [...data].sort((a,b) => new Date(a.date) - new Date(b.date));

    const labels = sorted.map(d => d.date);
    const weights = sorted.map(d => d.weight);

    const ctx = document.getElementById('weightChart').getContext('2d');
    if(weightChart) weightChart.destroy();

    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: weights,
                borderWidth: 2,        // Linha visível
                pointRadius: 5,        // Pontos percetíveis
                pointHoverRadius: 7,
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite ocupar menos espaço
            plugins: {
                legend: { display: true, labels: { font: { size: 12 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { font: { size: 12 } },
                    grid: { color: '#ddd', lineWidth: 1 },
                    title: { display: true, text: 'Peso (kg)', font: { size: 12 } }
                },
                x: {
                    ticks: { font: { size: 12 } },
                    grid: { color: '#eee' },
                    title: { display: true, text: 'Data', font: { size: 12 } }
                }
            }
        }
    });
}

// CARREGAR AO INICIAR
window.onload = () => {
    loadFromStorage();
    loadProgress();
};