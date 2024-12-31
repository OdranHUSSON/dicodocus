export async function uploadImageFromClipboard(file: File) {
    const formData = new FormData();
    formData.append('file', file);
  
    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error('Upload failed');
    }
  
    return await response.json();
  }