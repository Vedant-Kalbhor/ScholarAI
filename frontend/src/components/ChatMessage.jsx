import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Bot, FileText, Link2, User } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  if (message.type === 'results') {
    return (
      <div className="rounded-[1.75rem] border border-white/6 bg-slate-950/45 p-4 shadow-lg shadow-black/10">
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
          <Link2 className="h-4 w-4 text-cyan-300" />
          Retrieved source cards
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {message.data.map((paper, idx) => (
            <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.05]">
              <div className="flex items-start justify-between gap-3">
                <h4 className="line-clamp-2 text-sm font-semibold leading-6 text-white" title={paper.title}>
                  {paper.title}
                </h4>
                <FileText className="h-4 w-4 shrink-0 text-cyan-300" />
              </div>

              <p className="mt-2 text-xs text-slate-400">{paper.authors?.join(', ') || 'Unknown author'}</p>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{paper.summary}</p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/8 bg-slate-950/50 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {paper.published ? paper.published.slice(0, 4) : 'Paper'}
                </span>

                {paper.pdf_url ? (
                  <a
                    href={paper.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    Open PDF
                    <Link2 className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 rounded-[1.75rem] border p-4 shadow-lg shadow-black/10 ${
        isUser
          ? 'ml-auto max-w-[92%] flex-row-reverse border-cyan-400/20 bg-cyan-400/10'
          : 'border-white/6 bg-slate-950/45'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          isUser ? 'border-cyan-400/20 bg-cyan-400 text-slate-950' : 'border-white/5 bg-white/[0.04]'
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-cyan-300" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{isUser ? 'You' : 'ScholarAI'}</p>
          {message.type && !isUser ? (
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {message.type}
            </span>
          ) : null}
        </div>

        <div className="prose prose-invert prose-slate max-w-none text-sm leading-7 prose-headings:mb-3 prose-headings:mt-4 prose-p:my-2 prose-strong:text-white prose-a:text-cyan-300 prose-table:block prose-table:overflow-x-auto prose-th:border prose-th:border-white/10 prose-td:border prose-td:border-white/10 prose-th:bg-white/[0.05] prose-td:px-3 prose-td:py-2 prose-th:px-3 prose-th:py-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
