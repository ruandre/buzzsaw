<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Glows when audio playback is active */
    active?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    active: false,
    size: 'md',
  },
)

const SIZES = {
  sm: {
    frame: 'px-2.5 py-1 rounded-[4px]',
    svg: 'h-3.5 w-auto sm:h-4',
  },
  md: {
    frame: 'px-3 py-1.5 rounded-[5px]',
    svg: 'h-4 w-auto sm:h-4.5',
  },
  lg: {
    frame: 'px-4 py-2 rounded-[6px]',
    svg: 'h-5 w-auto sm:h-5.5',
  },
} as const

const sizeClasses = computed(() => SIZES[props.size])

// Wordmark letter paths (B-U-Z-Z-S-A-W) in reading order
const GLYPHS = [
  'M39.296 1.53601C46.1227 1.53601 51.6907 2.49601 56 4.41601C60.3093 6.33601 63.4667 9.02401 65.472 12.48C67.52 15.936 68.544 19.9253 68.544 24.448C68.544 29.0133 67.648 32.9387 65.856 36.224C64.064 39.4667 61.8027 42.0053 59.072 43.84C56.384 45.632 53.632 46.6347 50.816 46.848C53.6747 46.9333 56.6613 47.7013 59.776 49.152C62.8907 50.6027 65.536 52.928 67.712 56.128C69.888 59.328 70.976 63.616 70.976 68.992C70.976 73.984 69.9733 78.528 67.968 82.624C65.9627 86.6773 62.6347 89.92 57.984 92.352C53.376 94.7413 47.1253 95.936 39.232 95.936H0V1.53601H39.296ZM21.76 45.056L14.272 38.912H32.896C37.3333 38.912 40.576 37.9307 42.624 35.968C44.7147 34.0053 45.76 31.4667 45.76 28.352C45.76 26.2613 45.312 24.512 44.416 23.104C43.5627 21.696 42.2187 20.6293 40.384 19.904C38.5493 19.1787 36.224 18.816 33.408 18.816H11.456L21.76 8.256V45.056ZM34.752 78.592C39.104 78.592 42.3467 77.568 44.48 75.52C46.6133 73.472 47.68 70.8267 47.68 67.584C47.68 65.8773 47.3813 64.32 46.784 62.912C46.2293 61.504 45.376 60.288 44.224 59.264C43.1147 58.24 41.728 57.4507 40.064 56.896C38.4 56.3413 36.5013 56.064 34.368 56.064H14.272L21.76 49.92V89.152L11.456 78.592H34.752Z',
  'M151.148 62.08C151.148 73.9413 147.884 82.816 141.356 88.704C134.871 94.592 125.996 97.536 114.732 97.536C103.468 97.536 94.5933 94.592 88.108 88.704C81.6227 82.816 78.38 73.9413 78.38 62.08C78.38 60.5013 78.38 58.8587 78.38 57.152C78.38 55.4027 78.38 53.5893 78.38 51.712V1.53601H101.292V55.168C101.292 56.5333 101.292 57.8347 101.292 59.072C101.292 60.3093 101.292 61.4827 101.292 62.592C101.292 68.3093 102.295 72.576 104.3 75.392C106.348 78.208 109.825 79.616 114.732 79.616C119.639 79.616 123.116 78.208 125.164 75.392C127.255 72.576 128.3 68.3093 128.3 62.592V1.53601H151.148V62.08Z',
  'M184.309 78.592H223.797V95.936H158.709V81.088L198.965 18.688L199.093 18.816H161.653V1.53601H224.373V16.192L184.309 78.464V78.592Z',
  'M255.314 78.592H294.802V95.936H229.714V81.088L269.97 18.688L270.098 18.816H232.658V1.53601H295.378V16.192L255.314 78.464V78.592Z',
  'M335.983 97.536C329.114 97.536 322.991 96.4267 317.615 94.208C312.239 91.9893 308.015 88.704 304.943 84.352C301.871 79.9573 300.335 74.496 300.335 67.968C300.335 67.3707 300.335 66.7947 300.335 66.24C300.335 65.6853 300.335 65.088 300.335 64.448H323.183C323.183 65.0027 323.183 65.536 323.183 66.048C323.183 66.5173 323.183 67.008 323.183 67.52C323.183 71.232 324.25 74.176 326.383 76.352C328.559 78.528 331.823 79.616 336.175 79.616C340.484 79.616 343.812 78.9547 346.159 77.632C348.548 76.3093 349.743 74.1333 349.743 71.104C349.743 68.928 348.74 66.9653 346.735 65.216C344.772 63.4667 342.106 61.8667 338.735 60.416C335.364 58.9227 331.567 57.536 327.343 56.256C322.735 54.8053 318.426 52.8853 314.415 50.496C310.404 48.064 307.162 44.9707 304.687 41.216C302.212 37.4187 300.975 32.7253 300.975 27.136C300.975 21.4187 302.511 16.5547 305.583 12.544C308.698 8.49066 312.879 5.39733 318.127 3.264C323.418 1.088 329.348 0 335.919 0C342.703 0 348.74 1.06667 354.031 3.2C359.364 5.33333 363.567 8.49067 366.639 12.672C369.711 16.8533 371.247 22.016 371.247 28.16C371.247 28.8 371.247 29.3973 371.247 29.952C371.247 30.5067 371.247 31.0827 371.247 31.68H348.463C348.463 31.3813 348.463 30.9973 348.463 30.528C348.463 30.016 348.463 29.5893 348.463 29.248C348.463 25.792 347.503 23.04 345.583 20.992C343.663 18.9013 340.527 17.856 336.175 17.856C331.951 17.856 328.687 18.624 326.383 20.16C324.079 21.696 322.927 24 322.927 27.072C322.927 29.2907 323.823 31.1893 325.615 32.768C327.407 34.3467 329.86 35.7973 332.975 37.12C336.09 38.4 339.631 39.744 343.599 41.152C349.274 43.1147 354.244 45.2907 358.511 47.68C362.778 50.0693 366.084 53.056 368.431 56.64C370.778 60.224 371.951 64.8107 371.951 70.4C371.951 76.2027 370.415 81.1307 367.343 85.184C364.314 89.1947 360.09 92.2667 354.671 94.4C349.252 96.4907 343.023 97.536 335.983 97.536Z',
  'M374.798 95.936L397.518 1.472H433.742L456.398 95.936H432.974L415.63 15.232H415.758L398.158 95.936H374.798ZM392.846 75.072V57.6H438.542V75.072H392.846Z',
  'M463.831 95.936L450.391 1.53601H473.879L482.967 91.776L479.767 91.584L494.359 1.53601H522.519L537.047 91.584L533.847 91.776L542.935 1.53601H566.423L552.983 95.936H518.039L507.287 16.768H509.591L498.839 95.936H463.831Z',
]
</script>

