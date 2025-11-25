
import React from 'react';
import { HistoryEntry } from '../types';
import { ArrowLeftIcon, TrashIcon } from './icons';

interface HistoryPanelProps {
    history: HistoryEntry[];
    onSelect: (entry: HistoryEntry) => void;
    onClear: () => void;
    onBack: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear, onBack }) => {
    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-purple-400">Histórico de Gerações</h2>
                <div className="flex items-center gap-4">
                     <button
                        onClick={onClear}
                        disabled={history.length === 0}
                        className="flex items-center text-sm font-semibold px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Clear history"
                    >
                        <TrashIcon />
                        <span className="ml-2 hidden sm:inline">Limpar Histórico</span>
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center text-lg font-semibold px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                    >
                        <ArrowLeftIcon />
                        <span className="hidden sm:inline">Voltar</span>
                    </button>
                </div>
            </header>

            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((entry) => (
                        <div
                            key={entry.id}
                            onClick={() => onSelect(entry)}
                            className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-purple-500 hover:shadow-lg"
                        >
                            <p className="font-semibold text-lg text-white truncate">{entry.previewText}</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-gray-800 border border-gray-700 rounded-lg p-8">
                    <p className="text-gray-400">Nenhuma geração anterior encontrada.</p>
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;
