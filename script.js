// Initialize Icons on Load
window.addEventListener('load', () => {
    if (window.lucide) window.lucide.createIcons();
});

// Navigation Logic
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

function showView(viewId) {
    const homeView = document.getElementById('home-view');
    const projectsView = document.getElementById('projects-view');

    window.scrollTo(0, 0);

    if (viewId === 'projects') {
        homeView.classList.add('hidden-view');
        projectsView.classList.remove('hidden-view');
    } else {
        projectsView.classList.add('hidden-view');
        homeView.classList.remove('hidden-view');
    }
}

function scrollToContact() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
}

// Data Fetching & Rendering Logic (Adapted from reference.html)

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
});

async function fetchProjects() {
    // Google Sheet published as CSV
    const SHEET_ID = '1WdwQ3QgxNO8NqH54gHI_xQh-UM3tmByusA71ScqJqiI';
    const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const csvText = await response.text();
        const projects = parseCSV(csvText);
        renderProjects(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        const container = document.getElementById('projects-grid');
        if (container) {
            container.innerHTML = `<p class="col-span-full text-center text-red-500">Unable to load projects at this time.</p>`;
        }
    }
}

function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const projects = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = parseCSVLine(lines[i]);
        if (currentLine.length === headers.length) {
            const project = {};
            headers.forEach((header, index) => {
                project[header.trim()] = currentLine[index].trim();
            });
            projects.push(project);
        }
    }
    return projects;
}

function parseCSVLine(text) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const THEMES = [
    {
        gradient: 'from-blue-900 to-slate-900',
        iconColor: 'text-ebl-blue',
        typeColor: 'text-ebl-blue',
        tagBg: 'bg-blue-50',
        tagText: 'text-blue-700',
        mainIcon: 'bot',
        subIcon: 'circuit-board'
    },
    {
        gradient: 'from-cyan-800 to-slate-900',
        iconColor: 'text-cyan-600',
        typeColor: 'text-cyan-600',
        tagBg: 'bg-cyan-50',
        tagText: 'text-cyan-700',
        mainIcon: 'grab',
        subIcon: 'hand'
    },
    {
        gradient: 'from-indigo-900 to-slate-900',
        iconColor: 'text-indigo-600',
        typeColor: 'text-indigo-600',
        tagBg: 'bg-indigo-50',
        tagText: 'text-indigo-700',
        mainIcon: 'box',
        subIcon: 'pen-tool'
    },
    {
        gradient: 'from-emerald-800 to-slate-900',
        iconColor: 'text-emerald-600',
        typeColor: 'text-emerald-600',
        tagBg: 'bg-emerald-50',
        tagText: 'text-emerald-700',
        mainIcon: 'zap',
        subIcon: 'droplet'
    }
];

function renderProjects(projects) {
    const container = document.getElementById('projects-grid'); // ID matches index.html
    if (!container) return;

    container.innerHTML = '';

    projects.forEach((project, index) => {
        if (!project['Name']) return;

        // Determine logic based on Type
        const type = (project['Type'] || '').toLowerCase();
        let sideIcon = 'cpu'; // Default side icon
        let themeIndex = 0; // Default theme (Blue)

        if (type.includes('robot')) {
            sideIcon = 'bot';
            themeIndex = 0; // Blue/Cyan
        } else if (type.includes('3d') || type.includes('model')) {
            sideIcon = 'box';
            themeIndex = 2; // Indigo
        } else if (type.includes('auto') || type.includes('plant')) {
            sideIcon = 'factory';
            themeIndex = 3; // Emerald
        } else {
            // Fallback to cycling themes if type is unknown
            themeIndex = index % THEMES.length;
            sideIcon = THEMES[themeIndex].subIcon;
        }

        const theme = THEMES[themeIndex];

        const tags = [];
        if (project['Materials']) tags.push(...project['Materials'].split(','));
        if (project['Software']) tags.push(...project['Software'].split(','));
        if (project['Code']) tags.push(project['Code']);

        // Clean tags
        const tagsHtml = tags
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => `<span class="px-3 py-1 ${theme.tagBg} ${theme.tagText} text-xs font-semibold rounded-full">${tag}</span>`)
            .join('');

        const cardHtml = `
            <div class="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-xl transition-all group flex flex-col">
                <div class="h-64 bg-slate-200 relative overflow-hidden flex items-center justify-center cursor-pointer" onclick="window.open('${project['Video Link'] || '#'}', '_blank')">
                    <div class="absolute inset-0 bg-gradient-to-br ${theme.gradient} group-hover:scale-105 transition-transform duration-500"></div>
                    
                    <!-- YouTube Logo Mockup -->
                    <div class="w-20 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg relative z-10 group-hover:scale-110 transition-transform">
                        <i data-lucide="play" class="w-8 h-8 text-white fill-current ml-1"></i>
                    </div>
                    
                    <!-- Overlay Hint -->
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/10">
                    </div>
                </div>
                <div class="p-8 flex-grow">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="text-xs font-bold ${theme.typeColor} uppercase tracking-wider">${project['Type'] || 'Project'}</span>
                            <h3 class="text-2xl font-bold font-tech text-slate-900 mt-1">${project['Name']}</h3>
                        </div>
                        <div class="bg-slate-100 p-2 rounded-full">
                            <i data-lucide="${sideIcon}" class="w-5 h-5 text-slate-600"></i>
                        </div>
                    </div>
                    <p class="text-slate-600 mb-6">
                        ${project['Description'] || ''}
                    </p>
                    <div class="flex flex-wrap gap-2 mt-auto">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
