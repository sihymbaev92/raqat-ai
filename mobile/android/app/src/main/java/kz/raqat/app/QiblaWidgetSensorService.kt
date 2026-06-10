package kz.raqat.app



import android.app.Notification

import android.app.NotificationChannel

import android.app.NotificationManager

import android.app.Service

import android.appwidget.AppWidgetManager

import android.content.ComponentName

import android.content.Context

import android.content.Intent

import android.content.pm.ServiceInfo

import android.hardware.Sensor

import android.hardware.SensorEvent

import android.hardware.SensorEventListener

import android.hardware.SensorManager

import android.os.Build

import android.os.Handler

import android.os.IBinder

import android.os.Looper

import androidx.core.app.NotificationCompat

import kotlin.math.abs



/**

 * Home strip виджет: құбыла стрелкасын тегіс айналдыру (қолданба жабық/фонда).

 * Foreground — Android 8+ фон шектеуінен сенсор жұмысын сақтау.

 */

class QiblaWidgetSensorService : Service(), SensorEventListener {

  private var sensorManager: SensorManager? = null

  private var rotationSensor: Sensor? = null

  private var accelSensor: Sensor? = null

  private var magSensor: Sensor? = null

  private var gravity: QiblaWidgetHelper.Vec3? = null

  private var magnetic: QiblaWidgetHelper.Vec3? = null

  private val handler = Handler(Looper.getMainLooper())

  private var smoothedHeading: Float? = null

  private var lastWidgetPushMs = 0L

  private var lastRenderedDeg: Float? = null

  private var foregroundStarted = false



  override fun onBind(intent: Intent?): IBinder? = null



  override fun onCreate() {

    super.onCreate()

    ensureNotificationChannel()

  }



  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

    if (!hasHomeStripWidgets(this)) {

      stopSelfSafely()

      return START_NOT_STICKY

    }

    promoteForeground()

    startSensors()

