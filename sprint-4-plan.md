# Sprint 4 — GPS track recording, napredno bodovanje, leaderboard i splash screen

**Trajanje:** 10 dana (2026-06-06 – 2026-06-16)
**Tim:** Mijo Galić (voditelj, glavni razvoj), Tonka Čepo (podrška, testiranje)
**Cilj:** GPS track recording (snimanje rute tokom aktivnosti), napredna formula bodovanja, leaderboard tabela, indikatori pređenih ferata na Explore ekranu i profilu, splash screen sa animacijom.

---

## Pregled zadataka po danima

### Subota–Nedjelja (2026-06-06 – 2026-06-07) — Arhitektura i priprema

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 1 | Dizajn GPS track recording servisa | Kreirati `lib/gps-tracker.ts` — servis za kontinuirano praćenje GPS pozicije tokom aktivnosti. Svakih 5 sekundi snimati točku (`lat`, `lon`, `alt`, `ts`). Koristiti `expo-location` sa `Accuracy.BestForNavigation`. | Mijo Galić | Visok |
| 2 | Definirati Firestore shemu za track podatke | Proširiti `ascents` dokument s poljima: `track: TrackPoint[]`, `completionType: 'gps' | 'manual'`, `elapsedTimeMin: number`. Kreirati TypeScript tip `TrackPoint` u `lib/firestore.ts`. | Mijo Galić | Visok |
| 3 | Dizajn formule bodovanja | Definirati konačnu formulu: `score = (diffWeight * heightFactor) / timeFactor * completionBonus`. `diffWeight` = težina ferate (1-25). `heightFactor = 1 + (visina / 100) * 0.5`. `timeFactor = 1 + (stvarnoVrijeme / očekivanoVrijeme) * 0.3`. `completionBonus = 1.0 (GPS) | 0.5 (ručno)`. | Mijo Galić | Visok |
| 4 | Pregled postojećeg koda i priprema testnog okruženja | Proći kroz `activity/add.tsx`, `lib/utils.ts` (trenutni `calculateScore`), `lib/firestore.ts` i identificirati šta treba izmijeniti. Pripremiti testne ferate sa `startLat/startLon/endLat/endLon`. | Tonka Čepo | Srednji |

### Ponedjeljak–Utorak (2026-06-08 – 2026-06-09) — GPS Track Recording

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 5 | Start track — provjera blizine početka ferate | Implementirati provjeru: da bi se track startao, korisnik mora biti unutar 200m od početnih koordinata (`startLat`, `startLon`). Ako nije — alert: "Moraš biti bliže početku ferate (min. 200m)." | Mijo Galić | Visok |
| 6 | End track — provjera blizine kraja ferate | Implementirati provjeru: da bi se track završio, korisnik mora biti unutar 200m od krajnjih koordinata (`endLat`, `endLon`). Ako nije — alert: "Moraš biti bliže kraju ferate (min. 200m)." | Mijo Galić | Visok |
| 7 | Track UI — start/stop/pauza gumbi | Na `activity/add.tsx` dodati "Pokreni Track" gumb (narančasti) koji se mijenja u "Završi Track" (crveni). Prikazivati proteklo vrijeme, broj snimljenih točaka, trenutnu udaljenost od ferate. Dodati "Pauziraj" / "Nastavi" gumbe. | Mijo Galić | Visok |
| 8 | Pohrana track podataka u Firestore | Po završetku track-a, snimiti niz GPS točaka u polje `track` unutar `ascents/{id}` dokumenta. Svaka točka: `{lat, lon, alt, ts}`. Prolazno vrijeme se računa iz timestampova prve i zadnje točke (minus pauze). | Mijo Galić | Visok |
| 9 | GPS signal izgubljen — automatska pauza | Implementirati detekciju gubitka GPS signala. Ako signal nestane na >30s, track se automatski pauzira. Po povratku signala — resume. | Mijo Galić | Srednji |
| 10 | Testiranje GPS track recording-a | Testirati start/stop track unutar i izvan 200m zone. Testirati pauziranje/resume. Testirati gubitak GPS signala. Testirati track u pozadini (minimizirana aplikacija). Testirati feratu bez koordinata — gumb onemogućen. | Tonka Čepo | Visok |

