export default function App() {
  return (
    <main className="min-h-screen p-8">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-md">
        <h1 className="text-xl font-semibold text-text">Portal de Solicitações Internas</h1>
        <p className="mt-1 text-textMuted">Base do frontend configurada.</p>
        <span className="mt-4 inline-block rounded-full bg-status-aberto/10 px-3 py-1 text-sm text-status-aberto">Aberto</span>
        <button className="ml-3 rounded-md bg-primary px-4 py-2 text-onPrimary hover:bg-primaryHover">Botão</button>
      </div>
    </main>
  )
}
