
import React, { useState, useCallback } from 'react';
import { IconFile, IconUpload } from './Icons';

interface FileUploaderProps {
  onFileLoad: (file: { name: string; content: string }) => void;
  title: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoad, title }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileName(file.name);
        onFileLoad({ name: file.name, content });
      };
      reader.readAsText(file);
    }
  }, [onFileLoad]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.bpmn')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setFileName(file.name);
            onFileLoad({ name: file.name, content });
        };
        reader.readAsText(file);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">{title}</h3>
      <label
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        htmlFor={`file-upload-${title.replace(/\s+/g, '-')}`}
        className="relative flex justify-center w-full px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
      >
        <div className="space-y-1 text-center">
          <IconUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <span className="relative font-medium text-blue-600 hover:text-blue-500">
              <span>Upload a file</span>
              <input 
                id={`file-upload-${title.replace(/\s+/g, '-')}`}
                name={`file-upload-${title.replace(/\s+/g, '-')}`}
                type="file"
                className="sr-only"
                accept=".bpmn"
                onChange={handleFileChange}
              />
            </span>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">BPMN files only</p>
          {fileName && (
            <div className="mt-4 flex items-center justify-center text-sm font-medium text-green-700">
              <IconFile className="w-5 h-5 mr-2" />
              <span>{fileName}</span>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};
