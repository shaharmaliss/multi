import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* Updated route to accept two dynamic parameters */}
        <Route path="/:eventCode/:cardCode" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
