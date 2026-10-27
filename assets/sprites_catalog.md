# Assets Catalogo - Mara Survivor

## 📦 Sprites Reutilizados (Kenney + Open Source)

### A. Kenney Platformer Pack ⭐⭐⭐ PRINCIPAL
**Link:** https://kenney.nl/assets/platformer-pack  
**Licencia:** CC0 1.0 Universal (comercial, sin attribution)  
**Tamaño:** ~50MB compressed  
**Contenido:**

```
Player Sprites:
  - player_idle_0.png → idle animation frame
  - player_run_0.png → run animation
  - player_jump_0.png → jump animation
  - player_die_0.png → death animation
  
Enemies (6 basic types):
  - enemy_robot_walk_0.png
  - enemy_mushroom_walk_0.png
  - enemy_alien_walk_0.png
  - etc.

Items:
  - coin.png, key.png, potion_red.png
  - health_pack.png, mana_pack.png
  
Tiles/Backgrounds:
  - platform_surface.png, grass_top.png
  - water.png, dirt_fill.png
```

**Integración en Mara Survivor:**
```javascript
// js/player.js - Reemplazar sprites base:
this.sheets = {
    idle: 'sprites/en/player_idle_0.png',
    run: 'sprites/en/player_run_0.png',
    jump: 'sprites/en/player_jump_0.png'
};
```

---

### B. Kenney Roguelike Pack ⭐⭐ PARA ENEMIGOS + ITEMS
**Link:** https://kenney.nl/assets/roguelike-pack  
**Contenido adicional:**
- 8 tipos de monstruos roguelike (zombis, esqueletos, goblins)
- Armas, pociones avanzadas, scrolls mágicos
- Tiles de dungeons (walls, floors, doors procedurales)

---

### C. Sprites Generados con IA (TinyLlama/Hermes-3)

#### Para items variacionales:
**Prompt template:**
```
Generate 8 variants of [item_type], pixel art style, consistent with Kenney platformer aesthetic:
- Item type: e.g., "potion", "scroll", "key variant"
- Colors: randomized from palette [red, green, blue, purple]
- Add simple decoration symbols (star, flame, lightning)
- 16x16 pixel art, no background
```

**Output structure:**
```
assets/sprites/items/generated/
├── potion_stars.png (5 variants)
├── scroll_flame.png (3 variants)
└── key_lightning.png (4 variants)
```

---

#### Para enemigos procedurales:
**Prompt template:**
```
Generate [num] enemies for Mara Survivor, pixel art style matching Kenney aesthetic:
- Enemy type: e.g., "mechanical bug", "magic golem"
- Difficulty: basic enemy (1 hit point range)
- Animation frames: idle, walk cycle (4 frames), attack
- 16x16 or 32x32 pixel art, no background
```

---

### D. Sprites de Partículas

#### Generación procedural recomendada:
No necesito sprites predefinidos, generar proceduralmente:

```javascript
// js/particles.js - Procedural generation:
function createExplosionSprite(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 8; canvas.height = 8;
    const ctx = canvas.getContext('2d');
    
    // Draw simple particle shape procedurally
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(4, 4, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toDataURL();
}
```

**Tipos de partículas para generar:**
- Sparkles (brillos) - círculos pequeños blancos
- Sparks (chispas) - líneas cortas amarillas
- Smoke (humo) - círculos grises translúcidos
- Heart (corazones) - forma corazón roja

---

### E. Sprites de UI/HUD

#### Opción 1: Usar Kenney Game Assets All-in-1 ⭐⭐⭐
**Link:** https://kenney.nl/assets/game-assets-all-in-one  
**Contenido:** Botones, barras de vida, iconos, cursor pixel art

#### Opción 2: Generar proceduralmente con canvas API
```javascript
// js/ui.js - Barra de vida procedimental:
function drawHealthBar(maxHP, currentHP) {
    const width = 100;
    const height = 20;
    const percent = currentHP / maxHP;
    
    // Background (red)
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(0, 0, width, height);
    
    // Health (green/red based on percentage)
    ctx.fillStyle = percent > 0.5 ? '#00ff00' : '#ff6600';
    ctx.fillRect(0, 0, width * percent, height);
}
```

