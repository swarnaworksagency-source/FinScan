import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ProcessingStatus } from '@/types';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  selectedFile: File | null;
  processingStatus?: ProcessingStatus;
  maxSize?: number;
}

export function FileUploader({
  onFileSelect,
  onRemove,
  selectedFile,
  processingStatus,
  maxSize = 50 * 1024 * 1024
}: FileUploaderProps) {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File size exceeds 50MB limit');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Only PDF, DOCX, and XLSX files are allowed');
      } else {
        setError('Failed to upload file');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize,
    multiple: false,
    disabled: !!selectedFile
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return <File className="w-8 h-8 text-primary" />;
  };

  const getStatusIcon = () => {
    if (!processingStatus) return null;

    switch (processingStatus.stage) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'extracting':
        return <Loader2 className="w-5 h-5 animate-spin text-purple-500" />;
      case 'parsing':
        return <Loader2 className="w-5 h-5 animate-spin text-orange-500" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (selectedFile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-start space-x-3 flex-1">
                {getFileIcon(selectedFile.name)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  {processingStatus && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon()}
                        <span className="text-sm text-gray-600">{processingStatus.message}</span>
                      </div>
                      {processingStatus.stage !== 'completed' && processingStatus.stage !== 'failed' && (
                        <Progress value={processingStatus.progress} className="h-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {!processingStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {processingStatus?.stage === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {processingStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

          {isDragActive ? (
            <p className="text-lg font-medium text-primary">Drop your file here...</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag & drop your financial document
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse
              </p>
              <Button type="button" variant="outline" className="mx-auto">
                Select File
              </Button>
            </>
          )}

          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p>Supported formats: PDF, DOCX, XLSX</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
