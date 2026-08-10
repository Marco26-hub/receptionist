import { contactHref } from "../lib/site";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  secondary?: { label: string; href: string };
};

export function PageIntro({ eyebrow, title, description, secondary }: PageIntroProps) {
  return (
    <section className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="hero-actions">
        <a className="primary-action" href={contactHref}>Prenota una demo</a>
        {secondary && <a className="secondary-action" href={secondary.href}>{secondary.label}</a>}
      </div>
    </section>
  );
}

