# Sprint 2 — Pohrana podataka, pregled i manipulacija bazom

**Trajanje:** 5 dana (ponedjeljak – petak)
**Tim:** Mijo Galić (voditelj, glavni razvoj), Tonka Čepo (podrška, testiranje)
**Cilj:** Implementacija Firestore modela, CRUD servisa, preglednih ekrana i testiranje komunikacije s bazom.

---

## Pregled zadataka po danima

### Ponedjeljak — Modeli podataka i servisni sloj

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 1 | Dizajn Firestore kolekcija i sigurnosnih pravila | Definirati shemu za `via_ferrata` (staze), `ascents` (usponi/aktivnosti), `reviews` (recenzije) i `favorites`. Postaviti Firestore Security Rules za citanje/pisanje. | Mijo Galić | High |
| 2 | Implementacija `lib/firestore.ts` — genericki CRUD servis | Napisati TypeScript modul s funkcijama `getCollection`, `getDocument`, `addDocument`, `updateDocument`, `deleteDocument`, `queryDocuments` (s filtriranjem i sortiranjem). | Mijo Galić | High |
| 3 | Testni dokumenti i provjera konekcije | Rucno dodati testne dokumente u Firestore (putem konzole ili seed screena) i provjeriti da se citaju kroz servis. | Tonka Čepo | High |

### Utorak — Prikaz podataka (via ferata staze)

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 4 | `app/(tabs)/explore.tsx` — stvarni prikaz staza iz baze | Zamijeniti placeholder sadrzaj na Explore ekranu: dohvatiti kolekciju `via_ferrata` i prikazati staze u karticnom izgledu (naziv, lokacija, tezina, duzina, slika). | Mijo Galić | High |
| 5 | `components/FerrataCard.tsx` — komponenta kartice staze | Napraviti zasebnu komponentu za prikaz jedne via ferata staze s osnovnim informacijama (naziv, lokacija, tezina, ocjena). | Mijo Galić | Medium |
| 6 | Ekran detalja staze `app/(tabs)/explore/[id].tsx` | Implementirati zaslon s potpunim detaljima jedne staze: opis, tezina, duzina, visinska razlika, pristup, galerija slika, sezona, ocjene (kondicija/vjestine/iskustvo/pejzaz), recenzije, favoriti, mapa lokacije. | Mijo Galić | High |
| 7 | Testiranje dohvata i prikaza staza | Napisati testne scenarije za dohvat kolekcije `via_ferrata` i provjeru ispravnosti prikaza. | Tonka Čepo | Medium |

### Srijeda — Evidencija aktivnosti (usponi)

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 8 | `app/(tabs)/activity.tsx` — stvarni prikaz aktivnosti | Zamijeniti placeholder: dohvatiti kolekciju `ascents` za trenutnog korisnika i prikazati povijest uspona (datum, staza, trajanje, biljeske). | Mijo Galić | High |
| 9 | `app/(tabs)/activity/add.tsx` — forma za unos nove aktivnosti | Implementirati screen s formom: odabir staze (dropdown / search), datum, vrijeme trajanja, tezina ocjena, biljeske. Spremati u `ascents` kolekciju. | Mijo Galić | High |
| 10 | `components/ActivityCard.tsx` — komponenta kartice aktivnosti | Napraviti komponentu za prikaz jedne aktivnosti u listi. | Mijo Galić | Medium |
| 11 | Testiranje unosa i povijesti aktivnosti | Testirati dodavanje nove aktivnosti, validaciju forme i osvjezavanje popisa. | Tonka Čepo | Medium |

