<template>
  <SingleNoteWindow v-if="isSingleNote" :noteId="singleNoteId" />
  
  <div v-else class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <img src="/logo.png" alt="" />
        </div>
        <div class="brand-text">
          <h1>Sticky Notes</h1>
          <p>{{ totalNotes }} notes</p>
        </div>
      </div>

      <!-- Search -->
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search notes..."
          class="search-input"
        />
        <button 
          v-if="searchQuery" 
          class="search-clear"
          @click="searchQuery = ''"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- New Note Button -->
      <button class="new-note-btn" @click="onCreateNote">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3V15M3 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        New Note
      </button>

      <!-- Stats -->
      <div class="sidebar-stats">
        <div class="stat-item">
          <span class="stat-value">{{ totalNotes }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ pinnedCount }}</span>
          <span class="stat-label">Pinned</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ totalTodos }}</span>
          <span class="stat-label">Tasks</span>
        </div>
      </div>

      <!-- Color filter -->
      <div class="sidebar-section">
        <h3 class="section-title">Filter by Color</h3>
        <div class="color-filters">
          <button 
            class="filter-dot filter-all"
            :class="{ active: !activeColorFilter }"
            @click="activeColorFilter = null"
            title="All colors"
          >
            All
          </button>
          <button 
            v-for="color in NOTE_COLORS"
            :key="color.name"
            class="filter-dot"
            :class="{ active: activeColorFilter === color.name }"
            :style="{ backgroundColor: color.bg }"
            :title="color.name"
            @click="activeColorFilter = activeColorFilter === color.name ? null : color.name"
          />
        </div>
      </div>

      <div class="sidebar-footer">
        <p class="theme-label">Theme</p>
        <div class="theme-picker">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-option"
            :class="{ active: appTheme === theme.id }"
            @click="setTheme(theme.id)"
          >
            {{ theme.name }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Empty state -->
      <div v-if="displayedNotes.length === 0" class="empty-state">
        <div class="empty-icon">
          <img src="/logo.png" alt="" />
        </div>
        <h2 v-if="searchQuery">No notes found</h2>
        <h2 v-else>No notes yet</h2>
        <p v-if="searchQuery">Try a different search term</p>
        <p v-else>Click "New Note" to create your first sticky note!</p>
        <button v-if="!searchQuery" class="empty-cta" @click="onCreateNote">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Create Your First Note
        </button>
      </div>

      <!-- Notes Grid (Masonry-like with CSS columns) -->
      <div v-else class="notes-grid">
        <NoteCard
          v-for="note in displayedNotes"
          :key="note.id"
          :note="note"
          :colors="NOTE_COLORS"
          :format-date="formatDate"
          @update="updateNote"
          @delete="confirmDelete"
          @toggle-pin="togglePin"
          @change-color="changeColor"
          @add-todo="addTodo"
          @toggle-todo="toggleTodo"
          @update-todo="updateTodo"
          @delete-todo="deleteTodo"
          @pop-out="popOutNote"
          @toggle-startup="toggleOpenOnStartup"
        />
      </div>
    </main>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-overlay" @click="deleteTarget = null">
        <div class="modal-content" @click.stop>
          <h3>Delete Note?</h3>
          <p>This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="modal-btn modal-btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="modal-btn modal-btn-confirm" @click="onConfirmDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { WebviewWindow as Window } from '@tauri-apps/api/webviewWindow';
import NoteCard from './components/NoteCard.vue';
import SingleNoteWindow from './components/SingleNoteWindow.vue';
import { useNotes } from './composables/useNotes.js';

// Check if we are running in single note mode
const searchParams = new URLSearchParams(window.location.search);
const singleNoteId = searchParams.get('noteId');
const isSingleNote = !!singleNoteId;

const {
  notes,
  filteredNotes,
  searchQuery,
  createNote,
  deleteNote,
  updateNote,
  togglePin,
  changeColor,
  addTodo,
  toggleTodo,
  updateTodo,
  deleteTodo,
  NOTE_COLORS,
  formatDate,
  toggleOpenOnStartup,
} = useNotes();

const activeColorFilter = ref(null);
const deleteTarget = ref(null);

const themes = [
  { id: 'tokyo', name: 'Tokyo Night' },
  { id: 'nord', name: 'Nord' },
  { id: 'black', name: 'Black' },
  { id: 'light', name: 'Light' },
];
const appTheme = ref(document.documentElement.dataset.theme || 'tokyo');

function setTheme(id) {
  appTheme.value = id;
  document.documentElement.dataset.theme = id;
  localStorage.setItem('sticky-notes-theme', id);
}

const totalNotes = computed(() => notes.value.length);
const pinnedCount = computed(() => notes.value.filter(n => n.pinned).length);
const totalTodos = computed(() => notes.value.reduce((sum, n) => sum + (n.todos || []).filter(t => !t.completed).length, 0));

const displayedNotes = computed(() => {
  let result = filteredNotes.value;
  if (activeColorFilter.value) {
    result = result.filter(n => n.color.name === activeColorFilter.value);
  }
  return result;
});

async function popOutNote(id) {
  try {
    const label = `note-${id}`;
    // Initialize new window
    const noteWindow = new Window(label, {
      url: `/?noteId=${id}`,
      title: 'Sticky Note',
      width: 320,
      height: 380,
      minWidth: 200,
      minHeight: 200,
      decorations: false,
      transparent: true,
      shadow: true
    });
    
    // Optionally remove it from the dashboard or just leave it synced
  } catch (e) {
    console.error('Failed to open window', e);
    // Focus if already open
    try {
      const existing = Window.getByLabel(`note-${id}`);
      if (existing) {
        await existing.setFocus();
      }
    } catch (err) {}
  }
}

function onCreateNote() {
  activeColorFilter.value = null;
  searchQuery.value = '';
  const note = createNote();
  popOutNote(note.id); // auto pop-out the new note
}

function confirmDelete(id) {
  deleteTarget.value = id;
}

async function onConfirmDelete() {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value;
  deleteNote(id);
  deleteTarget.value = null;
  try {
    const existing = await Window.getByLabel(`note-${id}`);
    if (existing) await existing.close();
  } catch (e) {
    console.error('Failed to close note window', e);
  }
}

// Global keyboard shortcut
function onKeyDown(e) {
  if (!isSingleNote && (e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    onCreateNote();
  }
}

onMounted(() => {
  if (!isSingleNote) {
    const startupNotes = notes.value.filter(n => n.openOnStartup);
    for (const note of startupNotes) {
      const label = `note-${note.id}`;
      Window.getByLabel(label).then(existing => {
        if (!existing) {
          new Window(label, {
            url: `/?noteId=${note.id}`,
            title: 'Sticky Note',
            width: 320,
            height: 380,
            minWidth: 200,
            minHeight: 200,
            decorations: false,
            transparent: true,
            shadow: true
          });
        }
      }).catch(() => {
        new Window(label, {
            url: `/?noteId=${note.id}`,
            title: 'Sticky Note',
            width: 320,
            height: 380,
            minWidth: 200,
            minHeight: 200,
            decorations: false,
            transparent: true,
            shadow: true
          });
      });
    }
  }
  // Sync state between windows if in single note mode or dashboard mode
  window.addEventListener('storage', (e) => {
    if (e.key === 'sticky-notes-data') {
      // Data changed in another window, useNotes composable will handle if we implement it, 
      // but actually useNotes loads it on mount. We should update the refs if we want true real-time sync.
      // But for now, since each window manages its own note, it's fine.
      try {
        const newData = JSON.parse(e.newValue);
        // Force update the notes array to stay in sync
        notes.value = newData;
      } catch (err) {}
    }
  });
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
});
</script>

<style scoped>
/* ============================
   Layout
   ============================ */
.app-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* ============================
   Sidebar
   ============================ */
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  gap: 20px;
  overflow-y: auto;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: transparent;
}

.brand-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-text h1 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.brand-text p {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 1px;
}

/* Search */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 32px 10px 34px;
  background: var(--fill-soft);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  outline: none;
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--accent);
  background: var(--fill-soft-hover);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 20px;
  height: 20px;
  border: none;
  background: var(--fill-button);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  padding: 0;
}

