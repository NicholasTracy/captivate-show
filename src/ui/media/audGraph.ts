type Graph = {
  ctx: AudioContext
  source: MediaElementAudioSourceNode
  analyser: AnalyserNode
  gain: GainNode
  sinkId: string
}

const graphs = new WeakMap<HTMLMediaElement, Graph>()

type CtxSink = AudioContext & { setSinkId?: (id: string) => Promise<void> }

export async function applyAudSink(ctx: AudioContext, deviceId: string) {
  if (!deviceId || !('setSinkId' in ctx)) return
  await (ctx as CtxSink).setSinkId!(deviceId)
}

/** Web Audio graph per media element — routes via AudioContext.setSinkId */
export function ensureAudGraph(
  media: HTMLMediaElement,
  muteLocal: boolean,
  deviceId: string
): Graph {
  const existing = graphs.get(media)
  if (existing) {
    existing.gain.gain.value = muteLocal ? 0 : 1
    if (existing.sinkId !== deviceId) {
      existing.sinkId = deviceId
      void applyAudSink(existing.ctx, deviceId)
    }
    return existing
  }

  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(media)
  const analyser = ctx.createAnalyser()
  const gain = ctx.createGain()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.65
  source.connect(analyser)
  analyser.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.value = muteLocal ? 0 : 1

  const graph: Graph = { ctx, source, analyser, gain, sinkId: deviceId }
  graphs.set(media, graph)
  void applyAudSink(ctx, deviceId)
  return graph
}

export function resumeAudGraph(media: HTMLMediaElement | null) {
  if (!media) return
  const graph = graphs.get(media)
  if (graph) void graph.ctx.resume()
}
