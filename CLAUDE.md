# Product Platform – Projektkontext & Designsprache

## QUALITÄTSSTANDARDS
- Code muss produktionsreif sein – kein Prototyping, keine Platzhalter-Logik, keine TODO-Kommentare
- Jede Änderung muss funktional sein und im Browser sofort korrekt dargestellt werden
- Frontend: Performance, Accessibility, Responsive Design beachten
- Backend: Fehlerbehandlung, Validierung, Sicherheit (SQL-Injection, XSS) beachten
- Datenbank: Indizes, Relationen, Migrationen sauber halten
- Keine Quick-Fixes die technische Schulden erzeugen
- Immer den bestehenden Code und die Architektur respektieren – nicht unnötig umbauen
- Vor jeder Änderung prüfen: Funktioniert das Bestehende noch? Wird nichts kaputt gemacht?

## SICHERHEITSSTANDARDS
Jedes Feature muss diese Regeln einhalten – nicht optional, nicht „kommt später".

### Frontend
- **Kein `v-html` mit User-Input** – immer `{{ }}` Textinterpolation oder strukturiertes Parsing nutzen
- **Tokens gehören nicht in localStorage** wenn XSS-Risiko besteht – bei Architekturentscheidungen aktiv darauf hinweisen
- **Alle Formulare**: Validierung client- UND serverseitig, `aria-live="polite"` auf Fehlermeldungen, `role="alert"` auf globale Fehler
- **Keine Secrets in Frontend-Code** – keine API-Keys, keine Tokens im Source

### Backend
- **TypeScript Strict Mode aktiv** – `strictNullChecks: true`, `noImplicitAny: true` in `tsconfig.json`
- **Alle Inputs validieren** – DTOs mit class-validator, Query-Parameter mit Längen-/Wertebereich-Limits
- **Passwort-Policy**: Min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen
- **JWT-Secret**: Zentral über `getJwtSecret()` aus `common/constants/jwt.constants.ts` – nie inline duplizieren, in Production kein Fallback-Secret
- **Error-Responses**: Einheitliches Format `{ success: false, error: { code, message, statusCode } }` – keine internen Details leaken
- **Ownership-Prüfung**: Jede Mutation (PUT/PATCH/DELETE) auf User-eigene Ressourcen muss `userId === req.user.id` prüfen
- **Rate Limiting**: Alle öffentlichen Endpoints mit `@Throttle()` schützen
- **Keine N+1 Queries** – bei Listen mit Relations: `IN`-Clauses oder `leftJoinAndSelect`

### Infrastruktur / Docker
- **Ports nur auf `127.0.0.1` binden** – nie `0.0.0.0` für Datenbanken, Caches, Suchmaschinen
- **Resource-Limits** (`mem_limit`, `cpus`) auf jedem Container
- **Nginx Security-Headers**: X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy, Permissions-Policy
- **CORS**: Explizite Origins, kein Wildcard `*`
- **`.dockerignore`** in jedem Build-Context – `.git`, `node_modules`, `.env`, `dist` ausschließen
- **DB-Credentials**: Nie Defaults (`postgres:postgres`) in Production – `.env.example` muss alle Pflichtfelder dokumentieren

### Bei jedem neuen Feature prüfen
1. Kann ein Angreifer Input manipulieren? → Validierung
2. Wird User-Content gerendert? → XSS-Schutz (kein `v-html`)
3. Gibt es eine Mutation? → Ownership-Check + CSRF-Schutz
4. Wird ein neuer Endpoint exponiert? → Rate Limiting + Input-Limits
5. Wird ein neuer Container/Port hinzugefügt? → Nur localhost, mit Resource-Limits

## CODE-ARCHITEKTUR-PRINZIPIEN
Jedes Pattern existiert genau einmal. Wenn etwas dupliziert wird, ist das ein Bug.

### DRY (Don't Repeat Yourself)
- **Shared Logic** gehört in `frontend/src/composables/` (z.B. `useCategoryGradient.ts` für Gradient-Mapping)
- **Shared Types** gehören in `frontend/src/types/` – nie lokale Interfaces in Komponenten definieren wenn ein zentrales existiert
- **Backend-Konstanten** gehören in `backend/src/common/constants/` (z.B. `jwt.constants.ts`, `rating-weights.ts`)
- **Validierungslogik** für dasselbe Feld muss Frontend UND Backend identisch sein (z.B. Passwort-Policy)

