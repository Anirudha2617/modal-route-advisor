document.addEventListener('DOMContentLoaded', async () => {
    const directoryInfo = document.getElementById('directory-info');
  
    try {
      // Get the default downloads directory
      chrome.downloads.onDeterminingFilename.addListener((item) => {
        const downloadPath = item.filename;
        directoryInfo.innerHTML = `
          <strong>Downloads Directory:</strong> <br>${downloadPath}
        `;
      });
  
      // Trigger a small test download to determine the path
      const blob = new Blob(['test'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
  
      chrome.downloads.download({
        url: url,
        filename: 'temp_test.txt',
        conflictAction: 'overwrite',
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          directoryInfo.textContent = `Error: ${chrome.runtime.lastError.message}`;
        } else {
          setTimeout(() => {
            // Remove test file after getting directory
            chrome.downloads.erase({ id: downloadId });
          }, 5000);
        }
      });
    } catch (error) {
      directoryInfo.textContent = `Error: ${error.message}`;
    }
  });
  