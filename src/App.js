// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExercisePage from './exercise-page';
import NewRemark from './new-remark';
import NewCard from './new-card';
import SubscribePage from './new-card-2';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:eventCode/:cardCode" element={<ExercisePage />} />
        <Route path="/new-remark" element={<NewRemark />} />
        <Route path="/new-card" element={<NewCard />} />
        <Route path="/new-card-2" element={<SubscribePage />} />
      </Routes>
    </Router>
  );
}

export default App;
