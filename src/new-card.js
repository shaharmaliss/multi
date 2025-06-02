// NewCard.js
import React, { useState } from 'react';
import './App.css';

function NewCard() {
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentMobile: '',
    childName: '',
    childMobile: '',
    level: '',
    drillHour: '',
    reminderHour: '',
  });

  const levels = ['\u200E6 X 1', '\u200E4 X 3', '\u200E6 X 5', '\u200E9 X 7', '\u200E32 X 3', '\u200E87 X 9', 
                  '\u200E48 X 19', '\u200E153 X 29','\u200E2,599 X 45', '\u200E39,550 X 322',];
  const drillHours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const reminderHours = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'parentMobile' || name === 'childMobile') {
      // Only allow digits and auto-insert dash after third digit
      let digits = value.replace(/\D/g, '');
      if (digits.length > 10) digits = digits.slice(0, 10);
      const formatted = digits.length > 3
        ? `${digits.slice(0, 3)}-${digits.slice(3)}`
        : digits;
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch('https://hook.eu2.make.com/5c1cuko11qpn6bezr2nobqb63hxb89lu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('תודה שנרשמתם');
      // Optional: reset form
      setFormData({
        parentName: '',
        parentEmail: '',
        parentMobile: '',
        childName: '',
        childMobile: '',
        level: '',
        drillHour: '',
        reminderHour: '',
      });
    } else {
      alert('אירעה שגיאה בשליחה. נסה שוב מאוחר יותר.');
    }
  } catch (error) {
    console.error('Error sending data:', error);
    alert('שגיאה בשליחת הנתונים. בדוק את החיבור לאינטרנט ונסה שוב.');
  }
};


  return (
    <div className="App">
      <p className="remark-massage" style={{ fontSize: '16px' }}>
        כדי להירשם ולקבל החל ממחר סט תרגילים יומי, <br />
        יש למלא את כל הפרטים הבאים. <br />
        <br />
        אם נתקלתם בבעיה או לא התקבלה הודעת וואטסאפ, <br />
        ניתן ליצור איתנו קשר בקישור הבא:<br />
      <a
        href="https://main.d68e8t2303m09.amplifyapp.com/new-remark"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#007bff', textDecoration: 'underline' ,fontSize: '16px' }}
      >
        לחצו כאן 
      </a>
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <input
          type="text"
          name="parentName"
          placeholder="שם של הורה"
          className="styled-input"
          value={formData.parentName}
          onChange={handleChange}
          required
        />

         <input
            type="email"
            name="parentEmail"
            placeholder="אימייל של הורה"
            className="styled-input"
            value={formData.parentEmail}
            onChange={handleChange}
            required
            onInvalid={(e) => {
              e.target.setCustomValidity("יש להזין כתובת אימייל תקינה");
            }}
            onInput={(e) => {
              e.target.setCustomValidity("");
            }}
          />

          <input
            type="tel"
            name="parentMobile"
            dir="rtl"
            placeholder="מס נייד של הורה"
            className="styled-input"
            value={formData.parentMobile}
            onChange={handleChange}
            pattern="\d{3}-\d{7}"
            title="הפורמט חייב להיות XXX-XXXXXXX"
            required
          />

        <input
          type="text"
          name="childName"
          placeholder="שם של הילד"
          className="styled-input"
          value={formData.childName}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="childMobile"
          dir="rtl"
          placeholder="מס נייד של הילד"
          className="styled-input"
          value={formData.childMobile}
          onChange={handleChange}
          pattern="\d{3}-\d{7}"
          title="הפורמט חייב להיות XXX-XXXXXXX"
          required
        />

        <select
          name="level"
          className="styled-input"
          value={formData.level}
          onChange={handleChange}
          required
        >
          <option value="">בחירת רמת תרגילים להתחלה</option>
          {levels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>

        <select
          name="drillHour"
          className="styled-input"
          value={formData.drillHour}
          onChange={handleChange}
          required
        >
          <option value="" >שעה לקבלת התרגילים</option>
          {drillHours.map((hour) => (
  <option key={hour} value={hour} style={{ fontSize: '10px' }}>{hour}</option>
))}
        </select>

        <select
          name="reminderHour"
          className="styled-input"
          value={formData.reminderHour}
          onChange={handleChange}
          required
        >
          <option value="">שעה לקבלת תזכורת שלא הוגשו תרגילים</option>
          {reminderHours.map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>

        <button type="submit" className="send-button" style={{ marginTop: '5px' , fontSize: '12px'}}>
          הירשם לשירות
        </button>
      </form>
    </div>
  );
}

export default NewCard;
