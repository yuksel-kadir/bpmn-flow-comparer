
import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { BpmnViewer } from './components/BpmnViewer';
import { DiffSummary } from './components/DiffSummary';
import { GeminiSummary } from './components/GeminiSummary';
import { compareBpmn } from './services/bpmnComparer';
import { DiffResult } from './types';
import { IconDiagram, IconSparkles } from './components/Icons';

const App: React.FC = () => {
  const [file1, setFile1] = useState<{ name: string; content: string } | null>(null);
  const [file2, setFile2] = useState<{ name: string; content: string } | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomRequest, setZoomRequest] = useState<{ id: string | null; key: number }>({ id: null, key: 0 });

  const handleCompare = useCallback(() => {
    if (!file1 || !file2) {
      setError('Please upload both BPMN files to compare.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setDiffResult(null);
    setSelectedId(null); // Reset selection on new comparison

    try {
      const result = compareBpmn(file1.content, file2.content);
      setDiffResult(result);
    } catch (e) {
      console.error('Comparison error:', e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during comparison.';
      setError(`Failed to parse or compare BPMN files. Please ensure they are valid Camunda 7 XML files. Error: ${errorMessage}`);
      setDiffResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [file1, file2]);

  const handleElementClick = (id: string) => {
    const newSelectedId = selectedId === id ? null : id;
    setSelectedId(newSelectedId);
    setZoomRequest(prev => ({ id: newSelectedId, key: prev.key + 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <IconDiagram className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Camunda 7 Flow Comparer</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-purple-600">Powered by</span>
              <IconSparkles className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-bold text-purple-600">Gemini</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FileUploader onFileLoad={setFile1} title="Original Flow" />
            <FileUploader onFileLoad={setFile2} title="Modified Flow" />
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleCompare}
              disabled={!file1 || !file2 || isLoading}
              className="w-full md:w-1/3 flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Comparing...
                </>
              ) : 'Compare Flows'}
            </button>
          </div>
          {error && <div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</div>}
        </div>

        {diffResult && (
          <div className="space-y-8">
             <GeminiSummary diffResult={diffResult} />
             <DiffSummary diffResult={diffResult} onElementHover={setHoveredId} onElementClick={handleElementClick} selectedId={selectedId} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-2 text-center">{file1?.name || 'Original Flow'}</h2>
                <BpmnViewer xml={file1!.content} highlights={diffResult.removed} highlightColor="#FEE2E2" hoverHighlightId={hoveredId} selectedId={selectedId} zoomRequest={zoomRequest} />
              </div>
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-2 text-center">{file2?.name || 'Modified Flow'}</h2>
                <BpmnViewer xml={file2!.content} highlights={diffResult.added} highlightColor="#D1FAE5" hoverHighlightId={hoveredId} selectedId={selectedId} zoomRequest={zoomRequest} />
              </div>
            </div>
             <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-2 text-center">Modified Elements (in both flows)</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                         <h3 className="text-md font-medium mb-2 text-center text-gray-600">Original Version</h3>
                         <BpmnViewer xml={file1!.content} highlights={diffResult.modified.map(m => m.id)} highlightColor="#FEF3C7" hoverHighlightId={hoveredId} selectedId={selectedId} zoomRequest={zoomRequest} />
                    </div>
                     <div>
                         <h3 className="text-md font-medium mb-2 text-center text-gray-600">Modified Version</h3>
                         <BpmnViewer xml={file2!.content} highlights={diffResult.modified.map(m => m.id)} highlightColor="#FEF3C7" hoverHighlightId={hoveredId} selectedId={selectedId} zoomRequest={zoomRequest} />
                    </div>
                </div>
            </div>
          </div>
        )}

        {!diffResult && !isLoading && (
            <div className="text-center py-16 px-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <IconDiagram className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Ready to compare</h3>
                <p className="mt-1 text-sm text-gray-500">Upload two Camunda 7 BPMN files and click 'Compare Flows' to see the differences.</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
