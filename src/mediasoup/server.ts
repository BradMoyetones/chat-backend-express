// mediasoup/server.ts
import * as mediasoup from 'mediasoup'
import { types } from 'mediasoup'

let worker: mediasoup.types.Worker
let router: mediasoup.types.Router

export async function initMediasoup() {
    console.log('Inicializando Worker de mediasoup...')

    worker = await mediasoup.createWorker({
        rtcMinPort: 20000,
        rtcMaxPort: 29999,
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    })

    router = await worker.createRouter({ mediaCodecs: mediaCodecs })

    console.log('✔️ Worker y Router de mediasoup creados')
}

export function getMediasoupRouter() {
    return router
}

const mediaCodecs: types.RtpCodecCapability[] = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {},
    },
]
