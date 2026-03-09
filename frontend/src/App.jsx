import React, { useState } from 'react';
import { Search, BookOpen, Layers, BarChart3, ChevronRight, Send, Loader2 } from 'lucide-react';

const App = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Research Assistant. How can I help you today?' }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setMessages([...messages, { role: 'user', text: query }]);
    setQuery('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I've found 5 papers on "${query}". Here's a brief summary of the most relevant ones. Would you like a detailed comparison?`,
        },
      ]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">PaperMind</span>
        </div>

        <nav className="flex flex-col gap-2">
          {['Search Research', 'Literature Reviews', 'Paper Comparison', 'Research Gaps'].map((item, idx) => (
            <button
              key={idx}
              className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 text-neutral-400 hover:text-white"
            >
              {idx === 0 && <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              {idx === 1 && <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              {idx === 2 && <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />}
              {idx === 3 && <Loader2 className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />}
              <span className="text-sm font-medium">{item}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
          <p className="text-xs text-neutral-500 mb-2 uppercase tracking-widest font-bold">Pro Account</p>
          <p className="text-sm text-neutral-300">Upgrade for Citation Graphs & Timeline visualization.</p>
          <button className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20">
            Learn More
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 max-w-5xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              Intelligent Research Core
            </h1>
            <p className="text-neutral-500 mt-2">Access ArXiv, Google Scholar, and Zotero through MCP.</p>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 no-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/10'
                    : 'bg-white/5 border border-white/10 backdrop-blur-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.role === 'assistant' && !isLoading && (
                  <div className="mt-4 flex gap-2">
                    <button className="text-[10px] px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors uppercase tracking-wider font-bold">
                      View Results
                    </button>
                    <button className="text-[10px] px-2 py-1 bg-white/10 rounded-md hover:bg-white/20 transition-colors uppercase tracking-wider font-bold">
                      Compare Top 3
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-sm text-neutral-400 italic">Analyzing knowledge base...</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mt-8 pb-4">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query any research topic... (e.g., 'Latest RAG benchmarks')"
              className="w-full bg-neutral-800/80 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-xl transition-all shadow-2xl"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-4 flex justify-center gap-6 text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
            <span className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              ArXiv Live
            </span>
            <span className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors">
               Google Scholar Connected
            </span>
            <span className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors">
               Zotero Synced
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
