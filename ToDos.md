## Bugs
Flash when clicking page change first time

## Ideas
- add more features
- add more themes
- add Concept of Borderwallet

CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000 claude --resume 796aa5c7-023f-4775-a3cb-f73dd53fe6e6


/plugin marketplace add anthropics/claude-code
/plugin install frontend-design@claude-code-plugins

---

## Roadmap — Geplante Topics (Coming Soon)

### Grundlagen (`fundamentals`)

- [x] **elliptic-curves** — Elliptische Kurven
  - Punkt-Addition auf secp256k1 — die Mathematik hinter Bitcoin
  - Icon: `curve`

- [ ] **merkle-trees** — Merkle Trees
  - Baum-Builder + Proof-Check — wie Bitcoin Transaktionen effizient verifiziert
  - Icon: `tree`

- [ ] **ecdsa** — ECDSA Signaturen
  - Sign & Verify Playground — digitale Unterschriften verstehen
  - Icon: `pen`

### Keys & Wallets (`keys`)

- [ ] **adressen** — Bitcoin Adressen
  - Base58 & Bech32 Encoding-Lab — wie Adressen aufgebaut sind
  - Icon: `address`

- [ ] **bip85** — BIP-85 Child Seeds
  - Wie aus einem Master-Seed weitere unabhängige Seeds abgeleitet werden
  - Icon: `seedling`

### Transaktionen (`transactions`)

- [ ] **utxo** — UTXO Explorer
  - Coin-Auswahl simulieren — wie Bitcoin Guthaben verwaltet
  - Icon: `coins`

- [ ] **tx-builder** — Transaktion bauen
  - Eine Bitcoin-Transaktion Schritt für Schritt zusammensetzen
  - Icon: `build`

- [ ] **script** — Bitcoin Script
  - Script Playground — die Programmiersprache hinter Bitcoin
  - Icon: `code`

- [ ] **fees** — Gebühren & vBytes
  - Transaktionsgebühren verstehen und berechnen
  - Icon: `calculator`

### Netzwerk & Konsens (`network`)

- [ ] **mining** — Mining Simulator
  - Nonce finden + Difficulty — wie neue Blöcke entstehen
  - Icon: `pickaxe`

- [ ] **propagation** — Block-Propagierung
  - Wie sich Blöcke im Bitcoin-Netzwerk verbreiten
  - Icon: `network`

- [ ] **difficulty** — Difficulty Anpassung
  - Warum sich die Mining-Schwierigkeit alle 2016 Blöcke ändert
  - Icon: `gauge`

### Advanced (`advanced`)

- [ ] **lightning** — Lightning Network
  - Payment Channel Simulator — schnelle Zahlungen verstehen
  - Icon: `zap`

- [ ] **schnorr** — Schnorr Signaturen
  - Signatur vs. ECDSA Vergleich — warum Schnorr besser ist
  - Icon: `signature`

- [ ] **taproot** — Taproot
  - MAST-Bäume + Spending Paths — Bitcoins Smart Contracts
  - Icon: `tree-branch`

- [ ] **timechain** — Timechain
  - Halving, Supply & Emission — Bitcoins Geldpolitik visualisiert
  - Icon: `clock`