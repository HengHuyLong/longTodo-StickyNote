import { ref, watch } from 'vue';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';


const NOTE_COLORS = [
  { name: 'Yellow', bg: '#fff9c4', header: '#fef08a', dark: '#f9a825', text: '#5d4037' },
  { name: 'Pink',   bg: '#fce4ec', header: '#f8bbd0', dark: '#e91e63', text: '#880e4f' },
  { name: 'Blue',   bg: '#e3f2fd', header: '#bbdefb', dark: '#1976d2', text: '#0d47a1' },
  { name: 'Green',  bg: '#e8f5e9', header: '#c8e6c9', dark: '#388e3c', text: '#1b5e20' },
  { name: 'Purple', bg: '#f3e5f5', header: '#e1bee7', dark: '#7b1fa2', text: '#4a148c' },
  { name: 'Orange', bg: '#fff3e0', header: '#ffe0b2', dark: '#f57c00', text: '#e65100' },
  { name: 'Gray',   bg: '#ececec', header: '#e0e0e0', dark: '#5c5c5c', text: '#1f1f1f' },
  // Windows Notepad light: white page, near-black text
  { name: 'White',  bg: '#ffffff', header: '#e8e8e8', dark: '#3a3a3a', text: '#1a1a1a' },
  // Windows Notepad dark: charcoal page, white text
  { name: 'Black',  bg: '#1e1e1e', header: '#2b2b2b', dark: '#d4d4d4', text: '#f3f3f3' },
];

export function textOn(hex) {
  const raw = String(hex || '').replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#ffffff';
  const luma = (r * 299 + g * 587 + b * 114) / 1000;
  return luma > 160 ? '#1a1a1a' : '#ffffff';
}

export function isLightHex(hex) {
  return textOn(hex) === '#1a1a1a';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function loadNotes() {
  try {
    const raw = localStorage.getItem('sticky-notes-data');
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.error('Failed to load notes:', e);
  }
  return [];
}

function saveNotes(data) {
  try {
    localStorage.setItem('sticky-notes-data', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save notes:', e);
  }
}

// Global state across components in the SAME window
const notes = ref(loadNotes());
const searchQuery = ref('');
let isSyncing = false;

window.addEventListener('storage', (e) => {
  if (e.key === 'sticky-notes-data') {
    try {
      const newData = JSON.parse(e.newValue);
      isSyncing = true; // Prevent watch from triggering save
      notes.value = newData;
      setTimeout(() => { isSyncing = false; }, 50);
    } catch (err) {}
  }
});

// Auto-save whenever notes change locally
watch(notes, (val) => {
  if (!isSyncing) {
    saveNotes(val);
  }
}, { deep: true });

export function useNotes() {
  function createNote() {
    const colorIndex = notes.value.length % NOTE_COLORS.length;
    const note = {
      id: generateId(),
      title: '',
      content: '',
      color: NOTE_COLORS[colorIndex],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      openOnStartup: false,
      todos: [],
    };
    notes.value.unshift(note);
    // Explicitly force a save immediately so new windows can see it on boot
    saveNotes(notes.value);
    return note;
  }

  function deleteNote(id) {
    const index = notes.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notes.value.splice(index, 1);
    }
  }

  function updateNote(id, updates) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      Object.assign(note, updates, { updatedAt: new Date().toISOString() });
    }
  }

  async function toggleOpenOnStartup(id) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      note.openOnStartup = !note.openOnStartup;
      note.updatedAt = new Date().toISOString();
      
      try {
        const anyStartup = notes.value.some(n => n.openOnStartup);
        const currentEnabled = await isEnabled();
        if (anyStartup && !currentEnabled) {
          await enable();
        } else if (!anyStartup && currentEnabled) {
          await disable();
        }
      } catch (e) {
        console.error('Autostart toggle failed:', e);
      }
    }
  }

  function togglePin(id) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
    }
  }

  function changeColor(id, color) {
    const note = notes.value.find(n => n.id === id);
    if (note) {
      note.color = color;
      note.updatedAt = new Date().toISOString();
    }
  }

  // Todo operations
  function addTodo(noteId, text = '') {
    const note = notes.value.find(n => n.id === noteId);
    if (note) {
      note.todos.push({
        id: generateId(),
        text: text,
        completed: false,
      });
      note.updatedAt = new Date().toISOString();
    }
  }

  function toggleTodo(noteId, todoId) {
    const note = notes.value.find(n => n.id === noteId);
    if (!note) return;
    const index = note.todos.findIndex(t => t.id === todoId);
    if (index === -1) return;
    const [todo] = note.todos.splice(index, 1);
    todo.completed = !todo.completed;
    if (todo.completed) {
      note.todos.unshift(todo);
    } else {
      const firstOpen = note.todos.findIndex(t => !t.completed);
      if (firstOpen === -1) note.todos.push(todo);
      else note.todos.splice(firstOpen, 0, todo);
    }
    note.updatedAt = new Date().toISOString();
  }

  function updateTodo(noteId, todoId, text) {
    const note = notes.value.find(n => n.id === noteId);
    if (note) {
      const todo = note.todos.find(t => t.id === todoId);
      if (todo) {
        todo.text = text;
        note.updatedAt = new Date().toISOString();
      }
    }
  }

  function deleteTodo(noteId, todoId) {
    const note = notes.value.find(n => n.id === noteId);
    if (note) {
      note.todos = note.todos.filter(t => t.id !== todoId);
      note.updatedAt = new Date().toISOString();
    }
  }

  const filteredNotes = ref([]);

  watch([notes, searchQuery], () => {
    const query = searchQuery.value.toLowerCase().trim();
    let result = [...notes.value];

    if (query) {
      result = result.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.todos.some(t => t.text.toLowerCase().includes(query))
      );
    }

    // Pinned notes first, then by date
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    filteredNotes.value = result;
  }, { deep: true, immediate: true });

  return {
    notes,
    filteredNotes,
    searchQuery,
    createNote,
    deleteNote,
    updateNote,
    togglePin,
    toggleOpenOnStartup,
    changeColor,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo,
    NOTE_COLORS,
    formatDate,
  };
}
