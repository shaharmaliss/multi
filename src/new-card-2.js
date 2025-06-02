import React, { useState } from "react";
import "./App.css"; // Same styling as your existing app

function SubscribePage() {
  const [formData, setFormData] = useState({
    parentMobile: "",
    childMobile: "",
  });

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

  const formatPhone = (number) => {
    const digits = number.replace(/\D/g, ''); // Remove non-digits
    if (digits.startsWith("0")) {
      return "972" + digits.slice(1); // Replace leading 0 with 972
    }
    return "972" + digits; // Fallback in case leading 0 is missing
  };

  const parentFormatted = formatPhone(formData.parentMobile);
  const childFormatted = formatPhone(formData.childMobile);

  try {
    const response = await fetch("https://hook.eu2.make.com/2ts8premq6qd5hpv8axk91b66gb2dcc0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parentMobile: parentFormatted,
        childMobile: childFormatted,
      }),
    });

    if (response.ok) {
      alert("הטלפונים נשלחו לאימות בהצלחה");
      setFormData({ parentMobile: "", childMobile: "" });
    } else {
      alert("שליחה נכשלה. נסה שוב מאוחר יותר.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("ארעה שגיאה בעת שליחת הטופס.");
  }
};


  return (
    <div className="App">
      <p className="remark-massage">
       היי, זה שלב אחרון בהרשמה.   <br />
       כדי לוודא שמספרי הטלפון שהכנסת נכונים, <br />
       בבקשה להקליד שוב את שני מספרי הטלפון. <br />
      </p>

      <form onSubmit={handleSubmit}>
      <input
        type="tel"
        name="parentMobile"
        dir="rtl"
        placeholder="מס נייד של ההורה"
        className="styled-input"
        value={formData.parentMobile}
        onChange={handleChange}
        pattern="\d{3}-\d{7}"
        title="הפורמט חייב להיות XXX-XXXXXXX"
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

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <button type="submit" className="send-button">
          אימות מספרי טלפון
        </button>
      </div>
    </form>

    </div>
  );
}

export default SubscribePage;
