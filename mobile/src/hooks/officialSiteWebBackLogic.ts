/**
 * Official site WebView «артқа» шешімі (hook ішіндегі tryWebBack-пен бірдей).
 * beforeRemove + hardware back бірге шақырылғанда escape latch қажет.
 */
export type OfficialSiteWebBackState = {
  lastWebBackAt: number;
  forceLeave: boolean;
};

export type OfficialSiteWebBackInput = OfficialSiteWebBackState & {
  enabled: boolean;
  canGoBack: boolean;
  now: number;
  escapeMs: number;
};

export type OfficialSiteWebBackResult = OfficialSiteWebBackState & {
  /** true = WebView history.back + navigation-ді ұстау */
  consume: boolean;
};

export function resolveOfficialSiteWebBackAttempt(
  input: OfficialSiteWebBackInput
): OfficialSiteWebBackResult {
  if (!input.enabled) {
    return { consume: false, lastWebBackAt: 0, forceLeave: false };
  }
  if (input.forceLeave) {
    return { consume: false, lastWebBackAt: input.lastWebBackAt, forceLeave: true };
  }
  if (!input.canGoBack) {
    return { consume: false, lastWebBackAt: 0, forceLeave: false };
  }
  if (input.lastWebBackAt > 0 && input.now - input.lastWebBackAt < input.escapeMs) {
    return { consume: false, lastWebBackAt: 0, forceLeave: true };
  }
  return { consume: true, lastWebBackAt: input.now, forceLeave: false };
}
