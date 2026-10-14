import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite is the tool that runs the development server and builds the app.
// The react plugin lets Vite understand JSX/TSX files.
export default defineConfig({
  plugins: [react()],
  base: './',
});
