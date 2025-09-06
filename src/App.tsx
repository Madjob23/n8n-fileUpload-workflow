import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, CheckCircle, XCircle, AlertCircle, Loader2, X, FileText, FileSpreadsheet } from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['text/plain', 'application/pdf', 'text/csv', 'application/vnd.ms-excel'];
  const allowedExtensions = ['.txt', '.pdf', '.csv'];

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(file.type) || allowedExtensions.includes(extension);
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      case 'txt':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (uploadedFile: UploadedFile): Promise<void> => {
    const formData = new FormData();
    formData.append('data', uploadedFile.file);
    formData.append('filename', uploadedFile.file.name);
    formData.append('filesize', uploadedFile.file.size.toString());
    formData.append('filetype', uploadedFile.file.type);
    formData.append('userId', 'USR' + Math.random().toString(36).substr(2, 9).toUpperCase());

    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const response = await fetch('https://madjob.app.n8n.cloud/webhook-test/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header - let browser set it with boundary
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      // Log response for debugging
      const responseText = await response.text();
      console.log('Upload response:', responseText);
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(fileList).forEach(file => {
      if (validateFile(file)) {
        const uploadedFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
          progress: 0,
        };
        newFiles.push(uploadedFile);
      }
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Auto-upload files
    newFiles.forEach(uploadFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryUpload = (uploadedFile: UploadedFile) => {
    uploadFile(uploadedFile);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            File Upload Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Upload your documents to our n8n workflow. Supports TXT, PDF, and CSV files with secure processing.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
              ${isDragging 
                ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
              }
              shadow-sm hover:shadow-md`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.pdf,.csv,text/plain,application/pdf,text/csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full transition-colors duration-300 ${
                isDragging ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Upload className={`w-12 h-12 transition-colors duration-300 ${
                  isDragging ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {isDragging ? 'Drop files here' : 'Drop files or click to browse'}
                </h3>
                <p className="text-gray-500">
                  Supports TXT, PDF, and CSV files up to 10MB each
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-full">.txt</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">.pdf</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">.csv</span>
              </div>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Upload Queue ({files.length} files)
            </h2>
            
            <div className="space-y-3">
              {files.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(uploadedFile.file)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {uploadedFile.file.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(uploadedFile.file.size)}
                          </span>
                        </div>
                        
                        {uploadedFile.status === 'uploading' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadedFile.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {uploadedFile.error && (
                          <p className="mt-1 text-xs text-red-600">
                            {uploadedFile.error}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {uploadedFile.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm text-yellow-600">Pending</span>
                        </div>
                      )}
                      
                      {uploadedFile.status === 'uploading' && (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          <span className="text-sm text-blue-600">Uploading</span>
                        </div>
                      )}
                      
                      {uploadedFile.status === 'success' && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-600">Success</span>
                        </div>
                      )}
                      
                      {uploadedFile.status === 'error' && (
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <button
                            onClick={() => retryUpload(uploadedFile)}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => removeFile(uploadedFile.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Upload Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mt-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Summary</h3>
                  <p className="text-gray-600">
                    {files.filter(f => f.status === 'success').length} of {files.length} files uploaded successfully
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((files.filter(f => f.status === 'success').length / files.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Complete</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Select Files</h4>
              <p className="text-sm text-gray-600">Choose your TXT, PDF, or CSV files to upload</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Auto Upload</h4>
              <p className="text-sm text-gray-600">Files are automatically sent to the n8n workflow</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Process Complete</h4>
              <p className="text-sm text-gray-600">Your files are processed securely in the workflow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;