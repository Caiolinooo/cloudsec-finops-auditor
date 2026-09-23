import { AuditorConsole } from "@/components/AuditorConsole";

export default function Home() {
  return (
    <main className="page-shell">
      <AuditorConsole />
      <footer className="site-foot">
        <p>
          Policies live in <code>policies/*.md</code>. Swap the dense index for
          Qdrant + Gemini embeddings without changing the API envelope.
        </p>
        <p>
          Owner <a href="https://github.com/Caiolinooo">Caiolinooo</a> · live
          demo: <span className="placeholder">[LIVE_DEMO_URL]</span>
        </p>
      </footer>
    </main>
  );
}
