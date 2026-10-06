import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'

let player: AudioPlayer | null = null

/** Bipe do fim do descanso. Um único player para o app todo, criado no primeiro uso */
export function playBeep() {
  try {
    if (!player) {
      // "duckOthers" abaixa a música do usuário durante o bipe em vez de pausá-la
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {})
      player = createAudioPlayer(require('@/assets/sounds/beep.mp3'))
      player.volume = 0.6
    }
    const current = player
    current.seekTo(0).then(() => current.play()).catch(() => {})
  } catch {
    // sem som não é motivo para interromper o treino
  }
}
