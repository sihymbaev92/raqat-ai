const fs = require("fs");
const p = "d:/opt/raqat-ai/mobile/src/screens/QuranSurahScreen.tsx";
let s = fs.readFileSync(p, "utf8");
const readerVis = s.indexOf("visible={readerSettingsOpen}");
const legendVis = s.indexOf("visible={tajweedLegendOpen}");
if (readerVis < 0 || legendVis < 0) throw new Error("visibility markers not found");
const start = s.lastIndexOf("<Modal", readerVis);
const end = s.lastIndexOf("<Modal", legendVis);
if (start < 0 || end <= start) throw new Error("modal bounds invalid");
const rep = `      <QuranSurahReaderSettingsSheet
        visible={readerSettingsOpen}
        onClose={closeReaderSettings}
        styles={styles}
        colors={colors}
        isDark={isDark}
        mushafLayout={mushafLayout}
        windowHeight={windowHeight}
        readerSettingsAccordion={readerSettingsAccordion}
        toggleReaderSettingsAccordion={toggleReaderSettingsAccordion}
        showReaderArabic={showReaderArabic}
        showReaderTranslit={showReaderTranslit}
        showReaderMeaning={showReaderMeaning}
        setReaderContentLayer={setReaderContentLayer}
        readingThemeId={readingThemeId}
        setReadingThemeId={setReadingThemeId}
        showReciterLocaleFallbackNote={showReciterLocaleFallbackNote}
        reciterEdition={reciterEdition}
        setReciterEdition={setReciterEdition}
        arabicFontPreset={arabicFontPreset}
        setArabicFontPreset={setArabicFontPreset}
        arabicScriptEdition={arabicScriptEdition}
        setArabicScriptEdition={setArabicScriptEdition}
        arabicSourcesExpanded={arabicSourcesExpanded}
        setArabicSourcesExpanded={setArabicSourcesExpanded}
        effectiveReaderNavMode={effectiveReaderNavMode}
        setReaderNavMode={setReaderNavMode}
        mushafDensity={mushafDensity}
        setMushafDensityState={setMushafDensityState}
        ayahMarkerStyleId={ayahMarkerStyleId}
        setAyahMarkerStyleIdState={setAyahMarkerStyleIdState}
        mushafTextScale={mushafTextScale}
        setMushafTextScale={setMushafTextScale}
        showTajweedColors={showTajweedColors}
        onToggleTajweedColors={onToggleTajweedColors}
        tajweedLoading={tajweedLoading}
        onOpenTajweedLegend={() => {
          closeReaderSettings();
          setTajweedLegendOpen(true);
        }}
      />
`;
s = s.slice(0, start) + rep + s.slice(end);
fs.writeFileSync(p, s);
const lines = s.split(/\r?\n/).length;
console.log("replaced", end - start, "chars; file now", lines, "lines");
