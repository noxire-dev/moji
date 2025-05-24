class Notepad{
    constructor(container){
        this.container = container;
        this.notes = [];
        this.isRendered = false;
    }

    // Render the notepad interface directly in the container
    render(){
        if (!this.container) {
            console.error('No container provided for notepad');
            return;
        }

        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="notepad-container">
                <div class="notes-header">
                    <h2>📝 My Notes</h2>
                    <div class="notes-actions">
                        <button class="add-note-btn">
                            <span>+</span> New Note
                        </button>
                    </div>
                </div>
                <div class="notes-list"></div>
                <div class="notes-search">
                    <input type="text" class="search-input" placeholder="Search your notes...">
                </div>
            </div>
        `;

        this.isRendered = true;
        this.setupEventListeners();
        this.renderNoteCards();
    }

    // Initialize with sample data and render
    init(){
        // Add some sample notes if none exist
        if (this.notes.length === 0) {
            this.notes = [
                {
                    id: 1,
                    title: "Welcome to Moji Notepad",
                    content: "This is a sample note to demonstrate the sleek notepad component. You can create, edit, and organize your thoughts here with a beautiful, modern interface.",
                    tags: ["welcome", "demo"],
                    date: new Date().toISOString(),
                    pinned: true
                },
                {
                    id: 2,
                    title: "Component Testing",
                    content: "This notepad component features glassmorphism design, smooth animations, and responsive layout. Perfect for internal testing and development.",
                    tags: ["testing", "development"],
                    date: new Date(Date.now() - 86400000).toISOString(),
                    pinned: false
                },
                {
                    id: 3,
                    title: "Design System",
                    content: "The component follows moji's design principles with consistent colors, typography, and spacing.",
                    tags: ["design", "ui"],
                    date: new Date(Date.now() - 172800000).toISOString(),
                    pinned: false
                }
            ];
        }

        this.render();
    }

    addNote(title, content, tags, pinned){
        const note = {
            id: this.notes.length + 1,
            title: title,
            content: content,
            tags: tags,
            pinned: pinned,
        }
        this.notes.push(note);
        this.renderNoteCards();
    }

    htmlNoteCard(note){
        const preview = note.content ? note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '') : 'No content yet...';

        return `
            <div class="note-header">
                <h3 class="note-title">${note.title || 'Untitled Note'}</h3>
                <button class="note-menu">⋯</button>
            </div>
            <div class="note-content">
                <p class="note-preview">${preview}</p>
            </div>
            <div class="note-footer">
                <div class="note-tags">
                    ${note.tags ? note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
        `;
    }

    renderNoteCards(){
        if (!this.isRendered) return;

        const notesList = this.container.querySelector('.notes-list');
        if (!notesList) {
            console.warn('Notes list container not found');
            return;
        }

        notesList.innerHTML = '';

        if (this.notes.length === 0) {
            notesList.innerHTML = `
                <div class="notes-empty">
                    <div class="notes-empty-icon">📝</div>
                    <h3 class="notes-empty-title">No notes yet</h3>
                    <p class="notes-empty-subtitle">Click "New Note" to get started</p>
                </div>
            `;
            return;
        }

        for(const note of this.notes){
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            noteCard.setAttribute('data-id', note.id);
            noteCard.innerHTML = this.htmlNoteCard(note);

            // Add click event to note card
            noteCard.addEventListener('click', () => this.openNoteEditor(note));

            notesList.appendChild(noteCard);
        }
    }

    setupEventListeners(){
        if (!this.isRendered) return;

        const addNoteBtn = this.container.querySelector('.add-note-btn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => this.createNote());
        }

        // Setup search functionality
        const searchInput = this.container.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        }
    }

    createNote(title = 'New Note', content = 'Start writing...', tags = [], pinned = false){
        const note = {
            id: Date.now(),
            title: title,
            content: content,
            tags: tags,
            pinned: pinned,
            date: new Date().toISOString()
        }
        this.notes.push(note);
        this.renderNoteCards();

        // Auto-open editor for new notes
        this.openNoteEditor(note);
    }

    searchNotes(query) {
        const noteCards = this.container.querySelectorAll('.note-card');

        noteCards.forEach(card => {
            const title = card.querySelector('.note-title').textContent.toLowerCase();
            const content = card.querySelector('.note-preview').textContent.toLowerCase();
            const searchQuery = query.toLowerCase();

            if (title.includes(searchQuery) || content.includes(searchQuery) || !query) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    openNoteEditor(note) {
        const editor = document.createElement('div');
        editor.classList.add('note-editor-overlay');
        editor.innerHTML = `
            <div class="note-editor-container">
                <div class="note-editor">
                    <div class="note-editor-header">
                        <button class="note-editor-close">×</button>
                    </div>
                    <div class="note-editor-body">
                        <input
                            type="text"
                            class="note-title-input"
                            placeholder="Note title"
                            value="${note.title || ''}"
                        >
                        <textarea
                            class="note-content-input"
                            placeholder="Start writing..."
                        >${note.content || ''}</textarea>

                        <div class="note-bottom-actions">
                            <input
                                type="text"
                                class="note-tags-input"
                                placeholder="Add tags (comma separated)"
                                value="${note.tags ? note.tags.join(', ') : ''}"
                            >
                            <div class="note-actions">
                                <button class="note-delete-btn" data-note-id="${note.id}">
                                    Delete
                                </button>
                                <button class="note-save-btn" data-note-id="${note.id}">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = editor.querySelector('.note-editor-close');
        const saveBtn = editor.querySelector('.note-save-btn');
        const deleteBtn = editor.querySelector('.note-delete-btn');

        closeBtn.addEventListener('click', () => this.closeNoteEditor(editor));
        saveBtn.addEventListener('click', () => this.saveNote(editor, note));
        deleteBtn.addEventListener('click', () => this.deleteNote(editor, note));

        // Close on overlay click
        editor.addEventListener('click', (e) => {
            if (e.target === editor) {
                this.closeNoteEditor(editor);
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeNoteEditor(editor);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Auto-save on Ctrl+S
        const saveHandler = (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveNote(editor, note);
            }
        };
        document.addEventListener('keydown', saveHandler);

        // Store handlers for cleanup
        editor._escapeHandler = escapeHandler;
        editor._saveHandler = saveHandler;

        // Append to body and show
        document.body.appendChild(editor);

        // Focus on title input
        setTimeout(() => {
            const titleInput = editor.querySelector('.note-title-input');
            titleInput.focus();
        }, 100);

        return editor;
    }

    saveNote(editor, note) {
        const titleInput = editor.querySelector('.note-title-input');
        const contentInput = editor.querySelector('.note-content-input');
        const tagsInput = editor.querySelector('.note-tags-input');

        // Update note data
        note.title = titleInput.value.trim() || 'Untitled Note';
        note.content = contentInput.value.trim();
        note.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
        note.lastModified = new Date().toISOString();

        // Re-render notes to show changes
        this.renderNoteCards();

        // Show save feedback
        const saveBtn = editor.querySelector('.note-save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved ✓';
        saveBtn.style.background = '#34d399';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
        }, 1500);

        console.log('Note saved:', note);
    }

    deleteNote(editor, note) {
        if (confirm(`Are you sure you want to delete "${note.title}"?`)) {
            // Remove note from array
            this.notes = this.notes.filter(n => n.id !== note.id);

            // Re-render notes
            this.renderNoteCards();

            // Close editor
            this.closeNoteEditor(editor);

            console.log('Note deleted:', note.title);
        }
    }

    closeNoteEditor(editor) {
        editor.classList.add('closing');

        // Clean up event listeners
        if (editor._escapeHandler) {
            document.removeEventListener('keydown', editor._escapeHandler);
        }
        if (editor._saveHandler) {
            document.removeEventListener('keydown', editor._saveHandler);
        }

        setTimeout(() => {
            if (editor.parentNode) {
                editor.parentNode.removeChild(editor);
            }
        }, 300);
    }

    // Keep modal functionality separate for future use
    openAsModal(){
        const modal = document.createElement('div');
        modal.classList.add('notepad-modal-overlay');
        modal.innerHTML = `
            <div class="notepad-modal-container">
                <div class="notepad-modal-header">
                    <h2 class="notepad-modal-title">📝 My Notes</h2>
                    <button class="notepad-modal-close">×</button>
                </div>
                <div class="notepad-modal-body">
                    <div class="notes-header">
                        <div class="notes-actions">
                            <button class="add-note-btn">
                                <span>+</span> New Note
                            </button>
                        </div>
                    </div>
                    <div class="notes-list"></div>
                    <div class="notes-search">
                        <input type="text" class="search-input" placeholder="Search your notes...">
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.notepad-modal-close');
        closeBtn.addEventListener('click', () => this.closeModal(modal));

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Append to body and show
        document.body.appendChild(modal);

        // Temporarily update container for modal
        const originalContainer = this.container;
        const originalRendered = this.isRendered;
        this.container = modal;
        this.isRendered = true;
        this.setupEventListeners();
        this.renderNoteCards();

        // Store original container to restore later
        modal._originalContainer = originalContainer;
        modal._originalRendered = originalRendered;

        return modal;
    }

    closeModal(modal) {
        modal.classList.add('closing');

        // Restore original container
        if (modal._originalContainer) {
            this.container = modal._originalContainer;
            this.isRendered = modal._originalRendered;
        }

        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}
export default Notepad;
