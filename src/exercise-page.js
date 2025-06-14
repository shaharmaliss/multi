//  exercise_page.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';

const LEVEL_WITH_IMAGE_REQUIREMENT = 6;
// Airtable fetching function for events
async function fetchEvents() {
  const apiKey = 'pathzPdbSCEKZkZDi.eb39078e504fa6b1f4ecc919d7cd83c81832eb10bd5461fb55ddc544bd8db2b7'; // Replace with your Airtable API key
  const baseId = 'appNo45MQ8ifBdz6f'; // Replace with your Airtable base ID
  const tableName = 'events'; // Table name in Airtable

  
  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return data.records.map((record) => ({
    event_code: record.fields.event_code,
    card_code: record.fields.card_code,
    level: record.fields.level,
    event_counter: record.fields.event_counter !== undefined && record.fields.event_counter !== null 
    ? record.fields.event_counter 
    : 666,
    ...record.fields,
  }));
}

async function fetchCard(childCode) {
  const apiKey = 'pathzPdbSCEKZkZDi.eb39078e504fa6b1f4ecc919d7cd83c81832eb10bd5461fb55ddc544bd8db2b7'; // Replace with your Airtable API key
  const baseId = 'appNo45MQ8ifBdz6f'; // Replace with your Airtable base ID
  const tableName = 'cards';

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula={card_code}="${childCode}"`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return data.records.length > 0 ? data.records[0].fields.child_name : '';
}

function ExercisePage() {
  const { eventCode, cardCode } = useParams();
  const [results, setResults] = useState(Array(10).fill(''));
  const [event, setEvent] = useState(null);
  const [childName, setChildName] = useState('');
  const [buttonColor, setButtonColor] = useState('rgb(33, 102, 120)');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupStyle, setPopupStyle] = useState({});
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [error, setError] = useState('');
  const SUCCESS_MESSAGE = (`Hi guys, this is your result: ${event?.score ?? 'N/A'}`);
  const WAITING_MASSAGE = 'המערכת בודקת תוצאה.. בבקשה להמתין רגע'

  useEffect(() => {
    const fetchData = async () => {
      const events = await fetchEvents();
      
      // Log the fetched events and the URL parameters
      console.log('Fetched events:', events);
      console.log('URL eventCode:', eventCode);
      console.log('URL cardCode:', cardCode);

      const filteredEvent = events.find(
        (e) => String(e.event_code) === String(eventCode) && String(e.card_code) === String(cardCode)
      );

      console.log('Filtered event:', filteredEvent);

      if (filteredEvent) {
        setEvent(filteredEvent);
        const name = await fetchCard(filteredEvent.card_code);
        setChildName(name);

        // Set initial values for the inputs
        const initialResults = Array(10).fill('');
        for (let i = 0; i < 10; i++) {
          const saved = filteredEvent[`ex${i + 1}_response`];
          initialResults[i] = saved !== null && saved !== undefined ? saved.toLocaleString() : '';
        }
        setResults(initialResults);
                }
      else {
        setError('אין קובץ תרגילים כזה');
      }
    };

    fetchData();
  }, [eventCode, cardCode]);

const [uploadedFile, setUploadedFile] = useState(null);


  const handleResultChange = (index, e) => {
    let value = e.target.value.replace(/,/g, '');

    if (value && !Number.isInteger(Number(value))) {
      alert("הכנסת ערך לא נכון, רק ספרות מתקבלות");
      value = '';
    } else {
      value = value !== '' ? parseInt(value).toLocaleString() : '';
    }

    const newResults = [...results];
    newResults[index] = value;
    setResults(newResults);
  };

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return '';  
  };

const [selectedFile, setSelectedFile] = useState(null);
const [uploadedFileUrl, setUploadedFileUrl] = useState('');
const [isLoading, setIsLoading] = useState(false);

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedFile(file);
  }
};
 const [isCalculating, setIsCalculating] = useState(false);

 const checkFieldsAndSend = async () => {
  const allFieldsFilled = results.every((result) => result !== '');

  if (!allFieldsFilled) {
    alert("נא להשלים את כל התשובות לפני שליחה");
    return;
  }

  if (event?.level >= LEVEL_WITH_IMAGE_REQUIREMENT && !selectedFile) {
    alert('נא להעלות תמונה לפני שליחה');
    return;
  }

  try {
    const formData = new FormData();

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${event?.event_code || 'noevent'}_${event?.card_code || 'nocard'}.${fileExtension}`;
      formData.append('file', selectedFile, fileName);
    } else {
      const emptyContent = new Blob(['empty file'], { type: 'text/plain' });
      formData.append('file', emptyContent, 'empty.txt');
    }

    formData.append('event_code', event?.event_code || '');
    formData.append('card_code', event?.card_code || '');
    formData.append('event_counter', event?.event_counter ?? '');

    results.forEach((result, index) => {
      formData.append(`ex${index + 1}_result`, result.replace(/,/g, ''));
    });

    // Send the answers first
    const response = await fetch('https://hook.eu2.make.com/41ke6o4sksybyisgobo8k25pfw25qaoh', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to send data');
      alert('שליחה נכשלה. נסה שוב מאוחר יותר.');
      return;
    }

    // Show "Calculating your result..." popup while waiting
    setIsLoading(true)
    setPopupMessage('המערכת בודקת תוצאה.. בבקשה להמתין רגע');
