
import React, { useState, useCallback, useEffect } from 'react';
import { generateContent, refineContent } from './services/geminiService';
import { GeneratedContent, GroundingChunk, HistoryEntry } from './types';
import ResultCard from './components/ResultCard';
import { SparklesIcon, LoadingSpinner, HistoryIcon, SendIcon } from './components/icons';
import HistoryPanel from './components/HistoryPanel';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [citations, setCitations] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [view, setView] = useState<'main' | 'history'>('main');

  // Refinement states
  const [refinementText, setRefinementText] = useState<string>('');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem('gemini-content-history');
        if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
        }
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        localStorage.removeItem('gemini-content-history');
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setCitations([]);

    try {
      const { content, citations: searchCitations } = await generateContent(transcript);
      setGeneratedContent(content);
      setCitations(searchCitations);

      // Save to history
      const newHistoryEntry: HistoryEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          previewText: content.titles[0] || `Geração de ${new Date().toLocaleDateString()}`,
          content,
          citations: searchCitations,
      };

      setHistory(prevHistory => {
          const updatedHistory = [newHistoryEntry, ...prevHistory].slice(0, 10);
          localStorage.setItem('gemini-content-history', JSON.stringify(updatedHistory));
          return updatedHistory;
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [transcript, isLoading]);

  const handleRefine = async () => {
      if (!generatedContent || !refinementText.trim() || isRefining) return;

      setIsRefining(true);
      try {
          const updatedScript = await refineContent(generatedContent.longScript, refinementText);
          setGeneratedContent({
              ...generatedContent,
              longScript: updatedScript
          });
          setRefinementText(''); // Clear input on success
      } catch (err) {
          setError("Falha ao atualizar o roteiro. Tente novamente.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
      setGeneratedContent(entry.content);
      setCitations(entry.citations);
      setError(null);
      setView('main');
      window.scrollTo(0, 0);
  };

  const handleClearHistory = () => {
      if (window.confirm("Tem certeza de que deseja limpar todo o histórico? Esta ação não pode ser desfeita.")) {
          setHistory([]);
          localStorage.removeItem('gemini-content-history');
      }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <div className="flex justify-center items-center mb-4 max-w-4xl mx-auto relative">
            <div className="flex items-center">
              <SparklesIcon />
              <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 ml-2">
                Gerador de Conteúdo de Vídeo
              </h1>
            </div>
            <button
                onClick={() => setView('history')}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Ver histórico"
            >
                <HistoryIcon />
            </button>
          </div>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Cole um roteiro, título ou nome de produto, e a IA irá analisar, pesquisar na web e criar um pacote completo de conteúdo para seu próximo sucesso!
          </p>
        </header>

        {view === 'main' ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl mb-8">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Cole um roteiro, transcrição, título de vídeo ou nome de produto aqui..."
                  className="w-full h-48 p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 resize-none mb-4"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !transcript.trim()}
                  className="w-full flex items-center justify-center text-lg font-semibold px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:scale-100"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analisando e Criando...
                    </>
                  ) : (
                    'Gerar Conteúdo'
                  )}
                </button>
              </form>
            </div>

            {isLoading && <LoadingSpinner />}
            
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mb-6">
                <strong>Erro:</strong> {error}
              </div>
            )}

            {generatedContent && (
              <div className="space-y-8">
                <div>
                    <ResultCard title="Roteiro para Vídeo Longo (~8 min)" content={generatedContent.longScript} />
                    
                    {/* Interaction / Refinement Field */}
                    <div className="mt-4 bg-gray-800/80 p-4 rounded-lg border border-purple-500/30 shadow-inner">
                        <label className="block text-sm font-medium text-purple-300 mb-2">
                           ✨ IA Assistente: Deseja ajustar, melhorar ou alterar o roteiro acima?
                        </label>
                        <div className="flex gap-2">
                            <textarea
                                value={refinementText}
                                onChange={(e) => setRefinementText(e.target.value)}
                                placeholder="Ex: Deixe o tom mais humorado, remova a parte sobre custos, adicione uma chamada para ação..."
                                className="flex-1 p-3 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none h-16"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRefine();
                                    }
                                }}
                            />
                            <button
                                onClick={handleRefine}
                                disabled={!refinementText.trim() || isRefining}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg text-white font-medium transition-colors flex items-center justify-center min-w-[50px]"
                                title="Enviar solicitação"
                            >
                                {isRefining ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <SendIcon />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <ResultCard title="Roteiro para Vídeo Curto (~1.5 min)" content={generatedContent.shortScript} />
                <ResultCard title="Ideias de Títulos" content={generatedContent.titles} />
                <ResultCard title="Descrição (SEO Otimizado)" content={generatedContent.description} />
                <ResultCard title="Tags (15 Melhores)" content={generatedContent.tags} isTag={true} />
                
                {citations.length > 0 && (
                   <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
                      <h2 className="text-xl font-bold text-purple-400 mb-4">Fontes da Web</h2>
                      <ul className="list-disc list-inside space-y-2">
                          {citations.map((citation, index) => citation.web && (
                              <li key={index}>
                                  <a href={citation.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline hover:text-blue-300">
                                      {citation.web.title || citation.web.uri}
                                  </a>
                              </li>
                          ))}
                      </ul>
                   </div>
                )}
              </div>
            )}
          </div>
        ) : (
            <HistoryPanel
                history={history}
                onSelect={handleSelectHistory}
                onClear={handleClearHistory}
                onBack={() => setView('main')}
            />
        )}
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Powered by Google Gemini API</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
