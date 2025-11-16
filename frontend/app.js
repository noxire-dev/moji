/**
 * Moji - Universal Workspace
 * Lightweight, cross-platform note-taking app
 */

// ============================================================================
// STATE & CONFIGURATION
// ============================================================================

const CONFIG = {
    API_BASE: 'http://127.0.0.1:5000/v1/api',
    THEME_COLORS: {
        purple: '#7e9cd8',
        blue: '#7aa2f7',
        green: '#76946a',
        orange: '#e98a5b',
        red: '#c34043',
        pink: '#c678dd',
        teal: '#4db5bd',
        yellow: '#d7ba7d'
    }
};

const state = {
    workspaces: [],
    tasks: [],
    notes: [],
    theme: 'purple'
};

// ============================================================================
// API MODULE
// ============================================================================

const api = {
    async call(path, method = 'GET', body = null) {
        try {
            const opts = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (body) opts.body = JSON.stringify(body);

            const res = await fetch(`${CONFIG.API_BASE}${path}`, opts);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error('API error:', e);
            ui.toast('Connection error. Please try again.');
            return null;
        }
    },

    async loadAll() {
        const [workspaces, tasks, notes] = await Promise.all([
            this.call('/workspaces'),
            this.call('/tasks'),
            this.call('/notes')
        ]);

        if (Array.isArray(workspaces)) state.workspaces = workspaces;
        if (Array.isArray(tasks)) state.tasks = tasks;
        if (Array.isArray(notes)) state.notes = notes;

        render.all();
    }
};

// ============================================================================
// TASKS MODULE
// ============================================================================

const tasks = {
    async create(e) {
        e.preventDefault();
        const content = document.getElementById('taskInput').value;
        const priority = parseInt(document.getElementById('taskPriority').value);

        await api.call('/tasks', 'POST', { content, priority });
        await api.loadAll();
        ui.closeModal('task');
        e.target.reset();
        ui.toast('Task added!');
    },

    async toggle(id, completed) {
        await api.call(`/tasks/${id}`, 'PUT', { completed });
        await api.loadAll();
        ui.toast(completed ? 'Task completed!' : 'Task reopened');
    },

    async delete(id) {
        if (!confirm('Delete this task?')) return;
        await api.call(`/tasks/${id}`, 'DELETE');
        await api.loadAll();
        ui.toast('Task deleted');
    }
};

// ============================================================================
// NOTES MODULE
// ============================================================================

const notes = {
    async create(e) {
        e.preventDefault();
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        const tagsInput = document.getElementById('noteTags').value;
        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

        await api.call('/notes', 'POST', { title, content, tags });
        await api.loadAll();
        ui.closeModal('note');
        e.target.reset();
        ui.toast('Note added!');
    },

    async update(e) {
        e.preventDefault();
        const id = document.getElementById('noteEditId').value;
        const title = document.getElementById('noteEditTitle').value;
        const content = document.getElementById('noteEditContent').value;
        const tagsInput = document.getElementById('noteEditTags').value;
        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

        await api.call(`/notes/${id}`, 'PUT', { title, content, tags });
        await api.loadAll();
        ui.closeModal('noteView');
        ui.toast('Note updated!');
    },

    async delete(e, id) {
        e.stopPropagation();
        if (!confirm('Delete this note?')) return;
        await api.call(`/notes/${id}`, 'DELETE');
        await api.loadAll();
        ui.toast('Note deleted');
    },

    open(note) {
        document.getElementById('noteEditId').value = note.id;
        document.getElementById('noteViewTitle').textContent = note.title;
        document.getElementById('noteEditTitle').value = note.title;
        document.getElementById('noteEditContent').value = note.content;
        document.getElementById('noteEditTags').value = note.tags ? note.tags.join(', ') : '';
        ui.openModal('noteView');
    }
};

// ============================================================================
// RENDER MODULE
// ============================================================================

