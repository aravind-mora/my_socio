import { useRef, useState, useEffect } from "react";

/** 6-box OTP input with auto-advance, backspace handling and paste support. */
export default function OTPInput({ length = 6, value, onChange, disabled = false }) {
  const [boxes, setBoxes] = useState(Array(length).fill(""));
  const refs = useRef([]);

  useEffect(() => {
    if (value !== undefined) {
      const arr = String(value || "").padEnd(length, "").split("").slice(0, length);
      setBoxes(arr.map((c) => (c === " " ? "" : c)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (next[i]) { next[i] = ""; }
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
    const next = Array(length).fill("");
    text.split("").forEach((c, i) => (next[i] = c));
    setBoxes(next);
    emit(next);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="otp-boxes" onPaste={handlePaste}>
      {boxes.map((b, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="otp-box"
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
  );
}
