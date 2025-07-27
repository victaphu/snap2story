'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

export function FileUpload({
  onFileSelect,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 3,
  className,
  disabled = false,
  selectedFiles = [],
  onRemoveFile,
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - selectedFiles.length,
    disabled,
  });

  const hasError = fileRejections.length > 0;
  const errorMessage = fileRejections[0]?.errors[0]?.message;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-50",
          hasError && "border-destructive bg-destructive/5",
          selectedFiles.length >= maxFiles && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          
          {isDragActive ? (
            <p className="text-primary font-medium">Drop the files here...</p>
          ) : (
            <>
              <p className="font-medium">
                {selectedFiles.length >= maxFiles
                  ? `Maximum of ${maxFiles} files allowed`
                  : "Drag & drop files here, or click to select"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG up to {Math.round(maxSize / (1024 * 1024))}MB each
              </p>
            </>
          )}
        </div>
        
        {hasError && (
          <p className="text-sm text-destructive mt-2">{errorMessage}</p>
        )}
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group border rounded-lg p-4 bg-card"
            >
              <div className="flex items-center gap-3">
                <Image className="h-8 w-8 text-muted-foreground flex-shrink-0" aria-label="File icon" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}