
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionSettings, MergeSettings, ImageQuality } from "../types";
import { VARIATION_CONFIGS } from "../constants";

export const checkApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (hasKey) return true;
  }
  if (process.env.API_KEY) return true;
  return false;
};

export const selectApiKey = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};

const resizeImage = async (file: File, maxDimension = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(e.target?.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const fileToPart = async (file: File) => {
  const resizedBase64Url = await resizeImage(file);
  const base64Data = resizedBase64Url.split(',')[1];
  return {
    inlineData: {
      data: base64Data,
      mimeType: 'image/jpeg',
    },
  };
};

// Helper to determine model and size based on quality
const getModelConfig = (quality: ImageQuality) => {
  let modelName = 'gemini-2.5-flash-image';
  let imageSize: string | undefined = undefined;

  if (quality === ImageQuality.HD) {
    modelName = 'gemini-3-pro-image-preview';
    imageSize = '2K';
  } else if (quality === ImageQuality.UHD) {
    modelName = 'gemini-3-pro-image-preview';
    imageSize = '4K';
  }
  return { modelName, imageSize };
};

const handleResponse = (response: any, defaultError: string) => {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error(defaultError + " (No candidates)");
  }

  const candidate = response.candidates[0];

  // Check for Safety block
  if (candidate.finishReason === 'SAFETY') {
    throw new Error("Ảnh bị chặn bởi bộ lọc an toàn của Google. Vui lòng thử ảnh khác ít nhạy cảm hơn.");
  }

  // Iterate parts to find image
  if (candidate.content && candidate.content.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        // Dynamically use the returned mimeType
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
    // If no image found, look for text to explain why
    for (const part of candidate.content.parts) {
      if (part.text) {
        console.warn("Model returned text instead of image:", part.text);
        // Throw the model's explanation as the error
        throw new Error(part.text); 
      }
    }
  }

  throw new Error(defaultError);
};

export const extractProduct = async (settings: ExtractionSettings): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { modelName, imageSize } = getModelConfig(settings.quality);
  
  const imagePart = await fileToPart(settings.inputImage);
  
  const extractionPrompt = `
    NHIỆM VỤ: Bạn là chuyên gia xử lý ảnh thời trang.
    
    YÊU CẦU:
    1. Xác định trang phục/sản phẩm chính trong ảnh.
    2. TẠO RA MỘT HÌNH ẢNH MỚI chỉ chứa sản phẩm đó trên nền trắng tinh khiết (Hex #FFFFFF).
    3. Loại bỏ hoàn toàn người mẫu (tay, chân, đầu, tóc) và nền cũ.
    4. Giữ nguyên form dáng sản phẩm như đang được mặc (Ghost Mannequin).
    5. Đảm bảo chất lượng ảnh cao, rõ nét.
  `;

  const config: any = {
    imageConfig: {
      aspectRatio: settings.aspectRatio,
    }
  };
  if (imageSize) {
    config.imageConfig.imageSize = imageSize;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [imagePart, { text: extractionPrompt }]
      },
      config: config
    });

    return handleResponse(response, "Không thể tách sản phẩm. Vui lòng thử lại.");
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};

