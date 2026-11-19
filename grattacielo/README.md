# Grattacielo del portafoglio

Dashboard React (Tailwind + Framer Motion) che rappresenta un portafoglio Core-Satellite come un grattacielo:
fondamenta (core), piani intermedi (satellite), attico (speculazione). Larghezza ∝ √peso, luci = rendimento,
allarme "crollo" quando satellite + attico superano le fondamenta. Include una modalità di simulazione.

- Componente: `src/App.jsx`
- Dati: `src/data/portfolio.js` (**escluso da git**, contiene valori reali). Se manca, il build usa `portfolio.example.js`.
- Build: `npm install && npm run build` → `dist/index.html` (file unico autonomo).
