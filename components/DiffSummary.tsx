
import React from 'react';
import { DiffResult, ModificationDetail } from '../types';
import { IconPlusCircle, IconMinusCircle, IconPencil } from './Icons';

interface DiffSummaryProps {
  diffResult: DiffResult;
  onElementHover: (id: string | null) => void;
  onElementClick: (id: string) => void;
  selectedId: string | null;
}


export const DiffSummary: React.FC<DiffSummaryProps> = ({ diffResult, onElementHover, onElementClick, selectedId }) => {
  const { addedDetails, removedDetails, modified } = diffResult;

  if (addedDetails.length === 0 && removedDetails.length === 0 && modified.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
        <h2 className="text-xl font-bold mb-2">No functional changes detected.</h2>
        <p className="text-gray-600">The two flow diagrams are identical in terms of their core elements.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Detailed Element Changes</h2>
      <p className="text-sm text-gray-500 mb-6 -mt-2">Hover over an item to highlight it in the diagrams below. Click to zoom and select.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Added */}
        <div>
          <div className="flex items-center mb-3">
            <IconPlusCircle className="h-6 w-6 text-green-500 mr-2"/>
            <h3 className="text-lg font-semibold text-green-700">Added ({addedDetails.length})</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {addedDetails.length > 0 ? (
              addedDetails.map(el => (
                <div 
                  key={el.id}
                  className={`p-2 rounded-md border cursor-pointer transition-all duration-200 ${selectedId === el.id ? 'bg-green-100 border-green-400 shadow-md' : 'bg-green-50 border-green-200 hover:shadow-lg hover:border-green-300'}`}
                  onMouseEnter={() => onElementHover(el.id)}
                  onMouseLeave={() => onElementHover(null)}
                  onClick={() => onElementClick(el.id)}
                >
                  <p className="font-medium text-sm text-gray-800">{el.name || `(ID: ${el.id})`}</p>
                  <p className="text-xs text-gray-500">{el.type}</p>
                </div>
              ))
            ) : <p className="text-sm text-gray-500">None</p>}
          </div>
        </div>

        {/* Removed */}
        <div>
          <div className="flex items-center mb-3">
            <IconMinusCircle className="h-6 w-6 text-red-500 mr-2"/>
            <h3 className="text-lg font-semibold text-red-700">Removed ({removedDetails.length})</h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {removedDetails.length > 0 ? (
              removedDetails.map(el => (
                <div 
                  key={el.id}
                  className={`p-2 rounded-md border cursor-pointer transition-all duration-200 ${selectedId === el.id ? 'bg-red-100 border-red-400 shadow-md' : 'bg-red-50 border-red-200 hover:shadow-lg hover:border-red-300'}`}
                  onMouseEnter={() => onElementHover(el.id)}
                  onMouseLeave={() => onElementHover(null)}
                  onClick={() => onElementClick(el.id)}
                  >
                  <p className="font-medium text-sm text-gray-800">{el.name || `(ID: ${el.id})`}</p>
                  <p className="text-xs text-gray-500">{el.type}</p>
                </div>
              ))
            ) : <p className="text-sm text-gray-500">None</p>}
          </div>
        </div>

        {/* Modified */}
        <div>
          <div className="flex items-center mb-3">
            <IconPencil className="h-6 w-6 text-yellow-500 mr-2"/>
            <h3 className="text-lg font-semibold text-yellow-700">Modified ({modified.length})</h3>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {modified.length > 0 ? (
              modified.map(mod => (
                <div 
                  key={mod.id}
                  className={`p-3 rounded-md border cursor-pointer transition-all duration-200 ${selectedId === mod.id ? 'bg-yellow-100 border-yellow-400 shadow-md' : 'bg-yellow-50 border-yellow-200 hover:shadow-lg hover:border-yellow-300'}`}
                  onMouseEnter={() => onElementHover(mod.id)}
                  onMouseLeave={() => onElementHover(null)}
                  onClick={() => onElementClick(mod.id)}
                >
                  <p className="font-semibold text-gray-800">{mod.name || `(ID: ${mod.id})`}</p>
                  <p className="text-xs text-gray-500 mb-2">{mod.type}</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {mod.changes.map((change, index) => (
                      <li key={index}>
                        <span className="font-medium">{change.property}:</span> 
                        <span className="text-red-600 line-through mr-2">{change.oldValue || '""'}</span>
                        <span className="text-green-600">{change.newValue || '""'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : <p className="text-sm text-gray-500">None</p>}
          </div>
        </div>

      </div>
    </div>
  );
};