setPopupStyle({
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',   // full viewport height
  width: '100vw',    // full viewport width
  display: 'flex',   // flex container
  justifyContent: 'center', // center horizontally
  alignItems: 'center',     // center vertically
  fontSize: '30px',
  color: 'green',
  fontWeight: 'bold',
  textAlign: 'center',
  zIndex: 9999,
  backgroundColor: '#e0f7fa',
  padding: '20px',
  // no borderRadius needed when full screen, but you can keep if you want
});
    setIsPopupVisible(true);

    // Wait 5 seconds before fetching updated score
    setTimeout(async () => {
      try {
        const freshEvents = await fetchEvents();
        const updatedEvent = freshEvents.find(
          (e) =>
            String(e.event_code) === String(eventCode) &&
            String(e.card_code) === String(cardCode)
        );
        if (updatedEvent) {
          setEvent(updatedEvent);
          setPopupMessage(
  <div className="flex flex-col items-center justify-center h-full">
  <p className="text-xl mb-4">
    מספר התשובות הנכונות הוא: {updatedEvent.score ?? 'N/A'}
  </p>
  <button  
  className="text-blue-500 text-xl mb-4"
  onClick={() => window.location.reload()}    
  style={{ 
    color: 'blue',
    fontSize: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  }}
>   
    כדי לראות את התרגילים והתשובות, לחץ כאן
  </button>
</div>

);

          setPopupStyle({
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',   // full viewport height
            width: '100vw',    // full viewport width
            display: 'flex',   // flex container
            justifyContent: 'center', // center horizontally
            alignItems: 'center',     // center vertically
            fontSize: '30px',
            color: 'green',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 9999,
            backgroundColor: '#e0f7fa',
            padding: '20px',
          });
          setIsCalculating(false);
        } else {
          alert('לא ניתן לעדכן את התוצאה כרגע, נסה שוב מאוחר יותר.');
        }
      } catch (fetchErr) {
        console.error('Error fetching updated event:', fetchErr);
      }
    }, 5000);

  } catch (err) {
    console.error('Error during upload or send:', err);
    alert('אירעה שגיאה בשליחה');
  }
};

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupMessage('');
    setPopupStyle({});
  };

  return (
    <div className="App">
      {event && event.event_counter >= 4 ? (
        <p className="welcome-message" dir="rtl" style={{ color: 'blue', fontWeight: 'bold' }}>
          היי {childName || ''}, <br /> 
          הסתיימו נסיונות הפתרון להיום. 
          מספר התשובות הנכונות הסופי להיום הוא:  {event?.score ?? 'N/A'} <br />
          מחר יהיו תרגילים חדשים.
        </p>
      ) : (
        <>
          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <p className="welcome-message">
  היי {childName || ''},<br />
  {event.event_counter === 0 && (
    <>
      הנה עשרת התרגילים שלך להיום. <br />
      בהצלחה!
    </>
  )}
  {event.event_counter === 1 && (
    <>
      נשארו שני נסיונות לתקן את הציון. <br />
      בהצלחה!
    </>
  )}
  {event.event_counter === 2 && (
    <>
      נשאר נסיון אחד להיום לתקן את הציון. <br />
      בהצלחה!
    </>
  )}
  {event.event_counter === 3 && (
    <>
      נגמרו הנסיונות להיום. <br />
      נפגש מחר
    </>
  )}
</p>

          )}

          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <div className="drill-grid">
    {Array.from({ length: 10 }).map((_, i) => {
  const left = event?.[`ex${i + 1}_left`];
  const right = event?.[`ex${i + 1}_right`];
  const response = event?.[`ex${i + 1}_response`];
  const answer = event?.[`ex${i + 1}_answer`];

  // Start with base class
  let inputClass = "input-field result-field";

  // Add conditional color classes
  if (response !== undefined && response !== null && response !== "") {
    inputClass += response == answer ? " result-correct" : " result-wrong";
  }

  // Determine value to show
  const inputValue = results[i];

  const displayResult = (val) =>
  val === '' || val === null || val === undefined ? '' : val;

  return (
    <div key={i} className="drill-row" dir="ltr">
      <span className="drill-number">{i + 1}.</span>
      <span className="number-field">{formatNumber(left)}</span>
      <span className="multiplication-sign">X</span>
      <span className="number-field">{formatNumber(right)}</span>
      <span className="equal-sign">=</span>
      <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={inputClass}
            value={displayResult(results[i])}
            placeholder="תוצאה"
            onChange={(e) => handleResultChange(i, e)}
          />
    </div>
  );
})}


            </div>
          )}

{event && !error && popupMessage !== SUCCESS_MESSAGE && (
  <div className="button-row">
    {event?.level >= LEVEL_WITH_IMAGE_REQUIREMENT && (
      <>
        <label htmlFor="file-upload" className="custom-upload">
          📸 טיוטה
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </>
    )}

    <button
      style={{ backgroundColor: buttonColor, color: 'white' }}
      className="send-button"
      onClick={checkFieldsAndSend}
      disabled={event?.event_counter >= 3}
    >
      לשלוח תוצאות
    </button>
  </div>
)}


{isPopupVisible && (
  <div className="popup" style={popupStyle}>
    {popupMessage}

    {popupMessage !== WAITING_MASSAGE ? (
      <button
          className="close-popup"
          onClick={closePopup}
          style={{ color: 'blue', fontSize: '20px', whiteSpace: 'nowrap' }}
        >
         
      </button>
    ) : null}
  </div>
)}


        </>
      )}
    </div>
  );
}

export default  ExercisePage;


