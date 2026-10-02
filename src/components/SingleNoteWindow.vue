<template>
  <div class="single-note-container" :class="{ 'is-dark': onDark, 'needs-edge': needsEdge }" :style="containerStyle">
    <div v-if="!note" class="loading-state" @mousedown="startDrag">
      Loading note...
    </div>
    
    <template v-else>
      <div class="note-header-drag" :style="headerBarStyle" @mousedown="startDrag">
        <div class="drag-controls" @mousedown="startDrag">
          <img class="window-logo" src="/logo.png" alt="" />
          <span class="note-date" @mousedown="startDrag">{{ formattedDate }}</span>
        </div>
        <div class="window-actions" @mousedown.stop>
          <!-- Open Dashboard -->
          <button class="action-btn" @click.stop="openMainWindow" title="Open Dashboard">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 8L8 3L13.5 8" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 6.5V13.5H12V6.5" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <!-- Color Picker -->
          <div class="color-picker-wrapper">
            <button class="action-btn" @click.stop="showColorPicker = !showColorPicker" title="Change color">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" :stroke="note.color.text" stroke-width="1.5" stroke-dasharray="2 2" />
              </svg>
            </button>
            
            <div v-if="showColorPicker" class="color-picker-dropdown" @click.stop>
              <button 
                v-for="color in NOTE_COLORS" 
                :key="color.name"
                class="color-dot"
                :style="{ backgroundColor: color.bg, borderColor: color.name === note.color.name ? color.dark : 'transparent' }"
                @click="selectColor(color)"
                :title="color.name"
              />
            </div>
          </div>
          
          <!-- Create new popout note -->
          <button class="action-btn" @click.stop="createPopoutNote" title="New Note">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          
          <button class="action-btn" @click.stop="minimizeWindow" title="Minimize">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Close window -->
          <button class="action-btn close-btn" @click.stop="closeWindow" title="Close note">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="note-content-area">
        <input
          type="text"
          class="note-title"
          v-model="noteTitle"
          @input="updateTitle"
          :style="{ color: note.color.text }"
          placeholder="Title"
        />
        <div class="tasks-pane">
          <div class="todos-header" v-if="note.todos.length > 0">
            <span class="todo-count" :style="{ backgroundColor: note.color.dark, color: textOn(note.color.dark) }">
              {{ completedCount }}/{{ note.todos.length }}
            </span>
          </div>

          <div class="todo-progress" v-if="note.todos.length > 0">
            <div 
              class="todo-progress-fill" 
              :style="{ 
                width: progressPercent + '%', 
                backgroundColor: note.color.dark 
              }"
            />
          </div>

          <TransitionGroup name="task" tag="div" class="todo-list">
            <TodoItem
              v-for="todo in doneTodos"
              :key="todo.id"
              :todo="todo"
              :accent-color="note.color.text"
              :dark-color="note.color.dark"
              @toggle="onToggleTodo"
              @update="onUpdateTodo"
              @delete="onDeleteTodo"
              @add-next="onAddTodo"
              ref="todoItemRefs"
            />
            <div
              v-if="doneTodos.length && openTodos.length"
              key="todo-divider"
              class="todo-divider"
            />
            <TodoItem
              v-for="todo in openTodos"
              :key="todo.id"
              :todo="todo"
              :accent-color="note.color.text"
              :dark-color="note.color.dark"
              @toggle="onToggleTodo"
              @update="onUpdateTodo"
              @delete="onDeleteTodo"
              @add-next="onAddTodo"
              ref="todoItemRefs"
            />
          </TransitionGroup>

          <button class="add-todo-btn" :style="{ color: note.color.dark }" @click="onAddTodo">
            + Add task
          </button>
        </div>

        <div class="optional-notes">
          <template v-if="notesOpen">
            <div class="notes-bar">
              <button class="remove-note-btn" :style="{ color: note.color.text }" @click="removeNotes" title="Remove note section">
                Remove note
              </button>
            </div>
            <textarea
              ref="notesRef"
              class="note-content"
              v-model="noteContent"
              @input="updateContent"
              :style="{ color: note.color.text }"
              placeholder="Notes (optional)"
            />
          </template>
          <button
            v-else
            class="add-note-btn"
            :style="{ color: note.color.text }"
            @click="openNotes"
          >
            Add note
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { WebviewWindow as Window, getCurrentWebviewWindow as getCurrentWindow } from '@tauri-apps/api/webviewWindow';
import TodoItem from './TodoItem.vue';
import { useNotes, textOn, isLightHex } from '../composables/useNotes.js';
import { appTheme } from '../composables/useTheme.js';

