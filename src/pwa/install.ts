/**
 * PWA Installation functionality
 * Handles the custom installation prompt and installation process
 */

// Store the installation prompt event
let installPrompt: BeforeInstallPromptEvent | null = null;

// Create custom prompt element
const createCustomPrompt = (): HTMLDivElement => {
  const customPrompt = document.createElement('div');
  customPrompt.innerHTML = `<div class="install-app-prompt"><div dir="rtl" class="inner-prompt">
<span>התקנת כאפליקציה</span><div class="buttons-container"><button id="approve-install-btn"> אישור</button>
<button id="disapprove-install-btn"> רק בדפדפן</button>
</div>
      </div>
      </div>`;
  
  return customPrompt;
};

// Show the custom prompt
const showInstallPrompt = () => {
  if (window.location.hash !== '#install' && true) {
    // Condition commented out but kept for future reference
  }

  if (localStorage.getItem('install-prompt') === 'disapproved') {
    return;
  }

  const customPrompt = createCustomPrompt();
  document.body.appendChild(customPrompt);

  document.querySelector('#disapprove-install-btn')?.addEventListener('click', () => {
    localStorage.setItem('install-prompt', 'disapproved');
    customPrompt.setAttribute('hidden', '');
  });

  document.querySelector('#approve-install-btn')?.addEventListener('click', async () => {
    if (!installPrompt) {
      return;
    }
    const result = await installPrompt.prompt();
    console.log(`Install prompt was: ${result.outcome}`);
    installPrompt = null;

    customPrompt.setAttribute('hidden', '');
  });
};

// Initialize the installation prompt listener
const initInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    showInstallPrompt();
  });
};

// Define the BeforeInstallPromptEvent interface since it's not standard
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export { initInstallPrompt };