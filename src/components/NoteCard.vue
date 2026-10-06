<template>
  <div 
    class="note-card"
    :style="cardStyle"
    :class="{ 'is-pinned': note.pinned, 'is-expanded': isExpanded, 'is-dark': onDark, 'needs-edge': needsEdge }"
    @click="$emit('pop-out', note.id)"
  >
    <!-- Header Bar -->
    <div class="note-header" :style="headerStyle">
      <div class="header-left">
        <span class="note-date">{{ formattedDate }}</span>
        <span v-if="note.pinned" class="pin-badge" title="Pinned">📌</span>
      </div>
      <div class="header-actions" :class="{ 'is-copied': copied }">
        <!-- Startup Toggle -->
          <button class="header-btn"
            @click.stop="$emit('toggle-startup', note.id)"
            :title="note.openOnStartup ? 'Disable Open on Startup' : 'Enable Open on Startup'"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 13V3M8 3L4 7M8 3L12 7" :stroke="note.openOnStartup ? '#10b981' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Copy Completed Tasks -->
          <span v-if="completedCount > 0" class="copy-slot">
            <button class="header-btn"
              @click.stop="copyCompletedTasks"
              :title="copied ? 'Copied' : 'Copy completed tasks'"
            >
              <svg v-if="copied" class="copied-check" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M5.5 4V3C5.5 2.44772 5.94772 2 6.5 2H13.5C14.0523 2 14.5 2.44772 14.5 3V10C14.5 10.5523 14.0523 11 13.5 11H12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <rect x="2.5" y="5" width="8" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
            <span v-if="copied" class="copied-hint">Copied</span>
          </span>

          <!-- Pop Out -->
        <button 
          class="header-btn"
          @click.stop="$emit('pop-out', note.id)"
          title="Pop out into new window"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 10L14 2M14 2H9M14 2V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M10 14H3C2.44772 14 2 13.5523 2 13V6C2 5.44772 2.44772 5 3 5H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Color picker -->
        <div class="color-picker-wrapper">
          <button 
            class="header-btn"
            @click.stop="showColorPicker = !showColorPicker"
            title="Change color"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" :fill="note.color.bg" :stroke="note.color.text" stroke-width="1.5"/>
            </svg>
          </button>
          <div v-if="showColorPicker" class="color-picker-dropdown">
            <button
              v-for="color in colors"
              :key="color.name"
              class="color-dot"
              :style="{ backgroundColor: color.bg }"
              :title="color.name"
              @click.stop="selectColor(color)"
            />
          </div>
        </div>

        <!-- Pin -->
        <button 
          class="header-btn"
          @click.stop="$emit('toggle-pin', note.id)"
          :title="note.pinned ? 'Unpin' : 'Pin to top'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path 
              d="M9.5 2L14 6.5L10.5 8.5L9 13L7.5 11.5L3.5 14L5 10L3.5 8.5L5.5 5L9.5 2Z" 
              :fill="note.pinned ? note.color.dark : 'none'" 
              :stroke="note.color.text" 
              stroke-width="1.2"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Expand/Collapse -->
        <button 
          class="header-btn"
          @click.stop="isExpanded = !isExpanded"
          :title="isExpanded ? 'Collapse' : 'Expand'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path 
              v-if="!isExpanded" 
              d="M4 6L8 10L12 6" 
              :stroke="note.color.text" 
              stroke-width="1.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
            <path 
              v-else 
              d="M4 10L8 6L12 10" 
              :stroke="note.color.text" 
              stroke-width="1.5" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Delete -->
        <button 
          class="header-btn header-btn-delete"
          @click.stop="$emit('delete', note.id)"
          title="Delete note"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" :stroke="note.color.text" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Content area -->
    <div class="note-body" :class="{ collapsed: !isExpanded }">
      <input
        type="text"
        class="note-title"
        :value="note.title"
        :style="{ color: note.color.text }"
        placeholder="Title"
        @input="$emit('update', note.id, { title: $event.target.value })"
        @click.stop
      />
      <div class="tasks-pane" @click.stop>
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

        <template v-if="note.todos.length">
          <draggable
            v-model="doneList"
            item-key="id"
            :group="{ name: 'tasks', pull: true, put: true }"
            handle=".todo-checkbox"
            :delay="140"
            :delay-on-touch-only="false"
            :force-fallback="true"
            :fallback-on-body="true"
            :animation="150"
            class="todo-list"
            :class="{ 'drop-target': doneList.length === 0 && openList.length > 0 }"
            @start="dragging = true"
            @end="onDragEnd"
          >
            <template #item="{ element: todo }">
              <TodoItem
                :todo="todo"
                :accent-color="note.color.text"
                :dark-color="note.color.dark"
                @toggle="$emit('toggle-todo', note.id, $event)"
                @update="(todoId, text) => $emit('update-todo', note.id, todoId, text)"
                @update-description="(todoId, desc) => $emit('update-todo-description', note.id, todoId, desc)"
                @delete="$emit('delete-todo', note.id, $event)"
                @add-next="$emit('add-todo', note.id)"
                ref="todoItemRefs"
              />
            </template>
          </draggable>
          <div class="todo-divider" />
          <draggable
            v-model="openList"
            item-key="id"
            :group="{ name: 'tasks', pull: true, put: true }"
            handle=".todo-checkbox"
            :delay="140"
            :delay-on-touch-only="false"
            :force-fallback="true"
            :fallback-on-body="true"
            :animation="150"
            class="todo-list"
            :class="{ 'drop-target': openList.length === 0 && doneList.length > 0 }"
            @start="dragging = true"
            @end="onDragEnd"
          >
            <template #item="{ element: todo }">
              <TodoItem
                :todo="todo"
                :accent-color="note.color.text"
                :dark-color="note.color.dark"
                @toggle="$emit('toggle-todo', note.id, $event)"
                @update="(todoId, text) => $emit('update-todo', note.id, todoId, text)"
                @update-description="(todoId, desc) => $emit('update-todo-description', note.id, todoId, desc)"
                @delete="$emit('delete-todo', note.id, $event)"
                @add-next="$emit('add-todo', note.id)"
                ref="todoItemRefs"
              />
            </template>
          </draggable>
        </template>

        <button 
          class="add-todo-btn"
          :style="{ color: note.color.dark }"
          @click.stop="onAddTodo"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Add task
        </button>
      </div>

      <div class="optional-notes" @click.stop>
        <template v-if="notesOpen">
          <div class="notes-bar">
            <button class="remove-note-btn" :style="{ color: note.color.text }" @click="removeNotes" title="Remove note section">
              Remove note
            </button>
          </div>
          <textarea
            ref="notesRef"
            class="note-content"
            :value="note.content"
            :style="{ color: note.color.text }"
            placeholder="Notes (optional)"
            @input="onContentInput"
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

    <!-- Click overlay for collapsed state -->
    <div 
      v-if="!isExpanded" 
      class="expand-overlay"
      :style="{ background: `linear-gradient(transparent, ${note.color.bg})` }"
      @click.stop="isExpanded = true"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import draggable from 'vuedraggable';
