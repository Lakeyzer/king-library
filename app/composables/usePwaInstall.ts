interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
  prompt: () => Promise<void>
}

let listenersRegistered = false

export function usePwaInstall() {
  const canInstall = useState('pwa-can-install', () => false)
  const isInstalled = useState('pwa-is-installed', () => false)
  const deferredPrompt = useState<BeforeInstallPromptEvent | null>('pwa-deferred-prompt', () => null)

  const updateInstalledState = () => {
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    isInstalled.value = window.matchMedia('(display-mode: standalone)').matches || iosStandalone
  }

  if (import.meta.client && !listenersRegistered) {
    listenersRegistered = true

    updateInstalledState()
    window.matchMedia('(display-mode: standalone)').addEventListener('change', updateInstalledState)

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      deferredPrompt.value = event as BeforeInstallPromptEvent
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      canInstall.value = false
      deferredPrompt.value = null
    })
  }

  const promptInstall = async () => {
    const event = deferredPrompt.value
    if (!event) return

    deferredPrompt.value = null
    canInstall.value = false
    await event.prompt()
  }

  return { canInstall, isInstalled, promptInstall }
}
