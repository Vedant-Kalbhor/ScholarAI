import React, { useState } from 'react';
import { Search, BookOpen, Layers, BarChart3, ChevronRight, Send, Loader2, Sparkles } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import Dashboard from './components/Dashboard';

const App = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Search Research');
  const [mode, setMode] = useState('full'); // summarize, compare, full

  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Research Assistant. Enter a topic below and I will search ArXiv and Google Scholar, synthesize findings, or generate a structured comparison table.' }
  ]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:8000/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.text, mode })
      });

      const data = await resp.json();
      const newMessages = [];

      // Planner output
      if (data.plan && data.plan.length > 0) {
        newMessages.push({
          role: 'assistant',
          text: `### Research Plan:\n${data.plan.map(p => `- ${p}`).join('\n')}`
        });
      }

      // Found results
      if (data.results && data.results.length > 0) {
        newMessages.push({ role: 'assistant', type: 'results', data: data.results });
      }

      // Final Report
      if (data.final_report) {
        newMessages.push({ role: 'assistant', text: data.final_report });
      } else if (data.summary) {
        // Fallback for summarize mode
        newMessages.push({ role: 'assistant', text: `### Research Synthesis:\n\n${data.summary}` });
      }

      // Comparison
      if (data.comparison) {
        newMessages.push({ role: 'assistant', text: `### Paper Comparison:\n\n${data.comparison}` });
      }

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error connecting to the backend. Please ensure the FastAPI server is running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = ['Search Research', 'Dashboard'];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">ScholarAI</span>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item)}
              className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${activeTab === item ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5 text-neutral-400 hover:text-white'
                }`}
            >
              {idx === 0 && <Search className="w-4 h-4" />}
              {idx === 1 && <BarChart3 className="w-4 h-4" />}
              <span className="text-sm font-medium">{item}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'Search Research' && (
          <div className="mt-8">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">Agent Mode</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('summarize')}
                className={`p-2 text-xs rounded-lg border text-left flex items-center gap-2 ${mode === 'summarize' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-neutral-700 hover:bg-neutral-800'}`}>
                📝 Summarize Only
              </button>
              <button
                onClick={() => setMode('compare')}
                className={`p-2 text-xs rounded-lg border text-left flex items-center gap-2 ${mode === 'compare' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-neutral-700 hover:bg-neutral-800'}`}>
                📊 Compare Only
              </button>
              <button
                onClick={() => setMode('full')}
                className={`p-2 text-xs rounded-lg border text-left flex items-center gap-2 ${mode === 'full' ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' : 'border-neutral-700 hover:bg-neutral-800'}`}>
                ✨ Full Processing (Slow)
              </button>
            </div>
          </div>
        )}

        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
          <p className="text-xs text-neutral-500 mb-2 uppercase tracking-widest font-bold">Pro Account</p>
          <p className="text-sm text-neutral-300">Upgrade for Citation Graphs & Timeline visualization.</p>
          <button className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20">
            Learn More
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 max-w-5xl mx-auto h-screen flex flex-col relative z-0">

        {activeTab === 'Dashboard' ? (
          <Dashboard />
        ) : (
          <>
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
                  Intelligent Research Core
                </h1>
                <p className="text-neutral-500 mt-2">Access ArXiv, Google Scholar, and Zotero through MCP.</p>
              </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto space-y-6 px-4 no-scrollbar pb-32">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                    <span className="text-sm bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent font-medium">Agents are processing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-neutral-900 via-neutral-900/90 to-transparent pointer-events-none">
              <div className="pointer-events-auto">
                <form onSubmit={handleSearch} className="relative group max-w-4xl mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about an AI concept, model, or paper..."
                    className="w-full bg-neutral-800/80 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all shadow-2xl"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
                <div className="mt-4 flex justify-center gap-6 text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    ArXiv Live
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Google Scholar Live
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
