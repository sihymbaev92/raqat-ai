/** RAQAT open BLE profile — OEM rings can implement this for first-class support. */
export const RAQAT_TASBIH_SERVICE = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
export const RAQAT_TASBIH_COUNT_NOTIFY = "a1b2c3d4-e5f6-7890-abcd-ef1234567891";
export const RAQAT_TASBIH_COMMAND = "a1b2c3d4-e5f6-7890-abcd-ef1234567892";

/** Nordic UART — many nRF51/52 counter gadgets. */
export const NORDIC_UART_SERVICE = "6e40fff0-b5a3-f393-e0a9-e50e24dcca9e";
export const NORDIC_UART_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

export const TASBIH_NAME_HINT =
  /zikr|tasbih|tasbeeh|tasbee|dhikr|smart.?ring|counter|тасbih|тәспі|зікір|iqibla|feig|fegobe|m02|n01/i;
