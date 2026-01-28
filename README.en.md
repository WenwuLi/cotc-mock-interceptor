# cotc-mock-interceptor - Chrome Request Interception Extension

## Description

`cotc-mock-interceptor` is a powerful Chrome extension that intercepts XHR / Fetch
requests in the browser and returns configurable mock responses.

It is designed for:

- Frontend development with mocked APIs
- Reproducing production issues safely with anonymized data
- Testing edge cases and error scenarios

## Features

- Intercept browser XHR / Fetch requests
- Manage configurations for multiple projects
- URL pattern matching (supports wildcard `*`)
- JSON-based response configuration
- Project-level enable / disable switch
- Rule-level enable / disable switch
- Real-time rule synchronization, no manual refresh required
- One‑click rule duplication for similar scenarios
- Import / export project data as JSON (backup & sharing)

## Use Cases

### 1. Parallel frontend & backend development

When backend APIs are not ready yet, frontend developers can:

- Configure mock rules for the required interfaces
- Preview pages and interactions without waiting for backend progress
- Quickly switch between mock data and real APIs with a single toggle

### 2. Testing error and edge cases

Easily simulate typical error scenarios, such as:

- User not found: `{ code: 404, message: "User not found" }`
- Service timeout: `{ code: 500, message: "Service timeout" }`
- No permission: `{ code: 403, message: "Forbidden" }`

Enable or disable rules independently to switch between scenarios without
affecting other developers.

### 3. Network instability or slow APIs

When the network is unstable or some APIs are very slow:

- Intercept those slow requests
- Return local mock data instantly (millisecond‑level latency)
- Switch back to real APIs anytime by turning off the rule

### 4. Multi‑project / multi‑environment configuration

If you maintain multiple projects with different mock configurations:

- Create an independent configuration space for each project
- Enable one project while disabling others with a single click
- Export configurations and share them with your team, keeping everyone aligned

### 5. Frequently changing APIs

When backend contracts keep changing and tests become unstable:

- "Lock" API responses by using stable mock data
- Continue frontend development while backend evolves
- Switch back to real APIs only when you need to verify the latest contract

### 6. Demo and presentation environments

For important demos to stakeholders:

- Create a dedicated "Demo" project
- Pre‑configure perfect responses for all demo‑related APIs
- Ensure stable, predictable demo behavior regardless of the real backend state

### 7. Production issue reproduction without real data

When you cannot access real production data due to privacy or security:

- Ask ops to provide an anonymized / desensitized data structure
- Configure that structure as mock responses
- Open the real production page but let the extension intercept and return
  your mock data
- Reproduce and debug the issue locally without touching real data

## Tech Stack

- **Framework**: Vue 3 + TypeScript
- **UI Library**: Ant Design Vue 4.x
- **Build Tool**: Vite
- **Chrome APIs**: Manifest V3 + `declarativeNetRequest`

## Project Structure

```text
cotc-mock-interceptor/
├── manifest.json              # Chrome extension manifest
├── src/
│   ├── background/            # Background scripts (Service Worker)
│   │   └── service-worker.ts  # Core request interception logic
│   ├── options/               # Options page
│   │   ├── index.html         # Options page entry
│   │   ├── main.ts            # Options page bootstrap
│   │   └── App.vue            # Options main component
│   ├── components/            # Vue components
│   │   ├── ProjectList.vue    # Project list
│   │   ├── ProjectCard.vue    # Project card
│   │   ├── InterceptionList.vue # Interception rule list
│   │   └── OverrideModal.vue  # Rule edit modal
│   ├── stores/                # State management
│   │   └── useStorage.ts      # Chrome storage wrapper
│   ├── types/                 # TypeScript definitions
│   │   └── index.ts           # Project / rule types
│   └── utils/                 # Utility functions
│       ├── urlMatcher.ts      # URL matching utilities
│       └── storage.ts         # Storage helpers
└── vite.config.ts             # Vite config
```

## Installation & Usage

### Install from Release

If you only want to use the extension and do not need to build from source:

1. Go to the **GitHub Releases** page of this repository
2. Find the latest Release (for example `v1.0.0`)
3. Download the `cotc-mock-interceptor_*.zip` file from the **Assets** section

**Install steps:**

1. Extract the ZIP file to any local directory
2. Open Chrome and navigate to `chrome://extensions/`
3. Turn on **Developer mode** (toggle in the top‑right corner)
4. Click **Load unpacked**
5. Select the folder you just extracted
6. The extension is now installed and ready to use

> **Tip**: The extension will stay enabled after Chrome restarts; no need to
> reinstall it.

### Load built extension into Chrome (from source)

1. Build the project (see contribution section or project scripts)
2. Open Chrome and go to `chrome://extensions/`
3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Select the built `dist` directory

## Usage Guide

### Create a project

1. Open the extension Options page
2. Click **"Create Project"**
3. Enter a project name
4. The new project will appear in the project list

### Configure interception rules

1. Click a project card to enter the interception rule management page
2. Click **"Create XHR Interception"**
3. Fill in the following fields:
   - **Rule name**: A readable name for the rule
   - **Target URL pattern**: Supports wildcards, e.g. `/api/user/info`
     or `*/api/*`
   - **Response body**: JSON formatted response data
   - **Enable this rule immediately**: Whether to activate it right after
     creation

### URL pattern matching

Supported patterns:

- Exact match: `/api/user/info`
- Wildcard match: `*/api/*` (matches any URL containing `/api/`)
- Path prefix match: `/api/*` (matches any URL starting with `/api/`)

### Enable / disable

- **Project level**: Toggle the switch on the project card to control all
  rules of that project
- **Rule level**: Check / uncheck individual rules in the rule list

### Duplicate rules

1. In the interception rule list, find the rule you want to duplicate
2. Click the **"Duplicate"** button in the operation column
3. A new rule will be created with the suffix `(copy)` in its name
4. Edit the duplicated rule as needed

### Export project data

1. In the project card menu, click **"Export project"**
2. A JSON file will be downloaded automatically, with the name format
   `projectName_YYYYMMDD_HHmmss.json`
3. The file contains all project configurations and interception rules
4. You can use it for backup or import it on another device

### Import project data

1. On the Options page, click **"Import project"**
2. Choose a previously exported JSON file
3. The system will validate the file:
   - If a project with the same name exists, you will be asked whether to
     overwrite it
   - If the file format is invalid, an error message will be shown
4. On success, the project and all its rules will be added to the current
   configuration

## Notes

1. The extension uses **Manifest V3** and requires **Chrome 88+**
2. A rule will only take effect when:
   - The project is enabled, and
   - The rule itself is enabled
3. Changes to rules are synchronized to Chrome automatically, no manual
   refresh is needed
4. Data is stored in `chrome.storage.local` and only kept locally in the
   browser

## Contribution

Contributions are welcome!

1. Fork this repository
2. Create a feature branch, e.g. `feat/some-feature`
3. Commit your changes with clear messages
4. Open a Pull Request describing your changes and motivation

## License

MIT

