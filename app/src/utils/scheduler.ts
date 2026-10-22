// INP threshold for long tasks
const LONG_TASK_BUDGET_MS = 50
// Hosts without requestIdleCallback wait this long instead, past first render
const IDLE_FALLBACK_DELAY_MS = 1000

interface SchedulerApi {
  yield?: () => Promise<void>
}

/** Yields execution to browser main thread via scheduler.yield() or setTimeout */
export async function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerApi }).scheduler
  if (typeof scheduler?.yield === 'function') {
    return scheduler.yield()
  }
  return new Promise(resolve => setTimeout(resolve, 0))
}

/** Iterates items, yielding to main thread when execution exceeds budget */
export async function forEachYielding<T>(
  items: readonly T[],
  task: (item: T, index: number) => void,
): Promise<void> {
  let sliceStart = performance.now()

  for (let index = 0; index < items.length; index++) {
    task(items[index], index)

    if (performance.now() - sliceStart >= LONG_TASK_BUDGET_MS) {
      await yieldToMain()
      sliceStart = performance.now()
    }
  }
}

/** Runs low-priority work once the main thread is idle, or after a delay where idle callbacks are missing */
export function whenIdle(task: () => void): void {
  if (typeof globalThis.requestIdleCallback === 'function') {
    globalThis.requestIdleCallback(() => task())
    return
  }
  setTimeout(task, IDLE_FALLBACK_DELAY_MS)
}
