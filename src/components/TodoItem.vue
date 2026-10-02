<template>
  <div class="todo-item" :class="{ completed: todo.completed, 'on-dark': onDarkNote }">
    <button 
      class="todo-checkbox"
      :style="checkboxStyle"
      @click="$emit('toggle', todo.id)"
      :title="todo.completed ? 'Mark incomplete' : 'Mark complete'"
    >
      <svg v-if="todo.completed" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <input
      ref="inputRef"
      type="text"
      class="todo-text"
      :value="todo.text"
      :style="{ color: accentColor }"
      placeholder="Type a task..."
      @input="$emit('update', todo.id, $event.target.value)"
      @keydown.enter="$emit('add-next')"
      @keydown.backspace="onBackspace"
    />
    
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
</template>

<script setup>
import { ref, computed } from 'vue';
import { textOn, isLightHex } from '../composables/useNotes.js';

const props = defineProps({
  todo: { type: Object, required: true },
  accentColor: { type: String, default: '#5d4037' },
  darkColor: { type: String, default: '#f9a825' },
});

defineEmits(['toggle', 'update', 'delete', 'add-next']);

const inputRef = ref(null);

const onDarkNote = computed(() => isLightHex(props.accentColor));

const checkboxStyle = computed(() => ({
  borderColor: props.darkColor,
  backgroundColor: props.todo.completed ? props.darkColor : 'transparent',
  color: props.todo.completed ? textOn(props.darkColor) : 'transparent',
}));

function onBackspace(e) {
  if (e.target.value === '') {
    e.preventDefault();
    // Emit delete when backspacing on empty todo
    // Small delay to avoid double-trigger
    setTimeout(() => {
      // parent handles deletion
    }, 0);
  }
}

function focus() {
  inputRef.value?.focus();
}

defineExpose({ focus });
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.todo-checkbox:hover {
  transform: scale(1.15);
}

.todo-text {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  padding: 2px 0;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.5;
}

.todo-delete {
  width: 22px;
  height: 22px;
  min-width: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s ease;
  padding: 0;
}

.todo-item:hover .todo-delete {
  opacity: 0.4;
}

.todo-delete:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.08);
}

.todo-item.on-dark .todo-delete:hover {
  background: rgba(255, 255, 255, 0.12);
}

</style>