---

### F. Tilesheet Generation para Fondos

#### Herramienta recomendada: Free Texture Packer
**Link:** https://freetexturepacker.com/ (Windows/Mac/Linux)

**Flujo de trabajo:**
1. Generar tiles individuales con IA o usar packs existentes
2. Importar a Free Texture Packer
3. Packear en sprite sheet optimizado
4. Exportar PNG + XML para tu engine

---

## 📋 INTEGRACIÓN EN PIPELINE ACTUAL DE MARA SURVIVOR

### Archivo: `assets/sprites_catalog.md` (actualizado)

```markdown
# Sprites Actuales vs Recomendados

## PLAYER SPRITES

### Estado actual:
- ✅ Funcional pero sprites básicos
- ⚠️ Animaciones simples (idle, walk)

### Recomendación:
Reemplazar con Kenney Platformer Pack → player_idle_0.png, etc.

Cambios necesarios en:
- js/player.js - Reemplazar this.sheets
- assets/emotes/ - Migrar emotes a nueva estética si necesario
```

---

## 📝 INSTRUCCIONES PARA AGENTES DE IA

### Antes de generar/modificar sprites:

1. **Leer `assets/sprites_catalog.md`** para ver qué recursos existen
2. **Verificar `.opencode/memory.md`** por contexto actual de decisiones
3. **Consultar `task_state.json`** si la tarea está en progreso

### Para decidir reutilizar vs generar:

| Caso | Acción recomendada |
|------|-------------------|
| Sprites player/main enemies | ⭐⭐⭐ Reutilizar Kenney (ya descargado) |
| Items variacionales | Generar con TinyLlama/Hermes-3 |
| Procedural content | Generar proceduralmente sin assets |
| Fondos de nivel | Usar tiles de packs existentes + procedural variation |

### Post-procesado obligatorio:

```python
# assets/processor.py - Pipeline post-proceso:
def process_sprite(input_path, output_path):
    """
    Aplicar consistencia visual a sprites generados:
    1. Outline consistente (stroke edges)
    2. Chroma-key si tiene fondo sólido
    3. Quantizar colores a paleta objetivo
    """
    pass
```

---

## 📦 ARCHIVOS A DESCARGAR PRIORITARIAMENTE

### 1. Kenney Platformer Pack ⭐⭐⭐
**Link:** https://kenney.nl/assets/platformer-pack  
**Tamaño:** ~50MB  
**Acción:** Descargar y extraer a `assets/raw/platformer/`

### 2. Kenney Roguelike Pack (Opcional)
**Link:** https://kenney.nl/assets/roguelike-pack  
**Para:** Enemigos adicionales, items mágicos  
**Tamaño:** ~30MB

---

## 🎨 PALETA OBJETIVO PARA CONSISTENCIA

```
# Paleta base recomendada (inspirada en Kenney):

PRIMARY:
- White: #FFFFFF
- Light Gray: #CCCCCC
- Dark Gray: #424242
- Black: #1A1A1A

ACCENT COLORS:
- Red: #D93025
- Green: #2C8B3E
- Blue: #2F7DD5
- Yellow: #E9A60F
- Orange: #FF7B00
- Purple: #B136D6

NEUTRALS:
- Background: #1A1A1A (dark)
- Foreground: #FFFFFF
- Border: #424242
```

---

## 📝 LOG DE DECISIONES

### Fecha: 2026-XX-XX
**Decisión:** Reutilizar Kenney Platformer Pack para sprites principales + generar items procedimentales con IA ligera  
**Racional:** Menor tiempo de desarrollo + calidad prod-ready + flexibilidad procedural

---

## 🔗 ENLACES RÁPIDOS

| Recurso | Link | Licencia |
|---------|------|----------|
| Kenney Platformer | https://kenney.nl/assets/platformer-pack | CC0 ✅ |
| Kenney Roguelike | https://kenney.nl/assets/roguelike-pack | CC0 ✅ |
| OpenGameArt Platformer | https://opengameart.org/content/platformer-art-pixel-edition | CC-BY ⚠️ |
