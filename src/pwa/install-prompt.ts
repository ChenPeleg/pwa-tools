/**
 * PWA Installation functionality
 * Handles the custom installation prompt and installation process
 */

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

  private installPrompt: BeforeInstallPromptEvent | null = null;

  private language: PromptLanguage = 'he';

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
  constructor(language: PromptLanguage = 'he') {
    this.language = language;
  }
  

  public initInstallPrompt( ): void {

    
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
      this.showInstallPrompt();
    });
  }
  
  /**
   * Create custom prompt element based on selected language
   */
  private createCustomPrompt(): HTMLDivElement {
    const text = this.textContent[this.language];
    const customPrompt = document.createElement('div');
    
    // Set direction attribute based on language
    const direction = this.language === 'he' ? 'rtl' : 'ltr';
    
    customPrompt.innerHTML = `<div class="install-app-prompt">
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
    if (window.location.hash !== '#install' && true) {
      // Condition commented out but kept for future reference
    }
  
    if (localStorage.getItem('install-prompt') === 'disapproved') {
      return;
    }
  
    const customPrompt = this.createCustomPrompt();
    document.body.appendChild(customPrompt);
  
    document.querySelector('#disapprove-install-btn')?.addEventListener('click', () => {
      localStorage.setItem('install-prompt', 'disapproved');
      customPrompt.setAttribute('hidden', '');
    });
  
    document.querySelector('#approve-install-btn')?.addEventListener('click', async () => {
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

// Create and export a singleton instance
export const addInstallPrompt = ({language } : {language: PromptLanguage}) => {
const installPromptManager = new InstallPromptManager(language);
    installPromptManager.initInstallPrompt();
}

