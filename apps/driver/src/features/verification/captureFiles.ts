import { File, Paths } from 'expo-file-system';

const cachePrefix = () => Paths.cache.uri.replace(/\/$/, '') + '/';

/** Deletes a temporary capture. Files outside the app cache are never touched. */
export function removeCacheFile(uri: string) {
  if (!uri || !uri.startsWith(cachePrefix())) return;
  try { new File(uri).delete(); } catch { /* The OS may already have purged the cache. */ }
}

export function cacheFileSize(uri: string): number | null {
  try {
    const file = new File(uri);
    return file.exists ? file.size : null;
  } catch { return null; }
}
