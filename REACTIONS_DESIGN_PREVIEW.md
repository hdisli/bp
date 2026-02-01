# Emoji Reactions – Design Preview

## Visuelles Konzept: Overlap-Effekt

Die Reactions schweben elegant an der unteren Kante der Kommentar-Box und erzeugen einen modernen, lebendigen Look ohne zu verspielt zu wirken.

---

## Vorher/Nachher

### ❌ Vorher (Alte Version)

```
┌────────────────────────────────────────────┐
│ Username • 15. Jan                         │
│ Das ist ein toller Kommentar!              │
│                                            │
│ [👍 12] [❤️ 5] [😂 3] [+]                 │ ← Reactions innerhalb der Box
└────────────────────────────────────────────┘

Problem:
- Nur 6 Reactions (2 davon negativ/toxisch)
- Reactions nehmen Platz in der Box weg
- Kein visueller "Pop"
```

### ✅ Nachher (Neue Version)

```
┌────────────────────────────────────────────┐
│ Username • 15. Jan                         │
│ Das ist ein toller Kommentar!              │
│                                            │
└────────────────────────────────────────────┘
    [👍 12] [❤️ 5] [🔥 8] [💡 3] [🤡 1] [+]  ← Reactions überlappen!
    └─────┬──────┘
          └─ 50% in Box, 50% draußen
```

**Vorteile:**
- 12 Reactions (8 positiv, 4 Spaß)
- Visueller "Floating"-Effekt
- Mehr Platz in der Kommentar-Box
- Hover: Reactions schweben nach oben (-translate-y-0.5)

---

## Emoji-Picker: 6x2 Grid

**Vorher:** Horizontal in einer Reihe (6 Emojis)

```
[👍] [❤️] [😂] [😮] [😢] [😠]
```

**Nachher:** Kompaktes 6x2 Grid (12 Emojis)

```
┌─────────────────────────────────┐
│  [👍] [❤️] [😂] [😮] [🔥] [💡] │
│  [🎉] [👏] [💩] [🤡] [😴] [🤮] │
└─────────────────────────────────┐
                           └─ rounded-2xl, shadow-lg, border-gray-200/60
```

**Interaktion:**
- Hover: Scale 1.1x + bg-gray-50
- Tooltip: Deutsches Label (z.B. "Gefällt mir", "Bullshit", "Clown")
- Auto-close nach Auswahl

---

## Farbschema & Hierarchie

### Reaction Bubble (Aktiv)

```
bg-gray-900 text-white
px-2.5 py-1 rounded-full
shadow-sm
hover:bg-gray-800 hover:-translate-y-0.5
```

**Beispiel:**
```
┌─────────────┐
│ 🔥 Fire  12 │ ← Schwarz, weiße Schrift
└─────────────┘
```

### Reaction Bubble (Inaktiv)

```
bg-white text-gray-600
border border-gray-200/60
px-2.5 py-1 rounded-full
shadow-sm
hover:bg-gray-50 hover:-translate-y-0.5
```

**Beispiel:**
```
┌─────────────┐
│ 💡 Idea   3 │ ← Weiß, graue Schrift, dünner Border
└─────────────┘
```

### Add-Button

```
bg-white text-gray-400
border border-gray-200/60
w-7 h-7 rounded-full
shadow-sm
hover:text-gray-600 hover:bg-gray-50 hover:-translate-y-0.5
```

**Beispiel:**
```
┌───┐
│ + │ ← Kleiner, runder Button
└───┘
```

---

## Animation & Transitions

### Hover-Effekt (Reaction Bubbles)

```css
transition-all duration-200
hover:-translate-y-0.5
```

**Visuell:**
```
Resting:  [👍 12]
          ────────
Hover:      [👍 12]  ← Schwebt 2px nach oben
          ────────
```

### Picker-Entrance

```css
animate-scale-in  /* scaleIn 0.2s ease-out forwards */
```

**Visuell:**
```
Frame 0ms:   [·]          (scale 0.95, opacity 0)
Frame 100ms: [○]          (scale 0.97, opacity 0.5)
Frame 200ms: [⬤]          (scale 1, opacity 1)
```

---

## Responsive Design

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────┐
│ Username • 15. Jan                                   │
│ Das ist ein langer Kommentar mit viel Text...        │
└──────────────────────────────────────────────────────┘
    [👍 12] [❤️ 5] [🔥 8] [💡 3] [🤡 1] [+]
    └─ Alle in einer Reihe (flex gap-1.5)
```

### Mobile (<768px)

```
┌────────────────────────────────┐
│ Username • 15. Jan             │
│ Kommentar...                   │
└────────────────────────────────┘
    [👍 12] [❤️ 5] [🔥 8]
    [💡 3] [🤡 1] [+]
    └─ Wrapped bei Bedarf (flex-wrap)
