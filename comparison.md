# Semble vs grep/find

Documento di confronto per un articolo LinkedIn.

## Sintesi

Per la ricerca nel codice, **Semble** è pensato per trovare il frammento giusto con meno rumore e meno token. `grep` e `find` restano utili, ma risolvono problemi diversi:

- **Semble**: ricerca semantica + lessicale, adatta a domande tipo “dove viene gestita l’autenticazione?”
- **grep**: perfetto per match letterali e controllo esaustivo di una stringa
- **find**: utile per la struttura dei file, non per capire il contenuto

## Quando usare cosa

| Strumento | Ideale per | Limite principale |
|---|---|---|
| Semble | trovare implementazioni, funzioni correlate, codice simile | richiede setup/indice |
| grep | cercare stringhe esatte, pattern, conferme rapide | molto rumore, poco contesto semantico |
| find | navigare i file e le cartelle | non cerca nel contenuto |

## Esempio pratico

Query: **“How does Semble avoid duplicate results and diversify search ranking?”**

### Semble
Ha portato subito ai punti giusti:
- `src/semble/search.py`
- `src/semble/index/index.py`
- `src/semble/ranking/penalties.py`
- `src/semble/ranking/boosting.py`

Quindi non si è limitato a cercare la parola `rank`, ma ha trovato la logica di fusione, reranking e penalità.

### grep
Con una ricerca tipo:
```bash
grep -RIn -E "duplicate|dedup|divers|rerank|rank" src/semble
```
ho ottenuto molti match, ma anche risultati meno pertinenti:
- file di ranking
- file di benchmark
- riferimenti secondari dove la parola compare solo in commenti o docstring

### find
Con `find` ottengo solo la lista dei file:
```bash
find src/semble -type f \( -name "*.py" -o -name "*.md" \)
```
È utile per orientarsi, ma non risponde alla domanda.

## Tempi reali osservati

Test eseguito sul repository `MinishLab/semble` in locale.

| Operazione | Tempo |
|---|---:|
| `grep` su una query lessicale | ~0.01s |
| `find` sulla tree dei file | ~0.00s |
| `semble search` prima esecuzione | ~3.99s |
| `semble search` a caldo | ~1.93s |
| `semble find-related` a caldo | ~1.08s |

### Nota importante sui tempi

I tempi di Semble includono anche il costo di avvio del runner e, nella prima esecuzione, il setup dell’ambiente via `uvx`. In cambio, il risultato è molto più selettivo.

Nel benchmark del progetto, i numeri dichiarati sono ancora più chiari:
- **index time**: circa **263 ms**
- **query p50**: circa **1.5 ms**
- **NDCG@10**: **0.854**
- **token saving**: circa **98% in meno** rispetto a `grep + read`

## Pro e contro

### Semble
**Pro**
- trova codice rilevante anche quando non conosci il simbolo esatto
- ottimo per domande naturali
- riduce parecchio il numero di file da leggere
- utile per code review, onboarding e reverse engineering

**Contro**
- richiede indice/avvio iniziale
- non è il migliore per ricerche puramente letterali
- se vuoi verificare ogni occorrenza di una stringa, `grep` è più diretto

### grep
**Pro**
- velocissimo
- ideale per stringhe esatte
- zero complessità

**Contro**
- non capisce il significato
- spesso restituisce troppo rumore
- porta a leggere molti file inutili

### find
**Pro**
- ottimo per scoprire la struttura del repository
- semplice e universale

**Contro**
- non cerca nel contenuto
- non aiuta a capire come funziona il codice

## Conclusione

La combinazione migliore non è “Semble contro grep/find”, ma:

1. **Semble prima** per trovare il punto giusto del codice
2. **grep** solo se serve un match esatto o una conferma esaustiva
3. **find** solo per orientarsi nella struttura del repo

In pratica, Semble riduce il tempo speso a “cacciare file” e aumenta il tempo speso a capire davvero il codice.
