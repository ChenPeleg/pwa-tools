/**
 * PWA Installation functionality
 * Handles the custom installation prompt and installation process
 */
import {pwaInstallPromptStyle} from './pwa-install-prompt-style.ts';

  // Define the BeforeInstallPromptEvent interface since it's not standard
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}


export type PromptLanguage = 'en' | 'he';


interface PromptText {
  installAsApp: string;
  approve: string;
  onlyBrowser: string;
}


class InstallPromptManager {
  // Singleton instance
  private static instance: InstallPromptManager | null = null;

  private installPrompt: BeforeInstallPromptEvent | null = null;

  private readonly language: PromptLanguage = 'he';

  private readonly textContent: Record<PromptLanguage, PromptText> = {
    en: {
      installAsApp: 'Install as App',
      approve: 'Install',
      onlyBrowser: 'Continue in Browser'
    },
    he: {
      installAsApp: 'התקנת כאפליקציה',
      approve: 'אישור',
      onlyBrowser: 'רק בדפדפן'
    }
  };
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor(language: PromptLanguage = 'he') {
    this.language = language;
  }
  

  public static getInstance(language: PromptLanguage = 'he'): InstallPromptManager {
    if (!InstallPromptManager.instance) {
      InstallPromptManager.instance = new InstallPromptManager(language);
    }
    return InstallPromptManager.instance;
  }
  

  public static hasInstance(): boolean {
    return InstallPromptManager.instance !== null;
  }

  public initInstallPrompt(): void {
 

    window.addEventListener('beforeinstallprompt', (event) => {

      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.showInstallPrompt();
    });
  }

  private createCustomPrompt(): HTMLDivElement {
    const text = this.textContent[this.language];
    const customPrompt = document.createElement('div');
    customPrompt.style.position = 'fixed';
    customPrompt.style.width = '100%';
    customPrompt.style.height = '100%';
    const shadowPrompt = customPrompt.attachShadow({ mode: 'open' });


    // Set direction attribute based on language
    const direction = this.language === 'he' ? 'rtl' : 'ltr';

    shadowPrompt.innerHTML = `<style>
         ${pwaInstallPromptStyle}
        </style>
    <div class="install-app-prompt">
      <div dir="${direction}" class="inner-prompt">
        <span>${text.installAsApp}</span>
        <div class="buttons-container">
          <button id="approve-install-btn"> ${text.approve}</button>
          <button id="disapprove-install-btn"> ${text.onlyBrowser}</button>
        </div>
      </div>
    </div>`;
    
    return customPrompt;
  }
  
  /**
   * Show the custom prompt
   */
  private showInstallPrompt(): void {
  
    if (window.location.hash !== '#install') {
      // Condition commented out but kept for future reference
    }
  
    if (localStorage.getItem('install-prompt2') === 'disapproved') {
      return;
    }
  
    const customPrompt = this.createCustomPrompt();
 
 
    const shadowRoot = customPrompt.shadowRoot;
    
    document.body.appendChild(customPrompt);
   
    shadowRoot?.querySelector('#disapprove-install-btn')?.addEventListener('click', () => {
      localStorage.setItem('install-prompt', 'disapproved');
      customPrompt.setAttribute('hidden', '');
    });
  
    shadowRoot?.querySelector('#approve-install-btn')?.addEventListener('click', async () => {
      if (!this.installPrompt) {
        return;
      }
      const result = await this.installPrompt.prompt();
      console.log(`Install prompt was: ${result.outcome}`);
      this.installPrompt = null;
  
      customPrompt.setAttribute('hidden', '');
    });
  }
}

// Export a function to create and initialize the singleton instance
export const addInstallPrompt = ({ language }: { language: PromptLanguage }) => {
  // Abort if an instance already exists
  if (InstallPromptManager.hasInstance()) {
    console.log('Install prompt manager instance already exists, aborting initialization');
    return;
  }
  
  const installPromptManager = InstallPromptManager.getInstance(language);
  installPromptManager.initInstallPrompt();
}

