# Tauri Plugin Dev Issues

A simple, drop-in development tool for Tauri + React applications that allows users and developers to quickly report issues, bugs, and feature requests directly from the app interface. 

It includes a floating button and an "Inspect Context" feature that captures element DOM information.

## Installation

### 1. Rust Backend

Add the plugin to your `src-tauri/Cargo.toml`:

```toml
[dependencies]
tauri-plugin-dev-issues = { path = "../packages/tauri-plugin-dev-issues" } # Adjust path as necessary, or use version if published to crates.io
```

Initialize the plugin in your `src-tauri/src/lib.rs` (or `main.rs`):

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dev_issues::init()) // Initialize the plugin here!
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2. React Frontend

Add the package to your frontend dependencies (e.g., `package.json`):

```json
{
  "dependencies": {
    "tauri-plugin-dev-issues": "workspace:*" // or "file:../packages/tauri-plugin-dev-issues" depending on your setup
  }
}
```

Import and render the component in your root `App.tsx`:

```tsx
import { DevIssueReporter } from "tauri-plugin-dev-issues";

function App() {
  return (
    <>
      <YourAppContent />
      {/* Add the reporter to the root of your app */}
      <DevIssueReporter />
    </>
  );
}
```

## How it works

When an issue is reported, the Rust backend traverses up from the current directory to find a root `issues/` folder (or creates one) and saves the report as a Markdown (`.md`) file, allowing AI agents or developers to easily batch-process them.

> **Note**: This plugin uses `lucide-react` for icons and relies on `tailwindcss` for styling. Ensure your project is set up with Tailwind for the UI to display correctly.
