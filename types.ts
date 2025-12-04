
export interface ExtractedImage {
  id: string;
  originalUrl: string;
  resultUrl: string;
  timestamp: number;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "16:9" | "9:16";

export enum ImageQuality {
  STANDARD = 'standard', // gemini-2.5-flash-image
  HD = 'hd',             // gemini-3-pro (2K)
  UHD = 'uhd'            // gemini-3-pro (4K)
}

export interface ExtractionSettings {
  inputImage: File;
  aspectRatio: AspectRatio;
  quality: ImageQuality;
}

export interface MergeSettings {
  productImage: File;
  modelImage: File;
  prompt: string;
  aspectRatio: AspectRatio;
  quality: ImageQuality;
}
