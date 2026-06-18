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
  private val focusListener = AudioManager.OnAudioFocusChangeListener { }

  @Synchronized
  fun play(context: Context, soundId: String) {
    stop()
    val app = context.applicationContext
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
  }

  private fun requestAudioFocus(context: Context, attrs: AudioAttributes) {
    val mgr = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    audioManager = mgr
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
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
          AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
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

  private fun rawResourceId(soundId: String): Int {
    return when (soundId) {
      "adhan_madina_clear" -> R.raw.prayer_azan_user_02
      "adhan_makkah_live" -> R.raw.prayer_azan_user_03
      "adhan_soft_cc0" -> R.raw.prayer_azan_user_04
      "adhan_takbir_high" -> R.raw.prayer_azan_user_05
      else -> R.raw.prayer_azan_user_01
    }
  }
}