const render = {
    all() {
        this.workspaces();
        this.tasks();
        this.notes();
    },

    workspaces() {
        const el = document.getElementById('workspacesList');
        if (state.workspaces.length === 0) {
            el.innerHTML = '<div class="empty">No workspaces yet</div>';
            return;
        }

        const indicators = ['code', 'work', 'personal'];
        el.innerHTML = state.workspaces.map((w, i) => `
            <div class="workspace-item">
                <div class="workspace-indicator ${indicators[i % 3]}"></div>
                <div class="workspace-info">
                    <div class="workspace-name">${w.name}</div>
                    <div class="workspace-meta">${w.description || ''}</div>
                </div>
            </div>
        `).join('');
    },

    tasks() {
        const el = document.getElementById('tasksList');
        const count = document.getElementById('taskCount');
        const taskList = state.tasks.slice(0, 5);

        count.textContent = state.tasks.length;

        if (taskList.length === 0) {
            el.innerHTML = '<div class="empty">No tasks yet</div>';
            return;
        }

        el.innerHTML = taskList.map(t => {
            const p = ['low', 'medium', 'high'][t.priority || 1];
            const pl = ['Low', 'Medium', 'High'][t.priority || 1];
            return `
                <div class="task ${t.completed ? 'completed' : ''}">
                    <div class="checkbox ${t.completed ? 'checked' : ''}"
                         onclick="app.tasks.toggle(${t.id}, ${!t.completed})"></div>
                    <div class="task-content">
                        <div class="task-text">${this.escapeHtml(t.content)}</div>
                        <div class="task-meta">
                            <span class="priority priority-${p}">${pl}</span>
                            <span>${new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button class="btn-delete" onclick="app.tasks.delete(${t.id})" title="Delete">✕</button>
                </div>
            `;
        }).join('');
    },

    notes() {
        const el = document.getElementById('notesList');
        const count = document.getElementById('noteCount');
        const noteList = state.notes.slice(0, 5);

        count.textContent = state.notes.length;

        if (noteList.length === 0) {
            el.innerHTML = '<div class="empty">No notes yet</div>';
            return;
        }

        el.innerHTML = noteList.map(n => `
            <div class="note" onclick="app.notes.open(${JSON.stringify(n).replace(/"/g, '&quot;')})">
                <div class="note-title">${this.escapeHtml(n.title)}</div>
                <div class="note-content">${this.escapeHtml(n.content.substring(0, 150))}${n.content.length > 150 ? '...' : ''}</div>
                ${n.tags && n.tags.length > 0 ? `
                    <div class="note-tags">
                        ${n.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <button class="btn-delete" onclick="app.notes.delete(event, ${n.id})" title="Delete">✕</button>
            </div>
        `).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================================================
// UI MODULE
// ============================================================================

const ui = {
    openModal(type) {
        document.getElementById(`${type}Modal`).classList.add('active');
        setTimeout(() => {
            const inputMap = {
                task: 'taskInput',
                note: 'noteTitle',
                noteView: 'noteEditTitle'
            };
            const input = document.getElementById(inputMap[type]);
            input?.focus();
        }, 100);
    },

    closeModal(type) {
        document.getElementById(`${type}Modal`).classList.remove('active');
    },

    toast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 2000);
    }
};

// ============================================================================
// THEME MODULE
// ============================================================================

const theme = {
    init() {
        this.setupSelector();
        this.load();
    },

    setupSelector() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                this.set(option.dataset.color);
            });
        });
    },

    set(color) {
        document.documentElement.style.setProperty('--primary', CONFIG.THEME_COLORS[color]);
        state.theme = color;
        localStorage.setItem('mojiTheme', color);

        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });
    },

    load() {
        const saved = localStorage.getItem('mojiTheme') || 'purple';
        this.set(saved);
    }
};

// ============================================================================
// COMMAND BAR MODULE
// ============================================================================

const commands = {
    init() {
        const input = document.getElementById('commandInput');
        const suggestions = document.getElementById('suggestions');

        input.addEventListener('input', (e) => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';

            if (e.target.value.startsWith('/')) {
                suggestions.classList.add('show');
            } else {
                suggestions.classList.remove('show');
            }
        });

        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                await this.process(input.value.trim());
                input.value = '';
                input.style.height = 'auto';
                suggestions.classList.remove('show');
            }
            if (e.key === 'Escape') {
                suggestions.classList.remove('show');
                input.blur();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => suggestions.classList.remove('show'), 150);
        });
    },

    insert(cmd) {
        const input = document.getElementById('commandInput');
        input.value = cmd;
        input.focus();
    },

    async process(text) {
        if (!text) return;

        if (text.startsWith('/task ')) {
            const content = text.slice(6);
            await api.call('/tasks', 'POST', { content, priority: 1 });
            await api.loadAll();
            ui.toast('Task added!');
        } else if (text.startsWith('/note ')) {
            const content = text.slice(6);
            const title = content.split('\n')[0] || 'Quick note';
            await api.call('/notes', 'POST', { title, content, tags: [] });
            await api.loadAll();
            ui.toast('Note added!');
        } else if (text.startsWith('/workspace ')) {
            const name = text.slice(11);
            await api.call('/workspaces', 'POST', { name, description: '' });
            await api.loadAll();
            ui.toast('Workspace added!');
        } else {
            // Default: create a note
            await api.call('/notes', 'POST', {
                title: text.substring(0, 50),
                content: text,
                tags: []
            });
            await api.loadAll();
            ui.toast('Note added!');
        }
    }
};

// ============================================================================
// KEYBOARD SHORTCUTS MODULE
// ============================================================================

const shortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + K to focus command bar
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('commandInput').focus();
            }

            // ESC to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            }
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });
    }
};

// ============================================================================
// MAIN APP OBJECT
// ============================================================================

const app = {
    // Expose modules
    tasks,
    notes,
    commands,
    openModal: ui.openModal,
    closeModal: ui.closeModal,

    // Initialize the app
    async init() {
        theme.init();
        await api.loadAll();
        commands.init();
        shortcuts.init();
    }
};

// ============================================================================
// START THE APP
// ============================================================================

document.addEventListener('DOMContentLoaded', () => app.init());
