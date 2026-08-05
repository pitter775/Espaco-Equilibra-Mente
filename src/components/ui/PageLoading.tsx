type PageLoadingProps = {
  variant?: "site" | "admin";
};

export function PageLoading({ variant = "site" }: PageLoadingProps) {
  return (
    <main className={`legacy-page page-loading page-loading-${variant}`} aria-busy="true">
      <div className="page-loading-shell">
        <div className="page-loading-mark" />
        <div className="page-loading-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
