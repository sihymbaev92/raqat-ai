1) Put your database file here:
   global_clean.db

2) Create .env from example (never commit .env — it is gitignored):
   cp .env.example .env

3) Edit .env:
   nano .env

4) Install dependencies:
   pip install -r requirements.txt

5) Run:
   python bot_main.py

Дерекқор жаңарту: бот іске қосылғанда db/migrations.py орындалады (индекстер,
schema_migrations кестесі; ескі users кестесі user_preferences-пен біріктіріліп өшіріледі;
кейінірек миграция: feedback, event_log, bookmarks, ai_daily_usage, khatm_* кестелерінде
FOREIGN KEY → user_preferences(user_id) — орфан user_id алдын ала толықтырылады).
Негізгі дерекқордың сақтық көшірмесін алыңыз.

Құран транскрипциясы (quran.translit):
  — Барлық аяттарда мәтін бар; көпшілігі services/quran_translit.py (араб→қазақ) арқылы.
  — koran.kz/trnc/ бетінен кирилл берілген аяттар scripts/import_quran_translit_koran_kz.py
    импортымен жаңартылады (сайтта ұзын сүрелерде кирилл жоқ болғандықтан толық емес, ~181 аят).
  — Күй: .venv/bin/python scripts/quran_translit_status.py --db global_clean.db
  — Тексеру: .venv/bin/python scripts/validate_quran_translit.py --db global_clean.db
  — Бос translit толтыру: backfill_quran_translit.py (импорттан кейін қажет болса).
  — Қысқаша: барлық аятта кирилл бар (араб қалдық жоқ); «koran.kz стилі» тек ~181 аятта,
    қалғаны алгоритмдік кирилл.

Сахих хадис аудармасы (hadith.text_kk, қазақ кирилл):
  — Қолданба: translate_hadith_kk_batch.py (Gemini, .env ішінде GEMINI_API_KEY).
  — Сахих Бұхари мен Сахих Муслим алдымен: scripts/run_sahih_hadith_kk.sh (немесе
    --bukhari-muslim --backup — ұзақ жұмыс, нет желісі орнатылған серверде орындаңыз).
  — Күй: python translate_hadith_kk_batch.py --stats-only
  — Аудармадан кейін FTS: python create_hadith_fts.py
  — JSON экспорт/синк (бот DB ↔ қолданба HadithCorpus), тек сахих Бұхари+Муслим:
      .venv/bin/python scripts/hadith_corpus_sync.py export --db global_clean.db \\
        --out mobile/assets/bundled/hadith-from-db.json
      (қазақшасы барлар ғана: --only-with-kk; барлық жинақ: --include-all-sources).
      Кері жазу: import-json --input ... --dry-run
