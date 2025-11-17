
import React, { useState, useCallback, useEffect } from 'react';
import type { UploadedFile } from './types';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import { FileIcon } from './components/icons';

declare global {
  interface Window {
    jspdf: any;
  }
}

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50 text-white">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-medium">{message}</p>
    </div>
);


const ActionButtons: React.FC<{ onConvert: (mode: 'single' | 'separate') => void; disabled: boolean }> = ({ onConvert, disabled }) => (
    <div className="sticky bottom-0 left-0 right-0 w-full bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
                onClick={() => onConvert('separate')}
                disabled={disabled}
                className="w-full sm:w-auto flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
                Converter em PDFs Separados
            </button>
            <button
                onClick={() => onConvert('single')}
                disabled={disabled}
                className="w-full sm:w-auto flex-1 bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                Converter em um Único PDF
            </button>
        </div>
    </div>
);


const App: React.FC = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    
    useEffect(() => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      return () => {
        files.forEach(f => URL.revokeObjectURL(f.previewUrl));
      }
    }, []);

    const handleFilesAdded = useCallback((newFiles: FileList) => {
        const acceptedFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        const mappedFiles: UploadedFile[] = acceptedFiles.map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            previewUrl: URL.createObjectURL(file),
        }));
        setFiles(prev => {
            const newFileArray = [...prev, ...mappedFiles];
            // Clean up old object URLs
            prev.forEach(f => URL.revokeObjectURL(f.previewUrl));
            return newFileArray;
        });
    }, []);

    const handleFileRemove = useCallback((id: string) => {
        setFiles(prev => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.previewUrl);
            }
            return prev.filter(f => f.id !== id);
        });
    }, []);

    const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = dataUrl;
        });
    };

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleConversion = async (mode: 'single' | 'separate') => {
        if (files.length === 0) return;
        
        setIsLoading(true);
        setLoadingMessage('Preparando imagens...');

        const { jsPDF } = window.jspdf;

        const A4_WIDTH = 210;
        const A4_HEIGHT = 297;
        const MARGIN = 10;
        const MAX_WIDTH = A4_WIDTH - MARGIN * 2;
        const MAX_HEIGHT = A4_HEIGHT - MARGIN * 2;

        try {
            const processedImages = await Promise.all(
                files.map(async uploadedFile => {
                    const dataUrl = await fileToDataUrl(uploadedFile.file);
                    const { width, height } = await getImageDimensions(dataUrl);
                    return { dataUrl, width, height, name: uploadedFile.file.name };
                })
            );

            if (mode === 'single') {
                setLoadingMessage('Criando PDF único...');
                const pdf = new jsPDF('p', 'mm', 'a4');
                processedImages.forEach((img, index) => {
                    if (index > 0) pdf.addPage();
                    
                    const aspectRatio = img.width / img.height;
                    let pdfWidth = MAX_WIDTH;
                    let pdfHeight = pdfWidth / aspectRatio;
                    if (pdfHeight > MAX_HEIGHT) {
                        pdfHeight = MAX_HEIGHT;
                        pdfWidth = pdfHeight * aspectRatio;
                    }
                    const x = (A4_WIDTH - pdfWidth) / 2;
                    const y = (A4_HEIGHT - pdfHeight) / 2;
                    pdf.addImage(img.dataUrl, 'JPEG', x, y, pdfWidth, pdfHeight);
                });
                pdf.save('documento_combinado.pdf');
            } else { // separate
                for (let i = 0; i < processedImages.length; i++) {
                    const img = processedImages[i];
                    setLoadingMessage(`Convertendo ${i + 1}/${processedImages.length}: ${img.name}`);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    
                    const aspectRatio = img.width / img.height;
                    let pdfWidth = MAX_WIDTH;
                    let pdfHeight = pdfWidth / aspectRatio;
                    if (pdfHeight > MAX_HEIGHT) {
                        pdfHeight = MAX_HEIGHT;
                        pdfWidth = pdfHeight * aspectRatio;
                    }
                    const x = (A4_WIDTH - pdfWidth) / 2;
                    const y = (A4_HEIGHT - pdfHeight) / 2;
                    pdf.addImage(img.dataUrl, 'JPEG', x, y, pdfWidth, pdfHeight);
                    pdf.save(`${img.name.split('.').slice(0, -1).join('.') || img.name}.pdf`);
                }
            }
        } catch (error) {
            console.error("Erro na conversão para PDF:", error);
            alert("Ocorreu um erro durante a conversão. Por favor, tente novamente.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };


    return (
        <div className="min-h-screen flex flex-col">
            {isLoading && <LoadingOverlay message={loadingMessage} />}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-indigo-600"/>
                    <h1 className="text-2xl font-bold text-slate-800">Conversor de Imagem para PDF</h1>
                </div>
            </header>
            
            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow">
                    <FileUploader onFilesAdded={handleFilesAdded} />
                    <FileList files={files} onRemoveFile={handleFileRemove} />
                </div>
            </main>

            {files.length > 0 && (
                <ActionButtons onConvert={handleConversion} disabled={isLoading} />
            )}
        </div>
    );
};

export default App;
