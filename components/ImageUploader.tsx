import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  label: string;
  description?: string;
  onImageSelected: (file: File | null) => void;
  selectedFile: File | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ label, description, onImageSelected, selectedFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      onImageSelected(null);
      setPreview(null);
    }
  };

  const handleClear = () => {
    onImageSelected(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      
      {!preview ? (
        <div 
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 cursor-pointer transition-colors bg-white"
        >
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-gray-600 justify-center">
              <span className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                Tải ảnh lên
              </span>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
        </div>
      ) : (
        <div className="relative mt-2 rounded-md overflow-hidden border border-gray-200 group">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover bg-gray-50" />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                    onClick={handleClear}
                    className="bg-white text-red-600 px-3 py-1 rounded-full text-sm font-medium shadow-md hover:bg-gray-100"
                >
                    Xóa ảnh
                </button>
            </div>
        </div>
      )}
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};