    return START_STICKY

  }



  override fun onDestroy() {

    sensorManager?.unregisterListener(this)

    handler.removeCallbacksAndMessages(null)

    foregroundStarted = false

    super.onDestroy()

  }



  override fun onSensorChanged(event: SensorEvent) {

    val raw =

      when (event.sensor.type) {

        Sensor.TYPE_ROTATION_VECTOR, Sensor.TYPE_GAME_ROTATION_VECTOR -> headingFromRotation(event.values)

        Sensor.TYPE_ACCELEROMETER -> {

          gravity = QiblaWidgetHelper.Vec3(event.values[0], event.values[1], event.values[2])

          headingFromGravityMagnetic()

        }

        Sensor.TYPE_MAGNETIC_FIELD -> {

          magnetic = QiblaWidgetHelper.Vec3(event.values[0], event.values[1], event.values[2])

          headingFromGravityMagnetic()

        }

        else -> null

      } ?: return



    smoothedHeading = QiblaWidgetHelper.smoothHeading(smoothedHeading, raw)

    QiblaWidgetHelper.saveHeading(this, smoothedHeading ?: raw)

    scheduleWidgetPush()

  }



  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}



  private fun headingFromRotation(values: FloatArray): Float? {

    val rot = FloatArray(9)

    val orient = FloatArray(3)

    SensorManager.getRotationMatrixFromVector(rot, values)

    SensorManager.getOrientation(rot, orient)

    var az = Math.toDegrees(orient[0].toDouble()).toFloat()

    az = (az + 360f) % 360f

    return if (az.isFinite()) az else null

  }



  private fun headingFromGravityMagnetic(): Float? {

    val g = gravity ?: return null

    val m = magnetic ?: return null

    return QiblaWidgetHelper.headingFromGravityMagnetic(g, m)

  }



  private fun startSensors() {

    if (sensorManager != null) return

    val sm = getSystemService(SENSOR_SERVICE) as SensorManager

    sensorManager = sm

    rotationSensor =

      sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)

        ?: sm.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR)

    if (rotationSensor != null) {

      sm.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME)

      return

    }

    accelSensor = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    magSensor = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)

    accelSensor?.let { sm.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }

    magSensor?.let { sm.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME) }

  }



  private val pushRunnable =

    Runnable {

      val heading = smoothedHeading ?: QiblaWidgetHelper.readCachedHeading(this) ?: return@Runnable

      val now = System.currentTimeMillis()

      if (now - lastWidgetPushMs < PUSH_INTERVAL_MS) {

        scheduleWidgetPush()

        return@Runnable

      }

      val prev = lastRenderedDeg

      if (

        prev != null &&

          abs(QiblaWidgetHelper.angleDiff(prev.toDouble(), heading.toDouble()).toFloat()) <

            MIN_DEG_DELTA

      ) {

        scheduleWidgetPush()

        return@Runnable

      }

      lastWidgetPushMs = now

      lastRenderedDeg = heading

      try {

        PrayerWidgetViews.updateHomeStripQiblaOnly(applicationContext, heading)

      } catch (_: Throwable) {

        /* виджет жаңарту */

      }

      scheduleWidgetPush()

    }



  private fun scheduleWidgetPush() {

    handler.removeCallbacks(pushRunnable)

    handler.postDelayed(pushRunnable, PUSH_INTERVAL_MS)

  }



  private fun ensureNotificationChannel() {

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val mgr = getSystemService(NotificationManager::class.java) ?: return

    val channel =

      NotificationChannel(

        CHANNEL_ID,

        getString(R.string.widget_qibla_service_channel),

        NotificationManager.IMPORTANCE_MIN

      ).apply {

        setShowBadge(false)

        enableVibration(false)

        setSound(null, null)

      }

    mgr.createNotificationChannel(channel)

  }



  private fun promoteForeground() {

    if (foregroundStarted) return

    val notification = buildNotification()

    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    foregroundStarted = true
  }



  private fun buildNotification(): Notification {

    val launch =

      PendingIntentCompat.openApp(this)

    return NotificationCompat.Builder(this, CHANNEL_ID)

      .setSmallIcon(R.drawable.notification_icon)

      .setContentTitle(getString(R.string.widget_qibla_service_title))

      .setContentText(getString(R.string.widget_qibla_service_text))

      .setPriority(NotificationCompat.PRIORITY_MIN)

      .setOngoing(true)

      .setSilent(true)

      .setContentIntent(launch)

      .build()

  }



  private fun stopSelfSafely() {

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {

      stopForeground(STOP_FOREGROUND_REMOVE)

    } else {

      @Suppress("DEPRECATION")

      stopForeground(true)

    }

    stopSelf()

  }



  companion object {

    private const val CHANNEL_ID = "raqat_qibla_widget"

    private const val NOTIFICATION_ID = 90422

    private const val PUSH_INTERVAL_MS = 120L

    private const val MIN_DEG_DELTA = 0.45f



    fun hasHomeStripWidgets(context: Context): Boolean {

      val mgr = AppWidgetManager.getInstance(context)

      val ids =

        mgr.getAppWidgetIds(ComponentName(context, PrayerHomeStripWidgetProvider::class.java))

      return ids.isNotEmpty()

    }



    fun ensureRunning(context: Context) {

      if (!hasHomeStripWidgets(context)) return

      val app = context.applicationContext

      try {

        val intent = Intent(app, QiblaWidgetSensorService::class.java)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

          app.startForegroundService(intent)

        } else {

          app.startService(intent)

        }

      } catch (_: Throwable) {

        /* фон шектеуі */

      }

    }



    fun stopIfIdle(context: Context) {

      if (hasHomeStripWidgets(context)) return

      val app = context.applicationContext

      try {

        app.stopService(Intent(app, QiblaWidgetSensorService::class.java))

      } catch (_: Throwable) {

        /* */

      }

    }

  }

}



/** Notification content intent — MainActivity ашу. */

private object PendingIntentCompat {

  fun openApp(context: Context): android.app.PendingIntent {

    val intent =

      context.packageManager.getLaunchIntentForPackage(context.packageName)

        ?: Intent(context, MainActivity::class.java)

    val flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE

    return android.app.PendingIntent.getActivity(context, 0, intent, flags)

  }

}

