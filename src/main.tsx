import { XbPlayer } from "./xbplayer"

const player = new XbPlayer({
  container: "#root",
})
// https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
// https://media.w3.org/2010/05/sintel/trailer.mp4
// https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-360p.flv

player.src = ""

export { player }
