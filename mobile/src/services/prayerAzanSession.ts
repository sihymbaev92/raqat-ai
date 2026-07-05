/** Native azan alarm → RN экран ашылғанша reschedule/clear блоктау. */
let azanSessionActive = false;

export function setPrayerAzanSessionActive(active: boolean): void {
  azanSessionActive = active;
}

export function isPrayerAzanSessionActive(): boolean {
  return azanSessionActive;
}
