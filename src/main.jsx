// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import config from '../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import './index.css';
import './styles/animations.css';
import App from './App';

Amplify.configure(config);

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Handle HMR properly
if (import.meta.hot) {
  import.meta.hot.accept();
}