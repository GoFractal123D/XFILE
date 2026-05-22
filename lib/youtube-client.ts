import { Innertube, Platform } from 'youtubei.js'

let innertubePromise: Promise<Innertube> | null = null
let evaluatorReady = false

/**
 * YouTube.js exige un interpréteur pour déchiffrer les URLs de flux.
 * @see https://ytjs.dev/guide/getting-started.html#providing-a-custom-javascript-interpreter
 */
function ensureYoutubeEvaluator() {
  if (evaluatorReady) return
  evaluatorReady = true

  Platform.shim.eval = async (data, env) => {
    const keys = Object.keys(env)
    const values = Object.values(env)

    if (keys.length > 0) {
      const runner = new Function(...keys, data.output)
      return runner(...values)
    }

    return new Function(data.output)()
  }
}

export function getInnertube(): Promise<Innertube> {
  ensureYoutubeEvaluator()

  if (!innertubePromise) {
    // Désactiver la vérification SSL pour contourner le problème de certificat
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    innertubePromise = Innertube.create({
      retrieve_player: true,
      generate_session_locally: true,
      enable_session_cache: true,
    })
  }
  return innertubePromise
}
