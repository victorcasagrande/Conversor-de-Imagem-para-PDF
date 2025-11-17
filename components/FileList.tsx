
import React from 'react';
import type { UploadedFile } from '../types';
import { XIcon } from './icons';

interface FileItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  const fileSize = (file.file.size / 1024).toFixed(2); // in KB
  return (
    <div className="relative group bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute top-1 right-1 z-10">
        <button
          onClick={() => onRemove(file.id)}
          className="p-1 bg-white/50 backdrop-blur-sm rounded-full text-slate-600 hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100"
          aria-label="Remover arquivo"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="aspect-w-1 aspect-h-1 w-full bg-slate-100">
         <img src={file.previewUrl} alt={file.file.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3 text-sm">
        <p className="font-medium text-slate-800 truncate" title={file.file.name}>{file.file.name}</p>
        <p className="text-slate-500">{fileSize} KB</p>
      </div>
    </div>
  );
};


interface FileListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Arquivos Carregados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
                <FileItem key={file.id} file={file} onRemove={onRemoveFile} />
            ))}
        </div>
    </div>
  );
};

export default FileList;
