# HOOKED — Via Ferrata Companion

## Ručni (manuelni) testovi — Kompletan test plan

**Verzija:** 1.0.0 — Sprint 4  
**Datum:** 17.06.2026.  
**Tim:** Mijo Galić (razvoj), Tonka Čepo (testiranje)  
**Okruženje:** Android (primarno), iOS, Web

---

## Sadržaj

1. [Autentifikacija](#1-autentifikacija)
2. [Onboarding](#2-onboarding)
3. [Početna stranica (Home)](#3-pocetna-stranica-home)
4. [Istražite ferate (Explore)](#4-istrazite-ferate-explore)
5. [Detalji ferate](#5-detalji-ferate)
6. [Aktivnosti](#6-aktivnosti)
7. [Mapa](#7-mapa)
8. [Profil](#8-profil)
9. [Recenzije](#9-recenzije)
10. [Favoriti](#10-favoriti)
11. [GPS funkcionalnosti](#11-gps-funkcionalnosti)
12. [Regresioni testovi](#12-regresioni-testovi)
13. [🆕 Sprint 4 — GPS Track Recording](#13-sprint-4--gps-track-recording)
14. [🆕 Sprint 4 — Novo bodovanje](#14-sprint-4--novo-bodovanje-scoring)
15. [🆕 Sprint 4 — Leaderboard](#15-sprint-4--leaderboard)
16. [🆕 Sprint 4 — Indikatori pređenih ferata](#16-sprint-4--indikatori-pređenih-ferata)
17. [🆕 Sprint 4 — Splash Screen](#17-sprint-4--splash-screen)
18. [🆕 Sprint 4 — Regresioni testovi](#18-sprint-4--regresioni-testovi-cijeli-flow)

---

## 1. Autentifikacija

### 1.1 Registracija

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-01 | Uspješna registracija | 1. Otvori app -> "Registruj se"<br>2. Unesi: Ime=Marko, Prezime=Markic, Datum=15.03.1990, Email=marko@test.com, Lozinka=test123, Potvrda=test123<br>3. Klikni "Nastavi" | Kreiran Firebase Auth korisnik + Firestore `users/{uid}` dokument sa `onboardingComplete: false`. Root guard preusmjerava na onboarding. | Riješeno |
| T-REG-02 | Prazno ime | Registracija bez imena | Poruka: "Unesite ime i prezime." | Riješeno |
| T-REG-03 | Neispravan datum | Datum u formatu `1990-01-01` (ISO) | Poruka: "Datum rođenja mora biti u formatu DD.MM.GGGG" | Riješeno |
| T-REG-04 | Prekratka lozinka | Lozinka = `12345` | Poruka: "Lozinka mora imati min. 6 znakova." | Riješeno |
| T-REG-05 | Lozinke se ne podudaraju | Lozinka = `123456`, Potvrda = `654321` | Poruka: "Lozinke se ne podudaraju." | Riješeno |
| T-REG-06 | Već registrirani email | Registracija sa emailom koji već postoji | Poruka: "Email je već registriran." | Riješeno |
| T-REG-07 | Nevažeći email format | Email = `nijeemail` | Firebase greška: "Nevažeći email format." | Riješeno |

### 1.2 Prijava

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-LOG-01 | Uspješna prijava | 1. Email = `marko@test.com`, Lozinka = `test123`<br>2. Klikni "Prijavi se" | Root guard preusmjerava na `/(tabs)` ako je onboarding završen. Ako nije -> onboarding. | Riješeno |
| T-LOG-02 | Pogrešan email/lozinka | Email = `krivi@test.com`, Lozinka = `kriva` | Poruka: "Pogrešan email ili lozinka." | Riješeno |
| T-LOG-03 | Prazna polja | Klik na "Prijavi se" bez unosa | Poruka: "Unesite email i lozinku." | Riješeno |
| T-LOG-04 | Previše pokušaja | 5+ neuspješnih prijava zaredom | Poruka: "Previše pokušaja. Pokušajte kasnije." | Riješeno |
| T-LOG-05 | Prikaz/sakrij lozinku | Klik na ikonu pored lozinke | Lozinka se prikazuje/sakriva, ikona se mijenja (eye/eye-off). | Riješeno |

### 1.3 Odjava

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-LOGOUT-01 | Odjava preko profila | Profil -> "Odjavi se" -> Potvrdi | Firebase signOut, root guard preusmjerava na login. | Riješeno |
| T-LOGOUT-02 | Odjava — otkazivanje | Profil -> "Odjavi se" -> Odustani | Ostaje na profilu, korisnik i dalje prijavljen. | Riješeno |

### 1.4 Login redirect

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-LOG-LOOP-01 | Prijava -> direktno tabs | Prijavi se sa validnim kredencijalima | Odlazi na `/(tabs)` bez vraćanja na login. | Riješeno |
| T-LOG-LOOP-02 | Već prijavljen -> otvori app | Ponovno pokreni app dok je korisnik prijavljen | Ne prikazuje se login ekran ni na trenutak. | Riješeno |
| T-LOG-LOOP-03 | Logout -> login | Odjavi se, zatim se prijavi ponovo | Jedan, cist prijelaz, bez loop-anja. | Riješeno |

---

## 2. Onboarding

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-ONB-01 | Prolazak kroz sve korake | 1. Iskustvo -> "1-5 ferata"<br>2. Teren -> "Stijene i klisure"<br>3. Oprema -> "Kompletna oprema"<br>4. Stil -> "S prijateljem/icom"<br>5. "Završi" | Firestore `users/{uid}` ažuriran sa odabranim vrijednostima + `onboardingComplete: true`. Preusmjeravanje na `/(tabs)`. | Riješeno |
| T-ONB-02 | Ne moze dalje bez odabira | Klikni "Dalje" bez odabira opcije | Gumb je onemogućeno (disabled), ništa se ne događa. | Riješeno |
| T-ONB-03 | Nazad gumb | Na koraku 2 -> klikni "Nazad" | Vraca na korak 1, odabir je sačuvan. | Riješeno |
| T-ONB-04 | Nema nazad na prvom koraku | Na koraku 1 (Iskustvo) | Gumb "Nazad" se ne prikazuje. | Riješeno |
| T-ONB-05 | Progress bar | Prelazak kroz korake | Progress bar se popunjava: 25% -> 50% -> 75% -> 100%. | Riješeno |
| T-ONB-06 | Označena opcija (check ikona) | Odaberi "1-5 ferata" | Zelena check ikona se prikazuje desno od odabrane opcije. | Riješeno |

---

## 3. Početna stranica (Home)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-HOME-01 | Učitavanje ferata | Otvori početnu stranicu | Prikazuju se ferate iz Firestore `via_ferrata` kolekcije. | Riješeno |
| T-HOME-02 | Hero slider | Horizontalni scroll kroz hero kartice | 3 random ferate sa slikama, difficulty badge u boji, naziv i lokacija. | Riješeno |
| T-HOME-03 | Brze akcije (4 kartice) | Klikni na "Istražuj", "Mapa", "Aktivnosti", "Profil" | Svaka vodi na odgovarajuci tab. | Riješeno |
| T-HOME-04 | Najbolje ocijenjene | Sekcija "Najbolje ocijenjene" | Prikazuje top 4 ferate sortirane po `rating` opadajuće. | Riješeno |
| T-HOME-05 | Za početnike | Sekcija "Za početnike" | Prikazuje lagane ferate (A, A/B, B), max 3. | Riješeno |
| T-HOME-06 | Za iskusne | Sekcija "Za iskusne" | Prikazuje teske ferate (C/D, D, E, E/F, F), max 3. | Riješeno |
| T-HOME-07 | Sigurnosni savjeti | Sekcija "Sigurnost na ferati" | 5 numeriranih pravila sa ikonama (kaciga, VF set, voda...). | Riješeno |
| T-HOME-08 | Vodič za težine | Sekcija "Tezine ferata" | 4 težinske kategorije s bojama i opisima. | Riješeno |
| T-HOME-09 | Klik na feratu u hero slideru | Klikni hero karticu | Otvara `/(tabs)/explore/{id}`. | Riješeno |
| T-HOME-10 | Klik na feratu u listi | Klikni red u "Najbolje ocijenjene" | Otvara detalje te ferate. | Riješeno |
| T-HOME-11 | Pull-to-refresh (nema) | Povuci nadole | Nema refresh (stranica je statična nakon prvog loada). | Riješeno |

---

## 4. Istražite ferate (Explore)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-EXP-01 | Učitavanje svih ferata | Otvori Explore tab | Lista svih ferata iz baze, sortiranih po imenu. | Riješeno |
| T-EXP-02 | Top 5 horizontalni slider | Pogledaj vrh explore stranice | Horizontalni slider sa top 5 ferata po ocjeni u compact prikazu. | Riješeno |
| T-EXP-03 | FlatList sa svim feratama | Skroluj ispod top 5 | Sve ferate u `FerrataCard` komponentama. | Riješeno |
| T-EXP-04 | Pull-to-refresh | Povuci listu nadole | Osvjezava podatke iz Firestore-a (force reload). | Riješeno |
| T-EXP-05 | Pretraga po imenu | Unesi "prenj" u search polje | Filtrira ferate koje sadrze "prenj" u imenu ili lokaciji. | Riješeno |
| T-EXP-06 | Pretraga po lokaciji | Unesi "mostar" | Prikazuje ferate u Mostaru. | Riješeno |
| T-EXP-07 | Brisanje pretrage (X gumb) | Klikni X u search polju | Brise tekst, prikazuje sve ferate. | Riješeno |
| T-EXP-08 | Napredni filteri — toggle | Klikni ikonu filtera | Otvara/zatvara napredne filtere, ikona mijenja boju. | Riješeno |
| T-EXP-09 | Filter po tezini | Odaberi "A" i "B/C" | Prikazuje samo ferate tih težina. | Riješeno |
| T-EXP-10 | Filter po tezini — brisanje | Klikni "Obrisi" pored težina | Uklanja sve filtere težine. | Riješeno |
| T-EXP-11 | Filter po duzini | Odaberi "do 500" | Prikazuje ferate <= 500m. | Riješeno |
| T-EXP-12 | Filter po vremenu | Odaberi "do 60 min" | Prikazuje ferate sa trajanjem <= 60 min. | Riješeno |
| T-EXP-13 | Kombinovani filteri | Pretraga + težina + duzina | Presjek svih filtera. | Riješeno |
| T-EXP-14 | Nema rezultata | Filter koji ne daje rezultate | Poruka "Nema rezultata" sa predlogom. | Riješeno |
| T-EXP-15 | Bez reloadanja pri povratku | Otvori detalje -> vrati se nazad | Podaci ostaju u memoriji, nema spinnera, nema ponovnog fetcha. | Riješeno |
| T-EXP-16 | Klik na FerrataCard | Klikni bilo koju karticu | Otvara `/(tabs)/explore/{id}`. | Riješeno |

---

## 5. Detalji ferate

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-DET-01 | Učitavanje detalja | Otvori bilo koju feratu | Prikazuju se svi podaci: slika, naziv, lokacija, težina, duzina, visina. | Riješeno |
| T-DET-02 | Back navigacija | Klikni strelicu nazad | Vraca se na explore/home ekran. | Riješeno |
| T-DET-03 | Ne postoji ferata | Otvori `/explore/nepostojeci-id` | Poruka "Ferata nije pronađena." + gumb "Nazad". | Riješeno |
| T-DET-04 | Loading spinner | Otvori detalje (sporija mreza) | Prikazuje se `ActivityIndicator` narančaste boje. | Riješeno |
| T-DET-05 | Galerija slika | Horizontalni scroll kroz galeriju | Slike se prikazuju, snap-to-interval radi. | Riješeno |
| T-DET-06 | Klik na glavnu sliku | Klikni glavnu sliku ferate | Otvara fullscreen image preview modal. | Riješeno |
| T-DET-07 | Klik na galerijsku sliku | Klikni sliku u galeriji | Otvara fullscreen preview na toj slici. | Riješeno |
| T-DET-08 | Image preview modal — zatvaranje | X gumb u preview modalu | Zatvara modal, vraća na detalje. | Riješeno |
| T-DET-09 | Image preview — ispravan prikaz | Otvori preview modal | Slika se prikazuje normalno, pozadina je crna (#000000). | Riješeno |
| T-DET-10 | Opis — expand/collapse | Klikni "Procita više" / "Sakrij" | Tekst se siri/skuplja. | Riješeno |
| T-DET-11 | Za koga je — expand/collapse | Klikni "Procita više" | Sekcija se siri/skuplja. | Riješeno |
| T-DET-12 | Pristup — expand/collapse | Klikni "Procita više" | Sekcija se siri/skuplja. | Riješeno |
| T-DET-13 | Ocjene (badges) | Pogledaj sekciju "Ocjene" | Kondicija, Vjestine, Iskustvo, Pejzaz — svaki u svom badge-u. | Riješeno |
| T-DET-14 | Sezona (mjeseci) | Pogledaj "Najbolje doba godine" | Aktivni mjeseci označeni narančastom bojom. | Riješeno |
| T-DET-15 | Mapa lokacije | Scroll do "Lokacija" | Prikazuje se Google Maps sa markerom. | Riješeno |
| T-DET-16 | "Otvori u Google Maps" | Klikni gumb ispod mape | Otvara Google Maps app/web sa koordinatama. | Riješeno |
| T-DET-17 | Nema duplih stilova | Pregledaj cijeli ekran | Nema vizuelnih duplikata, sve sekcije uredne. | Riješeno |

---

## 6. Aktivnosti

### 6.1 Lista aktivnosti

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-ACT-01 | Prazna lista | Novi korisnik otvara Activities tab | Poruka "Jos nema aktivnosti" + gumb "Dodaj aktivnost". | Riješeno |
| T-ACT-02 | Lista sa aktivnostima | Korisnik sa usponima otvara tab | Lista `ActivityCard` komponenti sa datumom, stazom, trajanjem, zvjezdicama. | Riješeno |
| T-ACT-03 | Broj aktivnosti u subtitle-u | Pogledaj ispod naslova | "X zabiljezenih tura" (pravilna deklinacija). | Riješeno |
| T-ACT-04 | Pull-to-refresh | Povuci listu nadole | Osvjezava aktivnosti iz Firestore-a. | Riješeno |
| T-ACT-05 | FAB gumb | Skroluj listu | Narančasto "+" gumb u donjem desnom uglu. | Riješeno |
| T-ACT-06 | Footer gumb za dodavanje | Skroluj do dna liste | "Dodaj novu aktivnost" gumb sa isprekidanom granicom. | Riješeno |
| T-ACT-07 | Refresh pri fokusiranju | Prebaci se na drugi tab -> vrati na Activity | Lista se osvježava automatski (`useFocusEffect`). | Riješeno |

### 6.2 Dodavanje aktivnosti

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-ADD-01 | Otvaranje forme | Klikni "Dodaj aktivnost" | Otvara se `activity/add` screen sa formom. | Riješeno |
| T-ADD-02 | Odabir ferate — picker | Klikni "Odaberi feratu..." | Dropdown lista svih ferata sa imenom, lokacijom, difficulty badge-om. | Riješeno |
| T-ADD-03 | Odabir ferate — selekcija | Odaberi jednu feratu | Picker se zatvara, ime ferate prikazano, check ikona na odabranoj. | Riješeno |
| T-ADD-04 | Odabir ferate — zatvaranje | Ponovo klikni picker | Zatvara dropdown (toggle). | Riješeno |
| T-ADD-05 | Datum | Unesi `15.06.2026.` | Prihvacen format DD.MM.GGGG. | Riješeno |
| T-ADD-06 | Trajanje | Unesi `90 min`, `2 h`, `2 sata` | Prihvaceni razliciti formati. | Riješeno |
| T-ADD-07 | Ocjena težine (zvjezdice) | Klikni 4. zvjezdicu | 4 zvjezdice popunjene (zlatne), peta prazna. Ponovni klik na 4. resetuje na 0. | Riješeno |
| T-ADD-08 | Bilješke | Unesi tekst u textarea | Multiline, scrollable. | Riješeno |
| T-ADD-09 | Validacija — bez ferate | Klikni "Spremi aktivnost" bez odabira ferate | Alert: "Odaberi feratu." | Riješeno |
| T-ADD-10 | Validacija — bez datuma | Bez datuma | Alert: "Unesi datum." | Riješeno |
| T-ADD-11 | Validacija — bez trajanja | Bez trajanja | Alert: "Unesi vrijeme trajanja." | Riješeno |
| T-ADD-12 | Uspjesno spremanje | Sva polja ispravna -> "Spremi aktivnost" | Dokument kreiran u `ascents` kolekciji, navigacija nazad na listu. | Riješeno |
| T-ADD-13 | Back navigacija | Klikni strelicu nazad | Vraca se na Activity listu bez spremanja. | Riješeno |

---

## 7. Mapa

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-MAP-01 | Učitavanje mape | Otvori Map tab | Google Maps sa dark theme stilom, markeri za sve ferate sa koordinatama. | Riješeno |
| T-MAP-02 | Markeri u boji po tezini | Pogledaj markere | A=zelena, B/C=zuta, C/D=narančasta, D=crvena, E/F=tamno crvena. | Riješeno |
| T-MAP-03 | Info prozor (klik na marker) | Klikni marker | Prikazuje: naziv, lokaciju, difficulty badge, duzinu, trajanje, "Detalji ->" gumb. | Riješeno |
| T-MAP-04 | "Detalji ->" u info prozoru | Klikni "Detalji ->" | Otvara `/(tabs)/explore/{id}`. | Riješeno |
| T-MAP-05 | Fit to screen gumb | Klikni gumb za zumiranje | Mapa se zumira da prikaže sve markere. | Riješeno |
| T-MAP-06 | Header overlay | Pogledaj vrh mape | "Mapa ferata" + broj lokacija, tamna poluprozirna pozadina. | Riješeno |
| T-MAP-07 | Nema ferata sa koordinatama | (Edge case) | Poruka "Nema ferata sa koordinatama". | Riješeno |
| T-MAP-08 | Loading spinner | Otvori mapu (sporija mreza) | Spinner + "Učitavanje ferata...". | Riješeno |

---

## 8. Profil

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-PROF-01 | Prikaz profila | Otvori Profile tab | Avatar sa inicijalima, ime i prezime, email, experience badge. | Riješeno |
| T-PROF-02 | Statistika na vrhu | Pogledaj odmah ispod avatara | Kartica "Tvoja statistika" sa brojem uspona, favorita, zabiljezenih. | Riješeno |
| T-PROF-03 | Osobni podaci | Kartica "Osobni podaci" | Ime, datum rođenja, email. | Riješeno |
| T-PROF-04 | Via Ferrata profil | Kartica "Via Ferrata profil" | Iskustvo, Teren, Oprema, Stil ture — sa labelama. | Riješeno |
| T-PROF-05 | Uredi profil gumb | Klikni "Uredi profil" | Otvara `profile/edit`. | Riješeno |
| T-PROF-06 | Prazna polja (nema podataka) | Za nepotpuni profil | Prikazuje "—" za nedostajuce vrijednosti. | Riješeno |
| T-PROF-07 | Experience badge | Provjeri badge ispod imena | "Pocetnik/ca", "1-5 ferata", "5-20 ferata", "Veteran/ka 20+". | Riješeno |

### 8.1 Uredi profil

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-EDIT-01 | Izmjena imena | Promijeni Ime -> "Sacuvaj promjene" | Firestore ažuriran, profil osvježen, navigacija nazad. | Riješeno |
| T-EDIT-02 | Izmjena VF preferenci | Promijeni Iskustvo, Teren, Opremu, Stil | Sve vrijednosti sačuvane. | Riješeno |
| T-EDIT-03 | Validacija — prazno ime | Obrisi ime -> Sacuvaj | Alert: "Ime i prezime su obavezni." | Riješeno |
| T-EDIT-04 | Validacija — format datuma | Datum = `1990/01/01` | Alert: "Format datuma mora biti DD.MM.GGGG" | Riješeno |
| T-EDIT-05 | Otkazivanje | Back navigacija bez klika na spremi | Promjene nisu sačuvane, profil nepromijenjen. | Riješeno |

---

## 9. Recenzije

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REV-01 | Prikaz recenzija na detaljima | Otvori detalje ferate -> scroll do "Recenzije" | Prve 2 recenzije kao preview + "Prikazi sve" gumb. | Riješeno |
| T-REV-02 | Nema recenzija | Ferata bez recenzija | "Jos nema recenzija. Budi prvi/a!" | Riješeno |
| T-REV-03 | Ocjena pored naslova | Pogledaj pored "Recenzije" | Prosjecna ocjena sa zvjezdicama i brojem recenzija `(N)`. | Riješeno |
| T-REV-04 | Otvaranje recenzija modala | Klikni "Prikazi sve" ili "Napiši recenziju" | Modal sa svim recenzijama, bottom sheet dizajn. | Riješeno |
| T-REV-05 | Zatvaranje modala | Klikni X ili overlay | Modal se zatvara. | Riješeno |
| T-REV-06 | Modal overlay | Otvori modal | Tamni overlay preko cijelog ekrana, ne vidi se sadržaj ispod. | Riješeno |
| T-REV-07 | Nova recenzija — forma | Modal -> forma za novu recenziju (ako nema svoju) | Zvjezdice + text input + "Objavi" gumb. | Riješeno |
| T-REV-08 | Nova recenzija — validacija | Klikni "Objavi" bez zvjezdica | Alert: "Odaberi ocjenu i napiši komentar." | Riješeno |
| T-REV-09 | Nova recenzija — uspjeh | 5 zvjezdica + komentar -> "Objavi" | Recenzija spremljena, lista osvježena, forma nestaje. | Riješeno |
| T-REV-10 | Jedan korisnik — jedna recenzija | Pokusaj dodati drugu recenziju na istu feratu | Ne prikazuje se forma za novu — prikazuje se postojeca sa edit/delete opcijama. | Riješeno |
| T-REV-11 | Vlastita recenzija — oznaka | Pogledaj svoju recenziju u listi | Narandzasti border + "(ti)" tag pored imena. | Riješeno |
| T-REV-12 | Vlastita recenzija — edit | Klikni pencil na svojoj recenziji | Forma za edit sa pred-popunjenim podacima, "Spremi izmjene" i X gumb. | Riješeno |
| T-REV-13 | Edit — odustajanje | Klikni X u edit modu | Vraca se na prikaz recenzije bez promjena. | Riješeno |
| T-REV-14 | Edit — spremanje | Izmijeni -> "Spremi izmjene" | Recenzija ažurirana, lista osvježena, edit mod se gasi. | Riješeno |
| T-REV-15 | Vlastita recenzija — delete | Klikni delete -> Potvrdi | Alert potvrda -> recenzija obrisana, forma za novu se pojavljuje. | Riješeno |
| T-REV-16 | Delete — otkazivanje | Klikni delete -> "Odustani" | Recenzija ostaje. | Riješeno |
| T-REV-17 | Neprijavljen korisnik — recenzija | Pokusaj dodati recenziju bez prijave | Alert: "Za ostavljanje recenzije moraš biti prijavljen/a." | Riješeno |

---

## 10. Favoriti

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-FAV-01 | Dodaj u favorite | Na detaljima ferate -> klikni srce | Srce postaje crveno (ispunjeno), dokument u `favorites` kolekciji. | Riješeno |
| T-FAV-02 | Ukloni iz favorita | Ponovo klikni srce (crveno) | Srce postaje prazno (outline), dokument obrisan iz `favorites`. | Riješeno |
| T-FAV-03 | Neprijavljen korisnik — favorit | Klikni srce bez prijave | Alert: "Za dodavanje favorita moraš biti prijavljen/a." | Riješeno |
| T-FAV-04 | Favorit na slici | Provjeri poziciju srce gumbta na detaljima | Desno-dole na glavnoj slici, bijela/prazna kad nije favorit, crvena kad jest. | Riješeno |
| T-FAV-05 | Favoriti na profilu | Otvori profil | Broj favorita prikazan u statistici. | Riješeno |
| T-FAV-06 | Nema duplih favorita | Klikni srce dva puta brzo | Ne stvaraju se duplikati u bazi. | Riješeno |

---

## 11. GPS funkcionalnosti

### 11.1 Ferate u bližini (Explore filter)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-GPS-01 | Aktivacija "U bližini" | Explore -> Napredni filteri -> "Ferate u bližini" | Trazi GPS dozvolu. Nakon dozvole: gumb postaje narančasto + "U bližini (10 km)". | Riješeno |
| T-GPS-02 | GPS dozvola odbijena | Odbij GPS dozvolu | Alert: "GPS nije dozvoljen", filter se ne aktivira. | Riješeno |
| T-GPS-03 | Filter 10 km radijus | Aktiviraj "U bližini" na poznatoj lokaciji | Prikazuje samo ferate unutar 10 km. Koristi Haversine formulu. | Riješeno |
| T-GPS-04 | Deaktivacija filtera | Ponovo klikni "U bližini (10 km)" | Filter se gasi, gumb se vraća u normalno stanje, sve ferate prikazane. | Riješeno |
| T-GPS-05 | Haversine točnost | Provjeri udaljenost Sarajevo -> Mostar | ~75 km (unutar 70-80 km). | Riješeno |

### 11.2 GPS provjera pri dodavanju aktivnosti

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-GPS-ACT-01 | Unutar 500m — prolazi | Dodaj aktivnost dok si blizu ferate (<= 500m) | Aktivnost se sprema normalno. | Riješeno |
| T-GPS-ACT-02 | Izvan 500m — odbijeno | Dodaj aktivnost dok si daleko od ferate (> 500m) | Alert: "Udaljen si X.X km od ferate. Moraš biti unutar 500 m." | Riješeno |
| T-GPS-ACT-03 | Ferata bez koordinata | Dodaj aktivnost za feratu bez GPS koordinata | Provjera se preskace, aktivnost se sprema normalno. | Riješeno |
| T-GPS-ACT-04 | GPS dozvola odbijena | Odbij GPS pri dodavanju aktivnosti | Provjera se preskace (ne blokira korisnika). | Riješeno |

### 11.3 Scoring (bodovanje)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-SCORE-01 | Score se računa pri spremanju | Spremi aktivnost sa feratom težine C, 800m, 350m visine, 3h | `score` polje u `ascents` dokumentu priblizno 122. | Riješeno |
| T-SCORE-02 | Teza ferata -> više bodova | Usporedi score za A vs F feratu (isti ostali parametri) | Score(F) >> Score(A). | Riješeno |
| T-SCORE-03 | Score je integer | Provjeri `score` u Firestore | Cijeli broj, nema decimala. | Riješeno |

---

## 12. Regresioni testovi

### 12.1 Kompletni user flow

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-01 | Full flow: Register -> Onboard -> Explore -> Detail -> Favorite -> Review -> Activity -> Logout | 1. Registruj se<br>2. Prodji onboarding<br>3. Browse explore<br>4. Otvori detalje ferate<br>5. Dodaj u favorite<br>6. Napiši recenziju<br>7. Dodaj aktivnost<br>8. Odjavi se | Cijeli flow bez grešaka, svi podaci perzistiraju u Firestore-u. | Riješeno |

### 12.2 Cross-tab navigacija

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-02 | Navigacija kroz svih 5 tabova | Početna -> Mapa -> Aktivnosti -> Istražite -> Profil -> Početna | Svaki tab se učitava, tab bar pokazuje aktivan tab. | Riješeno |

### 12.3 Offline ponasanje

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-03 | Bez interneta — app start | Iskljuci internet -> otvori app | Firebase Auth ne radi (očekivano), app prikazuje loading. | Riješeno |
| T-REG-04 | Bez interneta — vec prijavljen | Prijavi se -> iskljuci internet -> koristi app | Firestore upiti padaju, prikazuju se prazne liste ili cached podaci. | Riješeno |

### 12.4 Edge cases

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-EDGE-01 | Veoma dugacko ime ferate | Ferata sa imenom > 50 karaktera | `numberOfLines={1}` ili `{2}`, ne razbija layout. | Riješeno |
| T-EDGE-02 | Ferata bez opisa | Otvori feratu bez `description` polja | Sekcija "Opis" se ne prikazuje. | Riješeno |
| T-EDGE-03 | Ferata bez slike | Otvori feratu bez `imageUrl` | Prikazuje se difficulty badge kao placeholder. | Riješeno |
| T-EDGE-04 | Prazna galerija (`gallery: []`) | Otvori feratu sa praznom galerijom | Sekcija "Galerija" se ne prikazuje. | Riješeno |
| T-EDGE-05 | Recenzija sa praznim komentarom | Spremi recenziju samo sa zvjezdicama | Validacija: "Odaberi ocjenu i napiši komentar." | Riješeno |
| T-EDGE-06 | Brzi dvostruki klik na favorit | 2x brzo klikni srce | Toggle radi ispravno, nema duplih dokumenata. | Riješeno |
| T-EDGE-07 | Back gesture (Android) | Swipe nazad na Androidu | Ponasa se isto kao back gumb. | Riješeno |

---

## 13. Sprint 4 — GPS Track Recording

### 13.1 Track pokretanje i zaustavljanje

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-TRK-01 | "Pokreni Track" vidljiv za feratu sa koordinatama | Odaberi feratu koja ima `startLat/startLon/endLat/endLon` | Prikazuje se "GPS Snimanje rute" kartica sa "Pokreni Track" gumbom. | |
| T-TRK-02 | "Pokreni Track" onemogućen za feratu bez koordinata | Odaberi feratu bez koordinata | Prikazuje se info banner: "Ferata nema definirane koordinate." Gumb se ne prikazuje. | |
| T-TRK-03 | Start track — unutar 200m | Budi unutar 200m od početka ferate → "Pokreni Track" | Track se pokreće, prikazuje se live crvena točkica, timer, broj točaka, udaljenost do kraja. | |
| T-TRK-04 | Start track — izvan 200m | Budi dalje od 200m → "Pokreni Track" | Alert: "Moraš biti bliže početku ferate (min. 200m). Udaljen si Xm." | |
| T-TRK-05 | GPS dozvola odbijena pri startu | Odbij GPS dozvolu → "Pokreni Track" | Alert: "GPS dozvola nije odobrena." | |
| T-TRK-06 | Stop track — unutar 200m od kraja | Tokom tracka, priđi kraju ferate → "Završi Track" | Track se zaustavlja, datum i vrijeme se auto-popunjavaju, aktivnost se automatski sprema. | |
| T-TRK-07 | Stop track — izvan 200m od kraja | Daleko od kraja → "Završi Track" | Alert: "Moraš biti bliže kraju ferate (min. 200m)." Track se ne zaustavlja. | |
| T-TRK-08 | Pauziraj track | Klikni "Pauziraj" tokom aktivnog tracka | Track pauziran, live dot postaje žut, gumb se mijenja u "Nastavi". | |
| T-TRK-09 | Nastavi track | Klikni "Nastavi" nakon pauze | Track se nastavlja, live dot ponovo crven. | |
| T-TRK-10 | Odustani od tracka | Klikni "Odustani od snimanja" | Alert potvrda → track se poništava, GPS točke se brišu. | |
| T-TRK-11 | Otkaži odustajanje | Alert potvrda → "Ne" | Track se nastavlja normalno. | |

### 13.2 GPS signal lost / auto-pauza

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-TRK-12 | Gubitak GPS signala > 30s | Uđi u tunel/zgradu tokom tracka | Nakon 30s bez signala: track auto-pauziran, žuti banner "GPS signal izgubljen. Track pauziran." | |
| T-TRK-13 | Povratak GPS signala | Izađi iz tunela | Signal se vraća, banner nestaje, ali track ostaje pauziran (korisnik mora ručno "Nastavi"). | |
| T-TRK-14 | Track u pozadini (minimizirana app) | Pokreni track → minimiziraj app → vrati se nakon 1 min | Track i dalje aktivan, točke se snimaju, timer ažuriran. | |

### 13.3 Pohrana track podataka

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-TRK-15 | Track sačuvan u Firestore | Završi track → provjeri Firestore `ascents/{id}` | Dokument sadrži: `track: [...]` (niz GPS točaka), `completionType: "gps"`, `elapsedTimeMin: XX`, `score: XX`. | |
| T-TRK-16 | Svaka GPS točka ispravna | Provjeri niz `track` u Firestore | Svaka točka sadrži: `{lat, lon, alt, ts}`. `ts` je Firebase Timestamp. | |
| T-TRK-17 | Elapsed time iz tracka | Usporedi `elapsedTimeMin` sa stvarnim vremenom | Odgovara trajanju tracka (minus pauze). | |

### 13.4 Track UI prikaz

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-TRK-18 | Timer prikaz | Tokom tracka, prati timer | Vrijeme u formatu `M:SS` ili `Hh MMm`, ažurira se svake sekunde. | |
| T-TRK-19 | Brojač točaka | Tokom tracka | Broj snimljenih točaka raste (svakih 5s nova točka). | |
| T-TRK-20 | Udaljenost do kraja | Tokom tracka | Prikazuje udaljenost u metrima ili km do `endLat/endLon`. | |
| T-TRK-21 | Datum i trajanje onemogućeni | Tokom tracka | Polja datum i trajanje su `editable={false}`. | |
| T-TRK-22 | "Spremi aktivnost" skriven | Tokom tracka | Gumb za spremanje se ne prikazuje (sprema se automatski na kraju tracka). | |

---

## 14. Sprint 4 — Novo bodovanje (Scoring)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-SCORE-S4-01 | Score sa GPS trackom > ručni unos | Zabilježi istu feratu GPS-om pa ručno | GPS score ≈ 2× ručni score (completionBonus 1.0 vs 0.5). | |
| T-SCORE-S4-02 | Score minimum 1 | Najlakša ferata (A), 0m visine, sporo vrijeme | Score >= 1. | |
| T-SCORE-S4-03 | Score prikaz na ActivityCard | Pogledaj Activity listu nakon dodavanja | Svaka ActivityCard prikazuje score u narančastom badge-u pored imena ferate. | |
| T-SCORE-S4-04 | GPS ikona na ActivityCard | ActivityCard za GPS track ascent | Prikazuje se `crosshairs-gps` ikona (zelena) pored score-a. | |
| T-SCORE-S4-05 | Score preview pri ručnom unosu | Odaberi feratu na add screenu (bez tracka) | Prikazuje se "Okvirni score: ~X (×2 sa GPS trackom)". | |
| T-SCORE-S4-06 | Score na profilu | Otvori profil → statistika | Prikazuje ukupni score (suma svih ascent score-ova). | |

---

## 15. Sprint 4 — Leaderboard

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-LB-01 | Leaderboard tab | Klikni "Rang" u tab bar-u | Otvara se leaderboard ekran sa naslovom "Leaderboard" i "Top 50 penjača". | |
| T-LB-02 | Lista korisnika sortirana po score-u | Pogledaj leaderboard | Korisnici sortirani od najvišeg ka najnižem score-u. | |
| T-LB-03 | Top 3 — trofeji | Pogledaj prva 3 mjesta | #1 zlatni trofej, #2 srebrni, #3 brončani. | |
| T-LB-04 | Rang prikaz | #4 i niže | Prikazuje `#4`, `#5` itd. | |
| T-LB-05 | Avatar sa inicijalima | Svaki red | Prikazuje inicijale korisnika u krugu. | |
| T-LB-06 | Score i broj ferata | Svaki red | Prikazuje ukupni score i "X ferata". | |
| T-LB-07 | Vlastiti red označen | Pronađi svoj red | Narandžasti border i pozadina, "Ti" umjesto imena. | |
| T-LB-08 | Vlastiti plasman uvijek vidljiv | Ako nisi u top 50 | Na dnu liste: divider + "Tvoj plasman" + tvoj red. | |
| T-LB-09 | Filter "Ovog tjedna" | Klikni "Ovog tjedna" | Chip postaje narančast, prikazuje rezultate za ovaj tjedan. | |
| T-LB-10 | Filter "Ovog mjeseca" | Klikni "Ovog mjeseca" | Prikazuje mjesečne rezultate. | |
| T-LB-11 | Filter "Sve vrijeme" | Klikni "Sve vrijeme" | Vraća na ukupni poredak. | |
| T-LB-12 | Prazan leaderboard | Novi korisnik, niko nema aktivnosti | Poruka: "Još nema rezultata. Budi prvi/a!" | |
| T-LB-13 | Pull-to-refresh | Povuci leaderboard listu nadole | Osvježava podatke. | |
| T-LB-15 | Leaderboard dostupan sa početne | Otvori Početna → klikni "Rang lista" quick link | Otvara se leaderboard ekran. | |

---

## 16. Sprint 4 — Indikatori pređenih ferata

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-COMP-01 | Zelena kvačica na pređenoj ferati | Otvori Explore → ferata koju si već popeo/la | Na FerrataCard se prikazuje zelena kvačica (`check-circle`). | |
| T-COMP-02 | Bez kvačice na nepređenoj | Pogledaj nepređenu feratu | Nema kvačice. | |
| T-COMP-03 | Filter "Pređene" | Napredni filteri → "Pređene" | Prikazuju se samo ferate sa kvačicom. | |
| T-COMP-04 | Filter "Nepređene" | Napredni filteri → "Nepređene" | Prikazuju se samo ferate bez kvačice. | |
| T-COMP-05 | Filter "Sve" | Vrati na "Sve" | Prikazuju se sve ferate. | |
| T-COMP-06 | Kvačica i na top 5 slideru | Pogledaj top 5 horizontalni slider | Pređene ferate u slideru također imaju kvačicu. | |
| T-COMP-07 | Progress bar na profilu | Otvori profil → statistika | "Pređene ferate: X/23" + progress bar (narandžasti) + postotak. | |
| T-COMP-08 | Lista nedavnih aktivnosti na profilu | Profil → "Nedavne aktivnosti" | Lista zadnjih 5 ascenta sa imenom ferate, datumom, score-om. Klik vodi na detalje ferate. | |
| T-COMP-09 | Cache pređenih ferata | Refresh Explore → dodaj novu aktivnost → vrati se na Explore | Kvačica se ažurira tek nakon pull-to-refresh ili ponovnog ulaska. | |

---

## 17. Sprint 4 — Splash Screen

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-SPL-01 | Splash screen pri pokretanju | Potpuno ugasi app → ponovo pokreni | Crna pozadina (#0D0D0D), Hooked logo u centru. | |
| T-SPL-02 | Trajanje splasha | Pokreni app | Splash traje dok se auth stanje ne riješi (1-3s). | |
| T-SPL-03 | Glatki prelaz na auth | Nakon splasha, ako nisi prijavljen | Fade-out splash → Login ekran. | |
| T-SPL-04 | Glatki prelaz na main | Nakon splasha, ako si prijavljen | Fade-out splash → Početna stranica (tabs). | |
| T-SPL-05 | Nema bijelog fleša | Pokreni app više puta | Nikad se ne prikazuje bijeli ekran. Samo crna → content. | |
| T-SPL-06 | Firebase Auth inicijalizacija u pozadini | Dok traje splash | `onAuthStateChanged` se izvršava, auth stanje određeno prije nego splash nestane. | |

---

## 18. Sprint 4 — Regresioni testovi (cijeli flow)

### 18.1 Full GPS track flow

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-S4-01 | Full GPS track flow | 1. Login<br>2. Otvori Explore → pronađi feratu sa koordinatama u blizini<br>3. Otvori "Dodaj aktivnost"<br>4. Odaberi feratu<br>5. "Pokreni Track" (moraš biti blizu)<br>6. Prođi feratu (sačekaj nekoliko minuta)<br>7. "Završi Track" blizu kraja<br>8. Provjeri score na ActivityCard<br>9. Provjeri leaderboard<br>10. Provjeri zelenu kvačicu na Explore<br>11. Provjeri progress bar i score na profilu | Sve komponente rade bez greške. Score ispravan. Kvačica prisutna. Leaderboard ažuriran. | |

### 18.2 Ručni unos (regresija)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-S4-02 | Ručni unos više ne postoji | Otvori "Dodaj aktivnost" → odaberi feratu bez koordinata | Prikazuje se crveni banner: "GPS track nije dostupan". Nema ručnog spašavanja. | |

### 18.3 Postojeće funkcionalnosti (regresija)

| # | Scenarij | Koraci | Očekivani rezultat | Status |
|---|----------|--------|--------------------|--------|
| T-REG-S4-03 | Explore radi normalno | Otvori Explore | Lista ferata, pretraga, filteri, top 5 — sve radi. | |
| T-REG-S4-04 | Mapa radi normalno | Otvori Mapu | Markeri vidljivi, info prozori rade. | |
| T-REG-S4-05 | Recenzije rade normalno | Otvori detalje → Recenzije | Dodavanje, edit, brisanje — sve radi. | |
| T-REG-S4-06 | Favoriti rade normalno | Srce na detaljima | Toggle favorita radi. | |
| T-REG-S4-07 | Profil radi normalno | Otvori Profil | Svi podaci prisutni, edit radi. | |
| T-REG-S4-08 | Auth i dalje radi | Odjavi se → Prijavi se ponovo | Login/Register/Onboarding rade. | |
| T-REG-S4-09 | Nema memory leak-ova od GPS trackera | Pokreni track → minimiziraj → vrati se → završi track → odjavi se | Nema `setState on unmounted` warninga. App stabilna. | |
| T-REG-S4-10 | Tab bar sa 5 tabova | Provjeri bottom tab bar | 5 tabova: Početna, Mapa, Aktivnost, Istraži, Profil. Leaderboard dostupan sa početne. | |

---

## Napomene za testiranje Sprinta 4

1. **GPS Track testovi:** Zahtijevaju fizički Android uređaj sa GPS-om ILI Android emulator sa mock GPS lokacijom. Preporučuje se testiranje na otvorenom prostoru.
2. **Proximity provjera:** 200m prag za start/end tracka. Na emulatoru koristiti `geo fix` komandu za postavljanje koordinata.
3. **Ferate sa koordinatama:** Samo ferate koje imaju `startLat`, `startLon`, `endLat`, `endLon` podržavaju GPS track. Provjeriti u Firestore-u.
4. **Leaderboard:** Potrebno je više korisnika sa aktivnostima za puni test. Testirati bar 2 različita accounta.
5. **Splash screen:** Testirati na fizičkom uređaju — emulator može preskočiti splash zbog brzine učitavanja.
6. **Score formula:** Provjeriti kalkulaciju sa primjerima:
   - C, 350m visine, 150min/180min, GPS → score 15
   - Ista, ručno → score 8
   - F, 500m visine, 200min/240min, GPS → score 70
7. **expo-splash-screen:** Verzija 0.27+ zahtijeva `expo-splash-screen` plugin u `app.json`. Provjeriti da je plugin ispravno konfigurisan.
8. **expo-task-manager:** Koristi se za background location. Na iOS-u zahtijeva dodatne dozvole u `Info.plist`.

1. **Testno okruzenje:** Preporucuje se testiranje na fizickom Android uredjaju (za GPS testove) i Android emulatoru (Pixel 6 API 34+).
2. **Firestore:** Sve testove koji ukljucuju pisanje izvoditi na development Firestore instanci, ne na production.
3. **GPS:** Za GPS testove potrebno je biti na stvarnoj lokaciji ili koristiti emulator sa mock GPS koordinatama.
4. **Slike:** Provjeriti da se slike učitavaju brzo — koristi se `expo-image` sa `cachePolicy="memory-disk"`.
5. **Performance:** Pratiti vrijeme učitavanja Explore ekrana — treba biti < 2 sekunde za 23 ferate.
6. **Kontrast teksta:** Na obojenim pozadinama (amber/orange/blue/green/red), tekst koristi `text-gray-900` za glavni i `text-gray-800` za sekundarni.

---

## Metrike testiranja

| Kategorija | Broj testova |
|------------|-------------|
| Autentifikacija | 14 |
| Onboarding | 6 |
| Početna stranica | 11 |
| Explore | 16 |
| Detalji ferate | 17 |
| Aktivnosti | 20 |
| Mapa | 8 |
| Profil | 12 |
| Recenzije | 17 |
| Favoriti | 6 |
| GPS (stari) | 9 |
| Regresija (stari) | 7 |
| **Sprint 4 — GPS Track** | **22** |
| **Sprint 4 — Scoring** | **6** |
| **Sprint 4 — Leaderboard** | **14** |
| **Sprint 4 — Indikatori** | **9** |
| **Sprint 4 — Splash Screen** | **6** |
| **Sprint 4 — Regresija** | **10** |
| **UKUPNO** | **210** |

-