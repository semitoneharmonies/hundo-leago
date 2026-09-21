export function StartupConfigurationPage() {
  return (
    <main
      aria-labelledby="startup-error-title"
      style={{ maxWidth: 680, margin: "48px auto", padding: 24 }}
    >
      <h1 id="startup-error-title">Hundo Leago could not start</h1>
      <p>
        The public application configuration is invalid. No league requests were
        sent. Ask the site operator to review this deployment.
      </p>
    </main>
  );
}
