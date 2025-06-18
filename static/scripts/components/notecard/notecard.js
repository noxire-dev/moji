class NoteCard {
    constructor(container) {
        this.notes = [];
        this.container = container;
        this.isRendered = false;
    }

    // Your missing escapeHtml method
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Generate a proper unique ID
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Fixed addNote method
    addNote(title, content, tags = null, pinned = false) {
        const note = {
            id: this.generateId(), // Better ID generation
            title: title,
            content: content,
            preview: this.generatePreview(content), // Auto-generate preview
            tag: tags,
            pinned: pinned,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.notes.push(note);

        // Auto-render if container exists
        if (this.container && this.isRendered) {
            this.renderNote(note);
        }

        return note;
    }

    // Generate preview from content
    generatePreview(content, maxLength = 100) {
        if (!content) return '';
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;
    }

    // Render a single note (for adding new ones)
    renderNote(note) {
        const noteElement = document.createElement('div');
        noteElement.innerHTML = this.createNoteCard(note);
        noteElement.classList.add('new'); // For animation
        this.container.appendChild(noteElement.firstElementChild);
    }

    // Render all notes
    render() {
        console.log('NoteCard render called');
        console.log('Container:', this.container);
        console.log('Notes:', this.notes);

        if (!this.container) {
            console.error('No container provided for NoteCard');
            return;
        }

        try {
            const html = this.notes.map(note => this.createNoteCard(note)).join('');
            console.log('Generated HTML:', html);
            this.container.innerHTML = html;
            this.isRendered = true;
            this.attachEventListeners();
            console.log('Render completed successfully');
        } catch (error) {
            console.error('Error in render:', error);
        }
    }

    // Add event listeners for interactions
    attachEventListeners() {
        this.container.addEventListener('click', (e) => {
            const notecard = e.target.closest('.notecard');
            if (!notecard) return;

            const noteId = notecard.dataset.noteId;

            if (e.target.closest('.notecard-action.pin')) {
                this.togglePin(noteId);
            } else if (e.target.closest('.notecard-action.delete')) {
                this.deleteNote(noteId);
            } else if (e.target.closest('.notecard-menu')) {
                this.showMenu(noteId, e.target);
            } else {
                this.openNote(noteId);
            }
        });
    }

    // Toggle pin status
    togglePin(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            note.pinned = !note.pinned;
            this.render(); // Re-render to update UI
        }
    }

    // Delete note
    deleteNote(noteId) {
        this.notes = this.notes.filter(n => n.id !== noteId);
        this.render();
    }

    // Open note for editing (placeholder)
    openNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        console.log('Opening note:', note);
        // You'll implement the modal/editor here
    }

    // Show context menu (placeholder)
    showMenu(noteId, target) {
        console.log('Show menu for note:', noteId);
        // You'll implement the dropdown menu here
    }

    // Your existing createNoteCard method stays the same
    createNoteCard(note) {
        const stateClasses = [
            note.pinned ? 'pinned' : '',
            note.isRecent ? 'recent' : '',
            note.loading ? 'loading' : ''
        ].filter(Boolean).join(' ');

        return `
            <div class="notecard ${stateClasses}"
                 data-note-id="${note.id}"
                 tabindex="0">
            <div class="notecard-header">
                <h3 class="notecard-title">${this.escapeHtml(note.title)}</h3>
                <button class="notecard-menu" aria-label="Note options">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                    </svg>
                </button>
            </div>

            <div class="notecard-content">
                <div class="notecard-preview">${this.escapeHtml(note.preview)}</div>
            </div>

            <div class="notecard-footer">
                <div class="notecard-meta">
                    ${note.tag ? `<span class="notecard-tag">${this.escapeHtml(note.tag)}</span>` : ''}
                </div>
                <div class="notecard-actions">
                    <button class="notecard-action pin" aria-label="${note.pinned ? 'Unpin' : 'Pin'} note">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-.42.301-.653.301-.232 0-.458-.106-.653-.301a.926.926 0 0 1 0-1.306l3.182-3.182L1.172 8.172a.5.5 0 0 1 0-.707c.688-.688 1.673-.766 2.375-.72a5.927 5.927 0 0 1 1.013.16l3.134-3.134c-.021-.125-.039-.283-.039-.46 0-.431.108-1.023.589-1.503a.5.5 0 0 1 .353-.146z"/>
                        </svg>
                    </button>
                    <button class="notecard-action delete" aria-label="Delete note">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </div>
            </div>
        `;
    }
}

export default NoteCard;
