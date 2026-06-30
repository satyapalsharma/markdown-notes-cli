# Markdown Notes CLI

A lightweight Node.js command-line interface for managing markdown notes.

## Overview

Create and list markdown notes directly from your terminal. Notes are stored as `.md` files in a simple directory structure for easy access and organization.

## Architecture

- **Data Access** (`src/dataAccess/`): Handles file system operations for reading and writing notes.
- **Business Logic** (`src/services/`): Core logic for note creation and listing.
- **CLI Interface** (`src/cli/`): Command definitions and user interaction layer.

## Setup

Install dependencies and build the project:

npm install
npm run build

## Usage

Create a new note:

npm start -- create "My Note Title"

List all existing notes:

npm start -- list

## Project Structure

```
src/
├── cli/            # Command definitions
├── dataAccess/     # File system operations
├── services/       # Business logic
└── index.ts        # Entry point
```

## License

MIT