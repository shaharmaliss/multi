//  exercise_page.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';

const LEVEL_WITH_IMAGE_REQUIREMENT = 7;
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
  const SUCCESS_MESSAGE = 'קבלנו את עשרת התרגילים. נפגש בפעם הבאה';

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
      } else {
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

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    setSelectedFile(file);
  }
};

 const checkFieldsAndSend = async () => {
  const allFieldsFilled = results.every((result) => result !== '');

  if (!allFieldsFilled) {
    setPopupMessage('חסרות תשובות שלא מולאו');
    setPopupStyle({
      bottom: '20px',
      backgroundColor: 'transparent',
      color: 'black',
      fontWeight: 'bold',
      border: '2px solid black',
      padding: '10px 50px',
      borderRadius: '12px',
    });
    setIsPopupVisible(true);
    return;
  }

  if (event?.level >= LEVEL_WITH_IMAGE_REQUIREMENT && !selectedFile)  {
    alert('נא להעלות תמונה לפני שליחה');
    return;
  }

  // Show success popup (even before upload finishes — you may want to delay this if needed)
  setPopupMessage(SUCCESS_MESSAGE);
  setPopupStyle({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '200px',
    width: '90%',
    maxWidth: '400px',
    fontSize: '30px',
    color: 'green',
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 9999,
    backgroundColor: 'transparent',
    padding: '20px',
    borderRadius: '12px',
  });
  setIsPopupVisible(true);

try {
  // Build one FormData object with everything
  const formData = new FormData();
  
  if (selectedFile) {
    const fileExtension = selectedFile.name.split('.').pop(); // Keep original extension
    const fileName = `${event?.event_code || 'noevent'}_${event?.card_code || 'nocard'}.${fileExtension}`;
    formData.append('file', selectedFile, fileName);
  } else {
    // Send a small .txt file with the content "empty file"
  const emptyContent = new Blob(['empty file'], { type: 'text/plain' });
  formData.append('file', emptyContent, 'empty.txt');
  }


  formData.append('event_code', event?.event_code || '');
  formData.append('card_code', event?.card_code || '');
  formData.append('event_counter', event?.event_counter ?? '');

  results.forEach((result, index) => {
    formData.append(`ex${index + 1}_result`, result.replace(/,/g, ''));
  });

  // Send one POST request with image and all the other data
  const response = await fetch('https://hook.eu2.make.com/41ke6o4sksybyisgobo8k25pfw25qaoh', {
    method: 'POST',
    body: formData, // Not JSON
  });

  if (!response.ok) {
    console.error('Failed to send data');
  } else {
    console.log('Data sent successfully');
  }
} catch (err) {
    console.error('Error during upload or send:', err);
  }
};


  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupMessage('');
    setPopupStyle({});
  };

  return (
    <div className="App">
      {event && event.event_counter >= 2 ? (
        <p className="welcome-message" dir="rtl" style={{ color: 'blue', fontWeight: 'bold' }}>
          היי {childName || ''}, <br /> 
          הסתיימו נסיונות הפתרון להיום. מחר יהיו תרגילים חדשים.
        </p>
      ) : (
        <>
          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <p className="welcome-message">
              היי {childName || ''},<br />
              הנה עשרת התרגילים שלך להיום. <br />
              בהצלחה!
            </p>
          )}

          {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <div className="drill-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="drill-row">
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input-field result-field"
                    placeholder="תוצאה"
                    value={results[i]}
                    onChange={(e) => handleResultChange(i, e)}
                  />
                  <span className="equal-sign">=</span>
                  <span className="number-field">{event ? formatNumber(event[`ex${i + 1}_right`]) : `Right ${i + 1}`}</span>
                  <span className="multiplication-sign">X</span>
                  <span className="number-field">{event ? formatNumber(event[`ex${i + 1}_left`]) : `Left ${i + 1}`}</span>
                </div>
              ))}
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
    >
      לשלוח תוצאות
    </button>
  </div>
)}


{isPopupVisible && (
  <div className="popup" style={popupStyle}>
    {popupMessage}
    {popupMessage !== SUCCESS_MESSAGE && (
      <button className="close-popup" onClick={closePopup}>X</button>
    )}
  </div>
)}

        </>
      )}
    </div>
  );
}

export default  ExercisePage;


