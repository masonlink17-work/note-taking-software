# 3D Note Taking Software

A 3D note-taking environment with an interactive map interface, resembling a top-down video game view (like Clash of Clans). Users can interact with elements (chests, castles, houses) to organize their notes in a visually engaging way.

## Current Status: Phase 1 - Foundation ✅

Phase 1 is complete! The project now has:
- ✅ Development environment set up (Node.js, TypeScript, Vite)
- ✅ React + React Three Fiber integration
- ✅ Basic 3D scene with top-down camera view
- ✅ Camera controls (pan, zoom, rotate)
- ✅ Grid/terrain for visual reference
- ✅ Proper project structure and folder organization

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
note-taking-software/
├── src/
│   ├── components/          # React components
│   │   └── MapScene/        # 3D map scene component
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── TECHNICAL_ANALYSIS.md    # Detailed technical analysis and roadmap
```

## Controls

- **Left Click + Drag**: Rotate camera around the scene
- **Right Click + Drag**: Pan the camera
- **Scroll Wheel**: Zoom in/out
- **Middle Click + Drag**: Pan (alternative)

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **@react-three/drei** - Useful helpers for React Three Fiber
- **Vite** - Build tool and dev server

## Next Steps

See `TECHNICAL_ANALYSIS.md` for the complete roadmap. The next phase will focus on implementing the object system (chests, castles, houses) that can be placed and interacted with on the map.

## License

MIT (or your preferred license)
