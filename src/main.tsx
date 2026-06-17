import { XbPlayer } from "./xbplayer"

const player = new XbPlayer({
  container: "#root",
})

player.src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

export { player }