### Typisierung
- **Frontend**: `strict: true` in tsconfig.json – jede Variable hat einen expliziten Typ
- **Backend**: `strictNullChecks: true`, `noImplicitAny: true` – kein `any`, kein implizites `null`
- **ESLint**: `@typescript-eslint/no-explicit-any: warn` – jedes `any` muss begründet sein
- **Entity-Felder** müssen den DB-Typ exakt spiegeln: `nullable: true` → `string | null`, nie nur `string`

### State Management
- **Error-State zurücksetzen**: Jede Ladefunktion setzt `error.value = null` am Anfang – nie stale Errors stehen lassen
- **Async-Initialisierung**: Wenn `loadFromStorage()` async ist, muss der Caller `await` nutzen oder bewusst fire-and-forget entscheiden
- **Event-Listeners**: Jedes `addEventListener` braucht ein korrespondierendes `removeEventListener` in `onUnmounted`
- **Event-Semantik**: Emitted Events müssen die Aktion beschreiben (`'voted'`, `'deleted'`, `'edited'`) – nie ein Event für eine andere Aktion zweckentfremden

### API-Konsistenz
- **Erfolg**: `{ success: true, data: T, meta: { timestamp, version } }`
- **Fehler**: `{ success: false, error: { code: string, message: string, statusCode: number } }`
- **Kein Mix** – auch der HttpExceptionFilter muss dieses Format einhalten
- **Pagination**: `page` ≥ 1, `limit` ≥ 1 und ≤ 100 – bei ungültigen Werten `400 Bad Request`

### Performance
- **Keine N+1 Queries**: Listen mit Relations → `IN`-Clauses oder `leftJoinAndSelect`, nie `.find()` in einer Schleife
- **Query-Limits**: Jeder Suchparameter hat eine Maximallänge (z.B. `q` max 200 Zeichen)
- **Lazy Loading**: Routen als `() => import()` laden (bereits umgesetzt), neue Routen ebenfalls

## ACCESSIBILITY-STANDARDS
- **Formulare**: Jedes `<input>` braucht ein `<label>` mit `for`-Attribut
- **Fehlermeldungen**: `aria-live="polite"` auf Validierungsfehler, `role="alert"` auf globale Fehler-Banner
- **Interaktive Elemente**: Buttons brauchen `aria-label` wenn kein sichtbarer Text vorhanden (z.B. Hamburger-Menu, Icon-Buttons)
- **Toggle-Buttons**: `aria-expanded="true/false"` auf Buttons die etwas auf-/zuklappen
- **Focus Management**: Nach Modal-Close oder Navigation → Fokus auf sinnvolles Element setzen
- **Skeleton Loading**: `aria-busy="true"` auf Containern die laden, `aria-hidden="true"` auf Skeleton-Elemente

## PROJEKT-ÜBERBLICK
Eine kuratierte Product Platform mit 15 Testprodukten in 5 Kategorien (Electronics, Beauty, Food & Beverages, Sports & Outdoors, Home & Garden). 6 davon sind Featured-Produkte. Es gibt keine echten Produktbilder – alle Bilder sind Placeholder. Das Projekt ist deutschsprachig.

## TECHNISCHER STACK
- Frontend: Vue 3 (Composition API, `<script setup>`), TypeScript, Tailwind CSS 3.4, Pinia Stores, Vue Router 4
- Icons: lucide-vue-next (bereits installiert)
- Backend: NestJS auf Port 3000 (NICHT ändern)
- Dev Server: Vite auf Port 5173 mit Proxy /api -> backend:3000
- Containerisiert: Docker Compose (PostgreSQL, OpenSearch, Redis, Nginx)
- **Keine neuen npm-Pakete ohne explizite Freigabe** (Security-Upgrades bestehender Pakete sind erlaubt, siehe REGELN)

