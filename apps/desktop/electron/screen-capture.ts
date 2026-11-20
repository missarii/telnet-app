import { desktopCapturer } from 'electron';

export interface SourceInfo {
  id: string;
  name: string;
  thumbnail: string;
}

/**
 * Returns all available screen and window capture sources.
 * Thumbnail is returned as a base64 PNG data URL.
 */
export async function getSources(): Promise<SourceInfo[]> {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
  });

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
  }));
}
