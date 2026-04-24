import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app/App.jsx';
import { AppErrorBoundary } from './components/global/AppErrorBoundary.jsx';
import './styles/global.css';
import './styles/final-polish.css';
import './styles/premium-ui.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
