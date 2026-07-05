import CarPlay
import AVFoundation
import Foundation
import UIKit

/// CarPlay: толық RAHAT OMIR hub — намaz, Құран, хадис, зікір, әсма, құбыла, халal.
@available(iOS 14.0, *)
final class CarPlayAppManager: NSObject {
    static let shared = CarPlayAppManager()

    private var interfaceController: CPInterfaceController?
    private var hubRoot: HubRoot?
    private var surahs: [CarSurahMeta] = []
    private var ayahCache: [Int: [CarAyahRow]] = [:]

    struct CarSurahMeta: Decodable {
        let n: Int
        let englishName: String
        let arabicName: String
        let ayahs: Int
    }

    struct CarAyahRow {
        let surah: Int
        let ayah: Int
        let globalAyah: Int
        let arabic: String
    }

    struct HubModule: Decodable {
        let id: String
        let title: String
        let subtitle: String
    }

    struct HubHadith: Decodable {
        let id: String
        let collection: String
        let citation: String
        let arabic: String
        let narrator: String
    }

    struct HubDhikr: Decodable {
        let id: Int
        let title: String
        let ar: String
        let meaning: String
        let target: Int?
    }

    struct HubAsma: Decodable {
        let n: Int
        let ar: String
        let kk: String
    }

    struct HubHalalCompany: Decodable {
        let name: String
        let city: String
    }

    struct HubHalal: Decodable {
        let total: Int
        let companies: [HubHalalCompany]
    }

    struct HubRoot: Decodable {
        let modules: [HubModule]
        let hadith: [HubHadith]
        let dhikr: [HubDhikr]
        let asma: [HubAsma]
        let halal: HubHalal
        let phoneModules: [String]?
    }

    func connect(_ controller: CPInterfaceController) {
        interfaceController = controller
        loadSurahMeta()
        loadHubRoot()
        controller.setRootTemplate(makeHubTemplate(), animated: true, completion: nil)
    }

    func disconnect() {
        interfaceController = nil
    }

    private func loadHubRoot() {
        guard let url = Bundle.main.url(forResource: "car_app_hub_bundle", withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            hubRoot = nil
            return
        }
        hubRoot = try? JSONDecoder().decode(HubRoot.self, from: data)
    }

