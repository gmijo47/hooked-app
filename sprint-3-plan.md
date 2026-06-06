# Sprint 3 — UI/UX dorada, GPS funkcionalnosti i sistemska poboljsanja

**Trajanje:** 3 dana (2026-06-08 – 2026-06-10)
**Tim:** Mijo Galić (voditelj, glavni razvoj), Tonka Čepo (podrška, testiranje)
**Cilj:** Dizajn pocetne stranice, GPS funkcionalnosti (ferate u blizini, provjera lokacije za uspon), sistem bodovanja, redizajn recenzija i popravke bagova.

---

## Pregled zadataka po danima

### Ponedjeljak (2026-06-08) — Dizajn i redizajn ekrana

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 1 | Redizajn pocetne stranice | Hero kartica sa korisnickim avatarom, inicijalima, levelom (Pocetnik-Veteran-Legenda) i statistikom. Sekcije: brze akcije (novi uspon, mapa, istrazi), izdvojene ferate (top 3 sa difficulty badge-om, lokacijom, ocjenom), oprema za via ferratu (kaciga, VF set, obuca, rukavice), sigurnosni savjeti (5 numerisanih pravila). | Mijo Galić | High |
| 2 | Redizajn sekcije recenzija | Nove kartice sa avatarom, imenom, datumom i zvjezdicama. Vlastita recenzija oznacena narandzastim borderom i "(ti)" tagom. Modal sa overlay pozadinom i bottom sheet dizajnom. Edit i delete dugmad samo za svoju recenziju. | Mijo Galić | High |
| 3 | Jedan korisnik — jedna recenzija po ferati | Provjera postoji li vec korisnikova recenzija pri ucitavanju. Ako ima: prikaz sa edit/delete opcijama. Ako nema: forma za novu. Edit mod sa pred-popunjenim podacima, "Spremi izmjene" i "Odustani" dugmadima. Brisanje uz Alert potvrdu. | Mijo Galić | High |
| 4 | Profil — premjestanje statistike na vrh | Kartica "Tvoja statistika" premjestena odmah ispod avatara, prije kartica sa osobnim podacima i via ferrata profilom. | Mijo Galić | Low |
| 5 | Testiranje UI promjena na svim ekranima | Provjeriti izgled pocetne, recenzija, profila na razlicitim uredajima. Testirati edit/delete recenzije, otvaranje/zatvaranje modala. | Tonka Čepo | Medium |

### Utorak (2026-06-09) — GPS funkcionalnosti i bodovanje

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 6 | "Ferate u blizini" — GPS filter na explore ekranu | Toggle u naprednim filterima, defaultno iskljucen. Kada se ukljuci: trazi GPS dozvolu (`expo-location`), uzima trenutnu poziciju, filtrira ferate unutar 10 km koristeci Haversine formulu. Aktivno stanje oznaceno narandzastim dugmetom i "U blizini (10 km)" tekstom. | Mijo Galić | High |
| 7 | GPS provjera pri dodavanju aktivnosti | Prije spašavanja uspona provjera udaljenosti od odabrane ferate. Mora biti unutar 500 m. Ako nije, prikazuje se poruka s udaljenoscu u km. | Mijo Galić | High |
| 8 | `lib/utils.ts` — distance i bodovanje | Haversine formula za udaljenost izmedu GPS koordinata. Funkcija `calculateScore()` — bodovanje uspona na osnovu: tezine (A=1, A/B=2, ..., F=25), duzine (+0.02/m), visinske razlike (+0.05/m), trajanja (+0.1/min). Rezultat se sprema u `ascents/{id}/score`. | Mijo Galić | High |
| 9 | Instalacija `expo-location` i konfiguracija | Dodavanje paketa, podesavanje dozvola u `app.json`, testiranje GPS dohvata. | Mijo Galić | High |
| 10 | Testiranje GPS funkcionalnosti | Testirati "U blizini" filter na stvarnoj lokaciji, testirati odbijanje dozvole, testirati 500m provjeru pri dodavanju aktivnosti. | Tonka Čepo | Medium |

### Srijeda (2026-06-10) — Popravke bagova i sistemsko ciscenje

| # | Zadatak | Opis | Odgovorni | Prioritet |
|---|---------|------|-----------|-----------|
| 11 | Image preview modal — slika crna | `expo-image` zamijenjen sa `RNImage` (react-native Image) u preview modalu. Modal postavljen na `transparent={false}` sa `#000000` pozadinom. | Mijo Galić | High |
| 12 | Login redirect loop | `RootGuard` u `_layout.tsx` popravljen: dodat `useRootNavigationState()` da saceka spremnost navigacije, `navigating` ref za sprjecavanje duplih navigacija, `segments` u dependency array. | Mijo Galić | High |
| 13 | Tipkovnica prekriva password polje | `KeyboardAvoidingView` promijenjen na `behavior="height"` za Android. Password input dobio `onFocus` handler koji skrola na dno forme. | Mijo Galić | Medium |
| 14 | Bespotrebno reloadanje explore ekrana | Dodan `loaded` flag — podaci ostaju u memoriji pri navigaciji na detalje i nazad. Pull-to-refresh forsira osvjezenje (`load(true)`). | Mijo Galić | Medium |
| 15 | Recenzije modal — vidio se komad stare stranice | Modal restrukturiran: dodat `reviewsModalOverlay` (tamni overlay preko cijelog ekrana) + `reviewsModal` (absolute bottom sheet sa zaobljenim vrhom). | Mijo Galić | Medium |
| 16 | Sistemske greske — dupli stilovi, import konflikti, typo | Uklonjeni dupli `ratingHero*` i `featuresBlock` stilovi. Popravljen konflikt importa `parseDuration` (bio lokalno i iz `utils.ts`). Typo `heightDiff` → `heightDiffMeters`. Dodani nedostajuci stilovi `nearbyBtnActive` i `nearbyBtnTextActive`. | Mijo Galić | Medium |
| 17 | Zavrsno testiranje cijele aplikacije | Proci kroz sve ekrane, provjeriti login flow, recenzije, GPS funkcionalnost, preview slika, navigaciju, profil. | Tonka Čepo | High |

---

## Korekcije

| Problem | Opis | Rjesenje |
|---------|------|----------|
| Image preview crni ekran | `expo-image` ne radi u `Modal` komponenti s `transparent` | `RNImage` iz react-native + `transparent={false}` + `#000000` pozadina |
| Login vodi nazad na login | `RootGuard` koristio stale `segments`, bez zastite od duplih navigacija | `useRootNavigationState()`, `navigating` ref, `segments` u deps |
| Keyboard prekriva input | Android ne gura automatski sadrzaj pri otvaranju tipkovnice | `behavior="height"`, `onFocus` scroll |
| Explore reloada nakon povratka s detalja | `useEffect` uvijek poziva `load()` | `loaded` flag — podaci se cuvaju u state-u |
| Recenzije modal providan | Modal `transparent` bez overlay pozadine | Odvojen overlay + bottom sheet |
| Dupli stilovi u `[id].tsx` | Visestruko definirani `ratingHero*`, `featuresBlock` | Uklonjeni duplikati |
| Import konflikt `parseDuration` | Funkcija postoji i lokalno u explore.tsx i u utils.ts | Uklonjen import iz utils.ts (koristi se lokalna) |
| Typo u utils.ts | Parametar `heightDiff` umjesto `heightDiffMeters` | Ispravljeno |