### Cetvrtak — Favoriti, recenzije i napredna manipulacija

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 12 | Sustav favorita — `favorites` kolekcija | Implementirati dodavanje/uklanjanje staza u favorite, te prikaz favorita na profilu ili posebnom ekranu. | Mijo Galić | High |
| 13 | Sustav recenzija — `reviews` kolekcija | Omoguciti korisnicima da ostave ocjenu (1-5) i tekstualnu recenziju na stranici detalja staze. | Mijo Galić | Medium |
| 14 | Ekran profila — statistika iz baze | Na profilu prikazati broj uspona, ukupne metre visinske razlike, omiljene staze (dohvat iz `ascents` i `favorites`). | Mijo Galić | Medium |
| 15 | Testiranje favorita i recenzija | Provjeriti konzistentnost podataka (ne dupliciranje favorita, ispravno brisanje), edge casevi. | Tonka Čepo | Low |

### Petak — Testiranje, integracija i dokumentacija

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 16 | End-to-end test komunikacije s Firestore | Proci kroz sve CRUD operacije nad svim kolekcijama, provjeriti Security Rules (autenticirani cita samo svoje podatke gdje treba). | Tonka Čepo | High |
| 17 | Optimizacija upita i indeksi | Pregledati Firestore Indexes, dodati composite indekse tamo gdje treba, optimizirati dohvate. | Mijo Galić | Medium |
| 18 | Ciscenje koda i TypeScript tipovi | Ukloniti placeholder komentare, provjeriti TypeScript tipove, srediti importe, osigurati konzistentan kod kroz cijeli projekt. | Mijo Galić | Low |
| 19 | Dokumentacija Sprint 2 | Napisati izvjestaj: sto je implementirano, arhitektura kolekcija, upute za daljnji razvoj. | Tonka Čepo | Low |

---

## Dodatni zadaci (izvan osnovnog plana)

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 20 | Seed podataka — viaferrata.ba | Web scraping 23 via ferata iz BiH sa svim podacima: opis, tezina, duzina, visinska razlika, koordinate, sezona, ocjene, galerija slika. | Mijo Galić | High |
| 21 | `app/(tabs)/map.tsx` — interaktivna mapa | Google Maps prikaz svih ferata s markerima u boji po tezini, info prozorima, dark theme stilom i navigacijom na detalje. | Mijo Galić | High |
| 22 | Google Maps API konfiguracija | Postavljanje API key-a u `app.json`, `AndroidManifest.xml` i Google Cloud Console (Maps SDK for Android). | Mijo Galić | High |
| 23 | Image caching — `expo-image` | Zamjena svih `Image` iz react-native sa `expo-image` uz `cachePolicy="memory-disk"` za brzo ucitavanje. | Mijo Galić | Medium |
| 24 | Image preview modal | Popravak crnog ekrana pri pregledu slika — koristenje `expo-image` umjesto `Image` iz react-native. | Mijo Galić | Medium |

---

## Planirane Firestore kolekcije

```
users/{userId}
  ├── firstName, lastName, email, dateOfBirth
  ├── experience, terrain, equipment, companionship
  └── onboardingComplete

via_ferrata/{ferrataId}
  ├── name, location, difficulty (A-F)
  ├── length, duration
  ├── description, detailedDescription
  ├── targetAudience, accessInfo
  ├── imageUrl, gallery[]
  ├── latitude, longitude, startPoint
  ├── heightDiff, climbingTime, accessTime, descentTime, orientation
  ├── fitnessLevel, skillLevel, experience, landscape
  ├── bestSeason[]
  ├── rating, reviewCount
  └── createdAt, updatedAt

ascents/{ascentId}
  ├── userId (ref), ferrataId (ref), ferrataName
  ├── date, duration, difficultyRating
  ├── notes, photos[]
  └── createdAt

reviews/{reviewId}
  ├── userId (ref), userName, ferrataId (ref)
  ├── rating (1-5), comment
  └── createdAt

favorites/{favoriteId}
  ├── userId (ref), ferrataId (ref), ferrataName
  └── createdAt
```

---

## Raspodjela posla

| Osoba | Zadaci | Broj zadataka |
|-------|--------|---------------|
| Mijo Galić | 1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 17, 18, 20, 21, 22, 23, 24 | 18 |
| Tonka Čepo | 3, 7, 11, 15, 16, 19 | 6 |



