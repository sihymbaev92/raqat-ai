package kz.raqat.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.acos
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

/** Виджет құбыла чипі — bearing + құрылғы heading (сensors). */
object QiblaWidgetHelper {
  private const val PREFS = "raqat_prayer_widget"
  private const val KEY_HEADING = "qibla_heading"
  private const val KEY_HEADING_AT = "qibla_heading_at_ms"
  /** JS / sensor кэш — виджет фонда жаңарғанда */
  private const val HEADING_MAX_AGE_MS = 5L * 60L * 1000L

  private const val KAABA_LAT = 21.422487
  private const val KAABA_LNG = 39.826206
  const val ALIGN_THRESHOLD_DEG = 8.0

  fun saveHeading(context: Context, headingDeg: Float) {
    if (!headingDeg.isFinite()) return
    context
      .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putFloat(KEY_HEADING, (headingDeg + 360f) % 360f)
      .putLong(KEY_HEADING_AT, System.currentTimeMillis())
      .apply()
  }

  fun readCachedHeading(context: Context): Float? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val at = prefs.getLong(KEY_HEADING_AT, 0L)
    if (at <= 0L || System.currentTimeMillis() - at > HEADING_MAX_AGE_MS) return null
    val h = prefs.getFloat(KEY_HEADING, Float.NaN)
    return if (h.isFinite()) h else null
  }

  /** Sensor → кэш; фонда sensor жоқ болса — соңғы heading. */
  fun resolveHeading(context: Context): Float? {
    val live = readHeadingDegrees(context, timeoutMs = 900L)
    if (live != null) {
      saveHeading(context, live)
      return live
    }
    return readCachedHeading(context)
  }

  fun bearingToKaaba(latDeg: Double, lngDeg: Double): Double {
    val phi1 = Math.toRadians(latDeg)
    val phi2 = Math.toRadians(KAABA_LAT)
    val dLambda = Math.toRadians(KAABA_LNG - lngDeg)
    val y = sin(dLambda) * cos(phi2)
    val x = cos(phi1) * sin(phi2) - sin(phi1) * cos(phi2) * cos(dLambda)
    var theta = Math.toDegrees(atan2(y, x))
    if (theta < 0) theta += 360.0
    return theta
  }

  fun angleDiff(fromDeg: Double, toDeg: Double): Double {
    var d = toDeg - fromDeg
    while (d > 180.0) d -= 360.0
    while (d < -180.0) d += 360.0
    return d
  }

  /** Бір реттік heading (0° = солтүстік), widget tick кезінде. */
  fun readHeadingDegrees(context: Context, timeoutMs: Long = 450L): Float? {
    val sm = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return null
    /** GAME_ROTATION_VECTOR магнитометрсіз — абсолют құбыла үшін жарамсыз. */
    val rotation = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    if (rotation != null) {
      return readRotationVectorHeading(sm, rotation, timeoutMs)
    }
    val accel = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) ?: return null
    val mag = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD) ?: return null
    return readMagAccelHeading(sm, accel, mag, timeoutMs)
  }

  /**
   * Жазық: телефон үсті (Y) — құбыла иінінің «жоғары» белгісі.
   * Тік/қиғаш: артқы камера бағыты (−Z) — экранға қарап тұрып Қағбаға бет бұру.
   */
  fun headingFromRotationMatrix(rotIn: FloatArray): Float? {
    if (rotIn.size < 9) return null
    val outR = FloatArray(9)
    val orient = FloatArray(3)
    val r8 = rotIn[8].coerceIn(-1f, 1f)
    val inclinationRad = acos(r8.toDouble())
    val flat =
      inclinationRad < Math.toRadians(25.0) || inclinationRad > Math.toRadians(155.0)
    val matrix =
      if (flat) {
        rotIn
      } else if (
        SensorManager.remapCoordinateSystem(
          rotIn,
          SensorManager.AXIS_X,
          SensorManager.AXIS_Z,
          outR
        )
      ) {
        outR
      } else {
        rotIn
      }
    SensorManager.getOrientation(matrix, orient)
    var az = Math.toDegrees(orient[0].toDouble()).toFloat()
    if (!az.isFinite()) return null
    az = (az + 360f) % 360f
    return az
  }

  fun headingFromRotationVector(values: FloatArray): Float? {
    val rot = FloatArray(9)
    SensorManager.getRotationMatrixFromVector(rot, values)
    return headingFromRotationMatrix(rot)
  }

  private fun readRotationVectorHeading(
    sm: SensorManager,
    sensor: Sensor,
    timeoutMs: Long
  ): Float? {
    val latch = CountDownLatch(1)
    var heading: Float? = null
    val listener =
      object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          if (heading != null) return
          heading = headingFromRotationVector(event.values) ?: return
          latch.countDown()
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
      }
    sm.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_GAME)
    latch.await(timeoutMs, TimeUnit.MILLISECONDS)
    sm.unregisterListener(listener)
    return heading
  }

  internal data class Vec3(var x: Float, var y: Float, var z: Float)

  /** Sensor jitter азайту — виджет стрелкасы тегіс айналады (бірақ қуып қалмасын). */
  fun smoothHeading(prev: Float?, next: Float, alpha: Float = 0.45f): Float {
    if (prev == null || !prev.isFinite()) return next
    val delta = angleDiff(prev.toDouble(), next.toDouble()).toFloat()
    var out = prev + delta * alpha
    if (out < 0f) out += 360f
    if (out >= 360f) out -= 360f
    return out
  }

  private fun readMagAccelHeading(
    sm: SensorManager,
    accelSensor: Sensor,
    magSensor: Sensor,
    timeoutMs: Long
  ): Float? {
    val latch = CountDownLatch(1)
    var gravity: Vec3? = null
    var magnetic: Vec3? = null
    var heading: Float? = null
    val listener =
      object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER ->
              gravity = Vec3(event.values[0], event.values[1], event.values[2])
            Sensor.TYPE_MAGNETIC_FIELD ->
              magnetic = Vec3(event.values[0], event.values[1], event.values[2])
          }
          if (heading != null) return
          val g = gravity ?: return
          val m = magnetic ?: return
          val h = headingFromGravityMagnetic(g, m) ?: return
          heading = h
          latch.countDown()
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
      }
    sm.registerListener(listener, accelSensor, SensorManager.SENSOR_DELAY_GAME)
    sm.registerListener(listener, magSensor, SensorManager.SENSOR_DELAY_GAME)
    latch.await(timeoutMs, TimeUnit.MILLISECONDS)
    sm.unregisterListener(listener)
    return heading
  }

  internal fun headingFromGravityMagnetic(gravity: Vec3, geomagnetic: Vec3): Float? {
    val R = FloatArray(9)
    val ok =
      SensorManager.getRotationMatrix(
        R,
        null,
        floatArrayOf(gravity.x, gravity.y, gravity.z),
        floatArrayOf(geomagnetic.x, geomagnetic.y, geomagnetic.z)
      )
    if (!ok) return null
    return headingFromRotationMatrix(R)
  }

  fun renderChipBitmap(
    context: Context,
    sizeDp: Int,
    bearingDeg: Double,
    headingDeg: Float?,
    aligned: Boolean
  ): Bitmap = renderChipBitmap(context, sizeDp, aligned, qiblaArrowRotationDeg(headingDeg, bearingDeg))

  /** Стрелка жоғары — айналдыру RemoteViews.setRotation арқылы (тегіс, жеңіл). */
  fun renderChipBitmap(
    context: Context,
    sizeDp: Int,
    aligned: Boolean,
    canvasRotationDeg: Float?
  ): Bitmap {
    val density = context.resources.displayMetrics.density
    val sizePx = (sizeDp * density).toInt().coerceAtLeast(32)
    val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    val cx = sizePx / 2f
    val cy = sizePx / 2f
    val ringR = sizePx * 0.46f

    val ringPaint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = sizePx * 0.04f
        color = if (aligned) Color.parseColor("#F234F3A6") else Color.parseColor("#75FFFFFF")
      }
    canvas.drawCircle(cx, cy, ringR, ringPaint)

    val rotateDeg = canvasRotationDeg ?: 0f

    canvas.save()
    if (canvasRotationDeg != null) {
      canvas.rotate(rotateDeg, cx, cy)
    }

    val arrowPaint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = if (aligned) Color.parseColor("#34D399") else Color.parseColor("#38B2AC")
      }
    val tipY = cy - sizePx * 0.28f
    val baseY = cy + sizePx * 0.12f
    val halfW = sizePx * 0.11f
    val path =
      Path().apply {
        moveTo(cx, tipY)
        lineTo(cx - halfW, baseY)
        lineTo(cx + halfW, baseY)
        close()
      }
    canvas.drawPath(path, arrowPaint)

    val hubPaint =
      Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#CCFFFFFF")
      }
    canvas.drawCircle(cx, cy, sizePx * 0.05f, hubPaint)
    canvas.restore()

    return bmp
  }

  fun qiblaArrowRotationDeg(headingDeg: Float?, bearingDeg: Double): Float? {
    if (headingDeg == null || !headingDeg.isFinite()) return null
    return angleDiff(headingDeg.toDouble(), bearingDeg).toFloat()
  }
}
