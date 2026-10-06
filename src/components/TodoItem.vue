<template>
  <div class="todo-item" :class="{ completed: todo.completed, 'on-dark': onDarkNote }">
    <button 
      class="todo-checkbox"
      :style="checkboxStyle"
      @pointerdown="onCheckPointerDown"
      @click="onCheckClick"
      :title="todo.completed ? 'Click to uncheck, hold to move' : 'Click to check, hold to move'"
    >
      <svg v-if="todo.completed" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <div class="todo-main">
      <div class="todo-title-row">
        <textarea
          ref="inputRef"
          class="todo-text"
          :value="todo.text"
          :style="{ color: accentColor }"
          placeholder="Type a task..."
          rows="1"
          @input="onInput"
          @keydown.enter.prevent="$emit('add-next')"
          @keydown.backspace="onBackspace"
        ></textarea>

        <div class="todo-actions">
          <button
            class="todo-desc-toggle"
            :class="{ open: descOpen }"
            type="button"
            :style="{ color: accentColor }"
            :title="descOpen ? 'Hide description' : 'Add description'"
            @click.stop="toggleDescription"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 3.5H12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M2 7H12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M2 10.5H8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>

          <button
            class="todo-delete"
            :style="{ color: accentColor }"
            @click="$emit('delete', todo.id)"
            title="Remove task"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <textarea
        v-show="descOpen"
        ref="descRef"
        class="todo-description"
        :value="todo.description"
        :style="{ color: accentColor }"
        placeholder="Add description..."
        rows="1"
        @input="onDescInput"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { textOn, isLightHex } from '../composables/useNotes.js';

const props = defineProps({
  todo: { type: Object, required: true },
  accentColor: { type: String, default: '#5d4037' },
  darkColor: { type: String, default: '#f9a825' },
});

const emit = defineEmits(['toggle', 'update', 'update-description', 'delete', 'add-next']);

const inputRef = ref(null);
const descRef = ref(null);
const descOpen = ref(false);

const onDarkNote = computed(() => isLightHex(props.accentColor));

const checkboxStyle = computed(() => ({
  borderColor: props.darkColor,
  backgroundColor: props.todo.completed ? props.darkColor : 'transparent',
  color: props.todo.completed ? textOn(props.darkColor) : 'transparent',
}));

function toggleDescription() {
  descOpen.value = !descOpen.value;
  if (descOpen.value) {
    nextTick(() => {
      resizeTextarea();
      descRef.value?.focus();
    });
  }
}

function resizeTextarea() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = inputRef.value.scrollHeight + 'px';
  }
  if (descRef.value) {
    descRef.value.style.height = 'auto';
    descRef.value.style.height = descRef.value.scrollHeight + 'px';
  }
}

function onInput(e) {
  emit('update', props.todo.id, e.target.value);
  resizeTextarea();
}

function onDescInput(e) {
  emit('update-description', props.todo.id, e.target.value);
  resizeTextarea();
}

function onBackspace(e) {
  if (e.target.value === '') {
    e.preventDefault();
    setTimeout(() => {
      emit('delete', props.todo.id);
    }, 0);
  }
}

onMounted(() => {
  nextTick(resizeTextarea);
});

watch(() => props.todo.text, () => {
  nextTick(resizeTextarea);
});

watch(() => props.todo.description, () => {
  nextTick(resizeTextarea);
});

watch(descOpen, (open) => {
  if (open) nextTick(resizeTextarea);
});

let checkMoved = false;

function onCheckPointerDown(event) {
  checkMoved = false;
  const startX = event.clientX;
  const startY = event.clientY;
  const onMove = (ev) => {
    if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) checkMoved = true;
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

function onCheckClick() {
  if (checkMoved) return;
  emit('toggle', props.todo.id);
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  transition: opacity 0.2s;
}

.todo-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.todo-title-row {
  position: relative;
  min-width: 0;
}

.todo-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.todo-main textarea {
  cursor: text;
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid;
  border-radius: 4px;
  background: transparent;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  margin-top: 2px;
  touch-action: none;
}

.todo-checkbox:active {
  cursor: grabbing;
}

.todo-checkbox:hover {
  transform: scale(1.15);
}

.todo-text {
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  padding: 2px 0;
  box-sizing: border-box;
  transition: padding-right 0.15s ease;
  resize: none;
  overflow: hidden;
  word-wrap: break-word;
}

.todo-item:hover .todo-text {
  padding-right: 26px;
}

.todo-item:focus-within .todo-text {
  padding-right: 26px;
}

.todo-item:hover:focus-within .todo-text {
  padding-right: 50px;
}

.todo-description {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  line-height: 1.4;
  outline: none;
  padding: 0 0 4px 0;
  resize: none;
  overflow: hidden;
  word-wrap: break-word;
  opacity: 0.65;
  margin-top: -2px;
}

.todo-item.completed .todo-text,
.todo-item.completed .todo-description {
  text-decoration: line-through;
  opacity: 0.4;
}

.todo-desc-toggle {
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, background 0.15s ease, width 0.15s ease;
  padding: 0;
  margin-top: 2px;
}

.todo-item:focus-within .todo-desc-toggle {
  width: 22px;
  min-width: 22px;
  opacity: 0.45;
  pointer-events: auto;
}

.todo-item:focus-within .todo-desc-toggle:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

.todo-item.on-dark:focus-within .todo-desc-toggle:hover {
  background: rgba(255, 255, 255, 0.12);
}

.todo-delete {
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  width: 0;
  min-width: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: all 0.15s ease;
  padding: 0;
  margin-top: 2px;
}

.todo-item:hover .todo-delete {
  width: 22px;
  min-width: 22px;
  opacity: 0.4;
  pointer-events: auto;
}

.todo-delete:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.08);
}

.todo-item.on-dark .todo-delete:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
