# Religious Content Review Packet — Namaz, Azan, Fiqh

**Status:** ready for external review  
**Scope:** RAQAT / RAHAT OMIR mobile and web religious copy  
**Required reviewer:** qualified Hanafi scholar or QMDB/Fatua.kz/Muftyat.kz-aligned religious-content reviewer

## Review Goal

Confirm that user-facing worship guidance is consistent with:

- Hanafi madhhab practical framing for Kazakhstan users.
- Maturidi aqida posture where creed-sensitive language appears.
- QMDB/Fatua.kz/Muftyat.kz source posture and public religious harmony.
- Clear separation between general educational text and fatwa/personal ruling.

This packet is not an approval by the engineering team. It is the handoff checklist for external sign-off.

## Files To Review

1. `mobile/src/content/namazContent.ts`
   - Practical namaz guidance and learning copy.
   - Check all fiqh wording, conditions, exceptions, and warnings.

2. `mobile/src/content/namazLearningContent.ts`
   - Step-by-step prayer learning content.
   - Check sequence, terminology, and beginner-facing explanations.

3. `mobile/src/content/namazMenzikir.ts`
   - Post-prayer zikr/dua content.
   - Check Arabic text, transliteration, meaning, and repeat counts.

4. `mobile/src/screens/PrayerAzanScreen.tsx`
   - Azan display flow and text rendering.
   - Check Arabic azan blocks, Fajr extra line, and post-azan dua.

5. `mobile/src/i18n/kk.ts`
   - Kazakh baseline strings, including azan text and religious disclaimers.
   - Check whether the wording stays educational and does not present new fatwa.

6. `mobile/src/i18n/runtime.ts`
   - Russian and English azan meaning/transliteration patches.
   - Check that translated meaning remains faithful and safe.

7. `mobile/src/config/aiRequestPolicy.ts`
   - Client-side AI request policy text.
   - Check Hanafi/QMDB guardrail wording.

8. `platform_api/ai_proxy.py`
   - Backend AI system/prompt guardrail text.
   - Check that AI is framed as a source-grounded helper, not a fatwa authority.

9. `platform_api/ai_safety_moderation.py`
   - Lightweight AI safety classifier.
   - Check blocked/review categories and safe refusal copy.

## Azan Text Checklist

- [ ] Standard azan order is correct.
- [ ] Fajr extra phrase `الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ` appears only for Fajr.
- [ ] Repeat counts are correct.
- [ ] Post-azan dua is complete, including `إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ`.
- [ ] Kazakh meaning is acceptable.
- [ ] Russian meaning is acceptable.
- [ ] English meaning is acceptable.
- [ ] Transliteration style is acceptable for beginner reading.

## Namaz / Fiqh Checklist

- [ ] Wudu and prayer steps match Hanafi practice.
- [ ] Obligatory, wajib, sunnah, mustahabb, makruh, invalidating actions are not mixed.
- [ ] Exceptions are not over-generalized.
- [ ] Personal cases direct users to a qualified teacher or official fatwa source.
- [ ] The app does not issue individual fatwa.
- [ ] Terms are clear for Kazakhstan users.

## AI Safety Checklist

- [ ] AI guardrails mention QMDB/Fatua.kz/Muftyat.kz and Hanafi framing.
- [ ] AI does not produce takfir, sectarian agitation, extremist instructions, or illegal/violent guidance.
- [ ] Sensitive fiqh questions are answered cautiously and source-grounded.
- [ ] Insufficient evidence leads to a referral to official sources/qualified teacher.
- [ ] Safe refusal wording is acceptable in Kazakh.

## Reviewer Sign-off

Reviewer name:

Role / affiliation:

Date:

Decision:

- [ ] Approved as-is.
- [ ] Approved with minor wording changes listed below.
- [ ] Not approved; requires rewrite before release.

Required changes:

1.
2.
3.

