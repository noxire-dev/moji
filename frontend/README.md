# Moji Frontend

Clean, minimal, lightweight note-taking app with a pastel dark theme.

## File Structure

```
frontend/
├── index.html      # Main HTML with all styles
├── app.js          # Organized JavaScript modules
└── README.md       # This file
```

## Code Organization

The `app.js` file is organized into clear modules:

### 1. **State & Configuration**
- `CONFIG` - API endpoints and theme colors
- `state` - Application state (workspaces, tasks, notes, theme)

### 2. **API Module**
- `api.call()` - Make API requests
- `api.loadAll()` - Load all data from backend

### 3. **Tasks Module**
- `tasks.create()` - Create new task
- `tasks.toggle()` - Complete/uncomplete task
- `tasks.delete()` - Delete task

### 4. **Notes Module**
- `notes.create()` - Create new note
- `notes.update()` - Update existing note
- `notes.delete()` - Delete note
- `notes.open()` - Open note in editor

### 5. **Render Module**
- `render.all()` - Render everything
- `render.workspaces()` - Render workspace list
- `render.tasks()` - Render task list
- `render.notes()` - Render note list
- `render.escapeHtml()` - Prevent XSS attacks

### 6. **UI Module**
- `ui.openModal()` - Open modal dialogs
- `ui.closeModal()` - Close modals
- `ui.toast()` - Show toast notifications

### 7. **Theme Module**
- `theme.init()` - Initialize theme system
- `theme.set()` - Change accent color
- `theme.load()` - Load saved theme from localStorage

### 8. **Command Bar Module**
- `commands.init()` - Set up command bar
- `commands.insert()` - Insert command text
- `commands.process()` - Process /task, /note, /workspace commands

### 9. **Keyboard Shortcuts Module**
- `shortcuts.init()` - Set up keyboard shortcuts
- Cmd/Ctrl+K: Focus command bar
- ESC: Close modals

## Features

### Note Expansion ✨ NEW!
- Click any note to open it in full-screen editor
- Edit title, content, and tags
- Auto-saves changes

### Changeable Accent Colors
- 8 beautiful color themes
- Click color at bottom of sidebar
- Persists in localStorage

### Dual Input Methods
- **Command bar**: `/task`, `/note`, `/workspace` commands
- **GUI buttons**: + buttons for modal forms

### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Focus command bar
- `ESC` - Close modals
- `Enter` - Submit forms
- `Shift + Enter` - Multi-line in command bar

## Next Steps

### Immediate Priorities
1. Add search functionality
2. Make workspaces actually switch content
3. Add loading spinners
4. Better empty states

### Future Features
1. Rich text editor (Tiptap)
2. Markdown support
3. Image upload
4. Tables
5. Export to markdown
6. Offline support (PWA)

## Development

To run locally:

```bash
# Start backend
cd ../backend
python app.py

# Open frontend
open frontend/index.html
# Or serve with any static server
```

## Design Philosophy

**Minimal, Fast, No BS**
- Vanilla JavaScript (no frameworks)
- Clean, readable code
- Performance over features
- Beautiful pastel dark theme
- No AI spam, no bloat

## Performance

- **Load time**: Instant (no framework)
- **Bundle size**: ~15KB total (HTML + JS + CSS)
- **Memory**: Minimal
- **Interactions**: Buttery smooth

---

Made with ❤️ for focused productivity
