import Link from "next/link";

export function EmptyDrop({ instagram }: { instagram?: string | null }) {
  return (
    <section className="empty-drop" aria-labelledby="empty-drop-title">
      <p className="eyebrow eyebrow--slash">Drop 001</p>
      <h2 id="empty-drop-title">Drop 001 is being prepared.</h2>
      <p>Built for the next point.</p>
      {instagram ? (
        <a className="button button--outline" href={instagram} target="_blank" rel="noreferrer">
          Follow on Instagram
        </a>
      ) : (
        <Link className="button button--outline" href="/about">
          About SET25
        </Link>
      )}
    </section>
  );
}