## ORDNERSTRUKTUR (Frontend)
```
frontend/src/
  App.vue                          # Root-Layout: Header, Navigation, Footer, RouterView
  main.ts                          # Bootstrapping – Struktur beibehalten, Bugfixes erlaubt
  index.css                        # Tailwind Imports + Custom CSS (glass, skeleton, stagger)
  components/
    SearchBar.vue                  # Suchfeld mit Autocomplete-Dropdown
    SearchResults.vue              # Suchergebnis-Liste mit Thumbnails
    ProductCard.vue                # Produkt-Karte (frameless, stagger-Animation)
    ProductList.vue                # Grid mit Kategorie-Filter-Support
    LoginForm.vue                  # Login-Formular
    RegisterForm.vue               # Registrierung mit Passwort-Stärke-Meter
  views/
    HomePage.vue                   # Hero-Section + Featured Products (max 6)
    ProductsPage.vue               # Katalog mit Kategorie-Filter-Tabs
    ProductDetailPage.vue          # Einzelansicht mit Breadcrumb
    SearchPage.vue                 # Suchergebnis-Seite
    LoginPage.vue                  # Split-Layout Login
    RegisterPage.vue               # Split-Layout Register
    NotFoundPage.vue               # 404-Seite
  composables/                     # Shared Composables (useCategoryGradient.ts etc.)
  stores/                          # Struktur nicht ändern, Bugfixes + Erweiterungen erlaubt
    products.store.ts
    search.store.ts
    auth.store.ts
  router/index.ts                  # Bestehende Routen nicht entfernen, neue Routen hinzufügen erlaubt
  types/                           # Bestehende Interfaces nicht brechen, erweitern erlaubt
    product.ts
    auth.ts
  tailwind.config.ts               # Custom Animations, Fonts, Farben
```

## ORDNERSTRUKTUR (Backend)
```
backend/src/
  main.ts                          # Bootstrapping – Struktur beibehalten, Bugfixes erlaubt
  app.module.ts                    # Root-Module
  config/
    app.config.ts                  # Environment-Config (Port, DB, Redis, OpenSearch)
    database.config.ts             # TypeORM-Konfiguration
    opensearch.config.ts           # OpenSearch-Client
  common/
    constants/
      jwt.constants.ts             # Zentrale JWT-Secret-Logik (getJwtSecret)
      rating-weights.ts            # Rating-Gewichtung
    filters/
      http-exception.filter.ts     # Globaler Error-Handler → einheitliches Response-Format
    interceptors/
      logging.interceptor.ts       # Request-Logging
    services/
      audit-log.service.ts         # Audit-Logging für sicherheitsrelevante Aktionen
  auth/                            # Auth-Modul (JWT, Passport)
    dto/                           # RegisterDto, LoginDto, RefreshDto
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    jwt.strategy.ts
    jwt-auth.guard.ts
  products/                        # Produkt-Modul
    entities/product.entity.ts
    products.controller.ts
    products.service.ts
    products.module.ts
  ratings/                         # Bewertungs-Modul
    entities/
      rating.entity.ts
      rating-vote.entity.ts
    dto/
      create-rating.dto.ts
      update-rating.dto.ts
      vote-rating.dto.ts
    ratings.controller.ts
    ratings.service.ts
    ratings.module.ts
  search/                          # OpenSearch-Modul
    search.controller.ts
    search.service.ts
    search.module.ts
  entities/                        # Shared Entities (User, RefreshToken, EmailVerification)
    user.entity.ts
    refresh-token.entity.ts
    email-verification.entity.ts
```

## API-ENDPUNKTE (Backend, NICHT ändern)
```
GET    /api/products                Alle Produkte (paginated)
GET    /api/products/featured?limit=6   Featured Produkte
GET    /api/products/:id            Einzelnes Produkt
GET    /api/search?q=...            Volltextsuche (min 2 Zeichen)
GET    /api/search/suggest?q=...    Autocomplete-Vorschläge
POST   /api/auth/register           Registrierung
POST   /api/auth/login              Login
POST   /api/auth/refresh            Token-Refresh
POST   /api/auth/logout             Logout
```

## DATENMODELLE
```typescript
// Product
{ id, name, description, brand, category: { id, name },
  images: { id, path, isPrimary, displayOrder }[],
  rating: 0.0-5.0, reviewCount, isFeatured, createdAt, updatedAt }

// SearchSuggestion (Autocomplete) – KEINE images, KEINE description
{ id, name, brand, category }

// SearchResult – HAT description, KEINE images
{ id, name, brand, description, category, category_id }

// User
{ id, email, username }
```

## BESTEHENDE FUNKTIONALITÄT (nicht entfernen!)
- Suche mit Autocomplete: Vorschläge beim Tippen, Keyboard-Navigation (Pfeiltasten, Enter, Escape), Click-Outside
- Partial Search: "So" findet "Sony" (Backend edge_ngram)
- Featured Products: Startseite zeigt 6, Produktseite zeigt alle 15
- Auth-System: Register/Login mit JWT, Auto-Token-Refresh, LocalStorage-Persistenz, Password-Strength-Meter
- Kategorie-Filter auf Produktseite (clientseitig)
- Breadcrumb auf Produktdetailseite

