import { onMounted, onUnmounted } from 'vue'

// Syncs CSS :user-invalid state to aria-invalid attribute on input fields
const FIELD_SELECTOR = 'input, textarea, select'

function sync(event: Event): void {
  const field = event.target as HTMLElement | null
  if (!field?.matches?.(FIELD_SELECTOR)) {
    return
  }
  if (field.matches(':user-invalid')) {
    field.setAttribute('aria-invalid', 'true')
  }
  else {
    field.removeAttribute('aria-invalid')
  }
}

// Clears aria-invalid on input as soon as value becomes valid
function syncIfFlagged(event: Event): void {
  const field = event.target as HTMLElement | null
  if (field?.getAttribute('aria-invalid') === 'true') {
    sync(event)
  }
}

export function useAriaInvalidSync(): void {
  onMounted(() => {
    if (!CSS.supports('selector(:user-invalid)')) {
      return
    }
    // Non-bubbling focus/blur events captured in capture phase
    document.addEventListener('blur', sync, true)
    document.addEventListener('focus', sync, true)
    document.addEventListener('input', syncIfFlagged)
  })

  onUnmounted(() => {
    document.removeEventListener('blur', sync, true)
    document.removeEventListener('focus', sync, true)
    document.removeEventListener('input', syncIfFlagged)
  })
}
