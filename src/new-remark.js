import React, { useState } from 'react';
import './App.css';

function NewRemark() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
  if (!title.trim()) {
    alert('כדי לשלוח יש לפחות למלא את הנושא של הפנייה');
    return;
  }

  const dataToSend = { title, description };

  try {
    const response = await fetch('https://hook.eu2.make.com/synosqen70eltxaittdx928lv7k65xu4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });

    if (response.ok) {
      alert('הפנייה נשלחה בהצלחה!');
      setTitle('');
      setDescription('');
    } else {
      alert('שליחה נכשלה.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('אירעה שגיאה בעת השליחה.');
  }
};


  return (
    <div className="App">
      <p className="remark-massage">
         אשמח לקבל תובנות, רעיונות או הצעות לשיפור.<br />
          כל הערה או הארה תתקבל בברכה!
      </p>

      <input
        type="text"
        placeholder="נושא"
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="styled-input"
      />

      <textarea
        placeholder="תיאור מפורט"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        className="styled-textarea1"
      />

      <button onClick={handleSubmit} className="send-button">
        לחיצה לשליחה
      </button>
    </div>
  );
}

export default NewRemark;