## REGELN
- Frontend- und Backend-Dateien dürfen geändert werden
- Stores, Router, Types dürfen für neue Module erweitert werden (bestehende Interfaces/Routes nicht brechen)
- Backend: neue Module, Entities, DTOs, Controller, Services anlegen erlaubt
- Docker-Compose darf für neue Volumes und Services erweitert werden
- Composition API mit `<script setup>` verwenden
- Tailwind CSS für alles – kein Inline-CSS außer für Gradients die Tailwind nicht kann
- Deutsche Texte mit **echten Umlauten** (ä, ö, ü, ß) – NIE ASCII-Ersetzungen (ae, oe, ue)
- Neue npm-Pakete (neue Funktionalität) nur wenn explizit freigegeben (z.B. multer, sharp, @nestjs/schedule, @nestjs/serve-static)
- Frontend: keine neuen Funktions-Pakete ohne explizite Freigabe
- **Security-Upgrades bestehender Pakete sind erlaubt** – Major-Version-Bumps bei CVE-Fixes inklusive notwendiger Migrations-Pakete (z.B. `@eslint/js`, `typescript-eslint` für ESLint 9 Flat Config)

## ERLAUBTE BACKEND-PAKETE (Phase 9)
```
multer + @types/multer          – Avatar/Bild-Upload
sharp + @types/sharp            – Bild-Resize/Optimierung
@nestjs/schedule                – Cron-Jobs (z.B. Online-Status)
@nestjs/serve-static            – Statische Dateien (Avatare)
@nestjs/throttler                – Rate Limiting (bereits installiert)
```

## AKTUELLE TOOLING-VERSIONEN
```
Backend:  @nestjs/cli@11, eslint@9 (Flat Config: eslint.config.mjs), @typescript-eslint@8
Frontend: vite@7, @vitejs/plugin-vue@6, vue-tsc@2
```

---

## DESIGNSPRACHE

### FARBPALETTE
```
Primär-Akzent:     red-800 (#991b1b), hover: red-900
Neutral-Primär:    gray-900 (#111827) – Texte, Kategorie-Tabs, Badges
Hintergrund:       #fafafa
Oberflächen:       white (Footer, Dropdown)
Text-Primär:       gray-900
Text-Sekundär:     gray-500 / gray-600
Text-Tertiär:      gray-400
Borders:           gray-200/60, gray-100
Selection:         bg #fecaca, text #7f1d1d
Rating-Stern:      fill-amber-400 text-amber-400
```

### AKZENTFARBE red-800 – NUR an diesen Stellen:
- Register-Button (Header + Mobile-Menu)
- User-Avatar-Kreis (Header)
- Login/Register Submit-Buttons
- Auth-Textlinks ("Registrieren" / "Anmelden")
- **Alles andere bleibt gray-900**

### KATEGORIE-GRADIENTS (Produktbilder-Placeholder)
```
Electronics:        from-slate-800 to-slate-600    (Text: text-slate-200)
Beauty:             from-rose-300 to-pink-200       (Text: text-rose-700)
Food & Beverages:   from-amber-300 to-orange-200    (Text: text-amber-800)
Sports & Outdoors:  from-emerald-400 to-teal-300    (Text: text-emerald-900)
Home & Garden:      from-sky-300 to-blue-200        (Text: text-sky-800)
Fallback:           from-gray-300 to-gray-200       (Text: text-gray-600)
```

### TYPOGRAFIE
```
Font:               Inter (Google Fonts), Fallbacks: SF Pro Display, -apple-system, system-ui
Überschriften:      font-bold, tracking-tight
Produktnamen:       text-[15px] font-medium (NIE font-bold)
Labels/Eyebrows:    text-[11px] font-medium uppercase tracking-widest text-gray-400
Body:               text-sm / text-base, leading-relaxed
```

### RADIEN
```
Buttons/Inputs:     rounded-full (Pill-Shape)
Karten/Dropdowns:   rounded-2xl
Thumbnails/Icons:   rounded-xl
Produktbilder:      rounded-2xl (Karten), rounded-3xl (Detailseite)
Badges:             rounded-full
```

### ABSTÄNDE
```
Section-Padding:    py-12 md:py-16 oder py-20 md:py-28
Max-Width:          max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Grid-Gaps:          gap-x-6 gap-y-10
Karten-Spacing:     mb-4 (Bild zu Text), space-y-1.5 (Textbereich)
```

