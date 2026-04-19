# RAQAT — мобильді қосымша (MVP)

Expo (React Native) — **iOS** және **Android** үшін бір код.

## Не дайын

- Төменгі табтар: **Басты** (дашборд), **Уақыт**, **Құбыла**, **Тәсбих**, **Тағы** (Құран тізімі, дұғалар, Telegram)
- **Намаз уақыттары** — [Aladhan API](https://aladhan.com/prayer-times-api) (қала/ел өзгерту)
- Telegram ботқа сілтеме — `Тағы` → Telegram бот

## Орнату

```bash
cd mobile
npm install
npx expo start
```

**Expo Go** қолданбасын телефонға орнатып, QR кодты сканерлеңіз немесе эмуляторда `a` / `i` пернелерін басыңыз.

## Телефонда тексеру (Expo Go)

1. **Google Play / App Store** — [Expo Go](https://expo.dev/go) орнатыңыз (SDK 52 жобалары үшін қолданба жаңартылған болуы керек).
2. **Компьютер мен телефон бір Wi‑Fi** болуы керек (немесе төмендегі tunnel).
3. Компьютерде жоба қалтасынан:

   ```bash
   cd mobile
   npm run start:lan
   ```

   Терминалдағы **QR** кодты Expo Go ішіндегі сканермен немесе (iOS) Камерамен сканерлеңіз.

4. **Маңызды:** егер терминал `exp://127.0.0.1:...` көрсетсе, телефон оған **жалғанбайды**. Сонда:
   - `npm run start:lan` қайта іске қосыңыз; немесе
   - компьютердің **жергілікті IP**-ін көрсетіңіз (мысалы Ubuntu: `ip -brief a`), содан:

     ```bash
     export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.10
     npm run start:lan
     ```

     (`192.168.1.10` орнына өзіңіздің IP.)

5. **Телефон басқа желіде** (мысалы компьютер үйде, телефон 4G) болса:

   ```bash
   cd mobile
   npx expo start --tunnel
   ```

   (Бірінші рет туннель үшін тіркелу сұрауы болуы мүмкін.)

6. **Metro сервер VPS / бұлтта** жүріп, телефон интернет арқылы қосылса — репозиторийдегі `npm run start:vps` және `mobile/scripts/expo-vps.sh` нұсқауын қараңыз (`REACT_NATIVE_PACKAGER_HOSTNAME` — жария IPv4).

**Платформа API** телефоннан тексеру үшін сол Wi‑Fi ішінде компьютердің IP-ін жазыңыз: мысалы `.env` файлы `mobile/` қалтасында:

```bash
EXPO_PUBLIC_RAQAT_API_BASE=http://192.168.1.10:8787
```

алдымен түбірде `bash scripts/run_platform_api.sh` іске қосылған болсын.

## Ескі телефон және жүйе талаптары

Бұл жоба **Expo SDK 52** / **React Native 0.76** үстінде тұр; өте ескі модельдерде Expo Go немесе дайын билд орнатылмауы мүмкін.

| Платформа | Шамамен не керек | Ескертпе |
|-----------|------------------|----------|
| **Android** | **7.0 (API 24)** және жоғары ұсынылады; `app.json` ішінде `minSdkVersion: 23` көрсетілген — билд шығарғанда нақты құрылғыда тексеріңіз | Expo Go Google Play-ден **жобаға сәйкес** нұсқада болуы керек |
| **iOS** | **15.1** және жоғары (`deploymentTarget`) | Мысалы iPhone 6s соңғы iOS-қа дейін жаңартылған болса, әдетте жүреді; одан ескі модельдерде App Store / Expo Go қолдауы болмауы мүмкін |

**Ескі құрылғыда жылдамдық:** басқа қолданбаларды жабыңыз; алғашқы ашылудан кейін Құран/хадис дерегі кэштеледі. **Құбыла** магнитометрге тәуелді — ескі сенсорда дәлдік нашарлауы табиғи.

**Expo Go іске қоспаса немесе телефон тым ескі болса:** [Telegram бот](https://t.me/my_islamic_ai_bot) пен репозиторийдегі **`web/`** статикалық бетті пайдаланыңыз; дамыту үшін браузерде `npx expo start --web` де іске қосуға болады.

## Платформа API (қосымша)

Репозиторийдегі `platform_api/` іске қосылғанда (`scripts/run_platform_api.sh`, порт **8787**), қолданба оны **Баптаулар** экранында тексере алады.

Мекенжайды беру жолдары (`src/config/raqatApiBase.ts` — алдымен `EXPO_PUBLIC_*`, содан `extra`):

1. **`EXPO_PUBLIC_RAQAT_API_BASE`** — Metro бандлы кезінде енгізіледі: `mobile/.env`, түбір `.env`, немесе **`mobile/.env.production`** (тек `npm run build:apk` release үшін `load-raqat-expo-env.sh` соңында жүктеледі).  
   Дамыту: `EXPO_PUBLIC_RAQAT_API_BASE=http://192.168.1.5:8787 npx expo start` — эмулятор: `http://10.0.2.2:8787`
2. **`app.config.js`** — `app.json` негізінде `extra.raqatApiBase` қалыптарады; `EXPO_PUBLIC_` жоқ болса, `app.json` extra қалпында қалады.
3. **Release:** түбір `.env` ішіндегі `RAQAT_PLATFORM_API_BASE=http://127.0.0.1:...` APK бандлына **көпірілмейді** — құрылғыда API жұмыс істеуі үшін `.env.production` немесе `app.json` extra-дағы нақты хост қолданылады.

## Келесі қадамдар (инженерия)

1. Нақты `@username` үшін `src/screens/TelegramInfoScreen.tsx` ішіндегі `BOT` тұрақтысын өзгертіңіз.
2. Қосымша иконка: `assets/icon.png` орнына 1024×1024 PNG салыңыз.
3. Платформа API: `src/services/platformApiClient.ts` — `fetchQuranSurahs`, `fetchMetadataChanges` (304 + ETag); опция `EXPO_PUBLIC_RAQAT_CONTENT_SECRET` = API-дағы `RAQAT_CONTENT_READ_SECRET`.

## Жоба түйіні

```
mobile/
  App.tsx
  app.json
  app.config.js
  src/
    api/prayerTimes.ts
    config/raqatApiBase.ts
    services/platformApiClient.ts
    navigation/MainTabs.tsx, MoreStack.tsx, types.ts
    screens/
    theme/colors.ts
```
