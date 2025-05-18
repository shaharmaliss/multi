// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExercisePage from './exercise-page';
import NewRemark from './new-remark';
import NewCard from './new-card';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:eventCode/:cardCode" element={<ExercisePage />} />
        <Route path="/new-remark" element={<NewRemark />} />
        <Route path="/new-card" element={<NewCard />} />
      </Routes>
    </Router>
  );
}

export default App;
