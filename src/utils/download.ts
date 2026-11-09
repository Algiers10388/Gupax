/**
 * Safe client-side file downloader utility
 * Designed to work reliably across desktop, mobile browsers, and iframe sandboxes.
 */

export async function downloadAsset(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2500);
    return true;
  } catch (err) {
    console.warn('Blob download fallback to direct anchor:', err);
    // Fallback: direct navigation with download attribute
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): boolean {
  try {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2500);
    return true;
  } catch (err) {
    console.error('Text file download failed:', err);
    return false;
  }
}
