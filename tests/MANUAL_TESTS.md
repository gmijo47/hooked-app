# HOOKED — Via Ferrata Companion

## Ručni (manuelni) testovi — Kompletan test plan

**Verzija:** 1.0.0  
**Datum:** 16.06.2026.  
**Tim:** Mijo Galic (razvoj), Tonka Cepo (testiranje)  
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

## Napomene za testiranje

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
| GPS | 9 |
| Regresija | 7 |
| **UKUPNO** | **143** |