import TodoItem from './TodoItem.vue';
import { textOn, isLightHex } from '../composables/useNotes.js';
import { appTheme } from '../composables/useTheme.js';

const props = defineProps({
  note: { type: Object, required: true },
  colors: { type: Array, required: true },
  formatDate: { type: Function, required: true },
});

const emit = defineEmits([
  'update', 'delete', 'toggle-pin', 'change-color',
  'add-todo', 'toggle-todo', 'update-todo', 'update-todo-description', 'delete-todo', 'pop-out', 'toggle-startup'
]);

const isExpanded = ref(true);
const copied = ref(false);
let copiedTimer = 0;
const dragging = ref(false);
const doneList = ref([]);
const openList = ref([]);
let writingLists = false;
const showColorPicker = ref(false);
const notesOpen = ref(false);
const notesRef = ref(null);
const todoItemRefs = ref([]);

const formattedDate = computed(() => props.formatDate(props.note.createdAt));

const doneTodos = computed(() => (props.note.todos || []).filter(t => t.completed));
const openTodos = computed(() => (props.note.todos || []).filter(t => !t.completed));

watch(
  () => (props.note.todos || []).map((t) => `${t.id}:${t.completed ? 1 : 0}`).join('|'),
  () => {
    if (writingLists || dragging.value) return;
    const list = props.note.todos || [];
    doneList.value = list.filter((t) => t.completed);
    openList.value = list.filter((t) => !t.completed);
  },
  { immediate: true }
);

const completedCount = computed(() => doneTodos.value.length);

const progressPercent = computed(() => {
  if (props.note.todos.length === 0) return 0;
  return (completedCount.value / props.note.todos.length) * 100;
});

const cardStyle = computed(() => ({
  backgroundColor: props.note.color.bg,
  borderColor: props.note.color.header,
}));

const headerStyle = computed(() => ({
  backgroundColor: props.note.color.header,
  color: props.note.color.text,
}));

const onDark = computed(() => isLightHex(props.note.color.text));

const needsEdge = computed(() =>
  appTheme.value === 'light' && props.note.color?.name === 'White'
);

function selectColor(color) {
  emit('change-color', props.note.id, color);
  showColorPicker.value = false;
}

