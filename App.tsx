
import React, { useState, useEffect } from 'react';
import { checkApiKey, extractProduct, mergeProductWithModel, generateCreativePrompt, generateVideoPrompt, generateFashionVideo } from './services/geminiService';
import { ApiKeySelector } from './components/ApiKeySelector';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { AspectRatio, ImageQuality } from './types';
import { 
  ASPECT_RATIOS, 
  QUALITY_OPTIONS, 
  FASHION_STYLES, 
  POSES, 
  BACKGROUNDS, 
  ANGLES,
  LIGHTING_OPTIONS,
  MODEL_TYPES,
  TIME_OPTIONS,
  HAIRSTYLES,
  VARIATION_CONFIGS
} from './constants';

type Tab = 'extract' | 'merge';
type ViewMode = 'grid' | 'single';

const App: React.FC = () => {
  const [apiKeyVerified, setApiKeyVerified] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('extract');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Extract State
  const [inputImage, setInputImage] = useState<File | null>(null);
  
  // Merge State
  const [mergeProductImage, setMergeProductImage] = useState<File | null>(null);
  const [mergeModelImage, setMergeModelImage] = useState<File | null>(null);
  const [mergePrompt, setMergePrompt] = useState<string>("");
  
  // Prompt Suggestion State
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Video Prompt State
  const [videoPrompt, setVideoPrompt] = useState<string>("");
  const [isVideoPromptLoading, setIsVideoPromptLoading] = useState<boolean>(false);

  // Video Generation State (Veo)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);

  // Merge Customization Options
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedPose, setSelectedPose] = useState<string>("");
  const [selectedBackground, setSelectedBackground] = useState<string>("");
  const [selectedAngle, setSelectedAngle] = useState<string>("");
  
  // New Advanced Options
  const [selectedLighting, setSelectedLighting] = useState<string>("");
  const [selectedModelType, setSelectedModelType] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedHairstyle, setSelectedHairstyle] = useState<string>("");

  // Common Result State
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [error, setError] = useState<string | null>(null);
  
  // Settings State (Shared)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [quality, setQuality] = useState<ImageQuality>(ImageQuality.STANDARD);

  // Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    checkApiKey().then(setApiKeyVerified);
  }, []);

  // Reset zoom and result when tab changes
  useEffect(() => {
    handleReset();
  }, [activeTab]);

  useEffect(() => {
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setVideoPrompt(""); // Reset video prompt when changing image
    setGeneratedVideoUrl(null); // Reset video
  }, [selectedImageIndex, generatedImages, viewMode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleError = (err: any) => {
    console.error("Processing Error:", err);
    let errorMessage = "Đã xảy ra lỗi. Vui lòng thử lại.";
    const rawMessage = err instanceof Error ? err.message : String(err);

    if (rawMessage.includes("403") || rawMessage.includes("API key")) {
      errorMessage = "API Key không hợp lệ hoặc không có quyền truy cập.";
    } else if (rawMessage.includes("429") || rawMessage.includes("quota")) {
      errorMessage = "Hệ thống đang quá tải (429). Vui lòng thử lại sau vài phút.";
    } else if (rawMessage.includes("500") || rawMessage.includes("503")) {
      errorMessage = "Lỗi máy chủ Google Gemini. Vui lòng thử lại sau.";
    } else if (rawMessage.includes("SAFETY") || rawMessage.includes("blocked")) {
      errorMessage = "Ảnh bị chặn bởi bộ lọc an toàn. Vui lòng thử ảnh khác.";
    } else if (rawMessage.includes("Rpc failed") || rawMessage.includes("xhr error")) {
      errorMessage = "Lỗi kết nối hoặc ảnh quá lớn.";
    } else if (rawMessage.includes("I cannot generate")) {
      errorMessage = rawMessage;
    }
    setError(errorMessage);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setSuggestedPrompts([]);
    setVideoPrompt("");
    setGeneratedVideoUrl(null);

    try {
      if (activeTab === 'extract') {
        if (!inputImage) return;
        const resultUrl = await extractProduct({ 
          inputImage,
          aspectRatio,
          quality
        });
        setGeneratedImages([resultUrl]);
        setViewMode('single');
      } else {
        if (!mergeProductImage || !mergeModelImage) return;
        const resultUrls = await mergeProductWithModel({
          productImage: mergeProductImage,
          modelImage: mergeModelImage,
          prompt: mergePrompt,
          aspectRatio,
          quality,
          style: selectedStyle,
          pose: selectedPose,
          background: selectedBackground,
          angle: selectedAngle,
          lighting: selectedLighting,
          modelType: selectedModelType,
          season: selectedSeason,
          hairstyle: selectedHairstyle
        });
        setGeneratedImages(resultUrls);
        if (resultUrls.length > 1) {
            setViewMode('grid');
        } else {
            setViewMode('single');
        }
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestPrompt = async () => {
    if (!mergeProductImage) {
      alert("Vui lòng tải ảnh sản phẩm trước để AI có thể gợi ý.");
      return;
    }
    setIsSuggesting(true);
    setSuggestedPrompts([]);
    try {
      const prompts = await generateCreativePrompt(mergeProductImage);
      setSuggestedPrompts(prompts);
    } catch (e) {
      console.error(e);
      alert("Không thể tạo gợi ý lúc này.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerateVideoPrompt = async () => {
      setIsVideoPromptLoading(true);
      try {
          const variation = getVariationInfo(selectedImageIndex);
          const prompt = await generateVideoPrompt(
              mergePrompt || "Fashion lookbook shoot",
              variation.label,
              {
                  style: selectedStyle,
                  background: selectedBackground,
                  lighting: selectedLighting,
                  modelType: selectedModelType
              }
          );
          setVideoPrompt(prompt);
          return prompt;
      } catch (error) {
          console.error(error);
          setVideoPrompt("Error generating video prompt.");
          return null;
      } finally {
          setIsVideoPromptLoading(false);
      }
  };

  const handleCreateVideo = async () => {
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    try {
        // 1. Generate text prompt first if empty
        let promptToUse = videoPrompt;
        if (!promptToUse) {
           promptToUse = await handleGenerateVideoPrompt() || "Cinematic fashion shot";
        }

        // 2. Call Veo API
        const currentImage = generatedImages[selectedImageIndex];
        const videoUrl = await generateFashionVideo(currentImage, promptToUse);
        setGeneratedVideoUrl(videoUrl);

    } catch (err: any) {
        const message = err.message || JSON.stringify(err);
        if (message.includes("404") || message.includes("Requested entity was not found")) {
            alert("Lỗi kết nối Video Model (404). \n\nNguyên nhân: API Key hiện tại không hỗ trợ Veo hoặc Project chưa kích hoạt thanh toán.\n\nVui lòng chọn lại API Key từ dự án Google Cloud có tính phí.");
            setApiKeyVerified(false); // Triggers the ApiKeySelector modal to appear
        } else {
            alert("Lỗi tạo video: " + message);
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  const handleSelectPrompt = (prompt: string) => {
      setMergePrompt(prompt);
      setSuggestedPrompts([]); 
  };

  const handleDownload = () => {
    const currentImage = generatedImages[selectedImageIndex];
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = `fashion-${activeTab}-${Date.now()}-${selectedImageIndex + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setGeneratedImages([]);
    setSelectedImageIndex(0);
    setError(null);
    setSuggestedPrompts([]);
    setVideoPrompt("");
    setGeneratedVideoUrl(null);
    setViewMode('single');
  };

  const getVariationInfo = (idx: number) => {
    if (activeTab === 'extract') return { label: '', description: '' };
    const config = VARIATION_CONFIGS.POSE_VARIATIONS;
    return config[idx] || { label: `Mẫu ${idx+1}`, description: '' };
  };

  const variationInfo = getVariationInfo(selectedImageIndex);
  const displayResult = generatedImages[selectedImageIndex];

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 py-4 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-rose-500 text-white p-2 rounded-lg shadow-rose-200 shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">AI Fashion Studio</h1>
                    <p className="text-xs text-rose-500 font-medium">Công cụ hình ảnh cho Shop Quần Áo</p>
                </div>
            </div>
            {(generatedImages.length > 0 || error) && (
                <Button onClick={handleReset} variant="outline" className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                    Làm lại
                </Button>
            )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 py-8">
        
        {/* Tab Navigation */}
        {!generatedImages.length && !isProcessing && (
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-rose-100 inline-flex">
                    <button
                        onClick={() => { setActiveTab('extract'); setError(null); }}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'extract' 
                            ? 'bg-rose-100 text-rose-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Tách Sản Phẩm
                    </button>
                    <button
                        onClick={() => { setActiveTab('merge'); setError(null); }}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'merge' 
                            ? 'bg-rose-100 text-rose-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        Ghép Lookbook (4 Ảnh)
                    </button>
                </div>
            </div>
        )}

        {!generatedImages.length && !isProcessing && !error ? (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-rose-100 border border-white p-6 md:p-8 transition-all">
                
                {activeTab === 'extract' ? (
                    // --- EXTRACT VIEW ---
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tách Quần Áo Khỏi Mẫu</h2>
                            <p className="text-gray-500 text-sm">Tải ảnh lên để lấy riêng sản phẩm trên nền trắng.</p>
                        </div>
                        <ImageUploader 
                            label=""
                            onImageSelected={setInputImage}
                            selectedFile={inputImage}
                        />
                        <div className="mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Tỷ lệ ảnh</label>
                                    <select 
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value as any)}
                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500 py-2"
                                    >
                                        {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Chất lượng</label>
                                    <select 
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value as any)}
                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-rose-500 focus:ring-rose-500 py-2"
                                    >
                                        {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>
                    </>
                ) : (
                    // --- MERGE VIEW ---
                    <>
                         <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ghép Đồ Vào Mẫu (Lookbook)</h2>
                            <p className="text-gray-500 text-sm">Tạo cùng lúc 4 ảnh (1 Bối cảnh, 4 Dáng Pose khác nhau)</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <ImageUploader 
                                label="1. Ảnh Sản Phẩm"
                                description="(Nên dùng ảnh đã tách nền)"
                                onImageSelected={setMergeProductImage}
                                selectedFile={mergeProductImage}
                            />
                            <ImageUploader 
                                label="2. Ảnh Dáng Mẫu/Nền"
                                description="(Mẫu mặc định hoặc bối cảnh)"
                                onImageSelected={setMergeModelImage}
                                selectedFile={mergeModelImage}
                            />
                        </div>

                        {/* Prompt Input */}
                        <div className="mb-6 relative">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-gray-800">Mô tả ý tưởng (Prompt):</label>
                                <button 
                                    onClick={handleSuggestPrompt}
                                    disabled={isSuggesting || !mergeProductImage}
                                    className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 font-medium"
                                >
                                    {isSuggesting ? (
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    )}
                                    AI Phân Tích & Gợi Ý
                                </button>
                             </div>
                             
                             {suggestedPrompts.length > 0 && (
                                <div className="mb-3 grid grid-cols-1 gap-2 bg-purple-50 p-3 rounded-xl border border-purple-100 animate-fade-in-up">
                                    <p className="text-xs text-purple-600 font-bold mb-1">Chọn một ý tưởng:</p>
                                    {suggestedPrompts.map((p, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSelectPrompt(p)}
                                            className="text-left text-xs text-gray-700 bg-white p-2 rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all"
                                        >
                                            <span className="font-bold text-purple-500 mr-1">#{idx + 1}</span> {p}
                                        </button>
                                    ))}
                                </div>
                             )}

                             <textarea
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none text-sm shadow-sm min-h-[80px]"
                                rows={3}
                                placeholder="Ví dụ: Người mẫu đang đi dạo trên phố Paris, ánh sáng tự nhiên..."
                                value={mergePrompt}
                                onChange={(e) => setMergePrompt(e.target.value)}
                             />
                        </div>

                        {/* Customization Toolbar */}
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                Tùy chỉnh nâng cao
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Người mẫu</label>
                                    <select value={selectedModelType} onChange={(e) => setSelectedModelType(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {MODEL_TYPES.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Kiểu Tóc (Đồng nhất)</label>
                                    <select value={selectedHairstyle} onChange={(e) => setSelectedHairstyle(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {HAIRSTYLES.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phong cách</label>
                                    <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {FASHION_STYLES.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Bối cảnh</label>
                                    <select value={selectedBackground} onChange={(e) => setSelectedBackground(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {BACKGROUNDS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ánh sáng</label>
                                    <select value={selectedLighting} onChange={(e) => setSelectedLighting(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {LIGHTING_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian/Mùa</label>
                                    <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {TIME_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tỷ lệ ảnh</label>
                                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Chất lượng</label>
                                    <select value={quality} onChange={(e) => setQuality(e.target.value as any)} className="w-full text-xs border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 h-9">
                                        {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-8">
                    <Button 
                        onClick={handleProcess} 
                        disabled={activeTab === 'extract' ? !inputImage : (!mergeProductImage || !mergeModelImage)}
                        className="w-full py-4 text-lg font-semibold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/30 rounded-xl transition-transform transform active:scale-[0.98]"
                    >
                        {activeTab === 'extract' ? 'Tách Lấy Quần Áo Ngay 👗' : 'Tạo 4 Ảnh Lookbook ✨'}
                    </Button>
                </div>
            </div>
        ) : (
            // --- RESULT VIEW ---
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in-up">
                {/* Input Preview Section */}
                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm sticky top-24">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <span className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                        Ảnh Đầu Vào
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {activeTab === 'extract' && inputImage && (
                             <div className="aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                <img src={URL.createObjectURL(inputImage)} alt="Input" className="w-full h-full object-contain" />
                            </div>
                        )}
                        {activeTab === 'merge' && (
                            <div className="grid grid-cols-2 gap-2">
                                {mergeProductImage && (
                                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                        <img src={URL.createObjectURL(mergeProductImage)} alt="Product" className="w-full h-full object-contain" />
                                    </div>
                                )}
                                {mergeModelImage && (
                                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                        <img src={URL.createObjectURL(mergeModelImage)} alt="Model" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Output Section */}
                <div className={`bg-white p-5 rounded-2xl border-2 ${error ? 'border-red-100 shadow-red-50' : 'border-rose-200 shadow-rose-100/50'} shadow-xl relative min-h-[400px]`}>
                    <h3 className={`font-semibold ${error ? 'text-red-700' : 'text-rose-700'} mb-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                            <span className={`${error ? 'bg-red-600' : 'bg-rose-600'} text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold`}>2</span>
                            {error ? 'Thông báo lỗi' : 'Kết Quả'}
                        </div>
                        {viewMode === 'single' && generatedImages.length > 1 && (
                            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">
                                Biến thể {selectedImageIndex + 1}/{generatedImages.length}
                            </span>
                        )}
                    </h3>
                    
                    {/* Main Display Area */}
                    <div 
                        className={`w-full ${!error ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white" : "bg-red-50"} rounded-xl overflow-hidden flex items-center justify-center relative border ${error ? 'border-red-100' : 'border-gray-100'} transition-all duration-300 ${
                        aspectRatio === '1:1' ? 'aspect-square' :
                        aspectRatio === '3:4' ? 'aspect-[3/4]' :
                        aspectRatio === '4:3' ? 'aspect-[4/3]' :
                        aspectRatio === '16:9' ? 'aspect-video' :
                        aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'
                    }`}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setIsZoomed(false)}
                        onClick={() => {
                            if (displayResult && viewMode === 'single') setIsZoomed(!isZoomed);
                        }}
                        style={{ cursor: (displayResult && viewMode === 'single') ? (isZoomed ? 'zoom-out' : 'zoom-in') : 'default' }}
                    >
                        {isProcessing ? (
                            <div className="text-center px-6">
                                <div className="animate-spin rounded-full h-14 w-14 border-[5px] border-rose-100 border-t-rose-500 mx-auto mb-4"></div>
                                <h4 className="text-lg font-medium text-gray-800 mb-1">
                                    {activeTab === 'extract' ? 'Đang tách vải...' : 'Đang thiết kế 4 mẫu...'}
                                </h4>
                                <p className="text-sm text-gray-500 animate-pulse">AI đang vẽ, vui lòng đợi...</p>
                            </div>
                        ) : error ? (
                             <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                <div className="bg-red-100 p-4 rounded-full mb-4">
                                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Không thành công</h4>
                                <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
                                <Button onClick={handleReset} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                                    Thử lại
                                </Button>
                            </div>
                        ) : viewMode === 'grid' && generatedImages.length > 1 ? (
                            // GRID VIEW
                            <div className="w-full h-full grid grid-cols-2 gap-2 p-2 bg-gray-50">
                                {generatedImages.map((img, idx) => {
                                    const info = getVariationInfo(idx);
                                    return (
                                        <div 
                                            key={idx} 
                                            className="relative w-full h-full cursor-pointer group overflow-hidden bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all"
                                            onClick={() => {
                                                setSelectedImageIndex(idx);
                                                setViewMode('single');
                                            }}
                                        >
                                            <img src={img} className="w-full h-full object-contain p-1" alt={`Variant ${idx}`} />
                                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                                                <p className="text-white font-bold text-sm">{info.label}</p>
                                                <p className="text-gray-200 text-[10px] line-clamp-2 mt-0.5 leading-tight">{info.description}</p>
                                                <div className="mt-2 flex items-center text-rose-300 text-[10px] font-bold uppercase tracking-wide">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                    Click xem lớn
                                                </div>
                                            </div>
                                            <div className="absolute top-2 left-2 bg-white/90 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm group-hover:opacity-0 transition-opacity">
                                                {info.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : displayResult ? (
                            // SINGLE VIEW
                            <>
                                {generatedImages.length > 1 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setViewMode('grid'); setIsZoomed(false); }}
                                        className="absolute top-4 left-4 z-20 bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1 transition-all border border-gray-200"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        Xem Lưới (4 ảnh)
                                    </button>
                                )}
                                <img 
                                    src={displayResult} 
                                    alt="Result" 
                                    className="w-full h-full object-contain transition-transform duration-200 ease-out"
                                    style={{
                                        transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                                        transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`
                                    }}
                                />
                                {!isZoomed && (
                                    <div className="absolute bottom-4 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                        Click để soi chi tiết vải
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Single View Actions */}
                    {displayResult && !error && viewMode === 'single' && (
                        <div className="mt-4 space-y-4 animate-fade-in-up">
                            
                            {/* Prompt Description */}
                            {variationInfo.description && (
                                <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div>
                                        <span className="font-bold block mb-0.5">{variationInfo.label}</span>
                                        {variationInfo.description}
                                    </div>
                                </div>
                            )}

                            {/* Thumbnail Selection */}
                            {generatedImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-rose-200">
                                    {generatedImages.map((img, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedImageIndex === idx ? 'border-rose-500 shadow-md ring-2 ring-rose-200 ring-offset-1' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Video Generation Section */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-600 p-1 rounded">🎬</span> Studio Quay Phim (Veo AI)
                                    </span>
                                </div>
                                
                                <div className="p-4">
                                    {!generatedVideoUrl ? (
                                        <>
                                            <p className="text-xs text-gray-500 mb-3">Tạo video điện ảnh chuyển động từ bức ảnh này. (Model: Google Veo)</p>
                                            
                                            {/* Video Prompt Area */}
                                            <div className="mb-3">
                                                 <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Kịch bản (Prompt)</label>
                                                 <div className="flex gap-2">
                                                     <input 
                                                        type="text" 
                                                        value={videoPrompt}
                                                        onChange={(e) => setVideoPrompt(e.target.value)}
                                                        placeholder="Mô tả chuyển động (VD: Người mẫu bước đi, tóc bay...)"
                                                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-purple-400 outline-none"
                                                     />
                                                     <Button 
                                                        onClick={handleGenerateVideoPrompt}
                                                        disabled={isVideoPromptLoading}
                                                        variant="secondary"
                                                        className="text-xs px-2 py-1 h-auto bg-white border border-gray-300 whitespace-nowrap"
                                                     >
                                                        ✨ AI Viết
                                                     </Button>
                                                 </div>
                                            </div>

                                            <Button 
                                                onClick={handleCreateVideo}
                                                disabled={isGeneratingVideo}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2.5"
                                            >
                                                {isGeneratingVideo ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        Đang quay phim (30s)...
                                                    </span>
                                                ) : (
                                                    '🎥 Tạo Video Chuyển Động Ngay'
                                                )}
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="animate-fade-in">
                                            <video 
                                                src={generatedVideoUrl} 
                                                controls 
                                                autoPlay 
                                                loop 
                                                className="w-full rounded-lg mb-3 shadow-sm border border-gray-200"
                                            />
                                            <div className="flex gap-2">
                                                <Button 
                                                    onClick={() => setGeneratedVideoUrl(null)} 
                                                    variant="secondary"
                                                    className="flex-1 text-xs py-2"
                                                >
                                                    Quay lại
                                                </Button>
                                                <a 
                                                    href={generatedVideoUrl} 
                                                    download={`fashion-video-${Date.now()}.mp4`}
                                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
                                                >
                                                    Tải Video MP4
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button onClick={handleDownload} className="w-full bg-gray-900 hover:bg-black text-white py-3 shadow-lg">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Tải ảnh này về (PNG)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>

      {!apiKeyVerified && <ApiKeySelector onKeySelected={() => setApiKeyVerified(true)} />}
    </div>
  );
};

export default App;
