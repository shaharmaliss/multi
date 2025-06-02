import React, { useState } from 'react';
import './App.css';

function NewRemark() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false); // new state

  const handleSubmit = async () => {
    if (!senderName.trim() || !title.trim()) {
      alert('חובה למלא את שם הפונה ואת הנושא כדי לשלוח פנייה');
      return;
    }

    const dataToSend = { senderName, title, description };

    try {
      const response = await fetch('https://hook.eu2.make.com/synosqen70eltxaittdx928lv7k65xu4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setIsSubmitted(true); // mark as submitted
        setSenderName('');
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
      {isSubmitted ? (
        <p className="success-message">הפנייה נשלחה בהצלחה!<br />
                                        נטפל בפנייה בהקדם האפשרי.</p>
      ) : (
        <>
          <p className="remark-massage">
            אשמח לקבל תובנות, רעיונות או הצעות לשיפור.<br />
            כל הערה או הארה תתקבל בברכה!
            <br /><br />
          </p>

          <input
            type="text"
            placeholder="שם הפונה"
            maxLength={100}
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="styled-input"
          />

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
        </>
      )}
    </div>
  );
}

export default NewRemark;
