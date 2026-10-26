# Dashboard di Resilienza · «La mia pensione»

Dati Scalable Capital del 26/10/2026, 08:46 UTC. Versione interattiva: `dashboard/resilienza.html`.

## 📊 Snapshot attuale

**Valore totale: 40.042,30 €** · 22 posizioni · liquidità 0 € · guadagno dall'inizio +5.995,85 €
Piano di accumulo attivo: 500 €/mese su Amundi Core MSCI World (nessuna quota ancora in portafoglio).

| Categoria | Valore | Peso |
|---|---:|---:|
| Globale (ACWI 31.292 €, World Momentum 1.272 €, Core MSCI World 70 €) | 32.633 € | 81,5% |
| Emergenti (Xtrackers EM, Amundi EM, EM IMI, India, Frontier, Malaysia) | 3.067 € | 7,7% |
| USA (Vanguard S&P 500, Core S&P 500, S&P 500 EUR Hedged) | 2.372 € | 5,9% |
| Azioni singole (Ferrari, Micron, PayPal, SpaceX, Cucinelli) | 1.009 € | 2,5% |
| Tematici (AI & Big Data, Robotics, Biotech, Ageing) | 683 € | 1,7% |
| Oro (iShares Physical Gold) | 278 € | 0,7% |
| **Azionario totale** | **39.764 €** | **99,3%** |

Da tenere presente:
- 0% obbligazioni e 0 € di liquidità: in un crollo il portafoglio perde quanto il mercato. L'oro (0,7%) non protegge niente.
- Il 78% sta in un solo ETF (ACWI). 16 posizioni pesano meno dell'1% l'una e i 3 ETF S&P 500 si duplicano.
- In look-through la quota USA è circa il 60% (stima).

## 🌪️ Stress test: 1929 e 1989

Il ribasso si applica a tutto l'azionario, l'oro resta fermo. PAC = 300 €/mese.

| | Wall Street 1929 (−89%) | Giappone 1989 (−60%, 20 anni) |
|---|---:|---:|
| Perdita | −35.390 € | −23.859 € |
| Valore al minimo | 4.652 € | 16.184 € |
| Drawdown massimo | −88,4% | −59,6% |
| Recupero dei 40.042 € restando fermi | 25,0 anni | 20,0 anni |
| Recupero dei 40.042 € con PAC 300 € | 8,2 anni | 6,3 anni |
| Pareggio sul capitale versato con PAC | 13,0 anni | 12,9 anni |

Confronto con la storia reale: per il Dow Jones il ritorno ai massimi solo di prezzo arrivò nel 1954; con dividendi e deflazione il recupero reale fu di circa 7 anni. Il Nikkei reale fece peggio dello scenario: −82% al minimo del 2009 e ritorno ai massimi del 1989 solo nel 2024, dopo 34 anni.

## 📈 Il tempo del recupero

Dal massimo precedente al ritorno sopra quel massimo (indici di prezzo).

| Crollo | Indice | Ribasso | Discesa | Risalita | Totale | Velocità di risalita |
|---|---|---:|---:|---:|---:|---:|
| 1929 Grande Depressione | S&P 500 | −86% | 2,7 anni | 22,3 anni | 25,0 anni | 9%/anno |
| 1973 Shock petrolifero | S&P 500 | −48% | 1,7 anni | 5,8 anni | 7,5 anni | 12%/anno |
| 1987 Lunedì nero | S&P 500 | −34% | 3 mesi | 1,6 anni | 1,9 anni | 28%/anno |
| 1989 Bolla giapponese | Nikkei 225 | −82% | 19,2 anni | 15,0 anni | 34,1 anni | 12%/anno |
| 2000 Bolla internet | S&P 500 | −49% | 2,5 anni | 4,6 anni | 7,2 anni | 16%/anno |
| 2008 Crisi finanziaria | S&P 500 | −57% | 1,4 anni | 4,1 anni | 5,5 anni | 23%/anno |
| 2020 Covid | S&P 500 | −34% | 1 mese | 5 mesi | 6 mesi | — |
| 2022 Inflazione e tassi | S&P 500 | −25% | 9 mesi | 1,3 anni | 2,0 anni | 26%/anno |
| 2025 Dazi | S&P 500 | −19% | 2 mesi | 3 mesi | 4 mesi | — |

- Tempo mediano per tornare ai massimi: **5,5 anni**. Risalita mediana dal minimo: **4,1 anni**. Recuperati in meno di 8 anni: **7 su 9**.
- Dal minimo la risalita è stata tra il 9% e il 28% annuo in tutti i casi oltre un anno, 1929 e Giappone compresi. Lo scenario base del simulatore (7%) è più pessimista di ogni caso storico.
- Applicando il 2008 reale (−57% in 17 mesi, risalita 23%/anno) al tuo portafoglio: fermo torni a 40.042 € in 6,1 anni, con PAC 300 € in 3,6 anni.
- Con dividendi reinvestiti i recuperi sono più brevi. Sono dati USA, il mercato più forte del secolo.

## 🛡️ Simulazione di salvataggio: PIC vs PAC

Scenario base: −50% in 24 mesi, 12 mesi fermi sul fondo, risalita del 7% annuo, orizzonte 20 anni.

| Metrica | PIC (fermo) | PAC 300 €/mese |
|---|---:|---:|
| Ritorno a 40.042 € | 13,3 anni | 4,9 anni |
| Pareggio sul capitale versato | 13,3 anni | 9,6 anni |
| Capitale versato | 40.042 € | 112.042 € |
| Valore dopo 20 anni | 63.060 € | 205.579 € |
| Rendimento medio annuo (20 anni) | 2,3% | 4,3% (IRR) |
| Prezzo medio dei nuovi acquisti | — | 80% del prezzo pre-crollo |

Sensibilità alla velocità di risalita (anni al pareggio, PIC / PAC): 3% → oltre 20 / 15,4 · 5% → 17,3 / 11,5 · 7% → 13,3 / 9,6 · 10% → 10,3 / 7,9 · 15% → 8,0 / 6,6.

## Limiti

Prezzi nominali, nessuna tassa, costo, inflazione. Tutto l'azionario si muove insieme. Il rendimento del PAC è money-weighted e non si confronta alla pari con il PIC. Il PAC presuppone un reddito stabile per tutta la crisi.

*Materiale informativo, non consulenza finanziaria.*
