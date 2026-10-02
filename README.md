# Sticky Notes

A beautiful, feature-rich desktop sticky notes application built with [Tauri](https://tauri.app/) and [Vue 3](https://vuejs.org/).

## Features

- **Manage Notes:** Create, edit, and organize sticky notes.
- **To-Do Lists:** Add to-do items and tasks directly within your notes.
- **Color Coding & Filtering:** Assign colors to your notes and filter them instantly.
- **Pop-out Windows:** Pop out individual notes into their own dedicated, transparent desktop windows.
- **Themes:** Choose from multiple app themes including Tokyo Night, Nord, Black, and Light.
- **Search & Pin:** Quickly search through your notes and pin important ones to the top.
- **Global Shortcuts:** Use `Ctrl + N` (or `Cmd + N`) to quickly create a new note.
- **Autostart:** Configure specific notes to automatically open when you start the application.

## Tech Stack

- **Frontend:** Vue 3 (Composition API, `<script setup>`), Vite
- **Backend:** Tauri (Rust)

## Development Setup

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [Rust](https://www.rust-lang.org/)
- Tauri dependencies (see [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Running the App

1. Install dependencies:
```bash
npm install
```

2. Run the application in development mode:
```bash
npm run tauri dev
```

### Building for Production

To build the application for your operating system, run:
```bash
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