const props = defineProps({
  noteId: { type: String, required: true }
});

const { notes, createNote, updateNote, addTodo, toggleTodo, updateTodo, deleteTodo, formatDate, NOTE_COLORS, changeColor } = useNotes();
const appWindow = getCurrentWindow();
const showColorPicker = ref(false);
const notesOpen = ref(false);
const notesRef = ref(null);
const todoItemRefs = ref([]);

const note = computed(() => notes.value.find(n => n.id === props.noteId));

const noteTitle = ref('');
const noteContent = ref('');

const onDark = computed(() => note.value ? isLightHex(note.value.color.text) : false);

const needsEdge = computed(() =>
  appTheme.value === 'light' && note.value?.color?.name === 'White'
);

const headerBarStyle = computed(() => {
  if (!note.value) return {};
  return {
    backgroundColor: needsEdge.value ? '#d4d4d4' : note.value.color.header,
    color: note.value.color.text,
  };
});

// Sync local refs when note updates from other windows
watch(() => note.value, (newVal, oldVal) => {
  if (oldVal && !newVal) {
    appWindow.close();
    return;
  }
  if (!newVal) return;
  if (noteTitle.value !== (newVal.title || '')) noteTitle.value = newVal.title || '';
  if (noteContent.value !== (newVal.content || '')) noteContent.value = newVal.content || '';
}, { immediate: true, deep: true });

const containerStyle = computed(() => {
  if (!note.value) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid #ccc'
    };
  }
  return {
    backgroundColor: note.value.color.bg,
    border: `1px solid ${needsEdge.value ? '#b5b5b5' : note.value.color.header}`
  };
});

const formattedDate = computed(() => note.value ? formatDate(note.value.createdAt) : '');

const doneTodos = computed(() => (note.value?.todos || []).filter(t => t.completed));
const openTodos = computed(() => (note.value?.todos || []).filter(t => !t.completed));

const completedCount = computed(() => doneTodos.value.length);

const progressPercent = computed(() => {
  if (!note.value || !note.value.todos || note.value.todos.length === 0) return 0;
  return (completedCount.value / note.value.todos.length) * 100;
});

function updateTitle() {
  updateNote(props.noteId, { title: noteTitle.value });
}

function updateContent() {
  updateNote(props.noteId, { content: noteContent.value });
}

function openNotes() {
  notesOpen.value = true;
  nextTick(() => notesRef.value?.focus());
}

function removeNotes() {
  notesOpen.value = false;
  noteContent.value = '';
  updateNote(props.noteId, { content: '' });
}

async function minimizeWindow() {
  await appWindow.minimize();
}

function onAddTodo() {
  addTodo(props.noteId);
  nextTick(() => {
    const refs = todoItemRefs.value;
    if (refs && refs.length > 0) {
      refs[refs.length - 1]?.focus?.();
    }
  });
}
function onToggleTodo(todoId) { toggleTodo(props.noteId, todoId); }
function onUpdateTodo(todoId, text) { updateTodo(props.noteId, todoId, text); }
function onDeleteTodo(todoId) { deleteTodo(props.noteId, todoId); }

