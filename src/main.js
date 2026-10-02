import { createApp } from "vue";
import App from "./App.vue";
import "./assets/styles.css";

const themes = ["tokyo", "nord", "black", "light"];
let savedTheme = localStorage.getItem("sticky-notes-theme");
if (savedTheme === "midnight" || savedTheme === "catppuccin") savedTheme = "tokyo";
if (themes.includes(savedTheme)) {
  document.documentElement.dataset.theme = savedTheme;
  localStorage.setItem("sticky-notes-theme", savedTheme);
}

createApp(App).mount("#app");
