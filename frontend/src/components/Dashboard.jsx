import { Activity, ArrowUpRight, CheckCircle2, Clock3, Layers3, ShieldCheck } from 'lucide-react';


const Dashboard = ({ runSummary }) => {
  const modeLabel =
    runSummary.mode === 'full'
      ? 'Full pipeline'
      : runSummary.mode === 'summarize'
        ? 'Summarize only'
        : runSummary.mode === 'compare'
          ? 'Compare only'
          : runSummary.mode;

  const traceItems = runSummary.messages.length
    ? runSummary.messages
    : [
        'No run yet. Enter a query to see the workflow trace.',
        'Gemini is tried first, then Ollama llama3:latest if the primary path fails.',
      ];

  const overviewCards = [
    { label: 'Active mode', value: modeLabel },
    { label: 'Plan steps', value: runSummary.planSteps.toString() },
    { label: 'Academic sources', value: runSummary.academicResults.toString() },
    { label: 'Web sources', value: runSummary.webResults.toString() },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Activity className="h-3.5 w-3.5" />
              Session dashboard
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">Production-style research overview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              This panel is wired to the current session, so you can show the workflow, the fallback path, and the
              source count during demos or interviews.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Last status</p>
            <p className="mt-2 text-sm font-medium text-white">{runSummary.finalStatus}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      
        

        <section className="rounded-[2rem] border border-white/6 bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-fuchsia-500/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            <Clock3 className="h-4 w-4 text-amber-300" />
            Workflow trace
          </div>

          <div className="mt-5 space-y-3">
            {traceItems.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-3 rounded-2xl border border-white/5 bg-slate-950/35 p-4">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>

          
        </section>
      
    </div>
  );
};

export default Dashboard;
