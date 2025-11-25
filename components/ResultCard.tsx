import React, { useState, useCallback } from 'react';
import { CopyIcon, CheckIcon } from './icons';

interface ResultCardProps {
  title: string;
  content: string | string[];
  isTag?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, content, isTag = false }) => {
  const [copied, setCopied] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = useCallback(() => {
    const textToCopy = Array.isArray(content) ? content.join('\n') : content;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  const handleIndividualCopy = useCallback((textToCopy: string, index: number) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    });
  }, []);
  
  const renderContent = () => {
    if (Array.isArray(content) && title === "Ideias de Títulos") {
        return (
            <ul className="space-y-3">
                {content.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-md transition-shadow hover:shadow-md">
                        <span className="flex-1 mr-4 text-gray-200">{item}</span>
                        <button
                            onClick={() => handleIndividualCopy(item, index)}
                            className={`p-2 rounded-full transition-all duration-200 ${copiedIndex === index ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-purple-600 text-gray-300'}`}
                            aria-label="Copy title"
                        >
                            {copiedIndex === index ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    </li>
                ))}
            </ul>
        );
    }
    if (Array.isArray(content)) {
      return (
        <ul className="list-disc list-inside space-y-2">
          {content.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    if (isTag) {
      return (
        <div className="flex flex-wrap gap-2">
            {content.split(',').map(tag => tag.trim()).map((tag, index) => (
                <span key={index} className="bg-gray-700 text-purple-300 text-sm font-medium px-2.5 py-1 rounded-full">{tag}</span>
            ))}
        </div>
      )
    }
    return <p className="whitespace-pre-wrap text-gray-300">{content}</p>;
  }


  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 relative">
      <h2 className="text-xl font-bold text-purple-400 mb-4">{title}</h2>
      <div className="prose prose-invert max-w-none text-gray-300">
        {renderContent()}
      </div>
       {title !== "Ideias de Títulos" && (
            <button
                onClick={handleCopy}
                className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-purple-600 text-gray-300'}`}
                aria-label="Copy to clipboard"
            >
                {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
       )}
    </div>
  );
};

export default ResultCard;