import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { GitaDataProvider } from './context/GitaDataContext';
import { GospelDataProvider } from './context/GospelDataContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GitaDataProvider>
        <GospelDataProvider>
          <App />
        </GospelDataProvider>
      </GitaDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
