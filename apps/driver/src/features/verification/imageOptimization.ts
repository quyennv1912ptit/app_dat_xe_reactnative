export const DOCUMENT_MAX_LONG_SIDE = 1800;
export const SELFIE_MAX_LONG_SIDE = 1600;
export const DOCUMENT_JPEG_QUALITY = 0.82;
const PASS_THROUGH_JPEG_MAX_BYTES = 650_000;

export type ImageOptimizationInput = {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileSize?: number | null;
};

export type ImageOptimizationResult = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number | null;
  optimized: boolean;
};

export type ImageManipulatorAdapter = (
  uri: string,
  resize: { width: number; height: number } | null,
  quality: number,
) => Promise<{ uri: string; width: number; height: number }>;

/**
 * Computes proportional target dimensions bounded by maxLongSide.
 * Returns null for low-resolution images so they are never upscaled.
 */
export function targetDocumentDimensions(
  width: number,
  height: number,
  maxLongSide = DOCUMENT_MAX_LONG_SIDE,
): { width: number; height: number } | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const longSide = Math.max(width, height);
  if (longSide <= maxLongSide) return null;
  const scale = maxLongSide / longSide;
  const nextWidth = width >= height
    ? maxLongSide
    : Math.max(2, Math.round(width * scale));
  const nextHeight = height >= width
    ? maxLongSide
    : Math.max(2, Math.round(height * scale));
  return { width: nextWidth, height: nextHeight };
}

async function defaultManipulate(
  uri: string,
  resize: { width: number; height: number } | null,
  quality: number,
): Promise<{ uri: string; width: number; height: number }> {
  const mod = await import('expo-image-manipulator');
  const format = mod.SaveFormat?.JPEG ?? ('jpeg' as never);
  if (mod.ImageManipulator?.manipulate) {
    let ctx = mod.ImageManipulator.manipulate(uri);
    if (resize) ctx = ctx.resize(resize);
    const rendered = await ctx.renderAsync();
    try {
      const saved = await rendered.saveAsync({ compress: quality, format });
      return { uri: saved.uri, width: saved.width, height: saved.height };
    } finally {
      try { rendered.release(); } catch { /* Ignore already-released refs. */ }
    }
  }
  if (mod.manipulateAsync) {
    const actions = resize ? [{ resize }] : [];
    const saved = await mod.manipulateAsync(uri, actions, { compress: quality, format });
    return { uri: saved.uri, width: saved.width, height: saved.height };
  }
  throw new Error('ImageManipulator unavailable');
}

/**
 * Normalizes capture dimensions and JPEG compression while preserving aspect ratio
 * and cleaning up superseded cache files safely.
 */
export async function optimizeCapturedImage(
  input: ImageOptimizationInput,
  options?: {
    kind?: 'document' | 'selfie';
    manipulate?: ImageManipulatorAdapter;
    statSize?: (uri: string) => number | null;
    cleanup?: (uri: string) => void;
  },
): Promise<ImageOptimizationResult> {
  const mime = (input.mimeType || 'image/jpeg').toLowerCase();
  const maxLongSide = options?.kind === 'selfie' ? SELFIE_MAX_LONG_SIDE : DOCUMENT_MAX_LONG_SIDE;
  const resize = targetDocumentDimensions(input.width, input.height, maxLongSide);
  const needsReencode = Boolean(resize)
    || mime !== 'image/jpeg'
    || input.fileSize == null
    || input.fileSize > PASS_THROUGH_JPEG_MAX_BYTES;

  if (!needsReencode) {
    return {
      uri: input.uri,
      width: input.width,
      height: input.height,
      mimeType: mime,
      fileSize: input.fileSize ?? null,
      optimized: false,
    };
  }

  try {
    const runManipulate = options?.manipulate ?? defaultManipulate;
    const result = await runManipulate(input.uri, resize, DOCUMENT_JPEG_QUALITY);
    if (!result?.uri || !Number.isFinite(result.width) || !Number.isFinite(result.height)
      || result.width < 2 || result.height < 2) {
      return {
        uri: input.uri,
        width: input.width,
        height: input.height,
        mimeType: mime,
        fileSize: input.fileSize ?? null,
        optimized: false,
      };
    }
    const nextSize = options?.statSize ? options.statSize(result.uri) : (input.fileSize ?? null);
    if (result.uri !== input.uri) {
      options?.cleanup?.(input.uri);
    }
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      mimeType: 'image/jpeg',
      fileSize: nextSize,
      optimized: true,
    };
  } catch {
    return {
      uri: input.uri,
      width: input.width,
      height: input.height,
      mimeType: mime,
      fileSize: input.fileSize ?? null,
      optimized: false,
    };
  }
}
