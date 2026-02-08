# Task Manager with Plugins

A task manager application with plugin support built in TypeScript.

## Technical Requirements

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

## Build Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Running the Application

After building, run the application:
```bash
node dist/index.js
```

## Usage examples

Listing options
```bash
>> node dist/index.js   
Available commands:
  add <title> [--detail <description>] [--due <YYYY-MM-DD>]
  export-json
  ls
  rm <id/*>
  stats
  up <id> [--title <title>] [--detail <description>] [--due <YYYY-MM-DD>] [--status <todo|in-progress|done>]
```

Adding a task
```bash
node dist/index.js add 'Initialize' --due '2026-03-01' --detail 'Some first detail of a task'

node dist/index.js add 'Develop MVP' --due '2026-04-01' --detail 'Develop Minimum Viable Product'
```

Listing the tasks

```bash
>> node dist/index.js ls
┌─────────┬──────┬───────────────┬───────────────┬────────────────────────┬──────────────────────────────────┐
│ (index) │ ID   │ Status        │ Title         │ Due                    │ Detail                           │
├─────────┼──────┼───────────────┼───────────────┼────────────────────────┼──────────────────────────────────┤
│ 0       │ '24' │ 'in-progress' │ 'Initialize'  │ '01/03/2026, 01:00:00' │ 'Some first detail of a task'    │
│ 1       │ '25' │ 'todo'        │ 'Develop MVP' │ '01/04/2026, 02:00:00' │ 'Develop Minimum Viable Product' │
└─────────┴──────┴───────────────┴───────────────┴────────────────────────┴──────────────────────────────────┘
```

Updating a task
```bash
>> node dist/index.js up 0 --due '2026-07-01' --status 'in-progress'
```

## Development

Build and run in one step:
```bash
npm run dev
```

To watch for changes and rebuild automatically:
```bash
npm run watch
```