.search-clear:hover {
  background: var(--accent);
  color: white;
}

/* New Note Button */
.new-note-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--accent), #c0392b);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-smooth);
  box-shadow: 0 4px 15px var(--accent-glow);
}

.new-note-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--accent-glow);
}

.new-note-btn:active {
  transform: translateY(0);
}

/* Stats */
.sidebar-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 10px 4px;
  background: var(--fill-chip);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  display: block;
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

/* Sidebar sections */
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
}

.color-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: inset 0 0 0 1px var(--swatch-ring);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.filter-dot.active {
  border-color: var(--focus-ring);
  transform: scale(1.15);
  box-shadow: 0 0 10px var(--accent-glow);
}

.filter-dot:hover {
  transform: scale(1.15);
}

.filter-all {
  background: linear-gradient(135deg, #e94560, #f97316, #fbbf24, #34d399, #3b82f6, #8b5cf6);
  font-size: 0;
  color: transparent;
}

/* Theme picker */
.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-secondary);
}

.theme-picker {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.theme-option {
  border: 1px solid var(--border-subtle);
  background: var(--fill-chip);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 8px 4px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.theme-option:hover {
  color: var(--text-primary);
  background: var(--fill-button-hover);
}

.theme-option.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

/* ============================
   Main Content
   ============================ */
.main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(145deg, var(--bg-app), var(--bg-app-deep));
}

/* Notes Grid */
.notes-grid {
  column-count: 3;
  column-gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .notes-grid {
    column-count: 2;
  }
}

@media (max-width: 800px) {
  .notes-grid {
    column-count: 1;
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  gap: 16px;
}

.empty-icon {
  width: 88px;
  height: 88px;
  margin-bottom: 8px;
  background: transparent;
}

.empty-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.empty-state h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 300px;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-smooth);
}

.empty-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-glow);
}

/* ============================
   Modal
   ============================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

.modal-content {
  background: var(--bg-sidebar);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px;
  min-width: 340px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.25s ease;
}

.modal-content h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-btn-cancel {
  background: var(--fill-button);
  color: var(--text-secondary);
}

.modal-btn-cancel:hover {
  background: var(--fill-button-hover);
  color: var(--text-primary);
}

.modal-btn-confirm {
  background: #dc3545;
  color: white;
}

.modal-btn-confirm:hover {
  background: #c82333;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
