import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Bot, User, FileText, CheckCircle2 } from 'lucide-react';

const ChatMessage = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex gap-4 p-4 rounded-2xl w-full ${isUser ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100 flex-row-reverse' : 'bg-white/5 border border-white/10 text-neutral-200'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-neutral-800 border border-neutral-700'}`}>
                {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className={`flex flex-col gap-2 w-full max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="prose prose-invert prose-indigo max-w-none w-full text-sm leading-relaxed prose-table:border-collapse prose-th:border prose-th:border-neutral-700 prose-td:border prose-td:border-neutral-700 prose-th:bg-neutral-800 prose-td:px-4 prose-td:py-2">
                    {message.type === 'results' ? (
                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                            {message.data.map((paper, idx) => (
                                <div key={idx} className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 hover:border-indigo-500/50 transition-colors">
                                    <h4 className="font-semibold text-indigo-300 line-clamp-2" title={paper.title}>{paper.title}</h4>
                                    <p className="text-xs text-neutral-400 mt-1 truncate">{paper.authors?.join(", ") || "Unknown Author"}</p>
                                    <p className="text-xs mt-2 line-clamp-3 text-neutral-300">{paper.summary}</p>
                                    {paper.pdf_url && (
                                        <a href={paper.pdf_url} target="_blank" rel="noreferrer" className="inline-flex mt-3 items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                                            <FileText className="w-3 h-3" /> View PDF
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {message.text}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
