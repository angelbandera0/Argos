export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Argos</span>
        </div>
        {children}
      </div>
    </main>
  );
}
