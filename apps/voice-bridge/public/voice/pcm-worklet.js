/**
 * AudioWorklet that converts the mic stream to 16-bit PCM at 16kHz, posted as
 * ArrayBuffer chunks. The ElevenLabs websocket accepts these directly.
 */
class PcmWorklet extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const channel = input[0]
    if (!channel) return true

    const out = new Int16Array(channel.length)
    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]))
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    this.port.postMessage(out.buffer, [out.buffer])
    return true
  }
}

registerProcessor('pcm-worklet', PcmWorklet)
