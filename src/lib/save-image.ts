'use client';
/**
 * Save an image without leaving the page. On phones that can share files, this opens
 * the share sheet (where "Save Image" puts it in Photos); everywhere else it downloads.
 */
export async function saveImage(url: string, filename: string): Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'> {
  try {
    const res = await fetch(url);
    if (!res.ok) return 'failed';
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return 'shared'; } catch { return 'cancelled'; }
    }
    const a = document.createElement('a');
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
