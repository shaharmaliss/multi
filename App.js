import './App.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams

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

function App() {
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

  const checkFieldsAndSend = async () => {
    const allFieldsFilled = results.every((result) => result !== '');

    if (allFieldsFilled) {
      setPopupMessage(SUCCESS_MESSAGE);
      setPopupStyle({
        position: 'fixed',
        top: '40%',
        left: '57%',
        height: '200px',
        width: '400px',
        transform: 'translate(-80%, 0)',
        fontSize: '35px',
        color: 'green',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 9999,
        backgroundColor: 'transparent',
        padding: '20px',
        borderRadius: '12px',
      });
      setIsPopupVisible(true);

      const dataToSend = {
        event_code: event ? event.event_code : '',
        card_code: event ? event.card_code : '',
        event_counter: event ? event.event_counter : '',
        ex1_result: results[0].replace(/,/g, ''),
        ex2_result: results[1].replace(/,/g, ''),
        ex3_result: results[2].replace(/,/g, ''),
        ex4_result: results[3].replace(/,/g, ''),
        ex5_result: results[4].replace(/,/g, ''),
        ex6_result: results[5].replace(/,/g, ''),
        ex7_result: results[6].replace(/,/g, ''),
        ex8_result: results[7].replace(/,/g, ''),
        ex9_result: results[8].replace(/,/g, ''),
        ex10_result: results[9].replace(/,/g, ''),
      };

      try {
        const response = await fetch('https://hook.eu2.make.com/41ke6o4sksybyisgobo8k25pfw25qaoh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
          console.log('Webhook sent successfully');
        } else {
          console.error('Error sending webhook:', response.statusText);
        }
      } catch (error) {
        console.error('Error sending webhook:', error);
      }
    } else {
      setPopupMessage('חסרות תשובות שלא מולאו');
      setPopupStyle({
        backgroundColor: 'transparent',
        color: 'black',
        fontWeight: 'bold',
        border: '2px solid black',
        padding: '10px 50px',
        borderRadius: '12px',
      });
      setIsPopupVisible(true);
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
          {popupMessage !== SUCCESS_MESSAGE && (
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
                  <span className="number-field">{event ? formatNumber(event[`ex${i + 1}_left`]) : `Left ${i + 1}`}</span>
                  <span className="multiplication-sign">X</span>
                  <span className="number-field">{event ? formatNumber(event[`ex${i + 1}_right`]) : `Right ${i + 1}`}</span>
                  <span className="equal-sign">=</span>
                  <input
                    type="text"
                    className="input-field result-field"
                    placeholder="תוצאה"
                    value={results[i]}
                    onChange={(e) => handleResultChange(i, e)}
                  />
                </div>
              ))}
            </div>
          )}

{isPopupVisible && (
  <div className="popup" style={popupStyle}>
    {popupMessage}
    {/* Only show the X button if the message is not SUCCESS_MESSAGE */}
    {popupMessage !== SUCCESS_MESSAGE && (
      <button className="close-popup" onClick={closePopup}>X</button>
    )}
  </div>
)}

          {popupMessage !== SUCCESS_MESSAGE && (
            <div className="button-container">
              <button
                style={{ backgroundColor: buttonColor, color: 'white' }}
                className="send-button"
                onClick={checkFieldsAndSend}
              >
                תוצאות לשלוח
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;