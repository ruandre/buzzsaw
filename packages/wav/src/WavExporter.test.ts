import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineSoundRenderer } from './OfflineSoundRenderer.js'
import { WavExporter } from './WavExporter.js'

describe('wavExporter', () => {
  const originalDocument = globalThis.document
  const originalURL = globalThis.URL

  beforeEach(() => {
    globalThis.document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(),
    } as unknown as Document

    globalThis.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL
  })

  afterEach(() => {
    globalThis.document = originalDocument
    globalThis.URL = originalURL
  })

  it('renders audio buffer and creates blob', async () => {
    const mockAudioBuffer = {
      getChannelData: () => new Float32Array(100),
      length: 100,
      numberOfChannels: 1,
      sampleRate: 44100,
    } as unknown as AudioBuffer

    vi.spyOn(OfflineSoundRenderer, 'render').mockResolvedValue(mockAudioBuffer)

    const blob = await WavExporter.renderToWavBlob({
      duration: 0.1,
      frequency: 440,
      waveType: 'sine',
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + 100 * 2)

    vi.mocked(OfflineSoundRenderer.render).mockRestore()
  })

  it('renders WAV ArrayBuffer directly', async () => {
    const mockAudioBuffer = {
      getChannelData: () => new Float32Array(50),
      length: 50,
      numberOfChannels: 1,
      sampleRate: 44100,
    } as unknown as AudioBuffer

    vi.spyOn(OfflineSoundRenderer, 'render').mockResolvedValue(mockAudioBuffer)

    const buffer = await WavExporter.renderToWavArrayBuffer({
      frequency: 440,
    })

    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(buffer.byteLength).toBe(44 + 50 * 2)

    vi.mocked(OfflineSoundRenderer.render).mockRestore()
  })

  it('triggers browser download when downloadWav is called', async () => {
    const blob = new Blob([new ArrayBuffer(100)], { type: 'audio/wav' })
    const mockClick = vi.fn()
    const mockAnchor = {
      click: mockClick,
      download: '',
      href: '',
      style: {},
    }

    vi.mocked(globalThis.document.createElement).mockReturnValue(mockAnchor as unknown as HTMLElement)

    await WavExporter.downloadWav(blob, 'laser.wav')

    expect(mockAnchor.download).toBe('laser.wav')
    expect(mockClick).toHaveBeenCalled()
    expect(globalThis.document.body.appendChild).toHaveBeenCalledWith(mockAnchor)
  })

  it('reports the missing document before attempting to render', async () => {
    globalThis.document = undefined as unknown as Document
    const render = vi.spyOn(OfflineSoundRenderer, 'render')

    await expect(WavExporter.downloadWav({ frequency: 440 })).rejects.toThrow(/requires a DOM document/)
    expect(render).not.toHaveBeenCalled()

    render.mockRestore()
  })
})
