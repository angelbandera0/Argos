export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="ui-section" aria-labelledby={`${id}-title`}>
      <h2 className="ui-section-title" id={`${id}-title`}>
        {title}
      </h2>
      {description && <p className="ui-section-desc">{description}</p>}
      {children}
    </section>
  );
}

export function Specimen({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="ui-specimen">
      <figcaption>
        <strong>{title}</strong>
        {note && <span className="caption">{note}</span>}
      </figcaption>
      <div className="ui-specimen-body">{children}</div>
    </figure>
  );
}
