/**
 * Image Generation API
 * This module handles all image generation related functionality
 */

export type ImageProvider = 'openai' | 'stability';

interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  numImages?: number;
  provider: ImageProvider;
  outputFormat?: 'webp' | 'png' | 'jpeg';
  apiKey: string;
}

interface GeneratedImage {
  blob: Blob;
  alt: string;
}

/**
 * Generate images using Stability AI API v2
 * @param options - Configuration options for image generation
 * @returns Promise resolving to an array of generated images
 */
async function generateWithStabilityAI(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
  const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';
  
  try {
    if (!options.apiKey) {
      throw new Error('Stability AI API key not found. Please set it in the settings.');
    }

    const formData = new FormData();
    formData.append('prompt', options.prompt);
    formData.append('output_format', options.outputFormat || 'webp');
    
    if (options.width) formData.append('width', options.width.toString());
    if (options.height) formData.append('height', options.height.toString());

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Accept': 'image/*',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Stability AI API error: ${response.statusText}`);
    }

    // Get the blob directly from the response
    const blob = await response.blob();

    return [{
      blob,
      alt: options.prompt
    }];
  } catch (error) {
    console.error('Error generating images with Stability AI:', error);
    throw error;
  }
}

/**
 * Generate images based on the provided prompt and options
 * @param options - Configuration options for image generation
 * @returns Promise resolving to an array of generated images
 */
export async function generateImages(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
  try {
    switch (options.provider) {
      case 'stability':
        return await generateWithStabilityAI(options);
      case 'openai':
        // TODO: Implement OpenAI DALL-E integration
        throw new Error('OpenAI integration not implemented yet');
      default:
        throw new Error(`Unsupported provider: ${options.provider}`);
    }
  } catch (error) {
    console.error('Error generating images:', error);
    throw error;
  }
}

/**
 * Cancel any ongoing image generation requests
 */
export function cancelImageGeneration(): void {
  // TODO: Implement cancellation logic
}

/**
 * Get the status of ongoing image generation
 * @returns Current status of image generation
 */
export function getImageGenerationStatus(): string {
  // TODO: Implement status checking logic
  return 'idle';
} 