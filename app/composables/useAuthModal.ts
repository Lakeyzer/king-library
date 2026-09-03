export function useAuthModal() {
  const isOpen = useState('auth-modal-open', () => false)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return { isOpen, open, close }
}