function onContentInput(e) {
  emit('update', props.note.id, { content: e.target.value });
}

function openNotes() {
  notesOpen.value = true;
  nextTick(() => notesRef.value?.focus());
}

function removeNotes() {
  notesOpen.value = false;
  emit('update', props.note.id, { content: '' });
}

async function copyCompletedTasks() {
  const completed = props.note.todos.filter(t => t.completed);
  if (completed.length === 0) return;
  const text = completed.map(t => `- ${t.text}`).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1000);
  } catch (err) {
    console.error(err);
  }
}

function onDragEnd() {
  const seen = new Set();
  const done = [];
  const open = [];
  for (const todo of doneList.value) {
    if (!todo || seen.has(todo.id)) continue;
    seen.add(todo.id);
    todo.completed = true;
    done.push(todo);
  }
  for (const todo of openList.value) {
    if (!todo || seen.has(todo.id)) continue;
    seen.add(todo.id);
    todo.completed = false;
    open.push(todo);
  }
  writingLists = true;
  props.note.todos = [...done, ...open];
  doneList.value = done;
  openList.value = open;
  dragging.value = false;
  nextTick(() => { writingLists = false; });
}

function onAddTodo() {
  emit('add-todo', props.note.id);
  nextTick(() => {
    const refs = todoItemRefs.value;
    if (refs && refs.length > 0) {
      const lastRef = refs[refs.length - 1];
      lastRef?.focus?.();
    }
  });
}
</script>

<style scoped>
.note-card {
  border-radius: var(--radius-md);
  border: 1px solid;
  overflow: hidden;
  transition: all var(--transition-smooth);
  animation: fadeInUp 0.35s ease;
  position: relative;
  break-inside: avoid;
  margin-bottom: 16px;
  cursor: pointer;
}

.note-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.note-card.is-pinned {
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.note-card.needs-edge {
  border-color: #b5b5b5 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
}

.note-card.needs-edge:hover {
  box-shadow: var(--shadow-hover);
}

.note-card.needs-edge .note-header {
  background-color: #d4d4d4 !important;
}

/* Header */
.note-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 8px;
  min-height: 36px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.note-date {
  font-size: 11px;
  font-weight: 500;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pin-badge {
  font-size: 12px;
  line-height: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.note-card:hover .header-actions,
.header-actions.is-copied {
  opacity: 1;
}

.copy-slot {
  position: relative;
}

.copied-check {
  animation: copiedPop 0.28s ease;
}

.copied-hint {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  z-index: 5;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  animation: copiedFade 1s ease forwards;
}

.header-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
  padding: 0;
}

.header-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.header-btn-delete:hover {
  background: rgba(220, 20, 60, 0.15);
}

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
  border-radius: var(--radius-sm);
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

/* Body */
.note-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 600px;
  overflow-y: auto;
  transition: max-height 0.3s ease, padding 0.3s ease;
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
}

.note-title::placeholder {
  opacity: 0.35;
}

.tasks-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-list {
  position: relative;
  display: flex;
  flex-direction: column;
}

.todo-list.drop-target {
  min-height: 32px;
}

.todo-divider {
  height: 0;
  margin: 6px 0 8px;
  border: none;
  border-top: 1px dashed rgba(0, 0, 0, 0.22);
}

.note-card.is-dark .todo-divider {
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

.note-body.collapsed {
  max-height: 80px;
  overflow: hidden;
}

.optional-notes {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
}

.note-card.is-dark .optional-notes {
  border-top-color: rgba(255, 255, 255, 0.16);
}

.note-content {
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  width: 100%;
  height: 64px;
  resize: none;
  overflow-y: auto;
}

.note-content::placeholder {
  opacity: 0.4;
}

.add-note-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 0;
  opacity: 0.45;
  text-align: left;
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
  opacity: 0.5;
  padding: 0 0 4px;
}

.remove-note-btn:hover {
  opacity: 1;
}

.todos-header {
  display: flex;
  align-items: center;
}

.todo-count {
  font-size: 10px;
  font-weight: 700;
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  line-height: 1.4;
}

.todo-progress {
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.note-card.is-dark .todo-progress {
  background: rgba(255, 255, 255, 0.12);
}

.note-card.is-dark .header-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.todo-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.add-todo-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 0;
  opacity: 0.5;
  transition: opacity 0.15s ease;
}

.add-todo-btn:hover {
  opacity: 1;
}

/* Expand overlay */
.expand-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  cursor: pointer;
}

@keyframes copiedPop {
  from { transform: scale(0.55); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes copiedFade {
  0% { opacity: 0; transform: translateX(-50%) translateY(3px); }
  18% { opacity: 1; transform: translateX(-50%) translateY(0); }
  72% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
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
