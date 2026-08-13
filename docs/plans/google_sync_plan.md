---
status: proposed
created: 2026-08-14
updated: 2026-08-14
type: feat
depth: deep
owner: Antigravity
labels: [backend, sync, tauri, plaintext]
---
### title: "feat: google-account-sync-v1.1"

## Google Account Data Sync (v1.1 - Plaintext Snapshot)

### Summary

Build a lightweight, secure cloud backup and synchronization feature using Google Accounts that allows users to back up and restore their Kodon data across multiple devices. The system will authenticate using OAuth 2.0 with PKCE through the system browser, store OAuth credentials in the OS keychain, and synchronize application snapshots through Google Drive's hidden `appDataFolder`.

This version prioritizes true disaster recovery (frictionless restoration on a new device) and system performance over real-time synchronization. It implements snapshot synchronization with version metadata and safe conflict detection, while leaving room for future row-level merge synchronization.

### Problem Frame

**Current state**

* All workout presets, stretches, flashcards, settings, and reflection history are stored locally in SQLite and configuration files.
* There is no cloud backup, account sync, or disaster recovery.

**User pain**

* Progress cannot be shared across multiple computers.
* Reinstalling the app or losing a device permanently destroys user-created content.
* Users cannot safely migrate to a new computer.

**Why now**

* As Kodon accumulates user-generated content, the value of local data increases substantially. Cloud backup becomes a baseline retention and trust feature.

### Goals

* Authenticate with a Google Account using the system browser.
* Synchronize Kodon data seamlessly through Google Drive `appDataFolder`.
* Provide bulletproof disaster recovery (plug-and-play on a new device with just a Google login).
* Minimize background system utilization and Google API quota consumption.
* Never block the UI during authentication or synchronization.
* Detect conflicts safely and avoid silent data loss.

### Non-goals

* End-to-end (E2E) local encryption.
* Real-time collaboration or background delta-syncs.
* Multi-provider sync (Dropbox, OneDrive, iCloud) in this phase.
* Synchronizing large media assets.
* Cross-account shared workspaces.

---

### Requirements

* **R1.** Use OAuth 2.0 Authorization Code Flow with PKCE.
* **R2.** Open the system browser for authentication.
* **R3.** Spawn a temporary local loopback server on a dynamic localhost port.
* **R4.** Store the OAuth refresh token securely in the OS keychain.
* **R5.** Store synchronization data in Google Drive `appDataFolder`.
* **R6.** Package and upload standard ZIP payloads (SQLite snapshot + metadata).
* **R7.** Use version metadata and device IDs for synchronization decisions.
* **R8.** Maintain the last 3 backup generations for recovery.
* **R9.** Auto-sync only at:
* Application launch.
* Best-effort during application shutdown.


* **R10.** Provide manual "Sync Now", account status, and logout controls.

---

### Key Technical Decisions

**1. Drop Local Encryption for v1**
Because the data primarily consists of workout presets and flashcards, E2E encryption adds developer complexity and severe UX friction (managing recovery keys) without substantial benefit. Relying on standard ZIP files ensures that if a user loses their laptop, they only need their Google password to get 100% of their data back. We rely on Google's native server-side security for data protection.

**2. Google Drive App Data Folder**
Use `appDataFolder` as the remote storage target.

* **Hidden from normal Drive UI:** Prevents accidental user deletion.
* **Isolated:** Kept separate from the user's personal files.
* **No backend infrastructure:** Aligns with a local-first architecture.

**3. Minimal Sync Frequency**
Uploading full SQLite snapshots on a timer or debounce is incredibly resource-heavy and will exhaust Google Drive API quotas. Synchronization is restricted to startup, shutdown, and explicit manual triggers to drastically reduce API usage and cross-device collision states.

**4. Snapshot-Based Synchronization**
Rather than uploading the live SQLite database, create a consistent SQLite snapshot using SQLite's backup API, package it with configuration files and metadata, and upload it as a single ZIP payload. This is a snapshot synchronization system, not a row-level collaborative sync engine.

---

### Synchronization Model

**Snapshot Package (`backup.zip`)**

