export function FormSection({
  n,
  title,
  description,
  aside,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  n: number;
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const id = `${props.id ?? `fs-${n}`}-title`;
  return (
    <section className="ui-form-section" aria-labelledby={id} {...props}>
      <header className="ui-form-section-head">
        <span className="ui-form-section-n" aria-hidden="true">
          {n}
        </span>
        <div className="ui-form-section-title">
          <h2 id={id}>{title}</h2>
          {description && <p className="hint">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