export const mergeProductWithModel = async (settings: MergeSettings & { 
  style?: string, 
  pose?: string, 
  background?: string, 
  angle?: string, 
  lighting?: string, 
  modelType?: string, 
  season?: string,
  hairstyle?: string 
}): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { modelName, imageSize } = getModelConfig(settings.quality);

  const productPart = await fileToPart(settings.productImage);
  const modelPart = await fileToPart(settings.modelImage);

  // Base prompt construction
  let basePrompt = `
    NHIỆM VỤ: Tạo bộ ảnh Lookbook thời trang chuyên nghiệp (4 Dáng Khác Nhau).
    INPUT:
    - Ảnh 1: Sản phẩm thời trang (Product Reference).
    - Ảnh 2: Dáng người mẫu tham khảo (Pose Reference).
    MÔ TẢ Ý TƯỞNG (PROMPT): "${settings.prompt}"
  `;

  // Append user options
  basePrompt += "\nTHÔNG SỐ KỸ THUẬT:";
  if (settings.modelType) basePrompt += `\n- Người mẫu: ${settings.modelType}`;
  if (settings.style) basePrompt += `\n- Phong cách: ${settings.style}`;
  
  // HAIRSTYLE LOGIC - Strict enforcement
  if (settings.hairstyle) {
    basePrompt += `\n- KIỂU TÓC (CỐ ĐỊNH): ${settings.hairstyle}`;
    basePrompt += `\nLƯU Ý QUAN TRỌNG: Phải sử dụng chính xác kiểu tóc "${settings.hairstyle}" cho tất cả các hình ảnh.`;
  } else {
    basePrompt += `\n- KIỂU TÓC: Giữ kiểu tóc tự nhiên, phù hợp.`;
  }

  // BACKGROUND LOGIC - Strict enforcement for consistency
  if (settings.background) {
    basePrompt += `\n- BỐI CẢNH (CỐ ĐỊNH CHO TẤT CẢ ẢNH): ${settings.background}`;
  } else {
    // Default consistent background if none selected
    basePrompt += `\n- BỐI CẢNH (CỐ ĐỊNH CHO TẤT CẢ ẢNH): Professional Fashion Studio. Clean, neutral background (White/Grey/Beige) to highlight the product. Softbox lighting.`;
  }

  if (settings.lighting) basePrompt += `\n- Ánh sáng: ${settings.lighting}`;
  if (settings.season) basePrompt += `\n- Thời gian: ${settings.season}`;
  if (settings.angle) basePrompt += `\n- Góc máy chung: ${settings.angle}`;

  // IMPORTANT: ENFORCE FULL BODY RULES
  basePrompt += `
    QUAN TRỌNG VỀ GÓC MÁY (FRAMING RULES):
    1. BẮT BUỘC CHỤP TOÀN THÂN (FULL BODY SHOT).
    2. KHÔNG ĐƯỢC CẮT ĐẦU HOẶC CẮT CHÂN (DO NOT CROP HEAD OR FEET).
    3. Phải nhìn thấy giày/chân của người mẫu.
    4. Sử dụng ống kính góc rộng (Wide Angle Lens) để lấy hết dáng.
    
    HƯỚNG DẪN CHUNG:
    1. Tạo người mẫu AI (Photorealistic) mặc chính xác trang phục từ Ảnh 1.
    2. Sử dụng đúng Bối Cảnh và Kiểu Tóc đã cố định ở trên cho TẤT CẢ các ảnh.
    3. Chất lượng studio, độ nét cao.
  `;

  const config: any = {
    imageConfig: {
      aspectRatio: settings.aspectRatio,
    }
  };
  if (imageSize) {
    config.imageConfig.imageSize = imageSize;
  }

  // Define Variations logic: SAME BACKGROUND, DIFFERENT POSES
  const variations = VARIATION_CONFIGS.POSE_VARIATIONS.map((v, i) => ({
    name: `Pose ${i+1}: ${v.label}`,
    instruction: v.instruction
  }));

  try {
    // Execute 4 requests in parallel
    const promises = variations.map(async (variant) => {
      // Add specific pose instruction to the base prompt
      const variantPrompt = `${basePrompt}\n\n${variant.instruction}\n(NHẮC LẠI: FULL BODY SHOT - KHÔNG CẮT CHÂN)`;
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [productPart, modelPart, { text: variantPrompt }]
          },
          config: config
        });
        return handleResponse(response, "Error");
      } catch (e) {
        console.warn(`Failed to generate ${variant.name}`, e);
        return null; 
      }
    });

    const results = await Promise.all(promises);
    const validImages = results.filter((img): img is string => img !== null);
    
    if (validImages.length === 0) {
      throw new Error("Không thể tạo ảnh nào. Vui lòng thử lại với prompt khác.");
    }
    
    return validImages;
  } catch (error) {
    console.error("Merge Error:", error);
    throw error;
  }
};

