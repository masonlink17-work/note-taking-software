# Setup Instructions

## Initial Setup

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/ (v18 or higher recommended)
   - Verify installation: `node --version` and `npm --version`

2. **Install project dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - The terminal will show a local URL (usually `http://localhost:5173`)
   - Open this URL in your web browser

## What You Should See

- A dark 3D scene with a grid
- A blue cube, red sphere, and green cone as test objects
- Camera controls that allow you to:
  - **Rotate**: Left click + drag
  - **Pan**: Right click + drag
  - **Zoom**: Scroll wheel

## Project Structure

```
src/
├── components/
│   └── MapScene/
│       └── MapScene.tsx      # Main 3D scene component
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Root React component
├── App.css                   # App-specific styles
├── main.tsx                  # Application entry point
└── index.css                 # Global styles
```

## Development Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code for linting errors

## Next Steps

Phase 1 is complete! You're ready to move on to Phase 2: Object System.

See `TECHNICAL_ANALYSIS.md` for the full roadmap.
