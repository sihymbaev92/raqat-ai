const fs = require("fs");
const p = "d:/opt/raqat-ai/mobile/src/screens/QuranSurahScreen.tsx";
let s = fs.readFileSync(p, "utf8");

const start = s.indexOf("  if (loading && !ayahs.length)");
const end = s.indexOf("  return (\r\n    <View style={styles.root}>", start);
if (start < 0 || end < 0 || end <= start) throw new Error("bounds not found");

const component = `      <QuranSurahReaderBody
        loading={loading}
        err={err}
        ayahs={ayahs}
        styles={styles}
        colors={colors}
        isDark={isDark}
        mushafLayout={mushafLayout}
        surahNumber={surahNumber}
        titleKk={titleKk}
        surahArabicTitleLine={surahArabicTitleLine}
        readerJuzFromAnchor={readerJuzFromAnchor}
        mushafFooterHizb={mushafFooterHizb}
        mushafFooterPage={mushafFooterPage}
        visibleMushafPrintPage={visibleMushafPrintPage}
        mushafChromeIconColor={mushafChromeIconColor}
        showReaderArabic={showReaderArabic}
        showReaderTranslit={showReaderTranslit}
        showReaderMeaning={showReaderMeaning}
        showTajweedColors={showTajweedColors}
        showTajweedForDisplay={showTajweedForDisplay}
        tajweedLoading={tajweedLoading}
        arabicScriptEdition={arabicScriptEdition}
        bookmarked={bookmarked}
        setBookmarked={setBookmarked}
        readerAllowRotation={readerAllowRotation}
        setReaderAllowRotation={setReaderAllowRotation}
        onToggleTajweedColors={onToggleTajweedColors}
        handleReaderBack={handleReaderBack}
        retryLoadSurah={retryLoadSurah}
        setJuzPickerVisible={setJuzPickerVisible}
        setReaderSettingsOpen={setReaderSettingsOpen}
        setTajweedLegendOpen={setTajweedLegendOpen}
        mushafAyahAudioActive={mushafAyahAudioActive}
        playingAyahInSurah={playingAyahInSurah}
        loadingAyahAudio={loadingAyahAudio}
        ayahAudioIsPlaying={ayahAudioIsPlaying}
        playAyahSudais={playAyahSudais}
        mushafPageMode={mushafPageMode}
        mushafScrollMode={mushafScrollMode}
        horizontalListRef={horizontalListRef}
        mushafPages={mushafPages}
        mushafPageWidth={mushafPageWidth}
        onHorizontalViewableItemsChanged={onHorizontalViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMushafPagerScrollBeginDrag={onMushafPagerScrollBeginDrag}
        onMushafPagerScrollEnd={onMushafPagerScrollEnd}
        mushafPagerExtraData={mushafPagerExtraData}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showMushafBismillahBanner={showMushafBismillahBanner}
        readingThemeId={readingThemeId}
        mushafHighlightAyah={mushafHighlightAyah}
        ayahMarkers={ayahMarkers}
        setAyahMenuItem={setAyahMenuItem}
        onMushafPagerVerticalReadingAnchor={onMushafPagerVerticalReadingAnchor}
        scrollTargetAyah={scrollTargetAyah}
        mushafScrollRef={mushafScrollRef}
        onMushafScroll={onMushafScroll}
        mushafScrollContentHeightRef={mushafScrollContentHeightRef}
        mushafScrollContentRef={mushafScrollContentRef}
        mushafContinuousRef={mushafContinuousRef}
        mushafArabicContentWidth={mushafArabicContentWidth}
        onMushafAyahTopMeasured={onMushafAyahTopMeasured}
        fallbackMushafScrollYForAyah={fallbackMushafScrollYForAyah}
        mushafAyahAccessibilityLabel={mushafAyahAccessibilityLabel}
        ayahMeaningLine={ayahMeaningLine}
        listRef={listRef}
        flashListRowType={flashListRowType}
        onViewableItemsChanged={onViewableItemsChanged}
        flashListPlaybackExtra={flashListPlaybackExtra}
        renderAyahListRow={renderAyahListRow}
      />
`;

s = s.slice(0, start) + s.slice(end);
if (!s.includes("{readerBody}")) throw new Error("{readerBody} not found");
s = s.replace("{readerBody}", component);

if (!s.includes("QuranSurahReaderBody")) {
  throw new Error("component insert failed");
}

fs.writeFileSync(p, s);
console.log("screen now", s.split(/\r?\n/).length, "lines");
