import re
from pathlib import Path

p = Path("d:/opt/raqat-ai/mobile/src/components/settings/SettingsQuranHub.tsx")
s = p.read_text(encoding="utf-8")
start = s.index("  return (")
end = s.rindex("  );\n}")
body = s[start : end + 5]

def wrap_prop(m: re.Match[str]) -> str:
    inner = m.group(1)
    if inner.startswith("tr("):
        return m.group(0)
    return "={" + "tr(" + inner + ")" + "}"


def wrap_text(m: re.Match[str]) -> str:
    inner = m.group(1)
    if inner.startswith("tr("):
        return m.group(0)
    return ">{tr(" + inner + ")}<"


body = re.sub(r"=\{(kk\.[^}]+)\}", wrap_prop, body)
body = re.sub(r">\{(kk\.[^}]+)\}<", wrap_text, body)
body = body.replace(
    "labelFor={(id) => kk.settings.quranMushafDensityOption(id)}",
    "labelFor={(id) => tr(kk.settings.quranMushafDensityOption(id))}",
)
body = body.replace(
    'id === "scroll" ? kk.settings.quranReaderNavScrollShort : kk.settings.quranReaderNavPageShort',
    'id === "scroll" ? tr(kk.settings.quranReaderNavScrollShort) : tr(kk.settings.quranReaderNavPageShort)',
)
body = body.replace(
    'id === "ring_svg" ? kk.settings.quranReaderMarkerRing : kk.settings.quranReaderMarkerClassic',
    'id === "ring_svg" ? tr(kk.settings.quranReaderMarkerRing) : tr(kk.settings.quranReaderMarkerClassic)',
)
body = re.sub(
    r"quranFontStatusLabel\(([^,)]+)\.status\)",
    r"quranFontStatusLabel(\1.status, tr)",
    body,
)
body = body.replace(
    "labelFor={(id) => QURAN_READING_THEMES.find((t) => t.id === id)?.labelKk ?? id}",
    "labelFor={(id) => tr(QURAN_READING_THEMES.find((t) => t.id === id)?.labelKk ?? id)}",
)
body = body.replace("label={p.labelKk}", "label={tr(p.labelKk)}")
body = body.replace(
    "r.audioAvailable ? undefined : kk.quran.readerReciterComingSoon",
    "r.audioAvailable ? undefined : tr(kk.quran.readerReciterComingSoon)",
)
body = body.replace(
    "bookFontReady ? kk.settings.quranFontsDownloaded : kk.settings.quranFontsDownloadButton",
    "bookFontReady ? tr(kk.settings.quranFontsDownloaded) : tr(kk.settings.quranFontsDownloadButton)",
)
body = body.replace(
    "qcf4FontReady ? kk.settings.quranFontsDownloaded : kk.settings.quranFontsDownloadButton",
    "qcf4FontReady ? tr(kk.settings.quranFontsDownloaded) : tr(kk.settings.quranFontsDownloadButton)",
)
body = body.replace(
    "bookFontReady ? kk.quran.readerArabicFontHint : kk.settings.quranFontsPresetLocked",
    "bookFontReady ? tr(kk.quran.readerArabicFontHint) : tr(kk.settings.quranFontsPresetLocked)",
)
body = body.replace(
    'audioPrefs?.paused || audioState?.status !== "running" ? kk.settings.quranAudioResume : kk.settings.quranAudioPause',
    'audioPrefs?.paused || audioState?.status !== "running" ? tr(kk.settings.quranAudioResume) : tr(kk.settings.quranAudioPause)',
)

p.write_text(s[:start] + body + s[end + 5 :], encoding="utf-8")
print("ok")
