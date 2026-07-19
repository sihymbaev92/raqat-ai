package kz.raqat.app

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log

object PrayerAzanNativePlayer {
  @Volatile private var player: MediaPlayer? = null
  @Volatile private var audioManager: AudioManager? = null
  @Volatile private var focusRequest: AudioFocusRequest? = null
  @Volatile private var lastSoundId: String? = null
  @Volatile private var lastContext: Context? = null
  @Volatile private var lastDurationMs: Int = 0
  @Volatile private var completed: Boolean = false
  @Volatile private var playingDua: Boolean = false
  /** Азан + бата толық бітті — JS экраны жабуы керек. */
  @Volatile private var sessionFullyFinished: Boolean = false

  private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
    when (change) {
      AudioManager.AUDIOFOCUS_GAIN,
      AudioManager.AUDIOFOCUS_GAIN_TRANSIENT -> {
        if (!PrayerAzanActiveSession.active) return@OnAudioFocusChangeListener
        val ctx = lastContext ?: return@OnAudioFocusChangeListener
        val soundId = lastSoundId ?: return@OnAudioFocusChangeListener
        val current = player
        if (current != null) {
          try {
            if (!current.isPlaying) current.start()
          } catch (t: Throwable) {
            Log.w("PrayerAzanNativePlayer", "Unable to resume azan after focus gain", t)
          }
        } else if (!playingDua && !completed && !sessionFullyFinished) {
          play(ctx, soundId)
        }
      }
      AudioManager.AUDIOFOCUS_LOSS -> stop()
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
        try {
          player?.pause()
        } catch (_: Throwable) {
          /* best effort */
        }
      }
    }
  }

  @Synchronized
  fun play(context: Context, soundId: String) {
    if (soundId.isBlank() || soundId == "off") return
    stopInternal(keepSession = false, clearFullyFinished = true)
    val app = context.applicationContext
    lastContext = app
    lastSoundId = soundId
    completed = false
    playingDua = false
    sessionFullyFinished = false
    PrayerAzanActiveSession.markActive(app)
    startPlayer(app, R.raw.prayer_azan_user_01, isDua = false)
  }

  /** Азан біткеннен кейін азан батасы (дуа). */
  @Synchronized
  fun playDua(context: Context) {
    if (sessionFullyFinished) return
    val app = context.applicationContext
    stopInternal(keepSession = true, clearFullyFinished = false)
    lastContext = app
    completed = true
    playingDua = true
    sessionFullyFinished = false
    PrayerAzanActiveSession.markActive(app)
    startPlayer(app, R.raw.prayer_azan_dua_01, isDua = true)
  }

  private fun startPlayer(app: Context, resId: Int, isDua: Boolean) {
    try {
      val afd = app.resources.openRawResourceFd(resId)
      val next = MediaPlayer()
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
        .build()
      requestAudioFocus(app, attrs)
      next.setAudioAttributes(attrs)
      next.setWakeMode(app, PowerManager.PARTIAL_WAKE_LOCK)
      next.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
      afd.close()
      next.setOnCompletionListener {
        if (isDua) {
          markSessionFullyFinished(next)
        } else {
          markAzanCompleted(next)
        }
      }
      next.setOnErrorListener { _, what, extra ->
        Log.w("PrayerAzanNativePlayer", "Azan playback error what=$what extra=$extra")
        stop()
        true
      }
      next.prepare()
      lastDurationMs = next.duration.coerceAtLeast(0)
      player = next
      PrayerAzanActiveSession.markActive(app)
      next.start()
      Log.i(
        "PrayerAzanNativePlayer",
        if (isDua) "Started native azan dua audio" else "Started native azan audio: $lastSoundId"
      )
    } catch (t: Throwable) {
      Log.w("PrayerAzanNativePlayer", "Unable to play native azan audio", t)
      stop()
    }
  }

  private fun markAzanCompleted(finished: MediaPlayer) {
    try {
      lastDurationMs = finished.duration.coerceAtLeast(lastDurationMs)
    } catch (_: Throwable) {
      /* */
    }
    completed = true
    playingDua = false
    if (player === finished) {
      player = null
      try {
        finished.release()
      } catch (_: Throwable) {
        /* */
      }
    }
    // Session active until dua plays or user stops — karaoke can detect finish.
    lastContext?.let { PrayerAzanActiveSession.markActive(it) }
    val ctx = lastContext
    if (ctx != null && !sessionFullyFinished) {
      Handler(Looper.getMainLooper()).postDelayed(
        {
          if (!playingDua && !sessionFullyFinished && PrayerAzanActiveSession.isActive(ctx)) {
            playDua(ctx)
          }
        },
        280L
      )
    }
  }

  private fun markSessionFullyFinished(finished: MediaPlayer) {
    try {
      lastDurationMs = finished.duration.coerceAtLeast(lastDurationMs)
    } catch (_: Throwable) {
      /* */
    }
    if (player === finished) {
      player = null
      try {
        finished.release()
      } catch (_: Throwable) {
        /* */
      }
    }
    playingDua = false
    completed = true
    sessionFullyFinished = true
    abandonAudioFocus()
    // Keep active until JS closes screen / finishAzanDelivery.
    lastContext?.let { PrayerAzanActiveSession.markActive(it) }
    Log.i("PrayerAzanNativePlayer", "Azan + dua fully finished")
    // FSI/экранды мұнда жаппаймыз — JS PrayerAzanScreen / finishAzanDelivery жабады.
    // Ерте dismissAzanDelivery құлып экранындағы FSI-ді өшіріп, PIN сұратуға әкелуі мүмкін.
  }

  @Synchronized
  fun stop() {
    stopInternal(keepSession = false, clearFullyFinished = true)
  }

  private fun stopInternal(keepSession: Boolean, clearFullyFinished: Boolean) {
    val current = player
    player = null
    if (current != null) {
      try {
        if (current.isPlaying) current.stop()
      } catch (_: Throwable) {
        /* best effort */
      }
      try {
        current.release()
      } catch (_: Throwable) {
        /* best effort */
      }
    }
    if (!keepSession) {
      clearReplayState()
      completed = false
      playingDua = false
      lastDurationMs = 0
      if (clearFullyFinished) sessionFullyFinished = false
      abandonAudioFocus()
      lastContext?.let { PrayerAzanActiveSession.clear(it) }
        ?: run { PrayerAzanActiveSession.active = false }
    }
  }

  private fun clearReplayState() {
    lastContext = null
    lastSoundId = null
  }

  @Synchronized
  fun isPlaying(): Boolean {
    return try {
      player?.isPlaying == true
    } catch (_: Throwable) {
      false
    }
  }

  @Synchronized
  fun playbackStatus(): Map<String, Any> {
    val current = player
    if (sessionFullyFinished && current == null) {
      return mapOf(
        "positionMs" to lastDurationMs,
        "durationMs" to lastDurationMs,
        "isPlaying" to false,
        "completed" to true,
        "isDua" to false,
        "fullyFinished" to true,
      )
    }
    if (current == null) {
      if (completed && !playingDua && lastDurationMs > 0) {
        return mapOf(
          "positionMs" to lastDurationMs,
          "durationMs" to lastDurationMs,
          "isPlaying" to false,
          "completed" to true,
          "isDua" to false,
          "fullyFinished" to false,
        )
      }
      return mapOf(
        "positionMs" to 0,
        "durationMs" to 0,
        "isPlaying" to false,
        "completed" to completed,
        "isDua" to playingDua,
        "fullyFinished" to sessionFullyFinished,
      )
    }
    return try {
      val duration = current.duration.coerceAtLeast(0)
      if (duration > 0) lastDurationMs = duration
      mapOf(
        "positionMs" to current.currentPosition.coerceAtLeast(0),
        "durationMs" to duration,
        "isPlaying" to current.isPlaying,
        "completed" to completed,
        "isDua" to playingDua,
        "fullyFinished" to false,
      )
    } catch (_: Throwable) {
      mapOf(
        "positionMs" to 0,
        "durationMs" to lastDurationMs,
        "isPlaying" to false,
        "completed" to completed,
        "isDua" to playingDua,
        "fullyFinished" to sessionFullyFinished,
      )
    }
  }

  private fun requestAudioFocus(context: Context, attrs: AudioAttributes) {
    val mgr = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    audioManager = mgr
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
          .setAudioAttributes(attrs)
          .setOnAudioFocusChangeListener(focusListener)
          .build()
        focusRequest = req
        mgr.requestAudioFocus(req)
      } else {
        @Suppress("DEPRECATION")
        mgr.requestAudioFocus(
          focusListener,
          AudioManager.STREAM_ALARM,
          AudioManager.AUDIOFOCUS_GAIN
        )
      }
    } catch (t: Throwable) {
      Log.w("PrayerAzanNativePlayer", "Unable to request azan audio focus", t)
    }
  }

  private fun abandonAudioFocus() {
    val mgr = audioManager ?: return
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        focusRequest?.let { mgr.abandonAudioFocusRequest(it) }
      } else {
        @Suppress("DEPRECATION")
        mgr.abandonAudioFocus(focusListener)
      }
    } catch (_: Throwable) {
      /* best effort */
    } finally {
      focusRequest = null
      audioManager = null
    }
  }
}
