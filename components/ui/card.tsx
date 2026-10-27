export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={`card${className ? ` ${className}` : ""}`} {...props} />;
}
