import React from 'react';
import ReactDOM from 'react-dom/client';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { App } from './app/App';
import { CompanionMenuWindow } from './components/CompanionMenuWindow';
import './styles/index.css';
import { reportStage, reportError } from './desktop/diagnostics';

// Surface any unhandled exceptions to the native terminal immediately
window.addEventListener('error', (event) => {
  reportError(
    'unhandled_window_error',
    `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`
  );
});

window.addEventListener('unhandledrejection', (event) => {
  reportError('unhandled_promise_rejection', event.reason);
});

const currentWindowLabel = getCurrentWindow().label;
reportStage('react_bootstrap_start', `window: ${currentWindowLabel}`);

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {currentWindowLabel === 'companion-menu' ? <CompanionMenuWindow /> : <App />}
    </React.StrictMode>
  );
  reportStage('react_bootstrap_rendered', `window: ${currentWindowLabel}`);
} else {
  const err = 'Fatal: #root element not found in DOM.';
  console.error(err);
  reportError('react_bootstrap_failed', err);
}
