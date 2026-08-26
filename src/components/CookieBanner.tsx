import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#060d0b",
        color: "#fff",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        zIndex: 9999,
        borderTop: "1px solid #2ecf9c",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", maxWidth: "800px" }}>
        Мы используем cookies для работы сайта и собираем персональные данные в соответствии с{" "}
        <a href="/privacy" style={{ color: "#2ecf9c" }}>
          политикой обработки персональных данных
        </a>
        . Продолжая использовать сайт, вы даёте согласие.
      </p>
      <button
        onClick={accept}
        style={{
          background: "#2ecf9c",
          color: "#060d0b",
          border: "none",
          padding: "10px 20px",
          borderRadius: "6px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Принять
      </button>
    </div>
  );
}