### ANIMATIONEN
```
fade-in:            fadeIn 0.5s ease-out forwards
fade-in-up:         fadeInUp 0.6s ease-out forwards
slide-down:         slideDown 0.3s ease-out forwards
scale-in:           scaleIn 0.2s ease-out forwards
shimmer:            shimmer 1.8s infinite linear (Skeleton-Loading)
Stagger:            50ms Versatz pro Element (CSS-Klassen stagger-1 bis stagger-15)
```

### KRITISCH – BEKANNTE FALLEN:
- **NIEMALS `opacity-0` als Tailwind-Klasse zusammen mit Animationen verwenden** – die Utility-Klasse überschreibt den Animations-Endzustand und Elemente bleiben unsichtbar. Die Keyframes starten selbst bei opacity: 0, `forwards` im Tailwind-Config hält den Endzustand.
- **Bei Filterwechsel `:key` auf den Grid-Container setzen**, damit Vue den DOM neu rendert und Animationen erneut starten (z.B. `:key="categoryFilter"`)

### TRANSITIONS
```
Hover (Buttons):    transition-all duration-200
Hover (Karten):     transition-colors duration-300
Bild-Zoom:          transition-transform duration-700 ease-out, group-hover:scale-105
Layout-Wechsel:     transition-all duration-300
```

### KOMPONENTEN-PATTERNS

**Header (App.vue):** Glassmorphism (`glass`-Klasse), sticky top-0 z-50, h-16, border-b border-gray-200/60. Desktop: Logo links, SearchBar mittig, Nav rechts. Mobile: Hamburger (Menu/X Icons), slide-down Menü. Menü schließt bei Routenwechsel.

**Produktkarten (ProductCard.vue):** Frameless (KEINE Borders, KEINE Schatten). Gradient-Placeholder pro Kategorie. Brand-Badge: absolute top-3 left-3, bg-white/90 backdrop-blur-sm, text-[11px], rounded-full. Rating: Star + Zahl + Count. Stagger über `index` Prop.

**Skeleton-Loading:** `.skeleton`-Klasse (index.css). Form spiegelt exakt erwarteten Content. Skeletons statt Spinner für ALLE Loading-States.

**Breadcrumb (ProductDetailPage):** Home > Produkte > Produktname. ChevronRight (:size="14"), text-gray-400, letztes Element text-gray-900 font-medium truncate.

**Suchleiste (SearchBar.vue):** Pill-Shape, Dropdown rounded-2xl animate-slide-down. Suggestions: Gradient-Thumbnail (w-10 h-10 rounded-xl) + Name + Brand/Category.

**Auth-Seiten:** Split-Layout Desktop (lg:w-1/2). Links: bg-gray-950 + rot/gold Gradient-Orbs + Icon + Text. Rechts: Formular max-w-sm. Mobile: nur Formular.

**Footer (App.vue):** 4-Spalten-Grid: Brand (col-span-2) + Navigation + Konto. Copyright mit border-t border-gray-100.

**Empty/Error States:** Zentriert, Icon in bg-gray-100 rounded-2xl (w-16 h-16), Titel font-medium, Text text-sm text-gray-400.

**Ergebnis-Badge:** bg-gray-900 text-white text-xs font-semibold rounded-full.

**Kategorie-Filter:** Horizontale Pill-Tabs. Aktiv: bg-gray-900 text-white. Inaktiv: bg-gray-100 text-gray-600.

### VERIFIKATION NACH JEDER ÄNDERUNG
Jede Änderung muss diese Checks bestehen – keine Ausnahmen:
```bash
# Backend
cd backend
npx tsc --noEmit                    # TypeScript-Fehler → 0 Errors
npx nest build                      # Build → erfolgreich
npx eslint src/                     # Lint → 0 Errors (Warnings akzeptabel)

# Frontend
cd frontend
npx vite build                      # Build → erfolgreich
```
- Bei Fehlern: **Sofort fixen**, nicht als „bekanntes Problem" stehen lassen
- Bei neuen Warnings: Bewusst entscheiden ob `warn` oder `error` – nie ignorieren
- **`NICHT ändern`-Regeln** schützen die Struktur, nicht vor Bugfixes. Ein echter Bug wird immer gefixt.

### ANTI-PATTERNS (NICHT verwenden)
- Sichtbare Borders bei Produktkarten
- Blaue Akzentfarben
- Fette Produktnamen (font-bold)
- `opacity-0` zusammen mit CSS-Animationen
- Spinner statt Skeleton-Loading
- Inline-CSS (außer Gradients)
- Neue npm-Pakete ohne explizite Freigabe
- Emojis im UI
- ASCII-Umlaute (ae, oe, ue)
