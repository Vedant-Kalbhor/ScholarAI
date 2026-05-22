import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import Dashboard from './components/Dashboard';

const quickPrompts = [
  'Summarize the latest papers on agentic RAG systems',
  'Compare retrieval strategies for research assistants',
  'Explain hallucination mitigation in multi-agent workflows',
];

const modeLabels = {
  summarize: 'Summarize',
  compare: 'Compare',
  full: 'Full pipeline',
};

const initialRunSummary = {
  query: '',
  mode: 'full',
  planSteps: 0,
  academicResults: 0,
  webResults: 0,
  provider: 'Ready for Gemini or local Ollama fallback',
  messages: [],
  lastUpdated: null,
  finalStatus: 'Idle',
};

function parseProvider(messages = []) {
  const providerHint = messages.find((message) => /using (gemini|ollama)/i.test(message));
  if (!providerHint) return 'Auto fallback enabled';

  if (providerHint.toLowerCase().includes('ollama')) {
    return 'llama3:latest via Ollama';
  }

  return 'Gemini';
}

const App = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Research');
  const [mode, setMode] = useState('full');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Welcome to ScholarAI. Ask a research question and I will search papers, synthesize findings, and verify the flow before generating a final report.',
    },
  ]);
  const [runSummary, setRunSummary] = useState(initialRunSummary);

  const stats = useMemo(
    () => [
      {
        label: 'Workflow',
        value: modeLabels[mode] || 'Full pipeline',
        icon: Zap,
      },
      {
        label: 'Academic sources',
        value: runSummary.academicResults.toString().padStart(2, '0'),
        icon: BookOpen,
      },
      {
        label: 'Web sources',
        value: runSummary.webResults.toString().padStart(2, '0'),
        icon: Database,
      },
      {
        label: 'LLM path',
        value: runSummary.provider,
        icon: ShieldCheck,
      },
    ],
    [mode, runSummary.academicResults, runSummary.provider, runSummary.webResults],
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const resp = await fetch(`${apiUrl}/api/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text, mode }),
      });

      const data = await resp.json();
      const newMessages = [];

      if (data.plan?.length) {
        newMessages.push({
          role: 'assistant',
          type: 'plan',
          text: `### Research plan\n${data.plan.map((item) => `- ${item}`).join('\n')}`,
        });
      }

      if (data.results?.length) {
        newMessages.push({ role: 'assistant', type: 'results', data: data.results });
      }

      if (data.final_report) {
        newMessages.push({ role: 'assistant', type: 'report', text: data.final_report });
      } else if (data.summary) {
        newMessages.push({ role: 'assistant', type: 'summary', text: `### Research synthesis\n\n${data.summary}` });
      }

      if (data.comparison) {
        newMessages.push({ role: 'assistant', type: 'comparison', text: `### Comparison matrix\n\n${data.comparison}` });
      }

      if (data.messages?.length) {
        newMessages.push({
          role: 'assistant',
          type: 'status',
          text: `### Workflow trace\n${data.messages.map((item) => `- ${item}`).join('\n')}`,
        });
      }

      setMessages((prev) => [...prev, ...newMessages]);
      setRunSummary({
        query: userMessage.text,
        mode,
        planSteps: data.plan?.length || 0,
        academicResults: data.results?.length || 0,
        webResults: data.web_results?.length || 0,
        provider: parseProvider(data.messages || []),
        messages: data.messages || [],
        lastUpdated: new Date().toLocaleTimeString(),
        finalStatus: data.final_report ? 'Completed' : 'Processed',
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            'I could not reach the backend. Make sure FastAPI is running and that Gemini or the local Ollama fallback is available.',
        },
      ]);
      setRunSummary((prev) => ({
        ...prev,
        provider: 'Backend unavailable',
        academicResults: 0,
        webResults: 0,
        finalStatus: 'Backend unavailable',
        lastUpdated: new Date().toLocaleTimeString(),
      }));
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_40%,_#020617_100%)] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-10 pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen max-w-[1680px] flex-col lg:flex-row">
        <aside className="border-b border-white/5 bg-slate-950/65 px-6 py-6 backdrop-blur-2xl lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-500/10">
              <BookOpen className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">ScholarAI</p>
              <h1 className="text-xl font-semibold text-white">Research workspace</h1>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {[
              { id: 'Research', label: 'Research', icon: Search },
              { id: 'Dashboard', label: 'Dashboard', icon: BarChart3 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                  activeTab === item.id
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/5'
                    : 'border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            ))}
          </div>

          {activeTab === 'Research' && (
            <div className="mt-8 rounded-3xl border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Query modes
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { id: 'summarize', title: 'Summarize only', desc: 'Best for quick literature notes.' },
                  { id: 'compare', title: 'Compare only', desc: 'Creates a compact comparison matrix.' },
                  { id: 'full', title: 'Full pipeline', desc: 'Search, synthesize, verify, and report.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-all ${
                      mode === item.id
                        ? 'border-cyan-400/30 bg-cyan-400/10'
                        : 'border-white/5 bg-slate-950/30 hover:border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/10 via-slate-900/70 to-fuchsia-500/10 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Reliability note
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Gemini is used first. If it fails, ScholarAI falls back to local Ollama with{' '}
              <span className="font-semibold text-white">llama3:latest</span>.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
              <p className="mt-2 text-sm font-medium text-white">{runSummary.finalStatus}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Last updated</p>
              <p className="mt-2 text-sm font-medium text-white">{runSummary.lastUpdated || 'Not run yet'}</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activeTab === 'Dashboard' ? (
            <Dashboard runSummary={runSummary} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
              <section className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      <Zap className="h-3.5 w-3.5" />
                      Production-style research assistant
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      Research with source cards, verification, and graceful fallback.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Run a paper search, synthesize the findings, and inspect the trace. The backend
                      automatically switches to local Ollama when Gemini is unavailable.
                    </p>
                  </div>

                  <div className="grid min-w-[240px] gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-4">
                    {stats.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                          <p className="mt-1 text-sm font-medium text-white">{stat.value}</p>
                        </div>
                        <stat.icon className="h-4 w-4 text-cyan-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setQuery(prompt)}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { title: 'Search', desc: 'ArXiv + Scholar + web', icon: Search },
                    { title: 'Verify', desc: 'Critic node checks support', icon: CheckCircle2 },
                    { title: 'Report', desc: 'Markdown output for the final answer', icon: FileText },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/5 bg-slate-950/35 p-4 transition hover:border-white/10"
                    >
                      <item.icon className="h-5 w-5 text-cyan-300" />
                      <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.75rem] border border-white/6 bg-slate-950/45 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Ask ScholarAI</p>
                      <p className="mt-1 text-sm text-slate-300">Use the prompt field below to start a run.</p>
                    </div>
                    <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 sm:inline-flex">
                      <div className="h-2 w-2 rounded-full bg-emerald-300" />
                      API ready
                    </div>
                  </div>

                  <div className="mt-5 max-h-[44vh] space-y-4 overflow-y-auto pr-1 no-scrollbar">
                    {messages.map((msg, idx) => (
                      <ChatMessage key={idx} message={msg} />
                    ))}

                    {isLoading && (
                      <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/8 p-4">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Agents are working</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Retrieving sources, validating claims, and preparing the final report.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSearch} className="relative mt-5">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-fuchsia-500/20 blur-xl" />
                    <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 p-2 shadow-2xl shadow-black/25">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about a paper, topic, or comparison..."
                        className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/25 focus:bg-white/[0.05]"
                      />
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                            <Search className="h-3.5 w-3.5" />
                            ArXiv
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                            <Database className="h-3.5 w-3.5" />
                            Scholar
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Local fallback
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Run research
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Current run</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Workflow trace</h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { label: 'Query', value: runSummary.query || 'Waiting for input' },
                      { label: 'Mode', value: modeLabels[runSummary.mode] || 'Full pipeline' },
                      { label: 'Plan steps', value: runSummary.planSteps.toString() },
                      { label: 'Sources', value: `${runSummary.academicResults + runSummary.webResults}` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                        <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <FileText className="h-4 w-4 text-cyan-300" />
                    What changed
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                    <p>Local Ollama fallback is now available if Gemini fails.</p>
                    <p>The backend reports provider details so the UI can show the actual execution path.</p>
                    <p>Source cards and workflow logs make the system easier to explain in interviews.</p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/6 bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-fuchsia-500/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Live signals
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[
                      {
                        label: 'Provider',
                        value: runSummary.provider,
                      },
                      {
                        label: 'Updated',
                        value: runSummary.lastUpdated || 'Idle',
                      },
                      {
                        label: 'Trace messages',
                        value: runSummary.messages.length ? `${runSummary.messages.length}` : '0',
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
                        <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
