import { useRef, useState, useEffect } from "react";

/**
 * Bulletproof OTP input.
 * - 6 styled boxes (inline styles — visible even if the CSS file is stale/missing)
 * - PLUS a visible fallback single field below, so there is ALWAYS a way to
 *   enter the OTP even if the boxes fail to render for any reason.
 */
export default function OTPInput({ length = 6, value, onChange, disabled = false }) {
  const [boxes, setBoxes] = useState(() => Array.from({ length }, () => ""));
  const refs = useRef([]);

  useEffect(() => {
    const str = String(value || "");
    setBoxes(Array.from({ length }, (_, i) => str[i] || ""));
  }, [value, length]);

  const emit = (arr) => onChange?.(arr.join(""));

  const handleChange = (i, ch) => {
    const digit = ch.replace(/\D/g, "").slice(-1);
    const next = [...boxes];
    next[i] = digit;
    setBoxes(next);
    emit(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...boxes];
      if (next[i]) next[i] = "";
      else if (i > 0) { next[i - 1] = ""; refs.current[i - 1]?.focus(); }
      setBoxes(next);
      emit(next);
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = Array.from({ length }, (_, i) => text[i] || "");
    setBoxes(next);
    emit(next);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  // inline styles so boxes are ALWAYS visible
  const boxStyle = {
    width: 52, height: 60, textAlign: "center",
    fontFamily: "'Fredoka', sans-serif", fontSize: "1.6rem", fontWeight: 700,
    background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.25)",
    borderRadius: 14, color: "#fdf3ea", outline: "none",
  };

  return (
    <div>
      <div className="otp-boxes" style={{ display: "flex", gap: 10, justifyContent: "center" }} onPaste={handlePaste}>
        {boxes.map((b, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            className="otp-box"
            style={boxStyle}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={2}
            value={b}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
          />
        ))}
      </div>

      {/* bulletproof fallback single field — always available */}
      <div className="field" style={{ marginTop: 14 }}>
        <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: 6 }}>
          Or type the {length}-digit code here:
        </label>
        <input
          className="input"
          inputMode="numeric"
          maxLength={length}
          placeholder={`e.g. 123456`}
          value={String(value || "")}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value.replace(/\D/g, "").slice(0, length))}
          style={{ textAlign: "center", letterSpacing: 6, fontSize: "1.2rem" }}
        />
      </div>
    </div>
  );
}
