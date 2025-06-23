import React, { useState } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kamhmwejfirhophsxdaq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbWhtd2VqZmlyaG9waHN4ZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjkwMTksImV4cCI6MjA2Mzg0NTAxOX0.xgZppnVzA0wUQw1QgBgP4hodFqMsI1HlTwxWqtCy8BQ"
); // Your anon public key

function SubscribePage() {
  const [formData, setFormData] = useState({
    parentMobile: "",
    childMobile: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only digits, max length 10
    let digits = value.replace(/\D/g, "");
    if (digits.length > 10) digits = digits.slice(0, 10);
    const formatted = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;

    setFormData((prev) => ({ ...prev, [name]: formatted }));
  };

  const formatPhone = (input) => {
    const digits = input.replace(/\D/g, ""); // Remove non-digit chars
    if (digits.length === 10 && digits.startsWith("0")) {
      return "972" + digits.slice(1); // Replace leading 0 with 972
    }
    if (digits.startsWith("972")) {
      return digits;
    }
    // fallback for other cases
    if (digits.length === 9) {
      return "972" + digits;
    }
    return digits; // if input is unexpected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage(""); // reset message
    setLoading(true);

    try {
      const parentPhone = formatPhone(formData.parentMobile);
      const childPhone = formatPhone(formData.childMobile);

      // Step 1: search for matching card where active = "N"
      const { data: cards, error } = await supabase
        .from("cards")
        .select("card_code")
        .eq("active", "N")
        .eq("card_cellular", parentPhone)
        .eq("child_cellular", childPhone)
        .limit(1);

      if (error) {
        console.error("Supabase fetch error:", error);
        setMessage("שגיאה בחיפוש. נסה שוב מאוחר יותר.");
        setLoading(false);
        return;
      }

      if (!cards || cards.length === 0) {
        setMessage("מספרי הטלפון שרשמת עכשיו לא מתאימים לאלו שנרשמו קודם. \n ניתן לנסות לשלוח שוב \n");

        setFormData({
          parentMobile: "",
          childMobile: "",
        });

        setLoading(false);
        return;
      }

      // Step 2: update active to "Y"
      const cardCode = cards[0].card_code;
      const { error: updateError } = await supabase
        .from("cards")
        .update({ active: "Y" })
        .eq("card_code", cardCode);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        setMessage("שגיאה בעדכון הנתונים. נסה שוב מאוחר יותר.");
        setLoading(false);
        return;
      }
      
      // Success message
      setMessage("כל הכבוד! נרשמת בהצלחה 🎉\nממחר תקבלו תרגילים לפתור");
      setIsSuccess(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("אירעה שגיאה לא צפויה. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <p className="remark-massage" style={{ whiteSpace: "pre-line", fontSize: "1.1em" }}>
        היי, זה שלב אחרון בהרשמה. <br />
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
          disabled={loading}
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
          disabled={loading}
        />

        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
          <button type="submit" className="send-button" disabled={loading || isSuccess}>
            {loading ? "בודק נתונים..." : "אימות מספרי טלפון"}
          </button>
        </div>
      </form>

      {message && (
        <p
          style={{
            fontSize: "16px",
            color: message.includes("כל הכבוד") ? "green" : "red",
            whiteSpace: "pre-line",
            textAlign: "center",
            lineHeight: "1.6",
            marginTop: "20px",
          }}
          className="remark-massage"
        >
          {message}

          {!message.includes("כל הכבוד") && (
            <>
              <br />
              אם נתקלת בבעיה, ניתן ליצור איתנו קשר בקישור הבא: <br />
              <a
                href="https://main.d68e8t2303m09.amplifyapp.com/new-remark"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "underline", fontSize: "16px" }}
              >
                לחצו כאן
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}

export default SubscribePage;