export const generateCreativePrompt = async (productImage: File): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = await fileToPart(productImage);

    const prompt = `
        Đóng vai Creative Director thời trang.
        Gợi ý 3 ý tưởng (Prompt) khác nhau để chụp Lookbook cho sản phẩm trong ảnh này.
        1. Street Style
        2. Luxury / High Fashion
        3. Casual / Daily wear

        Output: JSON Array of strings. Example: ["Prompt 1", "Prompt 2", "Prompt 3"].
        Ngôn ngữ: Tiếng Việt.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [imagePart, { text: prompt }]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Prompt Suggestion Error:", e);
        // Fallback suggestions if API fails or parsing error
        return ["Gợi ý 1: Người mẫu dạo phố tự tin, ánh sáng tự nhiên.", "Gợi ý 2: Chụp trong studio phông nền trơn, tập trung sản phẩm.", "Gợi ý 3: Bối cảnh quán cafe ấm cúng, phong cách nàng thơ."];
    }
};

export const generateVideoPrompt = async (
    originalPrompt: string, 
    variationLabel: string, 
    settings: { style: string, background: string, lighting: string, modelType: string }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert Prompt Engineer for Video Generation AI (like Sora, Veo, Runway Gen-3).
        
        TASK: Convert the following Static Fashion Image parameters into a highly detailed, cinematic VIDEO PROMPT (in English).
        
        CONTEXT:
        - Original Idea: "${originalPrompt}"
        - Variation Pose/Angle: ${variationLabel}
        - Background/Environment: ${settings.background || "Studio"}
        - Lighting: ${settings.lighting}
        - Model Look: ${settings.modelType}
        - Fashion Style: ${settings.style}

        REQUIREMENTS:
        1. Describe the SUBJECT: Model details, clothing texture, fabric movement (flowing, shining).
        2. Describe the ACTION: Subtle movements matching the pose (walking, turning head, hair blowing, posing).
        3. Describe CAMERA WORK: Camera angles, movement (Slow motion, Dolly zoom, Pan, Bokeh).
        4. Describe ATMOSPHERE: Lighting quality, mood, color grading.
        5. Output Format: A single, cohesive, high-quality paragraph in English. NO introductions or markdown headers.
        
        EXAMPLE OUTPUT:
        "Cinematic slow motion shot of a Vietnamese fashion model walking confidently through a neon-lit cyberpunk street at night. She is wearing a futuristic silver dress that reflects the city lights. Her hair blows gently in the wind. The camera tracks backward in front of her with a shallow depth of field, blurring the busy crowd in the background. High contrast lighting, 8k resolution, photorealistic, fashion film aesthetic."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { text: prompt }
        });

        return response.text || "Could not generate video prompt.";
    } catch (e) {
        console.error("Video Prompt Error:", e);
        return "Failed to generate video prompt. Please try again.";
    }
};

export const generateFashionVideo = async (
  imageBase64DataUrl: string, 
  prompt: string
): Promise<string> => {
  // Use a new instance to ensure we pick up the latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Extract base64 data and mimeType from data URL
  const matches = imageBase64DataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
      throw new Error("Invalid image data URL format");
  }
  const mimeType = matches[1];
  const base64Data = matches[2];

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Fashion cinematic shot, subtle movement, high quality",
      image: {
        imageBytes: base64Data,
        mimeType: mimeType, 
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16' // Default vertical for fashion
      }
    });

    console.log("Video operation started:", operation);

    // Polling for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log("Checking video status...", operation);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("Video generation completed but no URI returned.");
    }

    // Fetch the actual video content to create a blob URL (safely handling the API Key)
    const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
    const videoResponse = await fetch(downloadUrl);
    
    if (!videoResponse.ok) {
        throw new Error("Failed to download generated video.");
    }

    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};