<template>
  <div
    class="lcd-window relative inline-flex select-none items-center justify-center overflow-hidden transition-all duration-base group-active:scale-[0.985]"
    :class="[sizeClasses.frame, active ? 'lcd-window--active' : '']"
    role="img"
    :aria-label="`Buzzsaw Studio, ${active ? 'playing' : 'ready'}`"
  >
    <div class="lcd-grid pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
    <div class="lcd-sheen pointer-events-none absolute inset-0 z-20" aria-hidden="true" />

    <svg
      viewBox="0 0 567 98"
      :class="sizeClasses.svg"
      class="lcd-ghost pointer-events-none absolute z-5"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        v-for="(path, i) in GLYPHS"
        :key="`ghost-${i}`"
        :d="path"
        fill="currentColor"
      />
    </svg>

    <svg
      viewBox="0 0 567 98"
      :class="sizeClasses.svg"
      class="wordmark relative z-10"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        v-for="(path, i) in GLYPHS"
        :key="`glyph-${i}`"
        :d="path"
        :style="{ '--i': i }"
        class="lcd-letter"
        fill="currentColor"
      />
    </svg>
  </div>
</template>

<style scoped>
.lcd-window {
  background: linear-gradient(180deg, #cbd0bf 0%, #b8beac 100%);
  border: 1px solid #9da391;
  box-shadow:
    inset 0 1.5px 3px rgba(0, 0, 0, 0.18),
    inset 0 0.5px 1px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.85);
}

