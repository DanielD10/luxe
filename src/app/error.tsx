"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">Something went wrong</p>
        <h1>That didn&rsquo;t load.</h1>
        <p>Try again. If it keeps happening, the destinations page is a good place to start over.</p>
      </header>
      <div className="qrow">
        <button className="btn solid" onClick={reset}>Try again</button>
        <Link className="btn" href="/destinations">Destinations</Link>
      </div>
    </div>
  );
}
