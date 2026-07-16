package kz.raqat.app

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager

/**
 * Device heading (0° = magnetic north) via rotation vector or accel+mag fusion.
 * Used by JS Qibla compass — more reliable than expo-location on some Samsung builds.
 *
 * Does not use GAME_ROTATION_VECTOR (no magnetometer → absolute Qibla impossible).
 */
object QiblaDeviceHeadingWatcher {
  private var sensorManager: SensorManager? = null
  private var rotationSensor: Sensor? = null
  private var accelSensor: Sensor? = null
  private var magSensor: Sensor? = null
  private var sensorListener: SensorEventListener? = null
  private var onHeading: ((Float, Int) -> Unit)? = null
  private var smoothedHeading: Float? = null
  private var gravity: QiblaWidgetHelper.Vec3? = null
  private var magnetic: QiblaWidgetHelper.Vec3? = null
  private var lastSensorAccuracy: Int = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM

  fun start(context: Context, callback: (Float, Int) -> Unit): Boolean {
    stop()
    val app = context.applicationContext
    val sm = app.getSystemService(Context.SENSOR_SERVICE) as? SensorManager ?: return false
    onHeading = callback
    sensorManager = sm
    rotationSensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    if (rotationSensor == null) {
      accelSensor = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
      magSensor = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
      if (accelSensor == null || magSensor == null) {
        stop()
        return false
      }
    }
    smoothedHeading = null
    gravity = null
    magnetic = null
    lastSensorAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM
    val listener =
      object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
          val raw =
            when (event.sensor.type) {
              Sensor.TYPE_ROTATION_VECTOR ->
                QiblaWidgetHelper.headingFromRotationVector(event.values)
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
          /** Жеңіл EMA — JS adaptive smooth қос қабатты lag жасамайды. */
          smoothedHeading = QiblaWidgetHelper.smoothHeading(smoothedHeading, raw, 0.62f)
          onHeading?.invoke(smoothedHeading ?: raw, lastSensorAccuracy)
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
          lastSensorAccuracy = accuracy
        }
      }
    sensorListener = listener
    if (rotationSensor != null) {
      sm.registerListener(listener, rotationSensor, SensorManager.SENSOR_DELAY_GAME)
    } else {
      sm.registerListener(listener, accelSensor, SensorManager.SENSOR_DELAY_GAME)
      sm.registerListener(listener, magSensor, SensorManager.SENSOR_DELAY_GAME)
    }
    return true
  }

  fun stop() {
    sensorManager?.unregisterListener(sensorListener)
    sensorManager = null
    rotationSensor = null
    accelSensor = null
    magSensor = null
    sensorListener = null
    onHeading = null
    smoothedHeading = null
    gravity = null
    magnetic = null
    lastSensorAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM
  }

  private fun headingFromGravityMagnetic(): Float? {
    val g = gravity ?: return null
    val m = magnetic ?: return null
    return QiblaWidgetHelper.headingFromGravityMagnetic(g, m)
  }
}