.lcd-grid {
  background-image:
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 1px, transparent 1px, transparent 2px),
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0px, rgba(0, 0, 0, 0.12) 1px, transparent 1px, transparent 2px);
  background-size: 2px 2px;
  opacity: 0.5;
}

.lcd-sheen {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.1) 36%, transparent 48%);
}

.lcd-ghost {
  color: #141c16;
  opacity: 0.08;
}

.lcd-letter {
  color: #141c16;
  opacity: 0.28;
  filter: drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.5));
  transition-property: opacity, color, filter;
  transition-duration: var(--duration-base);
  transition-timing-function: var(--ease-out);
  transition-delay: calc(var(--i) * 20ms);
}

/* Hover state: Letters become significantly less faded with forward stagger */
:global(.group:hover .lcd-letter),
.lcd-window:hover .lcd-letter {
  opacity: 0.95;
  color: #0c120e;
  filter: drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.35));
  transition-delay: calc(var(--i) * 35ms);
}

.lcd-window--active .lcd-letter {
  opacity: 1;
  color: #000000;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 3px rgba(255, 255, 255, 0.95));
  transition-delay: calc(var(--i) * 30ms);
  animation: lcd-pulse-light 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  animation-delay: calc(var(--i) * 80ms);
}

@keyframes lcd-pulse-light {
  0%,
  100% {
    opacity: 1;
    color: #000000;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 3px rgba(255, 255, 255, 0.95));
  }
  50% {
    opacity: 0.72;
    color: #1a241e;
    filter: drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.7));
  }
}

.dark .lcd-window {
  background: linear-gradient(180deg, #0b120c 0%, #040805 100%);
  border: 1px solid #162416;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.95),
    inset 0 0.5px 1px rgba(0, 0, 0, 0.7),
    0 1px 0 rgba(255, 255, 255, 0.08);
}

.dark .lcd-grid {
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(163, 230, 53, 0.07) 0px,
      rgba(163, 230, 53, 0.07) 1px,
      transparent 1px,
      transparent 2px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(163, 230, 53, 0.07) 0px,
      rgba(163, 230, 53, 0.07) 1px,
      transparent 1px,
      transparent 2px
    );
  opacity: 1;
}

.dark .lcd-sheen {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 38%, transparent 48%);
}

.dark .lcd-ghost {
  color: #a3e635;
  opacity: 0.07;
}

.dark .lcd-letter {
  color: #a3e635;
  opacity: 0.22;
  filter: drop-shadow(0 0 1px rgba(163, 230, 53, 0.2));
}

:global(.dark .group:hover .lcd-letter),
.dark .lcd-window:hover .lcd-letter {
  opacity: 0.92;
  color: #d9f99d;
  filter: drop-shadow(0 0 2px #a3e635) drop-shadow(0 0 6px rgba(163, 230, 53, 0.65));
}

.dark .lcd-window--active .lcd-letter {
  opacity: 1;
  color: #ffffff;
  filter: drop-shadow(0 0 2px #a3e635) drop-shadow(0 0 8px rgba(163, 230, 53, 0.85))
    drop-shadow(0 0 14px rgba(163, 230, 53, 0.45));
  animation: lcd-pulse-dark 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  animation-delay: calc(var(--i) * 80ms);
}

@keyframes lcd-pulse-dark {
  0%,
  100% {
    opacity: 1;
    color: #ffffff;
    filter: drop-shadow(0 0 2px #a3e635) drop-shadow(0 0 8px rgba(163, 230, 53, 0.85))
      drop-shadow(0 0 14px rgba(163, 230, 53, 0.45));
  }
  50% {
    opacity: 0.65;
    color: #bef264;
    filter: drop-shadow(0 0 1px #a3e635) drop-shadow(0 0 5px rgba(163, 230, 53, 0.5));
  }
}

@media (prefers-reduced-motion: reduce) {
  .lcd-letter {
    transition-delay: 0ms !important;
    animation: none !important;
  }
}
</style>
