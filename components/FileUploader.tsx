
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloudIcon } from './icons';

interface FileUploaderProps {
  onFilesAdded: (files: FileList) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  }, [onFilesAdded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative w-full p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-300 ${
        isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'
      }`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/gif, image/webp, image/svg+xml"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4 text-slate-600">
        <UploadCloudIcon className="w-12 h-12 text-slate-400" />
        <p className="text-lg font-semibold">
          Arraste e solte seus arquivos aqui
        </p>
        <p className="text-sm text-slate-500">ou</p>
        <p className="text-indigo-600 font-medium">Clique para selecionar os arquivos</p>
        <p className="text-xs text-slate-400 mt-2">
          Suporta PNG, JPG, GIF, WEBP, SVG
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