```text
backup.zip
├── metadata.json
├── database.sqlite
└── settings.json

```

**Metadata (`metadata.json`)**

```json
{
  "version": 1,
  "device_id": "uuid",
  "schema_version": 3,
  "updated_at": "2026-08-14T12:30:00Z",
  "payload_hash": "sha256...",
  "sync_version": 42
}

```

**Local Sync State**
Persist:

* last successful sync time
* last remote sync version
* last uploaded payload hash
* current device ID
* dirty/pending state

**Synchronization State Machine**

| State | Action |
| --- | --- |
| **Remote newer** | Download snapshot, extract, verify, and replace local DB. |
| **Local newer** | Zip current local state and upload to Drive. |
| **Identical hash** | No-op. |
| **Diverged histories** | Surface conflict to user and preserve both copies. |

Conflicts should never silently overwrite data. If both local and remote snapshots changed since the last synchronized version, the user is prompted to choose:

1. **Keep Local** (Overwrites Cloud)
2. **Keep Cloud** (Overwrites Local)

**Backup Integrity**

* **SQLite Snapshot:** Never zip the live SQLite file directly. Use the SQLite backup API to create a consistent snapshot before packaging.
* **Atomic Restore:** Restore using: download -> verify hash -> extract to temporary files -> replace originals atomically -> reload database.
* **Backup Generations:** Maintain the `latest`, `previous`, and `previous-2`. Older generations are deleted after successful uploads.

---

### Component Architecture

```text
src-tauri/src/
├── core/
│   └── sync/
│       ├── mod.rs
│       ├── oauth.rs
│       ├── drive.rs
│       ├── snapshot.rs
│       └── metadata.rs
├── commands/
│   └── sync_cmds.rs

src/
└── components/
    └── settings/
        ├── SettingsModal.jsx
        └── SyncTab.jsx

```

---

### Implementation Units

**U1. OAuth + PKCE**

* **Goal:** Authenticate user securely using system browser.
* **Files:** `Cargo.toml`, `sync/oauth.rs`, `commands/sync_cmds.rs`
* **Dependencies:** `reqwest`, `tokio`, `url`, `keyring`, `sha2`, `base64`

**U2. Snapshot Manager**

* **Goal:** Create and restore consistent application snapshots.
* **Files:** `sync/snapshot.rs`
* **Responsibilities:**
* SQLite backup API calls.
* Temporary directory management.
* ZIP packaging and extraction.
* SHA256 hash generation for payloads.



**U3. Google Drive Integration**

* **Goal:** Upload, download, and manage backup generations.
* **Files:** `sync/drive.rs`, `sync/metadata.rs`
* **Responsibilities:**
* `appDataFolder` metadata retrieval.
* Generation rotation (enforcing the 3-file limit).
* Multipart upload/download.



**U4. Sync Coordinator**

* **Goal:** Orchestrate synchronization decisions safely.
* **Files:** `sync/mod.rs`
* **Responsibilities:**
* Run the state machine.
* Detect conflicts.
* Hook into Tauri app lifecycle (Startup / Shutdown triggers).



**U5. Frontend Integration**

* **Goal:** Expose synchronization controls.
* **Files:** `SyncTab.jsx`, `SettingsModal.jsx`
* **Display:**
* Connected Google Account email.
* Last sync time & status (Idle, Syncing, Error).
* Manual "Sync Now" button.
* Logout button.
* Conflict resolution modal (Keep Local vs. Keep Cloud).



---

### Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| **Dynamic Port OAuth Failures** | Ensure Google Cloud Console OAuth Client is explicitly configured as a **"Desktop app"**, not a "Web application". Web applications strictly enforce URI matching, which breaks `localhost:0`. |
| **OAuth credential exposure** | Use PKCE. Store the refresh token strictly in the OS keychain via the `keyring` crate. |
| **Database corruption during upload** | Use the SQLite backup API to create a static copy first; never touch the live journal/DB file. |
| **Partial restore failures** | Download to a temporary folder, verify the payload hash, and replace originals atomically before triggering a frontend reload. |
| **Network interruption** | Upload to a temporary generation ID before promoting it to "latest". |

---

