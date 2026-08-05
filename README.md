# idea-graph

A modern visual knowledge management system with Blender-style node interactions built using React, TypeScript, and `@xyflow/react`.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation
```bash
npm install
```

### Running Locally
To start the local development server:
```bash
npm run dev
```

### Production Build
To compile the TypeScript code and bundle the application for production:
```bash
npm run build
```

---

## Git Workflow

This project utilizes the **Git Flow** branching model to manage releases and concurrent development. Git Flow provides a structured process for feature development, release preparation, and emergency hotfixes.

### Main Branches

1. **`main`**: Stores the official release history. All code merged into `main` must be production-ready, thoroughly tested, and tagged with a version number.
2. **`develop`**: The integration branch for features. This is where ongoing development resides and where all features are merged before preparing a release.

### Supporting Branches

- **`feature/*`**: Used to develop new features. They branch off `develop` and must merge back into `develop`.
- **`release/*`**: Used to prepare a new production release. They branch off `develop` and merge into both `main` (for release) and `develop` (to sync any release fixes).
- **`hotfix/*`**: Used to quickly patch production releases. They branch off `main` and must merge into both `main` and `develop`.

For more details on branch conventions, naming, and step-by-step commands, see [CONTRIBUTING.md](CONTRIBUTING.md).