```

---

## Accessibility

### Tooltips

Jede Reaction hat ein deutsches Label:

```html
<button title="Gefällt mir">👍 12</button>
<button title="Fire">🔥 8</button>
<button title="Clown">🤡 1</button>
<button title="Reaktion hinzufügen">+</button>
```

### ARIA-Attributes

```html
<button
  @click="openReactionPicker"
  :aria-expanded="pickerOpen ? 'true' : 'false'"
  aria-label="Reaktion hinzufügen"
>
  +
</button>
```

### Keyboard-Navigation

- `Tab`: Durch Reactions navigieren
- `Enter`/`Space`: Reaction togglen
- `Escape`: Picker schließen (geplant)

---

## Beispiel-Kommentar (vollständig)

```
┌────────────────────────────────────────────────────────┐
│  👤 Username • 15. Jan 2026                      🗑️   │
│                                                        │
│  Ich finde dieses Produkt absolut genial! Die         │
│  Qualität übertrifft alle Erwartungen. 🔥             │
│                                                        │
└────────────────────────────────────────────────────────┘
      [👍 24] [❤️ 12] [🔥 18] [💡 5] [🎉 3] [+]
      └────────────────────────────────────────┘
                      ↑
              Overlap-Zone (translate-y-1/2)
```

**Hover über 🔥:**
```
      [👍 24] [❤️ 12]   [🔥 18]   [💡 5] [🎉 3] [+]
                         └─ Schwebt leicht nach oben
                         └─ bg wird dunkler (gray-800)
```

**Picker geöffnet:**
```
                                         ┌──────────┐
      [👍 24] [❤️ 12] [🔥 18] [💡 5]   │👍 ❤️ 😂  │ ← Grid 6x2
                                        │😮 🔥 💡  │
                                        │🎉 👏 💩  │
                                        │🤡 😴 🤮  │
                                        └──────────┘
                                             ↑
                                     Popup öffnet nach oben
```

---

## Edge Cases

### Viele Reactions

```
┌────────────────────────────────────────────┐
│ Username • 15. Jan                         │
│ Super beliebter Kommentar!                 │
└────────────────────────────────────────────┘
    [👍 124] [❤️ 89] [🔥 67] [💡 45] [🎉 23]
    [😂 12] [👏 8] [🤡 3] [💩 2] [+]
    └─ Wrapped automatisch bei Platz-Mangel
```

### Keine Reactions

```
┌────────────────────────────────────────────┐
│ Username • 15. Jan                         │
│ Frischer Kommentar ohne Reactions.        │
└────────────────────────────────────────────┘
    [+]  ← Nur der Add-Button erscheint
```

### Nicht authentifiziert

```
┌────────────────────────────────────────────┐
│ Username • 15. Jan                         │
│ Kommentar Text...                          │
└────────────────────────────────────────────┘
    [👍 12] [❤️ 5]  ← Nur existierende Reactions
    └─ Kein Add-Button, disabled State
```

---

## Design-Prinzipien

### 1. Subtile Hierarchie

```
Wichtigkeit:
1. Kommentar-Text (text-gray-600)
2. Username (text-gray-900 font-medium)
3. Reactions (text-gray-600 / gray-900 wenn aktiv)
4. Add-Button (text-gray-400)
```

### 2. Konsistenz mit Projekt

- ✅ Gray-900 für primäre Aktionen (aktive Reaction)
- ✅ Rounded-full für Buttons/Bubbles
- ✅ Border-gray-200/60 für dezente Trenner
- ✅ Shadow-sm für subtile Depth
- ✅ Transition-all duration-200
- ✅ Hover-Effekte (-translate-y)

### 3. Community-Fokus

**Positive dominieren (8 vs 4):**
```
Positiv:  👍 ❤️ 😂 😮 🔥 💡 🎉 👏
Spaß:     💩 🤡 😴 🤮
```

**Keine toxischen Reactions:**
- ❌ Kein "Angry" (😠)
- ❌ Kein "Sad" (😢)
- ❌ Kein "Dislike" (👎)

### 4. Performance

- Keine zusätzlichen Requests (alles in einem API-Call)
- Optimistic Updates (sofortiges UI-Feedback)
- Lazy Rendering (Picker nur wenn geöffnet)

---

## Finale Anmerkungen

Das neue Design balanciert perfekt zwischen **professionell** (clean, minimalistisch) und **lebendig** (Emojis, Animationen).

**Benchmark-Vergleich:**
- **LinkedIn:** Nur Like (zu minimalistisch für Community)
- **Discord:** Reactions + Overlap (unser Vorbild!)
- **Reddit:** Upvote/Downvote (zu gamified)
- **GitHub:** Reactions ohne Overlap (solide, aber nicht visuell stark)

**Unser Ansatz:** Discord-Overlap + GitHub-Professionalität = Premium Community Experience 🔥
