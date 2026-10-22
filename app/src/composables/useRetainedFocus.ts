import type { Ref } from 'vue'
import { watch } from 'vue'

/**
 * Keeps keyboard focus inside `container` while `isBusy` toggles controls
 * Focus on a control the toggle disables or removes moves to `fallback`, so it never drops to <body>
 */
export function useRetainedFocus(
  isBusy: () => boolean,
  container: Readonly<Ref<HTMLElement | null>>,
  fallback: Readonly<Ref<HTMLElement | null>>,
): void {
  let hadFocus = false

  // Pre flush reads focus before the DOM update disables or removes the focused control
  watch(isBusy, () => {
    hadFocus = container.value?.contains(document.activeElement) ?? false
  }, { flush: 'pre' })

  watch(isBusy, () => {
    if (hadFocus && !isUsableFocus(document.activeElement, container.value)) {
      fallback.value?.focus()
    }
  }, { flush: 'post' })
}

function isUsableFocus(active: Element | null, container: HTMLElement | null): boolean {
  const isDisabled = active instanceof HTMLButtonElement && active.disabled
  return Boolean(container?.contains(active)) && !isDisabled
}
