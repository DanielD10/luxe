"use client";

import { useEffect, useState } from "react";

export default function Toaster() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const show = (e: Event) => {
      setText((e as CustomEvent<string>).detail);
      setOn(true);
      clearTimeout(t);
      t = setTimeout(() => setOn(false), 2600);
    };
    window.addEventListener("luxe:toast", show);
    return () => {
      window.removeEventListener("luxe:toast", show);
      clearTimeout(t);
    };
  }, []);
  return (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      {text}
    </div>
  );
}
