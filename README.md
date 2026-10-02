# Toolbox — Management tools collection

Raccolta di tool in italiano, realizzata esclusivamente con **HTML, CSS, JavaScript e Bootstrap 5.3.8**. Sito statico senza build, backend o installazione di pacchetti.

## Avvio

Aprire `index.html` nel browser oppure, dalla cartella del progetto:

```sh
python3 -m http.server 8000
```

Visitare `http://localhost:8000`. Bootstrap viene caricato da jsDelivr con controllo di integrità (SRI): per il suo caricamento è necessaria una connessione Internet. Nessun dato della matrice viene inviato a server.

## Pubblicazione su GitHub Pages

1. Creare una repository su GitHub e caricare questo progetto nel branch `main`.
2. In **Settings → Pages → Build and deployment** selezionare **Deploy from a branch**.
3. Selezionare **main** e **/(root)**, quindi salvare.
4. GitHub mostrerà il link del sito una volta terminata la pubblicazione.

Il file `.nojekyll` disabilita l'elaborazione Jekyll. I percorsi relativi funzionano anche nei project site (`https://utente.github.io/nome-repository/`). Non occorrono workflow personalizzati o build.

Documentazione: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Catalogo

Il catalogo è in `assets/js/catalog.js`. Ogni tool ha titolo, descrizione, URL e un array di tag. I filtri sono generati automaticamente e combinati in **OR**: selezionando più tag si trovano i tool che ne contengono almeno uno. La ricerca si combina con il filtro e considera titolo, descrizione e tag.

Per aggiungere un tool, creare `tools/nome-tool/index.html` e aggiungere una voce all'array `tools`. Usare percorsi relativi, come per la matrice esistente.

## Matrice decisionale pesata

- Nomi, criteri, pesi e voti modificabili; da 2 a 20 alternative e da 1 a 12 criteri.
- Voti interi da 1 a 5: più alto è sempre meglio. Per criteri come costo o rischio, assegnare il voto alto alle opzioni più convenienti o meno rischiose.
- Pesi da 0 a 1000, anche decimali; normalizzazione automatica. Il peso 0 esclude il criterio.
- Formula: `punteggio = Σ(voto × peso) / Σ(pesi)`, su scala 1–5.
- Classifica calcolata sui valori non arrotondati; punteggi visualizzati con due decimali. Parità riconosciuta con tolleranza numerica di 1e-9.
- Pesi mancanti, voti attivi incompleti e nomi vuoti sospendono la classifica.
- Salvataggio automatico in `localStorage`, solo nel browser/dispositivo e origine correnti. Non è una sincronizzazione o un backup; cancellare i dati del browser elimina la matrice. Se lo storage non è disponibile, il tool continua a funzionare con un avviso.
- Ripristino dell'esempio con conferma.

## Griglia obiettivi 9×9

In `tools/goal-grid/`: un obiettivo centrale, otto aree e otto azioni per area (64 azioni). La struttura riprende la griglia Mandala / Open Window 64 mostrata nel video di riferimento: https://www.tiktok.com/@improvewithkate/video/7685805253601660192.

- Cliccare sulle celle per modificarle. I nomi delle aree vengono aggiornati in entrambe le posizioni della griglia.
- La lista sotto la griglia permette di scegliere un’area e spuntare le azioni completate. Un’azione vuota non può essere completata.
- Bozza automatica in `localStorage` e snapshot indipendenti in IndexedDB, separati dalla matrice decisionale.
- Link tramite `case` in Base64url UTF-8, con obiettivo, aree, azioni e stato di completamento. Il link ha precedenza sulla bozza locale; modificarlo non modifica la copia del mittente. I dati nel link sono leggibili da chi lo riceve.
- Griglia iniziale vuota ed esempio completo per il lancio di un servizio; sostituzione della bozza e cancellazione degli snapshot richiedono conferma.
- Pulsante **Stampa / PDF** con layout della griglia in formato A4 orizzontale; scegliere “Salva come PDF” nella finestra di stampa del browser.
- Sul telefono la griglia scorre orizzontalmente, mentre la lista delle azioni resta adattata allo schermo.

## Struttura

```text
index.html                    Home e filtri
assets/css/style.css          Personalizzazioni di Bootstrap
assets/js/catalog.js          Catalogo estendibile
assets/js/matrix-core.js       Validazione e calcolo
assets/js/matrix.js            Interfaccia, storico e condivisione
assets/js/matrix-storage.js    Database IndexedDB degli snapshot
assets/favicon.svg            Icona del sito
tools/decision-matrix/         Matrice decisionale
tools/goal-grid/              Griglia obiettivi 9×9
assets/js/goal-core.js         Modello, posizioni e condivisione della griglia
assets/js/goal-grid.js         Interfaccia e progressi
assets/js/goal-storage.js      Snapshot della griglia in IndexedDB
assets/css/goal-grid.css       Stile e stampa della griglia
tests/matrix.test.cjs          Test del calcolo e dei link della matrice
tests/goal-grid.test.cjs       Test della griglia, dei progressi e dei link
```

## Verifica del calcolo

I test usano il test runner integrato di Node.js 18+ (solo per lo sviluppo, non necessario al sito):

```sh
node --test tests/*.test.cjs
```
