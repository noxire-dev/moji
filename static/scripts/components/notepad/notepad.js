/**
 * MOJI Notepad Component
 * A modular, self-contained note-taking interface
 *
 * Usage:
 * const notepad = new Notepad(container, {
 *   projectId: 'project-123',
 *   apiEndpoint: '/api/v1/notes',
 *   enableSearch: true,
 *   allowPinning: true
 * });
 */

class Notepad {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            projectId: options.projectId || null,
            apiEndpoint: options.apiEndpoint || '/api/v1/notes',
            enableSearch: options.enableSearch !== false,
            allowPinning: options.allowPinning !== false,
            maxNotes: options.maxNotes || 100,
            autoSave: options.autoSave !== false,
            placeholder: options.placeholder || "Start writing your note...",
            onNoteCreate: options.onNoteCreate || null,
            onNoteUpdate: options.onNoteUpdate || null,
            onNoteDelete: options.onNoteDelete || null,
            ...options
        };

        this.notes = [];
        this.filteredNotes = [];
        this.currentNote = null;
        this.searchQuery = '';
        this.isLoading = false;

        this.init();
    }

    /**
     * Initialize the notepad component
     */
    init() {
        this.createHTML();
        this.bindEvents();
        this.loadNotes();
    }

    /**
     * Create the complete HTML structure
     */
    createHTML() {
        this.container.innerHTML = `
            <div class="notepad-container">
                <div class="notes-section">
                    ${this.createHeaderHTML()}
                    <div class="notes-list" id="notepad-notes-list">
                        ${this.createEmptyStateHTML()}
                    </div>
                    ${this.options.enableSearch ? this.createSearchHTML() : ''}
                </div>
            </div>
            ${this.createEditorHTML()}
        `;

        this.elements = {
            container: this.container.querySelector('.notepad-container'),
            notesList: this.container.querySelector('#notepad-notes-list'),
            searchInput: this.container.querySelector('#notepad-search'),
            addButton: this.container.querySelector('#notepad-add-btn'),
            editor: this.container.querySelector('#notepad-editor'),
            editorTitle: this.container.querySelector('#notepad-editor-title'),
            editorContent: this.container.querySelector('#notepad-editor-content'),
            saveButton: this.container.querySelector('#notepad-save-btn'),
            closeButton: this.container.querySelector('#notepad-close-btn'),
            deleteButton: this.container.querySelector('#notepad-delete-btn')
        };
    }

    /**
     * Create search bar HTML
     */
    createSearchHTML() {
        return `
            <div class="notes-search">
                <input
                    type="text"
                    class="search-input"
                    id="notepad-search"
                    placeholder="Search notes..."
                    autocomplete="off"
                >
            </div>
        `;
    }

    /**
     * Create header HTML
     */
    createHeaderHTML() {
        return `
            <div class="notes-header">
                <h2>Notes</h2>
                <div class="notes-actions">
                    <button class="add-note-btn" id="notepad-add-btn" title="Add new note">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        New Note
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create empty state HTML
     */
    createEmptyStateHTML() {
        return `
            <div class="notes-empty" id="notepad-empty-state">
                <div class="notes-empty-icon">📝</div>
                <h3 class="notes-empty-title">No notes yet</h3>
                <p class="notes-empty-subtitle">Create your first note to get started</p>
                <button class="add-note-btn" onclick="this.closest('.notepad-container').notepadInstance.createNote()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create Note
                </button>
            </div>
        `;
    }

    /**
     * Create note editor modal HTML
     */
    createEditorHTML() {
        return `
            <div class="note-editor-overlay" id="notepad-editor" style="display: none;">
                <div class="note-editor-container">
                    <div class="note-editor">
                        <div class="note-editor-header">
                            <h5 class="note-editor-title" id="notepad-editor-modal-title">New Note</h5>
                            <div class="note-editor-actions">
                                ${this.options.allowPinning ? `
                                    <button class="btn btn-sm btn-outline-secondary" id="notepad-pin-btn" title="Pin note">
                                        📌
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-danger" id="notepad-delete-btn" title="Delete note" style="display: none;">
                                    🗑️
                                </button>
                                <button class="btn btn-sm btn-secondary" id="notepad-close-btn">Cancel</button>
                                <button class="btn btn-sm btn-primary" id="notepad-save-btn">Save</button>
                            </div>
                        </div>
                        <div class="note-editor-body">
                            <input
                                type="text"
                                class="note-title-input"
                                id="notepad-editor-title"
                                placeholder="Note title..."
                                maxlength="100"
                            >
                            <textarea
                                class="note-content-input"
                                id="notepad-editor-content"
                                placeholder="${this.options.placeholder}"
                                rows="12"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Store reference for callbacks
        this.container.querySelector('.notepad-container').notepadInstance = this;

        // Search functionality
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Add note button
        this.elements.addButton?.addEventListener('click', () => this.createNote());

        // Editor buttons - Use querySelector to ensure we get the elements
        const saveBtn = this.container.querySelector('#notepad-save-btn');
        const closeBtn = this.container.querySelector('#notepad-close-btn');
        const deleteBtn = this.container.querySelector('#notepad-delete-btn');

        saveBtn?.addEventListener('click', () => this.saveCurrentNote());
        closeBtn?.addEventListener('click', () => this.closeEditor());
        deleteBtn?.addEventListener('click', () => this.deleteCurrentNote());

        // Close overlay when clicking outside
        this.elements.editor?.addEventListener('click', (e) => {
            if (e.target === this.elements.editor) {
                this.closeEditor();
            }
        });

        // Auto-save on content change
        if (this.options.autoSave) {
            [this.elements.editorTitle, this.elements.editorContent].forEach(element => {
                element?.addEventListener('input', this.debounce(() => {
                    if (this.currentNote && this.currentNote.id) {
                        this.autoSaveNote();
                    }
                }, 1000));
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        if (this.container.contains(document.activeElement)) {
                            e.preventDefault();
                            this.createNote();
                        }
                        break;
                    case 's':
                        if (this.isEditorOpen()) {
                            e.preventDefault();
                            this.saveCurrentNote();
                        }
                        break;
                }
            }
            if (e.key === 'Escape' && this.isEditorOpen()) {
                e.preventDefault();
                this.closeEditor();
            }
        });
    }

    /**
     * Load notes from API or local storage
     */
    async loadNotes() {
        this.isLoading = true;
        this.showLoading();

        try {
            let notes = [];

            if (this.options.projectId && this.options.apiEndpoint) {
                const response = await fetch(`${this.options.apiEndpoint}/${this.options.projectId}`);
                if (response.ok) {
                    notes = await response.json();
                }
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem('notepad-notes');
                notes = stored ? JSON.parse(stored) : [];
            }

            this.notes = notes.map(note => ({
                id: note.id || this.generateId(),
                title: note.title || 'Untitled',
                content: note.content || '',
                createdAt: new Date(note.createdAt || Date.now()),
                updatedAt: new Date(note.updatedAt || Date.now()),
                pinned: note.pinned || false,
                tags: note.tags || []
            }));

            this.filterNotes();
            this.renderNotes();
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.showError('Failed to load notes');
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    /**
     * Render notes in the grid
     */
    renderNotes() {
        const notesList = this.elements.notesList;
        const emptyState = notesList.querySelector('#notepad-empty-state');

        if (this.filteredNotes.length === 0) {
            if (!emptyState) {
                notesList.innerHTML = this.createEmptyStateHTML();
            }
            return;
        }

        // Remove empty state
        if (emptyState) {
            emptyState.remove();
        }

        // Sort notes (pinned first, then by updated date)
        const sortedNotes = [...this.filteredNotes].sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

        notesList.innerHTML = sortedNotes.map((note, index) => this.createNoteCardHTML(note, index)).join('');

        // Bind click events to note cards
        notesList.querySelectorAll('.note-card').forEach((card, index) => {
            const note = sortedNotes[index];
            card.addEventListener('click', () => this.editNote(note));
        });
    }

    /**
     * Create HTML for a single note card
     */
    createNoteCardHTML(note, index) {
        const formattedDate = this.formatDate(note.updatedAt);
        const preview = this.truncateText(note.content, 120);

        return `
            <div class="note-card ${note.pinned ? 'pinned' : ''}" data-note-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <button class="note-menu" onclick="event.stopPropagation(); this.closest('.notepad-container').notepadInstance.showNoteMenu('${note.id}', this)" title="More options">
                        ⋯
                    </button>
                </div>
                <div class="note-content">
                    <p class="note-preview">${this.escapeHtml(preview)}</p>
                </div>
                <div class="note-footer">
                    <span class="note-date">${formattedDate}</span>
                    ${note.tags.length > 0 ? `
                        <div class="note-tags">
                            ${note.tags.slice(0, 2).map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
                            ${note.tags.length > 2 ? `<span class="note-tag">+${note.tags.length - 2}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create a new note
     */
    createNote() {
        this.currentNote = {
            id: null,
            title: '',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            pinned: false,
            tags: []
        };

        this.openEditor('New Note');
        this.elements.deleteButton.style.display = 'none';
    }

    /**
     * Edit an existing note
     */
    editNote(note) {
        this.currentNote = { ...note };
        this.openEditor('Edit Note');
        this.elements.deleteButton.style.display = 'block';

        this.elements.editorTitle.value = note.title;
        this.elements.editorContent.value = note.content;
    }

    /**
     * Open the note editor overlay
     */
    openEditor(title) {
        const overlay = this.elements.editor;
        const modalTitle = this.container.querySelector('#notepad-editor-modal-title');

        modalTitle.textContent = title;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Focus on title if it's empty, otherwise content
        setTimeout(() => {
            if (!this.elements.editorTitle.value) {
                this.elements.editorTitle.focus();
            } else {
                this.elements.editorContent.focus();
            }
        }, 100);
    }

    /**
     * Close the note editor overlay
     */
    closeEditor() {
        const overlay = this.elements.editor;
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';

        this.currentNote = null;
        this.elements.editorTitle.value = '';
        this.elements.editorContent.value = '';
    }

    /**
     * Save the current note
     */
    async saveCurrentNote() {
        if (!this.currentNote) return;

        const title = this.elements.editorTitle.value.trim() || 'Untitled';
        const content = this.elements.editorContent.value.trim();

        if (!content) {
            this.showError('Note content cannot be empty');
            return;
        }

        this.currentNote.title = title;
        this.currentNote.content = content;
        this.currentNote.updatedAt = new Date();

        try {
            if (this.currentNote.id) {
                // Update existing note
                await this.updateNote(this.currentNote);
            } else {
                // Create new note
                this.currentNote.id = this.generateId();
                this.currentNote.createdAt = new Date();
                await this.createNoteAPI(this.currentNote);
                this.notes.push(this.currentNote);
            }

            this.filterNotes();
            this.renderNotes();
            this.closeEditor();
            this.showSuccess('Note saved successfully');

            // Trigger callback
            if (this.currentNote.id && this.options.onNoteUpdate) {
                this.options.onNoteUpdate(this.currentNote);
            } else if (this.options.onNoteCreate) {
                this.options.onNoteCreate(this.currentNote);
            }

        } catch (error) {
            console.error('Failed to save note:', error);
            this.showError('Failed to save note');
        }
    }

    /**
     * Delete the current note
     */
    async deleteCurrentNote() {
        if (!this.currentNote?.id) return;

        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await this.deleteNoteAPI(this.currentNote.id);
            this.notes = this.notes.filter(note => note.id !== this.currentNote.id);

            this.filterNotes();
            this.renderNotes();
            this.closeEditor();
            this.showSuccess('Note deleted successfully');

            // Trigger callback
            if (this.options.onNoteDelete) {
                this.options.onNoteDelete(this.currentNote);
            }

        } catch (error) {
            console.error('Failed to delete note:', error);
            this.showError('Failed to delete note');
        }
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.filterNotes();
        this.renderNotes();
    }

    /**
     * Filter notes based on search query
     */
    filterNotes() {
        if (!this.searchQuery) {
            this.filteredNotes = [...this.notes];
        } else {
            this.filteredNotes = this.notes.filter(note =>
                note.title.toLowerCase().includes(this.searchQuery) ||
                note.content.toLowerCase().includes(this.searchQuery) ||
                note.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))
            );
        }
    }

    /**
     * API Methods
     */
    async createNoteAPI(note) {
        if (this.options.apiEndpoint && this.options.projectId) {
            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...note, projectId: this.options.projectId })
            });
            if (!response.ok) throw new Error('Failed to create note');
            return await response.json();
        } else {
            this.saveToLocalStorage();
        }
    }

    async updateNote(note) {
        const index = this.notes.findIndex(n => n.id === note.id);
        if (index !== -1) {
            this.notes[index] = note;

            if (this.options.apiEndpoint) {
                const response = await fetch(`${this.options.apiEndpoint}/${note.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(note)
                });
                if (!response.ok) throw new Error('Failed to update note');
            } else {
                this.saveToLocalStorage();
            }
        }
    }

    async deleteNoteAPI(noteId) {
        if (this.options.apiEndpoint) {
            const response = await fetch(`${this.options.apiEndpoint}/${noteId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete note');
        } else {
            this.saveToLocalStorage();
        }
    }

    /**
     * Utility Methods
     */
    saveToLocalStorage() {
        localStorage.setItem('notepad-notes', JSON.stringify(this.notes));
    }

    generateId() {
        return 'note-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    formatDate(date) {
        const now = new Date();
        const noteDate = new Date(date);
        const diff = now - noteDate;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        if (days < 30) return `${Math.floor(days / 7)}w ago`;
        return noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '…';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    isEditorOpen() {
        return this.elements.editor.style.display === 'flex';
    }

    showLoading() {
        // Implementation for loading state
        console.log('Loading notes...');
    }

    hideLoading() {
        // Implementation for hiding loading state
        console.log('Loading complete');
    }

    showSuccess(message) {
        console.log('Success:', message);
        // TODO: Integrate with your flash message system
    }

    showError(message) {
        console.error('Error:', message);
        // TODO: Integrate with your flash message system
    }

    /**
     * Public API Methods
     */

    // Add a note programmatically
    addNote(noteData) {
        const note = {
            id: this.generateId(),
            title: noteData.title || 'Untitled',
            content: noteData.content || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            pinned: noteData.pinned || false,
            tags: noteData.tags || []
        };

        this.notes.push(note);
        this.filterNotes();
        this.renderNotes();
        this.saveToLocalStorage();
        return note;
    }

    // Get all notes
    getNotes() {
        return [...this.notes];
    }

    // Get filtered notes
    getFilteredNotes() {
        return [...this.filteredNotes];
    }

    // Clear all notes
    clearNotes() {
        if (confirm('Are you sure you want to delete all notes?')) {
            this.notes = [];
            this.filteredNotes = [];
            this.renderNotes();
            this.saveToLocalStorage();
        }
    }

    // Destroy the component
    destroy() {
        this.container.innerHTML = '';
        this.notes = [];
        this.filteredNotes = [];
        this.currentNote = null;
    }

    /**
     * Show note menu (context menu)
     */
    showNoteMenu(noteId, button) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        // Simple context menu for now
        const actions = ['Edit', 'Pin/Unpin', 'Delete'];
        const action = prompt(`Note: ${note.title}\nActions: ${actions.join(', ')}\nEnter action:`);

        switch (action?.toLowerCase()) {
            case 'edit':
                this.editNote(note);
                break;
            case 'pin':
            case 'unpin':
            case 'pin/unpin':
                this.togglePinNote(note);
                break;
            case 'delete':
                this.deleteNoteById(noteId);
                break;
        }
    }

    /**
     * Auto-save current note
     */
    autoSaveNote() {
        if (!this.currentNote?.id) return;

        this.currentNote.title = this.elements.editorTitle.value.trim() || 'Untitled';
        this.currentNote.content = this.elements.editorContent.value.trim();
        this.currentNote.updatedAt = new Date();

        this.updateNote(this.currentNote).catch(error => {
            console.error('Auto-save failed:', error);
        });
    }

    /**
     * Toggle pin status of a note
     */
    togglePinNote(note) {
        note.pinned = !note.pinned;
        this.updateNote(note);
        this.filterNotes();
        this.renderNotes();
    }

    /**
     * Delete note by ID
     */
    async deleteNoteById(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await this.deleteNoteAPI(noteId);
            this.notes = this.notes.filter(note => note.id !== noteId);
            this.filterNotes();
            this.renderNotes();
            this.showSuccess('Note deleted successfully');
        } catch (error) {
            console.error('Failed to delete note:', error);
            this.showError('Failed to delete note');
        }
    }
}

export default Notepad;
