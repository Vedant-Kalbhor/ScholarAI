import React from 'react';
import { Bookmark, Clock, ArrowRight } from 'lucide-react';

const savedPapers = [
    { title: 'Attention Is All You Need', year: 2017, author: 'Vaswani et al.', summary: 'Introduced the Transformer architecture.' },
    { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', year: 2020, author: 'Lewis et al.', summary: 'The foundational RAG paper combining parametric and non-parametric memory.' },
    { title: 'Sparks of Artificial General Intelligence', year: 2023, author: 'Bubeck et al.', summary: 'Explorations with GPT-4 and reasoning.' },
];

const timelineData = [
    { year: '2017', desc: 'Transformers Introduced' },
    { year: '2019', desc: 'BERT & Pre-training Era' },
    { year: '2020', desc: 'GPT-3 & foundational RAG' },
    { year: '2023', desc: 'Agentic workflows & Gemini/GPT-4' },
];

const Dashboard = () => {
    return (
        <div className="space-y-8 animate-slide-up">
            <h2 className="text-3xl font-extrabold text-white">Research Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Saved Papers Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Bookmark className="text-indigo-400 w-5 h-5" />
                        <h3 className="text-xl font-bold text-neutral-100">Saved Papers</h3>
                    </div>
                    <div className="space-y-4">
                        {savedPapers.map((paper, idx) => (
                            <div key={idx} className="group p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/50 hover:border-indigo-500/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-indigo-300">{paper.title}</h4>
                                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">{paper.year}</span>
                                </div>
                                <p className="text-xs text-neutral-400 mt-1">{paper.author}</p>
                                <p className="text-sm mt-3 text-neutral-300">{paper.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Research Timeline Visual */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <Clock className="text-indigo-400 w-5 h-5" />
                        <h3 className="text-xl font-bold text-neutral-100">Evolution of Language Models</h3>
                    </div>

                    <div className="space-y-6 relative z-10 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-purple-500">
                        {timelineData.map((item, idx) => (
                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" />
                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white/5 border border-white/10 p-4 rounded-xl shadow-lg">
                                    <div className="flex items-center justify-between space-x-2 mb-1">
                                        <div className="font-bold text-indigo-300">{item.year}</div>
                                    </div>
                                    <div className="text-sm text-neutral-300">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