function selectColor(color) {
  changeColor(props.noteId, color);
  showColorPicker.value = false;
}

async function createPopoutNote() {
  const newNote = createNote();
  const label = `note-${newNote.id}`;
  new Window(label, {
    url: `/?noteId=${newNote.id}`,
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

async function openMainWindow() {
  try {
    const mainWindow = await Window.getByLabel('main');
    if (mainWindow) {
      await mainWindow.unminimize();
      await mainWindow.show();
      await mainWindow.setFocus();
    } else {
      // Recreate if it was somehow closed
      new Window('main', {
        url: '/',
        title: 'Sticky Notes',
        width: 1100,
        height: 750,
        minWidth: 600,
        minHeight: 400,
        transparent: false,
        decorations: true
      });
    }
  } catch (e) {
    console.error('Failed to open main window:', e);
  }
}

async function closeWindow() {
  await appWindow.close();
}

async function startDrag() {
  // Hide color picker when dragging starts
  showColorPicker.value = false;
  try {
    await appWindow.startDragging();
  } catch (e) {
    console.error('Failed to drag window:', e);
  }
}
</script>

<style scoped>
.single-note-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px; /* For rounded frameless windows */
}

.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  cursor: grab;
}

/* Make header draggable */
.note-header-drag {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  cursor: grab;
}

.note-header-drag:active {
  cursor: grabbing;
}

.drag-controls {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.window-logo {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  pointer-events: none;
}

.note-date {
  font-size: 11px;
  opacity: 0.85; /* Increased opacity for readability */
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.window-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.action-btn:hover { background: rgba(0,0,0,0.1); }
.is-dark .action-btn:hover { background: rgba(255,255,255,0.12); }
.close-btn:hover { background: rgba(220, 20, 60, 0.15); }

/* Color picker */
.color-picker-wrapper {
  position: relative;
}

.color-picker-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 94px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  animation: slideDown 0.15s ease;
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
}

.color-dot:hover {
  transform: scale(1.2);
  border-color: rgba(0, 0, 0, 0.3);
}

.note-content-area {
  flex: 1;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-title {
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  width: 100%;
  line-height: 1.3;
  padding: 0;
  flex-shrink: 0;
}

.note-title::placeholder {
  opacity: 0.35;
}

.todo-list {
  position: relative;
  display: flex;
  flex-direction: column;
}

.todo-divider {
  height: 0;
  margin: 6px 0 8px;
  border: none;
  border-top: 1px dashed rgba(0, 0, 0, 0.22);
}

.is-dark .todo-divider {
  border-top-color: rgba(255, 255, 255, 0.24);
}

.task-move,
.task-enter-active,
.task-leave-active {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease;
}

.task-enter-from,
.task-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.task-leave-active {
  position: absolute;
  left: 0;
  right: 0;
}

.tasks-pane {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.optional-notes {
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
}

.is-dark .optional-notes {
  border-top-color: rgba(255, 255, 255, 0.16);
}

.note-content {
  width: 100%;
  height: 72px;
  border: none;
  background: transparent;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  overflow-y: auto;
  font-family: 'Inter', sans-serif;
}

.note-content::placeholder {
  opacity: 0.4;
}

.add-note-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  opacity: 0.45;
  padding: 2px 0;
}

.add-note-btn:hover {
  opacity: 0.85;
}

.notes-bar {
  display: flex;
  justify-content: flex-end;
}

.remove-note-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.55;
  padding: 0 0 4px;
}

.remove-note-btn:hover {
  opacity: 1;
}

.todos-header {
  display: flex;
  align-items: center;
  font-family: 'Inter', sans-serif;
}

.todo-count {
  font-size: 10px;
  font-weight: 700;
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.4;
  font-family: 'Inter', sans-serif;
}

.todo-progress {
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.is-dark .todo-progress {
  background: rgba(255, 255, 255, 0.12);
}

.todo-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-todo-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  margin-top: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
