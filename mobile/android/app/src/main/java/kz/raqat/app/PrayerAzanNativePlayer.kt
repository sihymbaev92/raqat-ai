package kz.raqat.app

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.PowerManager
import android.util.Log

object PrayerAzanNativePlayer {
  @Volatile private var player: MediaPlayer? = null
  @Volatile private var audioManager: AudioManager? = null
  @Volatile private var focusRequest: AudioFocusRequest? = null
  @Volatile private var lastSoundId: String? = null
  @Volatile private var lastContext: Context? = null

  private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
    when (change) {
      AudioManager.AUDIOFOCUS_GAIN,
      AudioManager.AUDIOFOCUS_GAIN_TRANSIENT -> {
        val ctx = lastContext ?: return@OnAudioFocusChangeListener
        val soundId = lastSoundId ?: return@OnAudioFocusChangeListener
        val current = player
        if (current != null) {
          try {
            if (!current.isPlaying) current.start()
          } catch (t: Throwable) {
            Log.w("PrayerAzanNativePlayer", "Unable to resume azan after focus gain", t)
          }
        } else {
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
    stop()
    val app = context.applicationContext
    lastContext = app
    lastSoundId = soundId
    val resId = rawResourceId(soundId)
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
      next.setOnCompletionListener { stop() }
      next.setOnErrorListener { _, what, extra ->
        Log.w("PrayerAzanNativePlayer", "Azan playback error what=$what extra=$extra")
        stop()
        true
      }
      next.prepare()
      player = next
      PrayerAzanActiveSession.active = true
      next.start()
      Log.i("PrayerAzanNativePlayer", "Started native azan audio: $soundId")
    } catch (t: Throwable) {
      Log.w("PrayerAzanNativePlayer", "Unable to play native azan audio: $soundId", t)
      stop()
    }
  }

  @Synchronized
  fun stop() {
    val current = player ?: run {
      abandonAudioFocus()
      PrayerAzanActiveSession.active = false
      return
    }
    player = null
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
    abandonAudioFocus()
    PrayerAzanActiveSession.active = false
  }

  @Synchronized
  fun isPlaying(): Boolean {
    return try {
      player?.isPlaying == true
    } catch (_: Throwable) {
      false
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

  private fun rawResourceId(@Suppress("UNUSED_PARAMETER") soundId: String): Int {
    return R.raw.prayer_azan_user_01
  }
}
