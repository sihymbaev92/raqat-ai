import AVFoundation
import Foundation

final class PrayerAzanNativePlayer: NSObject, AVAudioPlayerDelegate {
  static let shared = PrayerAzanNativePlayer()

  private var player: AVAudioPlayer?
  private var lastSoundId: String?
  private var completed = false
  private var playingDua = false
  private var sessionFullyFinished = false
  private var lastDurationMs = 0
  /** Жабу mid-dua-delay — asyncAfter playDua қайта қоспасын. */
  private var playbackGeneration: Int = 0

  private override init() {
    super.init()
  }

  func play(soundId: String) {
    guard !soundId.isEmpty, soundId != "off" else { return }
    stopInternal(keepSession: false, clearFullyFinished: true)
    playbackGeneration += 1
    lastSoundId = soundId
    completed = false
    playingDua = false
    sessionFullyFinished = false
    startPlayer(resource: "prayer_azan_user_01", ext: "mp3", isDua: false)
  }

  func playDua() {
    guard !sessionFullyFinished else { return }
    stopInternal(keepSession: true, clearFullyFinished: false)
    completed = true
    playingDua = true
    sessionFullyFinished = false
    startPlayer(resource: "prayer_azan_dua_01", ext: "mp3", isDua: true)
  }

  func stop() {
    stopInternal(keepSession: false, clearFullyFinished: true)
  }

  func playbackStatus() -> [String: Any] {
    if sessionFullyFinished, player == nil {
      return [
        "positionMs": lastDurationMs,
        "durationMs": lastDurationMs,
        "isPlaying": false,
        "completed": true,
        "isDua": false,
        "fullyFinished": true,
      ]
    }

    guard let current = player else {
      if completed, !playingDua, lastDurationMs > 0 {
        return [
          "positionMs": lastDurationMs,
          "durationMs": lastDurationMs,
          "isPlaying": false,
          "completed": true,
          "isDua": false,
          "fullyFinished": false,
        ]
      }
      return [
        "positionMs": 0,
        "durationMs": 0,
        "isPlaying": false,
        "completed": completed,
        "isDua": playingDua,
        "fullyFinished": sessionFullyFinished,
      ]
    }

    let duration = max(0, Int(current.duration * 1000))
    if duration > 0 { lastDurationMs = duration }
    return [
      "positionMs": max(0, Int(current.currentTime * 1000)),
      "durationMs": duration,
      "isPlaying": current.isPlaying,
      "completed": completed,
      "isDua": playingDua,
      "fullyFinished": false,
    ]
  }

  private func startPlayer(resource: String, ext: String, isDua: Bool) {
    guard let url = Bundle.main.url(forResource: resource, withExtension: ext) else { return }
    do {
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
      try AVAudioSession.sharedInstance().setActive(true)
      let next = try AVAudioPlayer(contentsOf: url)
      next.delegate = self
      next.prepareToPlay()
      lastDurationMs = max(0, Int(next.duration * 1000))
      player = next
      _ = next.play()
      _ = isDua
    } catch {
      stop()
    }
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    if playingDua {
      markSessionFullyFinished()
    } else {
      markAzanCompleted()
    }
    _ = flag
  }

  private func markAzanCompleted() {
    completed = true
    playingDua = false
    player = nil
    let gen = playbackGeneration
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) { [weak self] in
      guard let self else { return }
      guard self.playbackGeneration == gen else { return }
      guard !self.playingDua, !self.sessionFullyFinished else { return }
      self.playDua()
    }
  }

  private func markSessionFullyFinished() {
    completed = true
    playingDua = false
    sessionFullyFinished = true
    player = nil
  }

  private func stopInternal(keepSession: Bool, clearFullyFinished: Bool) {
    player?.stop()
    player = nil
    if !keepSession {
      playbackGeneration += 1
      lastSoundId = nil
      completed = false
      playingDua = false
      lastDurationMs = 0
      if clearFullyFinished { sessionFullyFinished = false }
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
  }
}
