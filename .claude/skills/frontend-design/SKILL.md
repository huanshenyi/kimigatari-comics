---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

## Project-Specific: キミガタリコミックス Design System

This manga creation app uses a **"Washi & Sumi"** (和紙と墨) aesthetic with modern glass effects.

### Core Principles

1. **White Space is Sacred**: Like traditional manga, generous white (washi paper) backgrounds let content breathe
2. **Sumi Ink Accents**: Deep black for panels, borders, and key UI elements - the ink on paper contrast
3. **Glass Morphism**: Modern frosted glass effects for cards and overlays - adds depth without darkness
4. **Editorial Typography**: Serif headlines (Noto Serif JP, Playfair Display) with clean sans-serif body

### Color Philosophy

- **Background**: Light washi (和紙) cream-white, NOT dark
- **Cards/Panels**: Frosted glass with subtle blur, light with dark borders
- **Ink/Text**: Deep sumi (墨) black for strong contrast
- **Accent**: Shu-iro (朱色) vermilion red - traditional Japanese ink stamp color
- **Secondary**: Ai (藍) indigo blue for interactive elements

### Visual Balance

```
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Washi (white/cream) background
│  ░░┌───────────────────────┐░░░░░░  │
│  ░░│  ▓▓▓ Glass Card ▓▓▓  │░░░░░░  │  ← Frosted glass panel
│  ░░│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │░░░░░░  │
│  ░░└───────────────────────┘░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░ ████ Sumi accent ░░░░░░░░  │  ← Ink black for emphasis
└─────────────────────────────────────┘
```

### Implementation Notes

- Use `backdrop-blur` for glass effects
- Borders should be visible but refined (1-2px, sumi black or soft gray)
- Shadows should be soft and diffused, not harsh
- Maintain at least 60% light/white space on any screen
- Dark mode is secondary - light washi theme is primary