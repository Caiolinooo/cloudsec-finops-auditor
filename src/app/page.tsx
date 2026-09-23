import { AuditorConsole } from "@/components/AuditorConsole";

export default function Home() {
  return (
    <main className="page-shell">
      <AuditorConsole />
      <footer className="site-foot">
        <p>
          Caio Correia ·{" "}
          <a href="https://github.com/Caiolinooo/cloudsec-finops-auditor">
            github.com/Caiolinooo/cloudsec-finops-auditor
          </a>
        </p>
      </footer>
    </main>
  );
}
