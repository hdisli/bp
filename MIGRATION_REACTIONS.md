# Migration: Erweiterte Emoji-Reactions für Profilkommentare

## Übersicht

Die Emoji-Reaction-Funktion wurde von 6 auf 12 Reactions erweitert und mit einem neuen Overlap-Design ausgestattet.

### Neue Reactions

**Positive (8):**
- 👍 `like` – Gefällt mir
- ❤️ `love` – Love
- 😂 `laugh` – Lustig
- 😮 `wow` – Wow
- 🔥 `fire` – Fire/Hot
- 💡 `idea` – Gute Idee
- 🎉 `party` – Feier es!
- 👏 `clap` – Applaus

**Negative/Spaß (4):**
- 💩 `poop` – Bullshit
- 🤡 `clown` – Clown (roast)
- 😴 `sleepy` – Langweilig
- 🤮 `vomit` – Cringe

**Entfernt:**
- ❌ `sad: '😢'` (zu emotional)
- ❌ `angry: '😠'` (fördert Toxizität)

---

## Visuelles Design: Overlap-Effekt

Die Reactions schweben jetzt **halb in der Kommentar-Box, halb draußen**:

```
┌─────────────────────────────────┐
│  Kommentar Text hier...         │
│                                 │
└─────────────────────────────────┘
    [👍 12] [❤️ 5] [🤡 2] [+]    ← 50% überlappen die Border
```

**Design-Details:**
- Position: `absolute bottom-0 translate-y-1/2`
- Schatten: `shadow-sm` für Depth
- Hover: `-translate-y-0.5` (leichtes Schweben)
- Spacing: `gap-1.5` zwischen Bubbles
- Grid im Picker: `grid-cols-6` für kompakte Darstellung

---

## Änderungen

### Backend

**Datei:** `backend/src/profile-comments/entities/profile-comment-reaction.entity.ts`

```typescript
export enum ReactionType {
  // Positive
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  FIRE = 'fire',      // NEU
  IDEA = 'idea',      // NEU
  PARTY = 'party',    // NEU
  CLAP = 'clap',      // NEU
  // Negative/Fun
  POOP = 'poop',      // NEU
  CLOWN = 'clown',    // NEU
  SLEEPY = 'sleepy',  // NEU
  VOMIT = 'vomit',    // NEU
}
```

### Frontend

**Datei:** `frontend/src/stores/profile-comments.store.ts`

```typescript
export type ReactionType =
  | 'like' | 'love' | 'laugh' | 'wow'
  | 'fire' | 'idea' | 'party' | 'clap'
  | 'poop' | 'clown' | 'sleepy' | 'vomit'

export const REACTION_TYPES: ReactionType[] = [
  'like', 'love', 'laugh', 'wow',
  'fire', 'idea', 'party', 'clap',
  'poop', 'clown', 'sleepy', 'vomit',
]
```

**Datei:** `frontend/src/views/UserProfilePage.vue`

- Emoji-Mapping erweitert
- Label-Mapping für Tooltips hinzugefügt
- Overlap-Design implementiert:
  - Kommentar-Container: `relative pb-6`
  - Reactions: `absolute left-8 bottom-0 translate-y-1/2`
  - Picker: `grid grid-cols-6` statt `flex`

### Datenbank

**Migration:** `backend/src/migrations/1738272000000-UpdateReactionTypes.ts`

Führt automatisch durch:
1. Konvertierung alter Reactions (`sad`, `angry` → `like`)
2. Enum-Update auf 12 neue Types
3. Rollback-Logik für Downgrade

---

## Migration ausführen

### 1. Docker-Container starten

```bash
docker-compose up -d
```

### 2. Migration ausführen

**Option A: Automatisch (TypeORM CLI)**

```bash
cd backend
npm run typeorm migration:run
```

**Option B: Manuell (SQL)**

