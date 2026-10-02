import { ref } from 'vue';

export const appTheme = ref(document.documentElement.dataset.theme || 'tokyo');

new MutationObserver(() => {
  appTheme.value = document.documentElement.dataset.theme || 'tokyo';
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
