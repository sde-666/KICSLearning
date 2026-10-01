import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { InstituteProvider } from './context/InstituteContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InstituteProvider>
      <App />
    </InstituteProvider>
  </StrictMode>,
);

