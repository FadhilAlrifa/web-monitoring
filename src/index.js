import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Memuat Tailwind CSS
import App from './App';
// Hapus import reportWebVitals; jika ada

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// Hapus baris reportWebVitals(console.log) jika ada