```sql
-- 1. Alte Reactions konvertieren
UPDATE profile_comment_reactions
SET type = 'like'
WHERE type IN ('sad', 'angry');

-- 2. Enum aktualisieren
ALTER TABLE profile_comment_reactions
ALTER COLUMN type TYPE VARCHAR(20);

DROP TYPE IF EXISTS profile_comment_reactions_type_enum;

CREATE TYPE profile_comment_reactions_type_enum AS ENUM (
  'like', 'love', 'laugh', 'wow',
  'fire', 'idea', 'party', 'clap',
  'poop', 'clown', 'sleepy', 'vomit'
);

ALTER TABLE profile_comment_reactions
ALTER COLUMN type TYPE profile_comment_reactions_type_enum
USING type::profile_comment_reactions_type_enum;

ALTER TABLE profile_comment_reactions
ALTER COLUMN type SET DEFAULT 'like';
```

### 3. Backend neu starten

```bash
docker-compose restart backend
```

### 4. Frontend neu bauen

```bash
cd frontend
npm run build
```

---

## Rollback

Falls die Migration rückgängig gemacht werden muss:

```bash
cd backend
npm run typeorm migration:revert
```

Oder manuell:

```sql
-- Neue Reactions zu 'like' konvertieren
UPDATE profile_comment_reactions
SET type = 'like'
WHERE type IN ('fire', 'idea', 'party', 'clap', 'poop', 'clown', 'sleepy', 'vomit');

-- Altes Enum wiederherstellen
ALTER TABLE profile_comment_reactions ALTER COLUMN type TYPE VARCHAR(20);
DROP TYPE IF EXISTS profile_comment_reactions_type_enum;
CREATE TYPE profile_comment_reactions_type_enum AS ENUM (
  'like', 'love', 'laugh', 'wow', 'sad', 'angry'
);
ALTER TABLE profile_comment_reactions
ALTER COLUMN type TYPE profile_comment_reactions_type_enum
USING type::profile_comment_reactions_type_enum;
```

---

## Verifikation

### 1. TypeScript-Check

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx vue-tsc --noEmit
```

### 2. Build-Test

```bash
# Backend
cd backend && npx nest build

# Frontend
cd frontend && npx vite build
```

### 3. Manuelle Tests

1. **Profil aufrufen** mit Kommentaren
2. **Auf `+` klicken** → 12 Emojis in 6x2 Grid sollten erscheinen
3. **Emoji wählen** → Reaction sollte halb in Box, halb draußen erscheinen
4. **Hover** → Reaction sollte leicht nach oben schweben
5. **Nochmal gleiche Reaction** → Sollte entfernt werden (Toggle)
6. **Andere Reaction** → Alte sollte verschwinden, neue erscheinen

---

## Design-Konsistenz

✅ Entspricht CLAUDE.md Designsprache:
- Gray-900 für aktive State
- Gray-200/60 für Borders
- Rounded-full für Bubbles
- Smooth Transitions (duration-200)
- Shadow-sm für Depth
- Hover-Effekte mit -translate-y

✅ Community-fokussiert:
- Positive Reactions überwiegen (8 vs 4)
- Negative Reactions sind als Spaß gedacht (💩🤡🤮)
- Keine toxischen Reactions (kein Angry)

---

## Performance

**Keine N+1 Queries:**
- Reactions werden mit Kommentaren geladen
- Aggregation auf Backend-Seite
- Optimistic Updates im Frontend

**Bundle Size:**
- Keine neuen Dependencies
- Nur Emoji-String-Mappings
- Build-Size: +0.14 KB (UserProfilePage.vue)

---

## Sicherheit

✅ Alle Standards eingehalten:
- JWT-Auth erforderlich
- Rate Limiting: 20 reactions/min
- Enum-Validierung (DTO)
- Ownership-Checks
- Unique Constraint (1 Reaction/User/Comment)

---

## Nächste Schritte

Nach erfolgreichem Test in Production:
1. EmojiPicker.vue kann gelöscht werden (nicht benutzt)
2. Monitoring für neue Reaction-Types einrichten
3. Analytics: Welche Reactions werden am meisten genutzt?
4. Ggf. weitere Reactions basierend auf Community-Feedback

---

**Migration erstellt:** 2026-01-30
**Autor:** Claude (Senior Fullstack Engineer)
