import { ImageGenerationJobData } from '../types/index';
interface ImageGenerationResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
    previewData?: any;
}
export declare const processImageGeneration: (params: ImageGenerationJobData) => Promise<ImageGenerationResult>;
export declare const processWithProgress: (params: ImageGenerationJobData, progressCallback: (progress: number, message: string) => void) => Promise<ImageGenerationResult>;
export {};
//# sourceMappingURL=imageProcessor.d.ts.map