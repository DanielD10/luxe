import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="label">404</p>
        <h1>That place isn&rsquo;t on the map.</h1>
        <p>The page may have moved. The destinations are all still here.</p>
      </header>
      <div className="qrow">
        <Link className="btn solid" href="/destinations">Browse destinations</Link>
        <Link className="btn" href="/">Home</Link>
      </div>
    </div>
  );
}
