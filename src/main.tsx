// main.tsx is the entry point of the app.
// It finds the <div id="root"> in index.html and tells React to draw <App /> inside it.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// The "!" tells TypeScript: "I am sure this element exists" (it is in index.html).
const rootElement = document.getElementById('root')!;

ReactDOM.createRoot(rootElement).render(
  // StrictMode shows extra warnings during development. It does nothing in production.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
