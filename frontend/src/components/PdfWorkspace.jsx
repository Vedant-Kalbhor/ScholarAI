import { useMemo, useState } from 'react';
import {
  BookOpenText,
  Bot,
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import ChatMessage from './ChatMessage';

const parseProvider = (provider = '') => {
  if (!provider) return 'Ready for Gemini or Ollama fallback';
  if (provider.toLowerCase().includes('ollama')) return 'llama3:latest via Ollama';
  if (provider.toLowerCase().includes('gemini')) return 'Gemini';
  return provider;
};

const PdfWorkspace = ({ apiUrl }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text:
        'Upload a PDF and then ask follow-up questions. The backend will chunk the document, store it in the vector database, and answer using Gemini first with a local llama3:latest fallback if needed.',
    },
  ]);
  const [documentInfo, setDocumentInfo] = useState({
    filename: '',
    chunksStored: 0,
    summary: '',
    provider: '',
    sources: [],
    lastUpdated: '',
  });

  const stats = useMemo(
    () => [
      { label: 'Indexed file', value: documentInfo.filename || 'None yet' },
      { label: 'Chunks stored', value: documentInfo.chunksStored.toString().padStart(2, '0') },
      { label: 'LLM path', value: parseProvider(documentInfo.provider) },
      { label: 'Sources shown', value: documentInfo.sources.length.toString().padStart(2, '0') },
    ],
    [documentInfo.chunksStored, documentInfo.filename, documentInfo.provider, documentInfo.sources.length],
  );

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const resp = await fetch(`${apiUrl}/api/pdf/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.error || 'PDF upload failed.');
      }

      setDocumentInfo((prev) => ({
        ...prev,
        filename: data.filename || selectedFile.name,
        chunksStored: data.chunks_stored || 0,
        summary: data.summary || '',
        provider: data.provider || prev.provider,
        lastUpdated: new Date().toLocaleTimeString(),
      }));

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'summary',
          text: `### PDF indexed successfully\n\n**File:** ${data.filename || selectedFile.name}\n\n**Chunks stored:** ${data.chunks_stored || 0}\n\n${data.summary ? `### Generated summary\n\n${data.summary}` : ''}`,
        },
      ]);
      setSelectedFile(null);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I could not index the PDF: ${error.message}`,
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQuestion = question.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userQuestion }]);
    setQuestion('');
    setAsking(true);

    try {
      const resp = await fetch(`${apiUrl}/api/pdf/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuestion }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data?.detail || data?.error || 'PDF query failed.');
      }

      const sourceBlock = (data.sources || [])
        .map(
          (source, index) =>
            `- **Source ${index + 1}** (${source.source || 'document'}): ${source.content || 'No snippet available.'}`,
        )
        .join('\n');

      const answerText = [
        `### Answer`,
        '',
        data.answer || 'No answer returned.',
        '',
        data.provider ? `**Model path:** ${parseProvider(data.provider)}` : '',
        sourceBlock ? `\n### Retrieved snippets\n${sourceBlock}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'answer',
          text: answerText,
        },
      ]);

      setDocumentInfo((prev) => ({
        ...prev,
        provider: data.provider || prev.provider,
        sources: data.sources || [],
        lastUpdated: new Date().toLocaleTimeString(),
      }));
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I could not answer that question: ${error.message}`,
        },
      ]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
      <section className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-200">
              <BookOpenText className="h-3.5 w-3.5" />
              PDF chatbot with RAG
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Upload a document and ask questions over its contents.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              This workspace chunks the PDF, stores embeddings in ChromaDB, and answers with Gemini first, then
              falls back to local llama3:latest through Ollama if needed.
            </p>
          </div>

          <div className="grid min-w-[240px] gap-3 rounded-3xl border border-white/5 bg-slate-950/40 p-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{stat.value}</p>
                </div>
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-white/6 bg-slate-950/45 p-4 sm:p-5">
          <form onSubmit={handleUpload} className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-400/8">
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-fuchsia-300" />
                <div className="min-w-0">
                  <p className="font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Choose a PDF to index'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Stored locally and indexed for follow-up questions.
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              Index PDF
            </button>
          </form>

          <div className="mt-5 max-h-[46vh] space-y-4 overflow-y-auto pr-1 no-scrollbar">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}

            {asking && (
              <div className="flex items-start gap-3 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/8 p-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10">
                  <Loader2 className="h-4 w-4 animate-spin text-fuchsia-200" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Reading your PDF</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Retrieving the most relevant chunks and drafting a grounded answer.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAsk} className="relative mt-5">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-fuchsia-500/20 via-cyan-500/10 to-amber-400/10 blur-xl" />
            <div className="relative rounded-3xl border border-white/10 bg-slate-950/80 p-2 shadow-2xl shadow-black/25">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the uploaded PDF..."
                className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-fuchsia-400/25 focus:bg-white/[0.05]"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                    <Bot className="h-3.5 w-3.5" />
                    Gemini
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                    <User className="h-3.5 w-3.5" />
                    llama3 fallback
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
                    <Link2 className="h-3.5 w-3.5" />
                    Retrieved snippets
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask PDF
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-white/6 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            <FileText className="h-4 w-4 text-fuchsia-300" />
            Indexed document
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">File</p>
              <p className="mt-1 text-sm font-medium text-white">{documentInfo.filename || 'No PDF uploaded yet'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Last indexed</p>
              <p className="mt-1 text-sm font-medium text-white">{documentInfo.lastUpdated || 'Idle'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {documentInfo.summary || 'Upload a PDF to generate a quick summary and enable question answering.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/6 bg-gradient-to-br from-fuchsia-500/10 via-slate-900/50 to-cyan-500/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            <Link2 className="h-4 w-4 text-cyan-300" />
            Retrieved snippets
          </div>

          <div className="mt-4 space-y-3">
            {documentInfo.sources.length ? (
              documentInfo.sources.map((source, index) => (
                <div key={`${source.source}-${index}`} className="rounded-2xl border border-white/5 bg-slate-950/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    {source.source || `Source ${index + 1}`}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{source.content}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/5 bg-slate-950/35 p-4 text-sm leading-6 text-slate-300">
                Ask a question to see the most relevant chunks from the indexed PDF.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default PdfWorkspace;