### Srijeda–Četvrtak (2026-06-10 – 2026-06-11) — Bodovanje i leaderboard

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 11 | Implementacija nove formule bodovanja | Zamijeniti postojeći `calculateScore()` u `lib/utils.ts` novom formulom. Score se računa na osnovu: težine ferate, visinske razlike, prolaznog vremena (iz track-a ili ručnog unosa) i tipa unosa (GPS/ručno). Score se zaokružuje na cijeli broj. Minimum score = 1. | Mijo Galić | Visok |
| 12 | Score kalkulacija na osnovu GPS track-a | Ako postoji GPS track, prolazno vrijeme se računa iz timestampova. Visina se računa iz razlike altitude prve i zadnje točke. `completionBonus = 1.0`. | Mijo Galić | Visok |
| 13 | Score history i grafikon napretka | Pri svakom novom ascentu čuvati i prethodni score. Na profilu prikazati grafikon napretka (score kroz vrijeme) — linijski grafikon ili jednostavni progress barovi. | Mijo Galić | Srednji |
| 14 | Leaderboard ekran | Novi tab ili sekcija "Leaderboard". Lista top 50 korisnika sortiranih po ukupnom score-u (suma svih ascent score-ova). Svaki red: rang (#1, #2, #3...), avatar (inicijali), ime, ukupni score, broj ferata. Top 3 imaju posebne bedževe (zlatni, srebrni, brončani). | Mijo Galić | Visok |
| 15 | Leaderboard — Firebase upit i indeks | Kreirati composite indeks u Firestore-u za `ascents`: `score` DESC, `createdAt` DESC. Agregacija score-ova po `userId` na klijentskoj strani. Cache TTL 5 minuta. | Mijo Galić | Visok |
| 16 | Leaderboard — vremenski filteri i vlastiti plasman | Filteri: "Ovog tjedna", "Ovog mjeseca", "Sve vrijeme". Vlastiti rang i score uvijek vidljiv (pinovan na dnu ili vrhu), čak i ako nije u top 50. | Mijo Galić | Srednji |
| 17 | Testiranje bodovanja i leaderboard-a | Testirati score sa GPS track-om (full completion) vs ručni unos. Testirati score za brzi vs spori prolaz. Testirati leaderboard prikaz, filtere, vlastiti plasman, prazan leaderboard, pull-to-refresh. | Tonka Čepo | Visok |

### Petak–Subota (2026-06-12 – 2026-06-13) — Indikatori prolazaka i splash screen

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 18 | Oznake "Pređeno" na Explore karticama | Na svakoj `FerrataCard` u Explore listi dodati malu zelenu kvačicu ili badge "Pređeno" ako korisnik ima ascent za tu feratu. Dohvatiti pređene `ferrataId`-ove kao `Set<string>` za brzi lookup. | Mijo Galić | Visok |
| 19 | Filter "Pređene ferate" u naprednim filterima | U naprednim filterima Explore-a dodati toggle: "Samo pređene", "Samo nepređene", "Sve". | Mijo Galić | Srednji |
| 20 | Statistika pređenih ferata na profilu | Na profilu prikazati: "Pređene ferate: X/23", progress bar (koliko %), lista pređenih ferata sa datumom i score-om. Klik na feratu otvara njene detalje. | Mijo Galić | Visok |
| 21 | Dizajn i implementacija splash screen-a | Animirani splash screen sa Hooked logom. Crna pozadina (#0D0D0D), logo u centru sa fade-in animacijom (1s), zatim narančasti progress bar (2s). Po završetku — glatki prelaz (fade-out) na auth ili main screen. | Mijo Galić | Visok |
| 22 | Splash screen konfiguracija i Firebase inicijalizacija | Podesiti `app.json` (`splash` sekcija: `backgroundColor`, `image`, `resizeMode`). Za Android: `splashScreen` u `AndroidManifest.xml`. Koristiti `expo-splash-screen` sa `preventAutoHideAsync()` i `hideAsync()`. Dok traje splash, u pozadini inicijalizirati Firebase Auth. | Mijo Galić | Visok |
| 23 | Testiranje indikatora prolazaka i splash screen-a | Testirati oznake "Pređeno" na Explore karticama. Testirati filtere "Samo pređene" / "Samo nepređene". Testirati statistiku na profilu. Testirati splash screen — trajanje, animaciju, prelaz na auth/main, odsustvo bijelog fleša. | Tonka Čepo | Visok |

### Nedjelja–Utorak (2026-06-14 – 2026-06-16) — Integracija, testiranje i dokumentacija

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 24 | Integracija svih komponenti | Povezati GPS tracker sa scoringom, scoring sa leaderboardom, indikatore prolazaka sa ascentima. Osigurati da sve komponente rade zajedno bez konflikata. | Mijo Galić | Visok |
| 25 | Regresiono testiranje — full flow sa track-om | Cijeli flow: Login → pronađi feratu u blizini → pokreni track → prođi feratu → završi track → provjeri score → provjeri leaderboard → provjeri oznaku "Pređeno" na Explore → provjeri statistiku na profilu. | Tonka Čepo | Visok |
| 26 | Regresiono testiranje — postojeće funkcionalnosti | Testirati da ručni unos aktivnosti i dalje radi. Testirati Explore, Mapu, Recenzije, Favorite, Profil — sve postojeće funkcionalnosti. Provjeriti performanse (bez memory leak-ova od GPS trackera). | Tonka Čepo | Visok |
| 27 | Čišćenje koda i TypeScript provjera | Ukloniti mrtav kod, provjeriti TypeScript tipove (`tsc --noEmit`), srediti importe, osigurati konzistentan stil koda. | Mijo Galić | Srednji |
| 28 | Dokumentacija Sprinta 4 | Napisati izvještaj: šta je implementirano, kako funkcioniše GPS track recording, formula bodovanja, leaderboard, poznati bagovi, upute za daljnji razvoj. | Tonka Čepo | Nizak |

---

## Dodatni zadaci (izvan osnovnog plana)

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 29 | Track prikaz na mapi | Na ActivityCard i detaljima aktivnosti prikazati malu mapu sa iscrtanom trasom (Polyline) koristeći snimljene GPS točke. | Mijo Galić | Nizak |
| 30 | Export track-a u GPX format | Omogućiti izvoz snimljenog track-a u GPX format za korištenje u drugim aplikacijama (Google Earth, Strava...). | Mijo Galić | Nizak |
| 31 | Push notifikacije za leaderboard | Notifikacija kada korisnik padne sa top 10 ili kada ga neko prestigne. | Mijo Galić | Nizak |

---

## Korekcije

| Problem | Opis | Rješenje |
|---------|------|----------|
| GPS track ne može startati bez koordinata ferate | Neke ferate nemaju definirane `startLat/startLon/endLat/endLon` | "Pokreni Track" gumb onemogućen (disabled) sa tooltipom: "Ferata nema definirane koordinate." |
| GPS signal nestane tokom track-a | U tunelu ili lošem vremenu GPS signal može nestati na duže vrijeme | Automatska detekcija gubitka signala (>30s) → automatska pauza track-a. Po povratku signala → resume. |
| Score za ručni unos previsok u odnosu na GPS track | Ručni unos ne prolazi kroz istu rigoroznu provjeru kao GPS track | `completionBonus = 0.5` za ručni unos. GPS track uvijek daje veći score. |
| Leaderboard prazan za nove korisnike | Nema dovoljno podataka za prikaz | Poruka: "Još nema rezultata. Budi prvi/a!" + gumb koji vodi na Explore. |
| Splash screen — bijeli fleš prije prikaza | Android defaultno prikazuje bijeli ekran prije splash-a | `backgroundColor: "#0D0D0D"` u `app.json` splash konfiguraciji. `android:windowBackground` u `styles.xml`. |
| Previše Firestore čitanja za indikatore prolazaka | Svako renderovanje Explore liste čita sve ascent-e korisnika | Cached `Set<string>` pređenih `ferrataId`-ova. Osvježava se samo pri dodavanju nove aktivnosti ili pull-to-refreshu. |
| Leaderboard — spora agregacija na klijentskoj strani | Za mnogo korisnika, dohvat i sumiranje svih score-ova može biti sporo | Firebase Cloud Function za dnevnu agregaciju. Klijentska strana kešira rezultate 5 minuta. |

---

## Planirane izmjene u Firestore shemi

```
ascents/{ascentId}
  ├── userId (ref), ferrataId (ref), ferrataName
  ├── date, duration, difficultyRating
  ├── notes, photos[]
  ├── track: [{ lat: number, lon: number, alt: number | null, ts: Timestamp }]   // NOVO
  ├── completionType: 'gps' | 'manual'                                            // NOVO
  ├── elapsedTimeMin: number                                                      // NOVO (iz track-a)
  ├── score: number                                                               // POSTOJEĆE (nova formula)
  └── createdAt
```

### Novi kompozitni indeksi

```
ascents: score DESC, createdAt DESC        // za leaderboard
ascents: userId ASC, ferrataId ASC         // za indikatore prolazaka
```

---

## Formula bodovanja (detaljno)

```
score = round(diffWeight * heightFactor / timeFactor * completionBonus)

Gdje je:
  diffWeight       = getDiffWeight(difficulty)          // A=1, A/B=2, B=3, B/C=5, C=7, C/D=10, D=13, E=17, E/F=21, F=25
  heightFactor     = 1 + (heightDiffMeters / 100) * 0.5 // npr. 350m → 1 + 1.75 = 2.75
  timeFactor       = 1 + (actualTimeMin / expectedTimeMin) * 0.3  // brži prolaz = manji faktor = više bodova
  completionBonus  = 1.0 (GPS track) | 0.5 (ručni unos)

Primjeri:
  - Ferata C (diffWeight=7), visina 350m, očekivano 180 min, stvarno 150 min, GPS track
    score = round(7 * 2.75 / (1 + (150/180)*0.3) * 1.0)
    = round(19.25 / 1.25) = round(15.4) = 15

  - Ista ferata, ručni unos (completionBonus=0.5)
    score = round(15.4 * 0.5) = round(7.7) = 8

  - Ferata F (diffWeight=25), visina 500m, očekivano 240 min, stvarno 200 min, GPS track
    score = round(25 * 3.5 / (1 + (200/240)*0.3) * 1.0)
    = round(87.5 / 1.25) = round(70) = 70
```

---

## Raspodjela posla

| Osoba | Zadaci | Broj zadataka |
|-------|--------|---------------|
| Mijo Galić | 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 27, 29, 30, 31 | 24 |
| Tonka Čepo | 4, 10, 17, 23, 25, 26, 28 | 7 |
