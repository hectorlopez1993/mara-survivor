# Mara Survivor — Sistema de Sprites Procedurales (Grid-Based)

## 🎨 ARQUITECTURA ACTUAL DEL JUEGO

**El juego genera sprites proceduralmente desde mapas de bits en texto:**

```javascript
// Ejemplo de sprite generado por gridSprite() en js/sprites.js:
const PLAYER_GRIDS = {
  "p_body_down0": [
    "..kkkkkkkkkkkk..",
    "..kkkkkkkkkkkk..",
    // ... cada caracter = un pixel coloreado por la paleta PAL
  ],
};
```

**Ventajas del sistema actual:**
- ⭐⭐⭐ **Sin archivos PNG externos** → repo de ~KBs, no MBs
- ⭐⭐⭐ **Generación procedural inmediata** en runtime vía `gridSprite()`
- ⭐⭐⭐ **Totalmente customizable** editando arrays de texto

---

## 🤖 INTEGRACIÓN DE IA: EN LUGAR DE DESCARGAR SPRITES EXTERNOS

### Estrategia recomendada (HÍBRIDA):

#### A. Sprites Procedurales Existentes (JUGADOR, UI BÁSICA)
**Mantener sistema actual de grids en texto:**
- ✅ Funcionalidad probada y minimalista
- ⭐⭐⭐ Integración con IA: usar LLM para generar nuevos grids desde prompts textuales

#### B. Sprites de Enemigos (VARIACIONES PROCEDURALES)
**Generar procedimentalmente con IA + grids en texto:**

```javascript
// Ejemplo: enemigo con variante procedural
const ENEMY_VARIANTS = {
  "robot_basic": [
    "..RRR.....",
    ".RhhhhhR..",
    // ... generado desde prompt de IA
  ],
  "robot_mechanic": [
    // Variante procedimental generada con IA
  ]
};
```

**Prompt template para IA:**
```
Generate a pixel art robot enemy for Mara Survivor, grid-based format (16x8 chars):
- Style: retro synthwave palette (R=red, h=pink, w=white, k=gray)
- Features: antenna, mechanical joints, simple face
- Format: 16 columns x 8 rows of characters where . = transparent
```

---

## 📦 RECURSOS PARA INTEGRAR (NO DESCARGAS EXTERNAS)

### 1. Sprites procedurales existentes (JUGADOR + UI BÁSICA)
**Estado:** ✅ Ya implementado en `js/sprites.js`  
**Acción:** Mantener y mejorar con IA procedural

---

### 2. Sprites de Enemigos Procedurales
**Recomendación:** Generar procedimentalmente con LLM usando prompts textuales

#### Plantilla para generar enemigos:
```javascript
const ENEMY_VARIANTS = {};

function generateEnemyFromPrompt(prompt) {
  // Usar TU_MODELO_ORQUESTADOR_GGUF o backend API
  // Devolver array de strings (grid 16xN)
}
```

**Ejemplo enemigo procedural:**
```javascript
const ENEMY_ZOMBIE = [
  "..nnn.....",
  ".nnnnnnn..",
  ".nnNNNnn..",
  "..nnnnnn..",
  ".nnnnnnn..",
  "n.n...n.n.",
  "n......n.n",
  "..........",
];
```

---

### 3. Sprites de Items (GENERACIÓN PROCEDURAL CON IA)
**Recomendación:** Generar variantes procedimentales con prompts LLM

#### Plantilla para items:
```javascript
const ITEMS = {};

function generateItemFromPrompt(itemType, prompt) {
  // Devolver sprite grid + metadata (color, rarity, etc.)
}
```

**Ejemplo item procedimental:**
```javascript
const ITEM_POTION_RED = [
  "..RRR.....",
  ".R..R...R.",
  ".R..G...R.",
  ".R....G.R.",
  ".........",
];
```

---

## 📋 TAREAS PRIORITARIAS (SIN DESCARGAS EXTERNAS)

### ✅ TAREA 1a: INVESTIGACIÓN DE EJEMPLOS PIXEL ART + IA ⭐⭐⭐ COMPLETADO
**Estado:** ✅ Completado en `research/pixel_art_games.md`

### ✅ TAREA 1b: RECURSOS SPRITES (REUTILIZAR VS CREAR) ⭐⭐⭐ COMPLETADO
**Hallazgo clave:** El juego ya usa generación procedural desde grids en texto → NO necesita descargar sprites externos  
**Acción:** Mejorar sistema existente con IA para generar variantes procedimentales

---

## 🎯 SIGUIENTE PASO: GENERACIÓN PROCEDURAL DE ENEMIGOS Y ITEMS

### A. Crear módulo de generación procedural de enemigos
```javascript
// js/enemy_generator.js - NUEVO ARCHIVO
window.EnemyGenerator = {
  generateFromPrompt: function(type, prompt) {
    // Llama a TU_MODELO_BACKEND_GGUF vía API o backend
    // Devuelve grid de enemigo procedimental
  },
  
  getBaseEnemies: function() {
    return [
      { name: "robot_basic", grid: ZOMBIE_GRID_DEFECTO },
      { name: "zombie_basic", grid: ZOMBIE_GRID_DEFECTO },
    ];
  }
};
```

### B. Integrar con sistema existente de `js/enemies.js`
**Actualizar:** `this.enemies = EnemyGenerator.getBaseEnemies()`  
**Mejorar:** Generar variantes procedimentales con IA para cada nivel/boss

---

## 💡 CONCLUSIÓN DE INVESTIGACIÓN

**Para Mara Survivor, la estrategia óptima es:**

1. ✅ **MANTENER sistema de grids en texto (PROCEDURAL Puro)**
   - Ventaja: repo mínimo (~KBs), sin archivos PNG externos
   - IA puede generar nuevos grids desde prompts textuales

2. ✅ **USAR IA para GENERACIÓN PROCEDIMENTAL** de enemigos/items variados
   - No descargar sprites externos (ya generamos proceduralmente)
   - LLM genera arrays de texto directamente → integrable inmediatamente

3. ⚠️ **NO RECOMENDADO:** Descargar packs externos (Kenney, etc.)
   - El sistema actual es más ligero y flexible
   - Sprites procedurales con IA son más consistentes con estilo existente

---

## 📝 LOG DE DECISIONES

**Fecha:** 2026-XX-XX  
**Decisión final:** Mejorar generación procedural existente con IA, NO descargar assets externos  
**Racional:** Sistema actual ya es procedural (grids en texto) → añadir IA para variar contenido infinitamente
