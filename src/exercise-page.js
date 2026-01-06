
//  exercise_page.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './App.css';
import { createClient } from '@supabase/supabase-js';
import Lottie from "lottie-react";


const LEVEL_WITH_IMAGE_REQUIREMENT = 6;



const supabaseUrl = 'https://kamhmwejfirhophsxdaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWhtd2VqZmlyaG9waHN4ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjkwMTksImV4cCI6MjA2Mzg0NTAxOX0.xgZppnVzA0wUQw1QgBgP4hodFqMsI1HlTwxWqtCy8BQ'; // Use the public anon key, not service role!
const supabase = createClient(supabaseUrl, supabaseKey);


async function getRandomAnimation(feedbackCategory) {
    let folder = '';

    // 1. Map Category to Folder Name
    if (feedbackCategory === 'levelup10' || feedbackCategory === 'levelup89') {
      folder = 'level_up';
    } else if (feedbackCategory === 'score_excellent') {
      folder = 'score_excellent';
    } else if (feedbackCategory === 'score_high') {
      folder = 'score_high';
    } else if (feedbackCategory === 'score_medium') {
      folder = 'score_medium';
    } else if (feedbackCategory === 'score_low') {
      folder = 'score_low';
    } else {
      console.warn('Unknown category for animation:', feedbackCategory);
      return null;
    }

    try {
      // 2. List all files in that folder
      // Note: 'Lotties' is your Bucket name. Ensure case matches exactly in Supabase.
      const { data: files, error } = await supabase
        .storage
        .from('Lotties') 
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('Error listing Lottie files:', error);
        return null;
      }

      if (!files || files.length === 0) {
        console.warn(`No animations found in folder: ${folder}`);
        return null;
      }

      // 3. Filter out system files (like .emptyFolderPlaceholder)
      const validFiles = files.filter(f => f.name !== '.emptyFolderPlaceholder');
      
      if (validFiles.length === 0) return null;

      // 4. Pick a random file
      const randomFile = validFiles[Math.floor(Math.random() * validFiles.length)];

      // 5. Get the Public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('Lotties')
        .getPublicUrl(`${folder}/${randomFile.name}`);

      // 6. Fetch the actual JSON content
      const response = await fetch(publicUrlData.publicUrl);
      const animationJson = await response.json();
      
      return animationJson;

    } catch (err) {
      console.error('Unexpected error loading animation:', err);
      return null;
    }
  }



async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*');

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data.map((record) => ({
    event_code: record.event_code,
    card_code: record.card_code,
    level: record.level,
    event_counter: record.event_counter ?? 666,
    ...record,
  }));
}


async function fetchCard(cardCode) {
  const { data, error } = await supabase
    .from('cards')
    .select('child_name, card_name, card_cellular, child_cellular, seq_days_good')
    .eq('card_code', cardCode)
    .single();

  if (error) {
    console.error('Error fetching card:', error);
    return ['', '', '', '',0];
  }

  return [
    data.child_name || '',
    data.card_name || '',
    data.card_cellular || '',
    data.child_cellular || '',
    data.seq_days_good || 0
  ];
}

async function getFeedbackText(feedbackCategory, tries_left) {
  let scoreType = '';
  let isLevelUp = 'N';

  // Map category to DB columns
  if (feedbackCategory === 'levelup10') {
    scoreType = 'score_excellent';
    isLevelUp = 'Y';
  } else if (feedbackCategory === 'levelup89') {
    scoreType = 'score_high';
    isLevelUp = 'Y';
  } else if (feedbackCategory === 'score_excellent') {
    scoreType = 'score_excellent';
    isLevelUp = 'N';
  } else if (feedbackCategory === 'score_high') {
    scoreType = 'score_high';
  } else if (feedbackCategory === 'score_medium') {
    scoreType = 'score_medium';
  } else if (feedbackCategory === 'score_low') {
    scoreType = 'score_low';
  }

  console.log('Querying Supabase → ', scoreType, isLevelUp, tries_left);

  // 1. Create Base Query
  const baseQuery = supabase
    .from('text_after_score')
    .select('text')
    .eq('score_type', scoreType)
    .eq('level_up', isLevelUp);

  let data = [];
  
  // 2. Try to find EXACT match for tries_left (only if not leveling up)
  if (feedbackCategory !== 'levelup10' && feedbackCategory !== 'levelup89') {
     // We use the integer variable 'tries_left' directly
     const { data: specificData } = await baseQuery.eq('tries_left', tries_left);
     data = specificData;
  } else {
     // If Level Up, we don't care about tries_left
     const { data: levelUpData } = await baseQuery;
     data = levelUpData;
  }

  // 3. FALLBACK: If specific search returned empty, search for a GENERIC message (tries_left IS NULL)
  if (!data || data.length === 0) {
      console.log(`No specific message for try ${tries_left}, looking for generic message...`);
      
      const { data: genericData } = await supabase
        .from('text_after_score')
        .select('text')
        .eq('score_type', scoreType)
        .eq('level_up', isLevelUp)
        .is('tries_left', null); // .is check for NULL
      
      data = genericData;
  }

  if (!data || data.length === 0) {
    console.warn('No feedback text found → fallback');
    return 'כל הכבוד! המשך להתאמן!';
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].text;
}