    private func loadSurahMeta() {
        guard let url = Bundle.main.url(forResource: "car_quran_surah_meta", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let root = try? JSONDecoder().decode(RootMeta.self, from: data) else {
            surahs = []
            return
        }
        surahs = root.surahs
    }

    private struct RootMeta: Decodable {
        let surahs: [CarSurahMeta]
    }

    private func makeHubTemplate() -> CPListTemplate {
        var items: [CPListItem] = []
        let nextPrayer = CPListItem(text: "Келесі намаз", detailText: "Толық кесте — телефonda синхрон")
        nextPrayer.userInfo = ["module": "prayer"] as [String: Any]
        nextPrayer.handler = { [weak self] _, c in self?.openModule("prayer"); c() }
        items.append(nextPrayer)

        for m in hubRoot?.modules ?? [] {
            let item = CPListItem(text: m.title, detailText: m.subtitle)
            item.userInfo = ["module": m.id] as [String: Any]
            item.handler = { [weak self] _, c in
                self?.openModule(m.id)
                c()
            }
            items.append(item)
        }
        return CPListTemplate(title: "RAHAT OMIR", sections: [CPListSection(items: items)])
    }

    private func openModule(_ id: String) {
        switch id {
        case "quran": pushSurahList()
        case "hadith": pushHadithList()
        case "duas", "tasbih": pushDhikrList(title: id == "tasbih" ? "Тәспіх" : "Дұға · зікір")
        case "asma": pushAsmaList()
        case "halal": pushHalalList()
        case "qibla": pushQiblaInfo()
        case "prayer": pushPrayerInfo()
        default:
            if hubRoot?.phoneModules?.contains(id) == true || ["ai", "namaz", "tradition", "hajj"].contains(id) {
                pushPhoneHandoff(moduleId: id)
            } else {
                pushPhoneHandoff(moduleId: id)
            }
        }
    }

    private func pushPrayerInfo() {
        let t = CPInformationTemplate(
            title: "Намаз уақыты",
            layout: .leading,
            items: [
                CPInformationItem(title: "Кесте", detail: "Телефonda RAHAT OMIR ашып, виджетпен синхрондалады."),
            ],
            actions: []
        )
        interfaceController?.pushTemplate(t, animated: true, completion: nil)
    }

    private func pushQiblaInfo() {
        let t = CPInformationTemplate(
            title: "Құбыла",
            layout: .leading,
            items: [CPInformationItem(title: "Бағыт", detail: "GPS және сенсор телефonda. Көлікте — телефонды қолданыңыз.")],
            actions: []
        )
        interfaceController?.pushTemplate(t, animated: true, completion: nil)
    }

    private func pushPhoneHandoff(moduleId: String) {
        let title = hubRoot?.modules.first(where: { $0.id == moduleId })?.title ?? "RAHAT OMIR"
        let t = CPInformationTemplate(
            title: title,
            layout: .leading,
            items: [CPInformationItem(title: "Телефonda", detail: "Толық модуль интерфейсі телефonda. Көлікте тоқтағанда ашыңыз.")],
            actions: []
        )
        interfaceController?.pushTemplate(t, animated: true, completion: nil)
    }

    private func pushHadithList() {
        let items = (hubRoot?.hadith ?? []).map { h -> CPListItem in
            let preview = String(h.arabic.prefix(80))
            let item = CPListItem(text: h.collection, detailText: preview)
            item.handler = { [weak self] _, c in
                self?.pushHadithDetail(h)
                c()
            }
            return item
        }
        interfaceController?.pushTemplate(
            CPListTemplate(title: "Хадис", sections: [CPListSection(items: items)]),
            animated: true,
            completion: nil
        )
    }

    private func pushHadithDetail(_ h: HubHadith) {
        var detail = h.arabic
        if !h.narrator.isEmpty { detail += "\n\n" + h.narrator }
        if !h.citation.isEmpty { detail += "\n" + h.citation }
        let t = CPInformationTemplate(
            title: h.collection,
            layout: .leading,
            items: [CPInformationItem(title: "Хадис", detail: detail)],
            actions: []
        )
        interfaceController?.pushTemplate(t, animated: true, completion: nil)
    }

    private func pushDhikrList(title: String) {
        let items = (hubRoot?.dhikr ?? []).map { d -> CPListItem in
            let item = CPListItem(text: d.title, detailText: String(d.ar.prefix(60)))
            item.handler = { [weak self] _, c in
                self?.pushDhikrDetail(d)
                c()
            }
            return item
        }
        interfaceController?.pushTemplate(
            CPListTemplate(title: title, sections: [CPListSection(items: items)]),
            animated: true,
            completion: nil
        )
    }

    private func pushDhikrDetail(_ d: HubDhikr) {
        var body = d.ar
        if !d.meaning.isEmpty { body += "\n\n" + d.meaning }
        if let t = d.target { body += "\n\nМақсат: \(t) рет" }
        let tpl = CPInformationTemplate(
            title: d.title,
            layout: .leading,
            items: [CPInformationItem(title: "Зікір", detail: body)],
            actions: []
        )
        interfaceController?.pushTemplate(tpl, animated: true, completion: nil)
    }

    private func pushAsmaList() {
        let items = (hubRoot?.asma ?? []).map { a -> CPListItem in
            let item = CPListItem(text: "\(a.n). \(a.ar)", detailText: String(a.kk.prefix(90)))
            item.handler = { [weak self] _, c in
                self?.pushAsmaDetail(a)
                c()
            }
            return item
        }
        interfaceController?.pushTemplate(
            CPListTemplate(title: "Әсма әл-Хусна", sections: [CPListSection(items: items)]),
            animated: true,
            completion: nil
        )
    }

    private func pushAsmaDetail(_ a: HubAsma) {
        let t = CPInformationTemplate(
            title: "\(a.n). \(a.ar)",
            layout: .leading,
            items: [CPInformationItem(title: "Мағына", detail: a.kk)],
            actions: []
        )
        interfaceController?.pushTemplate(t, animated: true, completion: nil)
    }

    private func pushHalalList() {
        let total = hubRoot?.halal.total ?? 0
        let items = (hubRoot?.halal.companies ?? []).map { c -> CPListItem in
            CPListItem(text: c.name, detailText: c.city.isEmpty ? "Қазақстан" : c.city)
        }
        interfaceController?.pushTemplate(
            CPListTemplate(title: "Халал · \(total)", sections: [CPListSection(items: items)]),
            animated: true,
            completion: nil
        )
    }

    // MARK: - Quran (existing flow)

    private func pushSurahList() {
        let items = surahs.map { s -> CPListItem in
            let item = CPListItem(
                text: "\(s.n). \(s.englishName)",
                detailText: "\(s.arabicName) · \(s.ayahs) аят"
            )
            item.userInfo = ["surah": s.n, "title": s.englishName] as [String: Any]
            item.handler = { [weak self] _, completion in
                guard let self, let info = item.userInfo as? [String: Any],
                      let surah = info["surah"] as? Int,
                      let title = info["title"] as? String else {
                    completion()
                    return
                }
                self.pushAyahList(surah: surah, title: title)
                completion()
            }
            return item
        }
        interfaceController?.pushTemplate(
            CPListTemplate(title: "Құран", sections: [CPListSection(items: items)]),
            animated: true,
            completion: nil
        )
    }

    private func pushAyahList(surah: Int, title: String) {
        fetchAyahs(surah: surah) { [weak self] rows in
            guard let self, let ic = self.interfaceController else { return }
            let items = rows.map { a -> CPListItem in
                let preview = String(a.arabic.prefix(100))
                let item = CPListItem(text: "Аят \(a.ayah)", detailText: preview)
                item.userInfo = ["surah": a.surah, "ayah": a.ayah, "global": a.globalAyah, "arabic": a.arabic] as [String: Any]
                item.handler = { [weak self] _, completion in
                    self?.playAyah(item: item, surahTitle: title)
                    completion()
                }
                return item
            }
            ic.pushTemplate(
                CPListTemplate(title: "\(title) · \(rows.count) аят", sections: [CPListSection(items: items)]),
                animated: true,
                completion: nil
            )
        }
    }

    private func playAyah(item: CPListItem, surahTitle: String) {
        guard let info = item.userInfo as? [String: Any],
              let ayah = info["ayah"] as? Int,
              let global = info["global"] as? Int,
              let arabic = info["arabic"] as? String else { return }
        let urlStr = "https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais/\(global).mp3"
        guard let url = URL(string: urlStr) else { return }
        let infoTemplate = CPInformationTemplate(
            title: "\(surahTitle) · аят \(ayah)",
            layout: .leading,
            items: [CPInformationItem(title: "Арабша", detail: arabic)],
            actions: [
                CPTextButton(title: "Ойнату", textStyle: .normal) { _ in
                    CarPlayQuranAudio.shared.play(url: url)
                },
            ]
        )
        interfaceController?.pushTemplate(infoTemplate, animated: true, completion: nil)
    }

    private func loadBundledAyahs(surah: Int) -> [CarAyahRow]? {
        guard let url = Bundle.main.url(forResource: "car_quran_arabic_bundle", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let surahs = root["surahs"] as? [[String: Any]] else { return nil }
        guard let entry = surahs.first(where: { ($0["n"] as? Int) == surah }),
              let texts = entry["t"] as? [String], !texts.isEmpty else { return nil }
        return texts.enumerated().map { idx, arabic in
            let ayahNum = idx + 1
            return CarAyahRow(
                surah: surah,
                ayah: ayahNum,
                globalAyah: globalOffset(surah: surah) + ayahNum,
                arabic: arabic.trimmingCharacters(in: .whitespacesAndNewlines)
            )
        }
    }

    private func fetchAyahs(surah: Int, done: @escaping ([CarAyahRow]) -> Void) {
        if let cached = ayahCache[surah] { done(cached); return }
        if let bundled = loadBundledAyahs(surah: surah) {
            ayahCache[surah] = bundled
            done(bundled)
            return
        }
        let urlStr = "https://api.alquran.cloud/v1/surah/\(surah)/quran-uthmani"
        guard let url = URL(string: urlStr) else { done([]); return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            var rows: [CarAyahRow] = []
            defer {
                DispatchQueue.main.async {
                    self.ayahCache[surah] = rows
                    done(rows)
                }
            }
            guard let data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let dataObj = json["data"] as? [String: Any],
                  let ayahs = dataObj["ayahs"] as? [[String: Any]] else { return }
            let global = self.globalOffset(surah: surah)
            for (idx, a) in ayahs.enumerated() {
                let ayahNum = a["numberInSurah"] as? Int ?? (idx + 1)
                let text = (a["text"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                rows.append(CarAyahRow(surah: surah, ayah: ayahNum, globalAyah: global + ayahNum, arabic: text))
            }
        }.resume()
    }

    private func globalOffset(surah: Int) -> Int {
        let counts = CarPlayQuranCounts.ayahCounts
        guard surah > 1 else { return 0 }
        return counts.prefix(surah - 1).reduce(0, +)
    }
}

enum CarPlayQuranCounts {
    static let ayahCounts: [Int] = [
        7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
        78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
        37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
        52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
        11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
    ]
}

@available(iOS 14.0, *)
final class CarPlayQuranAudio: NSObject {
    static let shared = CarPlayQuranAudio()
    private var player: AVPlayer?

    func play(url: URL) {
        player?.pause()
        player = AVPlayer(url: url)
        player?.play()
    }

    func stop() {
        player?.pause()
        player = nil
    }
}

@available(iOS 14.0, *)
final class CarPlayQuranSceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        CarPlayAppManager.shared.connect(interfaceController)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        CarPlayAppManager.shared.disconnect()
        CarPlayQuranAudio.shared.stop()
    }
}

// Backward-compatible alias
@available(iOS 14.0, *)
typealias CarPlayQuranManager = CarPlayAppManager
