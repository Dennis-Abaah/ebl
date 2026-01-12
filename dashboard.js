// Initialize Icons
window.addEventListener('load', () => {
    if (window.lucide) window.lucide.createIcons();
    // Initial load of data if needed, or wait for user to click View All
});

const form = document.getElementById('projectForm');
const editForm = document.getElementById('editForm');
const statusDiv = document.getElementById('statusMessage');

// REPLACE THIS WITH YOUR DEPLOYED WEB APP URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_krPleue-HaApN508KMXyNpyvvKMnJkV3CclFhomAEzHLGX9nwOjzh8oaaIuUSz_q/exec';

// --- Sidebar Logic ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('open');
    // also toggle 'active' on overlay
    if (sidebar.classList.contains('open')) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function switchView(viewName, element) {
    // 1. Hide all views
    document.querySelectorAll('.dashboard-view').forEach(el => el.classList.add('hidden'));

    // 2. Show selected view
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    // 3. Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    // 4. Update Header Title
    const titles = {
        'add': 'New Project Entry',
        'view': 'Manage Projects',
        'analytics': 'Project Analytics'
    };
    document.getElementById('pageTitle').textContent = titles[viewName];

    // 5. Special logic
    if (window.innerWidth < 768) {
        // If mobile, close sidebar after clicking
        toggleSidebar();
    }

    if (viewName === 'view') {
        fetchAndRenderTable();
    } else if (viewName === 'analytics') {
        fetchAndRenderAnalytics();
    }
}


// --- Data Submission (Add New) ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    handleFormSubmit(form, 'create');
});

// --- Data Submission (Edit) ---
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(editForm, 'update');
    closeEditModal();
    // Refresh table if needed
    fetchAndRenderTable();
});

async function handleFormSubmit(formEl, action) {
    // UI Feedback
    const btn = formEl.querySelector('button[type="submit"]');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Processing...`;
    lucide.createIcons();

    if (formEl === form) showStatus('Uploading project data...', 'loading');

    const formData = new FormData(formEl);
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    data.action = action; // 'create' or 'update'

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (formEl === form) {
            showStatus('Success! Data transmitted.', 'success');
            formEl.reset();
        } else {
            alert('Update sent! Give it a moment to reflect.');
        }

    } catch (error) {
        console.error('Error:', error);
        if (formEl === form) showStatus('Failed. Check console.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
        lucide.createIcons();
        setTimeout(() => {
            if (statusDiv && !statusDiv.classList.contains('hidden')) statusDiv.classList.add('hidden');
        }, 3000);
    }
}

function showStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');
}


// --- View All & Fetch Logic ---
let globalProjects = [];

async function fetchAndRenderTable() {
    const tbody = document.querySelector('#projectsTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Fetching data...</td></tr>';

    try {
        const response = await fetch(SCRIPT_URL); // GET request returns JSON
        const projects = await response.json();
        globalProjects = projects;

        tbody.innerHTML = '';
        projects.forEach(project => {
            const row = `
                <tr>
                    <td class="font-semibold">${project.Name}</td>
                    <td><span class="px-2 py-1 bg-slate-100 rounded text-xs">${project.Type}</span></td>
                    <td class="text-xs text-muted truncate max-w-[200px]">${project.Description || ''}</td>
                    <td class="flex gap-2">
                        <button class="btn-icon edit" onclick="openEditModal(${project._row})"><i data-lucide="edit-2" style="width:16px; height:16px;"></i></button>
                        <button class="btn-icon delete" onclick="deleteProject(${project._row})"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        lucide.createIcons();

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-red-500">Failed to load data. Ensure script is deployed correctly.</td></tr>';
    }
}

function refreshData() {
    fetchAndRenderTable();
}

// --- Edit/Delete Logic ---

function openEditModal(rowIndex) {
    const project = globalProjects.find(p => p._row === rowIndex);
    if (!project) return;

    document.getElementById('editRow').value = rowIndex;
    document.getElementById('editName').value = project.Name;
    document.getElementById('editType').value = project.Type; // Ideally matches select options
    document.getElementById('editVideo').value = project['Video Link'] || '';
    document.getElementById('editDesc').value = project.Description || '';
    document.getElementById('editMaterials').value = project.Materials || '';
    document.getElementById('editSoftware').value = project.Software || '';
    document.getElementById('editCode').value = project.Code || '';

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function deleteProject(rowIndex) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', _row: rowIndex })
        });

        // Optimistic UI update
        alert('Deletion request sent. Refreshing...');
        setTimeout(fetchAndRenderTable, 1000);

    } catch (error) {
        alert('Delete failed');
    }
}

// --- Analytics Logic ---
let typeChartInstance = null;
let softwareChartInstance = null;

async function fetchAndRenderAnalytics() {
    try {
        const response = await fetch(SCRIPT_URL);
        const projects = await response.json();

        document.getElementById('totalProjects').textContent = projects.length;

        // 1. Calculate Type Distribution & Filter for known types
        const knownTypes = ['Robotics', 'Automation', '3D Modeling'];
        const typeCounts = {
            'Robotics': 0,
            'Automation': 0,
            '3D Modeling': 0,
            'Other': 0
        };

        projects.forEach(p => {
            let t = p.Type || 'Other';
            // Normalize matching
            const match = knownTypes.find(kt => kt.toLowerCase() === t.toLowerCase()) || 'Other';

            // If it was one of the removed types, count as Other
            typeCounts[match] = (typeCounts[match] || 0) + 1;
        });

        // Get top category
        const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        if (sortedTypes.length > 0) {
            document.getElementById('topCategory').textContent = `${sortedTypes[0][0]} (${sortedTypes[0][1]})`;
        }

        // 2. Render Pie Chart (Types)
        // Labels with counts: "Robotics (5)"
        const labelsWithCounts = Object.keys(typeCounts).map(key => `${key} (${typeCounts[key]})`);

        const typeCtx = document.getElementById('typeChart').getContext('2d');

        if (typeChartInstance) typeChartInstance.destroy();

        typeChartInstance = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: labelsWithCounts,
                datasets: [{
                    data: Object.values(typeCounts),
                    backgroundColor: [
                        '#3b82f6', // Robotics - Blue
                        '#10b981', // Automation - Green
                        '#6366f1', // 3D Modeling - Indigo
                        '#94a3b8'  // Other - Slate
                    ],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Projects by Category' }
                }
            }
        });

        // 3. Render Bar Chart (Software Frequency - Simple split)
        // Count all individual software mentions
        const softwareCounts = {};
        projects.forEach(p => {
            if (!p.Software) return;
            const softs = p.Software.split(',').map(s => s.trim());
            softs.forEach(s => {
                softwareCounts[s] = (softwareCounts[s] || 0) + 1;
            });
        });

        // Sort and take top 5
        const topSoftware = Object.entries(softwareCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const softCtx = document.getElementById('softwareChart').getContext('2d');
        if (softwareChartInstance) softwareChartInstance.destroy();

        softwareChartInstance = new Chart(softCtx, {
            type: 'bar',
            data: {
                labels: topSoftware.map(i => i[0]),
                datasets: [{
                    label: 'Usage Count',
                    data: topSoftware.map(i => i[1]),
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Top Technologies' }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });

    } catch (e) {
        console.error('Analytics Error:', e);
    }
}
