import React from 'react';
import { Button } from './Button';
import { selectApiKey } from '../services/geminiService';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  const handleConnect = async () => {
    try {
      await selectApiKey();
      // Assuming successful selection if promise resolves without error
      // In a real scenario, we might want to check `hasSelectedApiKey` again, 
      // but the prompt guidance suggests assuming success to avoid race conditions.
      onKeySelected();
    } catch (error) {
      console.error("Failed to select key", error);
      alert("Có lỗi xảy ra khi chọn API Key. Vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.636 14.536 6.636 9.636 11.536 6.636 14.536 5.743 6.743A6 6 0 0113.5 1m0 0V0m0 8a8 8 0 100 16 8 8 0 000-16z" />
            </svg>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Kết nối Google Gemini</h3>
          <p className="text-sm text-gray-500 mt-2">
            Để sử dụng tính năng tạo ảnh chất lượng cao (4K/8K) và chỉnh sửa ảnh mỹ phẩm, bạn cần chọn API Key từ dự án Google Cloud có trả phí.
          </p>
        </div>
        <div className="mt-6 flex flex-col space-y-3">
          <Button onClick={handleConnect} className="w-full">
            Chọn API Key
          </Button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noreferrer"
            className="text-xs text-primary-600 hover:text-primary-800 underline"
          >
            Tìm hiểu về thanh toán API
          </a>
        </div>
      </div>
    </div>
  );
};