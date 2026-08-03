# TODO: Terms & Conditions Implementation

Below is the checklist of tasks required to integrate a complete and legally protective Terms & Conditions system into the application.

## 📋 Tasks

- [ ] **Draft Terms & Conditions**
  - [ ] Research/write full terms governing the usage of the desktop application.
  - [ ] Include clear sections on user behavior, physical/medical liability, content streaming policies, and data privacy.
  - [ ] Review against standard software distribution licenses.

- [ ] **Onboarding & Acceptance Flow**
  - [ ] Design a simple onboarding/welcome screen for first-time launch.
  - [ ] Implement an explicit "I Accept the Terms and Conditions" checkbox/button flow.
  - [ ] Block the main timer UI until terms are accepted.

- [ ] **State Persistence**
  - [ ] Save the acceptance state (e.g., `has_accepted_terms: true`) in the local configuration storage.
  - [ ] Ensure the app reads this preference on launch so returning users bypass the acceptance screen.

- [ ] **Access from App UI**
  - [ ] Integrate a "View Terms & Conditions" link/tab into the **About & Legal** section of the Settings Modal.
  - [ ] Allow users to re-read the terms at any time.

- [ ] **Legal Document Storage**
  - [ ] Add the plain text terms in a new local asset (e.g., `TERMS.md` or as JSON).
  - [ ] Add an action to open the external document in a web browser using Tauri's shell/open API.
