import { useTimeoutFn } from '@vueuse/core'
import { onScopeDispose, readonly, ref } from 'vue'

/** Temporary boolean flag that resets automatically after durationMs */
export function useTransientFlag(durationMs: number) {
  const isRaised = ref(false)
  const { start, stop } = useTimeoutFn(() => {
    isRaised.value = false
  }, durationMs, { immediate: false })

  function raise(): void {
    isRaised.value = true
    start()
  }

  function lower(): void {
    stop()
    isRaised.value = false
  }

  onScopeDispose(stop)

  return { isRaised: readonly(isRaised), raise, lower }
}
