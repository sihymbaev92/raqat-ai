import SwiftUI
import WidgetKit

struct PrayerTimesEntry: TimelineEntry {
  let date: Date
  let snapshot: PrayerWidgetSnapshot?
}

struct PrayerTimesProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerTimesEntry {
    PrayerTimesEntry(date: Date(), snapshot: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerTimesEntry) -> Void) {
    completion(
      PrayerTimesEntry(
        date: Date(),
        snapshot: PrayerWidgetSnapshot.parse(from: PrayerWidgetStore.readPayloadJson())
      )
    )
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimesEntry>) -> Void) {
    let snap = PrayerWidgetSnapshot.parse(from: PrayerWidgetStore.readPayloadJson())
    let entry = PrayerTimesEntry(date: Date(), snapshot: snap)
    let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }
}

struct PrayerTimesWidgetEntryView: View {
  var entry: PrayerTimesEntry

  private var gradient: LinearGradient {
    LinearGradient(
      colors: [
        Color(red: 0.05, green: 0.12, blue: 0.16),
        Color(red: 0.08, green: 0.20, blue: 0.24),
      ],
      startPoint: .topLeading,
      endPoint: .bottomTrailing
    )
  }

  var body: some View {
    content
      .modifier(WidgetBackgroundModifier(gradient: gradient))
  }

  @ViewBuilder
  private var content: some View {
      if let snap = entry.snapshot, let next = snap.nextSalat() {
        VStack(alignment: .leading, spacing: 6) {
          Text("RAHAT OMIR")
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.white.opacity(0.72))
          Text(snap.city)
            .font(.headline.weight(.bold))
            .foregroundStyle(.white)
            .lineLimit(1)
          Spacer(minLength: 0)
          Text("Келесі: \(next.label)")
            .font(.caption)
            .foregroundStyle(.white.opacity(0.85))
          Text(next.time)
            .font(.title2.weight(.heavy))
            .foregroundStyle(Color(red: 0.78, green: 0.63, blue: 0.35))
            .minimumScaleFactor(0.7)
            .lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding(12)
      } else {
        VStack(alignment: .leading, spacing: 6) {
          Text("RAHAT OMIR")
            .font(.caption2.weight(.semibold))
            .foregroundStyle(.white.opacity(0.72))
          Text("Намаз уақыты")
            .font(.headline.weight(.bold))
            .foregroundStyle(.white)
          Text("Қолданбаны ашып қалаңызды таңдаңыз")
            .font(.caption)
            .foregroundStyle(.white.opacity(0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding(12)
      }
  }
}

private struct WidgetBackgroundModifier: ViewModifier {
  let gradient: LinearGradient

  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content.containerBackground(for: .widget) {
        gradient
      }
    } else {
      content.background(gradient)
    }
  }
}

@main
struct PrayerWidgetExtensionBundle: WidgetBundle {
  var body: some Widget {
    PrayerTimesWidget()
  }
}

struct PrayerTimesWidget: Widget {
  let kind = "PrayerTimesWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PrayerTimesProvider()) { entry in
      PrayerTimesWidgetEntryView(entry: entry)
    }
    .configurationDisplayName("Намаз уақыты")
    .description("Келесі намаз және қала.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
