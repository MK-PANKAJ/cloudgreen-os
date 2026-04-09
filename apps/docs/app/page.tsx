import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>CloudGreen OS Docs</h1>
        <p>
          Carbon-aware orchestration and verifiable credential APIs for
          sustainable compute workflows.
        </p>

        <ol>
          <li>Start API: <code>pnpm --filter api dev</code></li>
          <li>Health: <code>GET /health</code></li>
          <li>Live carbon signal: <code>GET /api/carbon/live</code></li>
          <li>Issue VC: <code>POST /api/credentials/issue</code></li>
          <li>Trigger workload: <code>POST /api/workloads/trigger</code></li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="http://localhost:8787/health"
          >
            Check API Health
          </a>
          <a
            href="http://localhost:8787/"
            className={styles.secondary}
          >
            API Root
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>PowerShell tip:</span>
        <span>
          Use <code>Invoke-RestMethod</code> or <code>curl.exe</code> instead of
          Linux-style <code>curl</code> flags in PowerShell.
        </span>
      </footer>
    </div>
  );
}
