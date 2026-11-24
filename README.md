# Norlandia · Kvalitetsportal – prototype

En selvstendig klikkbar prototype uten backend. All data genereres lokalt og lagres i nettleserens `localStorage`, så besøk, rapporter og skår huskes mellom økter.

## Start

Enklest: åpne `index.html` i nettleseren.

Anbefalt (unngår eventuelle begrensninger på `localStorage` i `file://`):

```bash
cd ~/Documents/Norlandia/prototype
python3 -m http.server 4173
```

Åpne deretter http://127.0.0.1:4173

## Roller i demoen

| Rolle | Innsyn | Observatørside | Administrasjon |
| --- | --- | --- | --- |
| Fagdirektør | Alle 3 regioner, 84 barnehager, 840 avdelinger | 10 utvalgte avdelinger på tvers av regionene | Barnehageliste gruppert per region → 10 avdelinger → rapport/skår |
| Regiondirektør | 30 barnehager i Region Øst | 10 avdelinger i regionen | Barnehageliste → 10 avdelinger → rapport/skår |
| Barnehageleder | Solstua barnehage | Alle 10 avdelinger i barnehagen | Avdelingene i barnehagen med rapporter og skårsammendrag |
| Pedagogisk leder | Avdeling Eika | Egen avdeling | Rapport, skår og oppsummering for egen avdeling |

## Flyt på observatørsiden

1. Kryss av **Besøkt** (dato settes automatisk til i dag, og kan endres).
2. **Skriv rapport** åpner en editor. **Publiser rapport** lagrer teksten.
3. **Gi skår** åpner de ti parameterne. Velg **Lav / Middels / Høy** for alle ti og lagre.

Skårene regnes om til 1–3 for gjennomsnitt og vises i oppsummeringene i administrasjonen. **Nullstill demodata** i sidepanelet setter alt tilbake til utgangspunktet.

## Filer

- `index.html` – inngangsside
- `styles.css` – design og responsiv layout
- `data.js` – roller, barnehager, avdelinger, parametere og demodata
- `app.js` – sider, ruting, rapporter, skår og lagring

Prototypen bruker ingen eksterne biblioteker eller fonter.
