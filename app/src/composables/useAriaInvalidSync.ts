import { onMounted, onUnmounted } from 'vue'

// Syncs CSS :user-invalid state to aria-invalid attribute on input fields
const FIELD_SELECTOR = 'input, textarea, select'

interface AriaInvalidSync {
  sync: (event: Event) => void
  /** Clears aria-invalid on input as soon as value becomes valid */
  syncIfFlagged: (event: Event) => void
}

// Removes only flags it set: components bind aria-invalid themselves for errors CSS cannot see
export function createAriaInvalidSync(): AriaInvalidSync {
  const flagged = new WeakSet<EventTarget>()

  function sync(event: Event): void {
    const field = event.target as HTMLElement | null
    if (!field?.matches?.(FIELD_SELECTOR)) {
      return
    }
    if (field.matches(':user-invalid')) {
      field.setAttribute('aria-invalid', 'true')
      flagged.add(field)
    }
    else if (flagged.delete(field)) {
      field.removeAttribute('aria-invalid')
    }
  }

  function syncIfFlagged(event: Event): void {
    if (event.target && flagged.has(event.target)) {
      sync(event)
    }
  }

  return { sync, syncIfFlagged }
}

export function useAriaInvalidSync(): void {
  const { sync, syncIfFlagged } = createAriaInvalidSync()

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
