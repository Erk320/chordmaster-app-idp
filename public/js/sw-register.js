/**
 * Service Worker Registration & Android PWA Install Prompt Handler
 */

let deferredInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ ServiceWorker registered with scope:', registration.scope);
      })
      .catch((err) => {
        console.warn('⚠️ ServiceWorker registration failed:', err);
      });
  });
}

// Android PWA Install Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default mini-infobar on mobile Chrome
  e.preventDefault();
  deferredInstallPrompt = e;
  
  // Show our custom install banner
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.classList.add('flex');
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }
  console.log('🎉 ChordMaster successfully installed on device!');
});

// Trigger install prompt programmatically
function triggerPwaInstall() {
  if (!deferredInstallPrompt) {
    alert('To install on Android:\n1. Tap the 3 dots (⋮) in Chrome\n2. Select "Add to Home screen" or "Install App"');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    deferredInstallPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.classList.remove('flex');
    }
  });
}

window.triggerPwaInstall = triggerPwaInstall;
