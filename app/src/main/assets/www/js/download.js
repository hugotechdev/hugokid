(async () => {
  const label = document.getElementById('download-status');
  try {
    const response = await fetch('/api/android-download', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not check the download.');
    const { available, size } = await response.json();
    if (!available) {
      label.textContent = 'The Android download is not available yet.';
      return;
    }
    label.textContent = 'Android APK · ' + (size / (1024 * 1024)).toFixed(1) + ' MB';
    document.getElementById('download-apk').hidden = false;
  } catch {
    label.textContent = 'Could not check the download. Refresh this page to try again.';
  }
})();