function ExercisePage() {
  const { eventCode, cardCode } = useParams();
  const [results, setResults] = useState(Array(10).fill(''));
  const [event, setEvent] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    child_name: '',
    card_name: '',
    card_cellular: '',
    child_cellular: '',
  });
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
       setError(`קישור לא תקין ❗
                  נראה שנכנסת לקישור שלא קיים או שכבר אינו פעיל.
                  בבקשה בדוק שקיבלת את הקישור הנכון, ונסה שוב.

                  אם הבעיה נמשכת – פנה אלינו ונשמח לעזור 😊`);
      }
    };

    fetchData();
  }, [eventCode, cardCode]);

const [uploadedFile, setUploadedFile] = useState(null);


  const handleResultChange = (index, e) => {
    let value = e.target.value.replace(/,/g, '');

    if (value && !Number.isInteger(Number(value))) {
      alert('הכנסת ערך לא נכון, רק ספרות מתקבלות');
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
 const [isSending, setIsSending] = useState(false);
   
 const checkFieldsAndSend = async () => {
    if (isSending) return;

    const allFieldsFilled = results.every((result) => result !== '');

    if (!allFieldsFilled) {
      alert('נא להשלים את כל התשובות לפני שליחה');
      return;
    }

    if (event?.level >= LEVEL_WITH_IMAGE_REQUIREMENT && !selectedFile) {
      alert('נא להעלות תמונה לפני שליחה');
      return;
    }

    setIsSending(true); // prevent further clicks

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

      // Append card details
      formData.append('card_name', childName[1]);
      formData.append('card_cellular', childName[2]);
      formData.append('child_name', childName[0]);
      formData.append('child_cellular', childName[3]);

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

      // Show 'Calculating your result...' popup while waiting
      setIsLoading(true);
      setPopupMessage('המערכת בודקת תוצאה.. בבקשה להמתין רגע');
      setPopupStyle({
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        fontSize: '30px',
        color: 'green',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 9999,
        backgroundColor: '#e0f7fa',
        padding: '20px',
        boxSizing: 'border-box',
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
            const event = updatedEvent; 

            setEvent(event); 

            const score = event.score ?? 0; 
            const tries_left = 3 - event.event_counter;
            
            // Determine score_points
            let score_points = 0;
            if (score === 10) score_points = 2;
            else if (score === 9 || score === 8) score_points = 1;

            // Extract seq_days_good from card details
            const currentSeq = Number(childName[4] || 0);

            // Calculate next
            const nextSeq = currentSeq + score_points;

            let feedbackCategory = '';

            if (nextSeq >= 4) {
              if (score === 10) {
                feedbackCategory = 'levelup10';
              } else if (score === 9 || score === 8) {
                feedbackCategory = 'levelup89';
              }
            } else if (score === 10) {
              feedbackCategory = 'score_excellent';
            } else if (score === 9 || score === 8) {
              feedbackCategory = 'score_high';
            } else if (score === 7 || score === 6) {
              feedbackCategory = 'score_medium';
            } else {
              feedbackCategory = 'score_low';
            }

            // 1. Get Text Feedback
            const feedbackText = await getFeedbackText(feedbackCategory, tries_left);

            // 2. Get Animation
            let animationData = null;
            try {
              console.log("Fetching animation for category:", feedbackCategory);
              animationData = await getRandomAnimation(feedbackCategory);
            } catch (animErr) {
              console.error("Animation failed to load:", animErr);
            }

            // --- 3. SHOW POPUP (FIXED LAYOUT) ---
            setPopupMessage(
              <div 
                className='min-h-screen flex flex-col' 
                dir='rtl' 
                style={{
                  width: '100%', 
                  height: '100%',        
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden'     
                }}
              >
                
                {/* --- PART 1: SCROLLABLE CONTENT (Lottie + Text) --- */}
                <div style={{
                  flex: 1,               
                  overflowY: 'auto',     
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  width: '100%',
                  paddingBottom: '10px'  
                }}>
                
                    {/* LOTTIE ANIMATION */}
                    {animationData && (
                      <div style={{ 
                        width: '280px',        
                        height: '280px',       
                        marginBottom: '5px',  
                        flexShrink: 0          
                      }}>
                        <Lottie animationData={animationData} loop={true} />
                      </div>
                    )}

                    {/* SCORE TEXT */}
                    <p style={{ 
                      fontSize: '22px', 
                      fontWeight: 'bold',
                      color: '#333',         
                      marginBottom: '10px',
                      textAlign: 'center',   
                      fontFamily: 'Varela Round, sans-serif',
                      flexShrink: 0
                    }}>
                      מספר התשובות הנכונות הוא: {score}
                    </p>

                    {/* FEEDBACK TEXT */}
                    <p style={{ 
                      fontSize: '32px',      
                      fontWeight: 'bold',
                      color: '#00695c',      
                      marginBottom: '10px', 
                      padding: '0 20px',
                      textAlign: 'center',   
                      lineHeight: '1.4',
                      fontFamily: 'Varela Round, sans-serif'
                    }}>
                      {feedbackText}
                    </p>

                </div>

                {/* --- PART 2: FIXED BUTTON AREA --- */}
                <div style={{
                  flexShrink: 0,         
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: '10px',
                  paddingBottom: '10px', 
                  backgroundColor: 'rgba(224, 247, 250, 0.9)' 
                }}>
                    <button
                      className='text-blue-500 text-xl bg-transparent border-none cursor-pointer'
                      onClick={() => window.location.reload()}
                      style={{ 
                        color: '#1565c0',    
                        fontSize: '22px',
                        backgroundColor: 'transparent',
                        border: '2px solid #1565c0', 
                        borderRadius: '50px',
                        padding: '10px 30px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}
                    >
                      לתרגילים והתשובות
                    </button>
                </div>

              </div>
            );

            setPopupStyle({
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              width: '100vw',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              fontSize: '30px',
              color: 'green',
              fontWeight: 'bold',
              textAlign: 'center',
              zIndex: 9999,
              backgroundColor: '#e0f7fa',
              padding: '20px',
              boxSizing: 'border-box',
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
    } finally {
      setIsSending(false); // allow future send attempts if needed
    }
  };

  const closePopup = () => {
    setIsPopupVisible(false);
    setPopupMessage('');
    setPopupStyle({});
  };

  return (
    <div className='App'>
      {event && event.event_counter >= 4 ? (
        <p className='welcome-message' dir='rtl' style={{ color: 'blue', fontWeight: 'bold' }}>
          היי {childName[0] || ''}, <br /> 
         נראה שניסית לפתוח קישור ישן שכבר לא עובד 😕 <br /> 
        אבל אל דאגה! כל יום יש דף חדש עם תרגילים חדשים 🎯 <br /> 
        אז תבדוק בוואטסאפ אם יש לך קישור חדש מהיום ✨ <br /> 

        נתראה שם! 💪😊
        </p>
      ) : (
        <>
          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <p className='welcome-message'>
  היי {childName[0] || ''},<br />
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

          {error && <p className='error-message' style={{ color: 'black', whiteSpace: 'pre-line',textAlign: 'center', }}>
                         {error} 
                    </p>
          }

          {event && !error && popupMessage !== SUCCESS_MESSAGE && (
            <div className='drill-grid'>
    {Array.from({ length: 10 }).map((_, i) => {
  const left = event?.[`ex${i + 1}_left`];
  const right = event?.[`ex${i + 1}_right`];
  const response = event?.[`ex${i + 1}_response`];
  const answer = event?.[`ex${i + 1}_answer`];

  // Start with base class
  let inputClass = 'input-field result-field';

  // Add conditional color classes
  if (response !== undefined && response !== null && response !== '') {
    inputClass += response == answer ? ' result-correct' : ' result-wrong';
  }

  // Determine value to show
  const inputValue = results[i];

  const displayResult = (val) =>
  val === '' || val === null || val === undefined ? '' : val;

  return (
    <div key={i} className='drill-row' dir='ltr'>
      <span className='drill-number'>{i + 1}.</span>
      <span className='number-field'>{formatNumber(left)}</span>
      <span className='multiplication-sign'>X</span>
      <span className='number-field'>{formatNumber(right)}</span>
      <span className='equal-sign'>=</span>
      <input
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          className={inputClass}
          value={displayResult(results[i])}
          placeholder='תוצאה'
          onChange={(e) => handleResultChange(i, e)}
          onFocus={() => {
            if (response != null && response !== '' && response != answer) {
              const clearedResults = [...results];
              clearedResults[i] = '';
              setResults(clearedResults);
            }
          }}
        />

    </div>
  );
})}


            </div>
          )}

{event && !error && popupMessage !== SUCCESS_MESSAGE && (
  <div className='button-row'>
    {event?.level >= LEVEL_WITH_IMAGE_REQUIREMENT && (
      <>
        <label htmlFor='file-upload' className='custom-upload'>
          📸 טיוטה
        </label>
        <input
          id='file-upload'
          type='file'
          accept='image/*'
          capture='environment'
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </>
    )}

    <button
      style={{ backgroundColor: buttonColor, color: 'white' }}
      className='send-button'
      onClick={checkFieldsAndSend}
      disabled={event?.event_counter >= 3 || isSending}
    >
      לשלוח תוצאות
    </button>
  </div>
)}


{isPopupVisible && (
  <div className='popup' style={popupStyle}>
    {popupMessage}

    {popupMessage !== WAITING_MASSAGE ? (
      <button
          className='close-popup'
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
