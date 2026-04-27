# CLAUDE.md

## Project Context

This project is **Astra — a visually immersive, space-inspired web experience**.

The goal is not just to build a functional website, but to create a **cohesive, atmospheric system** where:

* ideas are represented as celestial systems
* motion is subtle, intentional, and layered
* real-world data is transformed into visual signals

This is a **design-driven project**, not a typical UI build.

Always prioritize **cohesion, clarity, and restraint** over adding more features.

---

## Core Principles

### 1. Build Systems, Not One-Off Components

* Components should be reusable and composable
* Avoid tightly coupled logic
* Separate layout, animation, and data logic clearly

---

### 2. Motion Must Be Subtle and Intentional

* Avoid fast, exaggerated, or chaotic animations
* Prefer slow transitions using opacity, blur, and scale
* Scroll animations should feel smooth and continuous

If an animation is immediately noticeable, it is likely too strong.

---

### 3. Visual Restraint

* Do NOT use pure black or harsh white
* Use soft teal-based gradients and diffused glow
* Avoid generic UI patterns (e.g., overly rounded cards, heavy shadows)

Prefer:

* asymmetry
* thin glowing edges
* layered depth

---

### 4. Performance is Critical

* Avoid unnecessary re-renders
* Lazy load heavy sections (3D, canvas, large assets)
* Keep animations efficient (use requestAnimationFrame, GSAP where appropriate)

---

### 5. Prefer Simplicity in Implementation

* Do not over-engineer solutions
* Use the simplest approach that satisfies the PRD
* Avoid introducing unnecessary dependencies

---

## Tech Stack Guidelines

* Framework: Next.js (App Router)
* Styling: Tailwind CSS + custom CSS where needed
* Animation:

  * GSAP (ScrollTrigger) for scroll-based animation
  * Framer Motion for UI micro-interactions
* 3D / Background:

  * React Three Fiber + drei (only where necessary)
* Data:

  * NASA EONET API (filtered and transformed before rendering)

---

## Section-Specific Guidance

### Hero Section

* Focus on layout and UI polish
* Background animation is scroll-driven (image sequence handled separately)
* UI elements (text, buttons, navbar) should have subtle idle animations

---

### Ideas Forming

* Use SVG or canvas for nodes and connections
* Animate connections progressively with scroll
* Avoid randomness that breaks visual clarity

---

### Ideas Becoming Real

* Use a layered approach:

  * particles → intermediate shapes → final objects
* Animate using opacity, blur, and scale
* Avoid hard morphing or complex physics simulations

---

### Astronomy Carousel

* Infinite horizontal scroll
* Cards must be minimal:

  * year, title, short line, visual
* No long text blocks
* Maintain visual progression (older = dimmer, newer = brighter)

---

### EONET Integration

#### Allowed Event Types ONLY:

* Wildfires → "Thermal Surge"
* Storms → "Atmospheric Disturbance"
* Volcanoes → "Geological Activity"

#### Do NOT:

* display raw API data
* show coordinates
* use technical jargon

#### Always:

* transform data into simplified, human-readable labels
* represent events visually (glow, ripple, pulse)

---

### Signals from Earth

* Abstract visualization of events
* Floating nodes with subtle motion
* Intensity reflects recency

---

### Event Carousel

* Infinite scroll
* Minimal card content:

  * label, location, time, status
* No clutter or extra metadata

---

### Planet System (R3F)

* Keep geometry simple
* Focus on lighting and interaction
* Avoid photorealism

---

### Minigame

* Keep mechanics simple (cursor-based interaction)
* Use lightweight canvas or WebGL
* Avoid complex game systems

---

## Code Style Guidelines

* Keep components small and focused
* Use clear naming (no vague names like "Thing", "Stuff")
* Avoid deeply nested logic
* Prefer readability over cleverness

---

## What to Avoid

* Overly complex animation systems
* Generic UI kit styling
* Excessive libraries
* Unstructured code
* Overloading a single component with multiple responsibilities

---

## Final Instruction

Always refer back to the PRD when making decisions.

If something is unclear:

* choose the simpler solution
* maintain visual consistency
* preserve the overall experience

This project should feel like **one cohesive universe**, not a collection of features.

