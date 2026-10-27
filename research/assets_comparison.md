# Comparativa: Reutilizar vs Crear Sprites Pixel Art

## 📊 ANÁLISIS DE COSTES TIEMPO (PROYECTO MEDIUM-SIZE)

### OPCIÓN A: REUTILIZAR SPRITES EXISTENTES ⭐⭐⭐ RECOMENDADO

#### Ventajas:
- **Tiempo:** 20% del desarrollo (solo integración + customización ligera)
- **Calidad inicial:** Prod-ready out-of-box (Kenney=CC0)
- **Consistencia:** Coherente por defecto (mismo pack = mismo estilo)
- **Riesgo:** Nulo (assets probados comercialmente)

#### Desventajas:
- **Customización limitada:** Requiere variaciones del pack base
- **Tamaño assets:** Descargar ~50-100MB (Kenney platformer-pack)

#### Flujo de trabajo recomendado:
```bash
# 1. Descargar Kenney Platformer Pack (~50MB, CC0)
wget https://kenney.nl/assets/platformer-pack

# 2. Extraer y organizar en proyecto
mkdir -p assets/sprites/{player,enemies,tiles,items,particles}
unzip platformer-pack.zip -d assets/raw/

# 3. Integrar en pipeline actual de Mara Survivor
#   player → sprites/en/player_idle.png, player_run_0.png, etc.
#   tiles → assets/tiles/platform_surface.png, grass.png, water.png
```

---

### OPCIÓN B: CREAR SPRITES CON IA ⚠️ REQUIERE PIPELINE COMPLETO

#### Ventajas:
- **Customización total:** Diseñar cada sprite exactamente como se desea
- **Variación infinita:** Generar variantes procedimentales (enemigos, items)

#### Desventajas:
- **Tiempo:** 100% del desarrollo (prompt → generar → post-procesado → integrar)
- **Hardware:** VRAM 4-8GB mínimo para modelos GGUF ligeros (Hermes-3 8B)
- **Consistencia:** Requiere LoRA/fine-tuning para mantener estilo coherente
- **Calidad variable:** Sprites IA requieren post-procesado (outline, chroma-key)

#### Flujo de trabajo recomendado:
```bash
# 1. Configurar LM Studio con modelo GGUF (Hermes-3-Llama-3.1-8B-Q4_K_M)
# 2. Crear prompts estandarizados para cada categoría
# 3. Generar batchs de sprites (5-10 variantes por tipo)
# 4. Post-procesado: outline, chroma-key, resize a sprite sheet
# 5. Integrar en pipeline
```

---

## 🏆 RECOMENDACIÓN HÍBRIDA ⭐⭐⭐⚡ OPTIMAL

### Estrategia propuesta para Mara Survivor:

#### A. SPRITES CORE (JUGADOR, UI, HUD) → KENNEY + CUSTOM
```bash
# Usar Kenney para sprites principales
# Customizar ligeramente con post-procesado IA:
- Outlining consistente con tu paleta
- Chroma-key de fondos si necesario
- Variaciones mínimas (idle vs run)
```

#### B. SPRITES PROCEDURALES (ENEMIGOS, ITEMS, DECORACIÓN) → IA LIGERA
```bash
# Para contenido procedural o variante:
- Usar TinyLlama 1.1B para generación rápida de items
- Prompt estandarizado + seed consistente
- Batch generation en lugar de individual
```

#### C. TILES/LEVELS → GENERACIÓN PROCEDURAL (IA LIGERA)
```bash
# Para fondos, suelos, obstáculos:
- Generar con modelos pequeños (Qwen-VL 7B para análisis, TinyLlama para tiles simples)
- Procedural variation con seeds
```

---

## 💰 COSTE VRAM TIPO POR MODELO

| Modelo | Cuanto menos VRAM | Para qué sirve |
|--------|-------------------|----------------|
| **TinyLlama 1.1B** | ~2 GB | Generación rápida, items simples |
| **Hermes-3 8B (Q4_K_M)** | ~6 GB | Orquestación, prompts complejos |
| **Qwen-VL 7B (Q4_K_M)** | ~6 GB | Análisis de sprites, consistencia visual |
| **SegaGhost 2.9M** | ~1.5 GB | Generación sprite a sprite breeding (experimental) |

---

## 📦 RECURSOS ESPECÍFICOS PARA SPRITES PIXEL ART

### A. Sprites Plataformas (Player, Enemies)

#### Kenney Platformer Pack ⭐⭐⭐
- **Contenido:** 
  - Player sprites (idle, run, jump, fall, attack)
  - 6-8 enemigos básicos (robot, mushroom, alien, etc.)
  - Items: monedas, llaves, pociones
  - Tiles: suelo, plataformas, escaleras, bloques
- **Tamaño:** ~50MB compressed
- **Formato:** Spritesheets + PNG separados

**Link:** https://kenney.nl/assets/platformer-pack

---

### B. Sprites RPG/Dungeon (Items, Loot, UI)

#### Kenney Roguelike Pack ⭐⭐⭐
- **Contenido:**
  - Monstruos roguelike (8 tipos básicos)
  - Items: armas, pociones, scrolls, keys
  - Tiles dungeons (walls, floors, doors)
  - HUD elements (health bars, icons)
- **Licencia:** CC0 (comercial sin attribution)

**Link:** https://kenney.nl/assets/roguelike-pack

---

### C. Sprites Alternativos (Free/Open License)

#### OpenGameArt.org Platformer Art ⭐⭐
- **Pack "Pixel edition":** ~200MB, CC-BY
- **Pack "Redux":** Variante con más enemigos
- **Licencia:** Verificar cada pack (CC-BY requiere attribution)

**Link:** https://opengameart.org/content/platformer-art-pixel-edition

---

### D. Sprites Minimalistas

#### Kenney 1-Bit Platformer ⭐⭐
- **Estilo:** Monochrome, high-contrast
- **Ideal para:** Juegos abstractos/low-fi
- **Licencia:** CC0

**Link:** https://kenney-assets.itch.io/1-bit-platformer-pack

---

## 🎨 PALETA Y CONSISTENCIA VISUAL

### Problema común con sprites reutilizados:
- Sprites de packs diferentes tienen paletas distintas → inconsistencia visual

### Solución recomendada:
```python
# Post-procesado con IA para unificar paleta
from PIL import Image
import numpy as np

def unify_palette(source_sprite, target_palette):
    """Aplicar paleta objetivo a sprite fuente"""
    # Usar k-means + lookup table generation
    # Aplicar via image processing o modelo small CNN
    pass
```

### Opción alternativa: Fine-tuning ligero
- Entrenar LoRA con 10-20 sprites base de tu juego
- Generar nuevos assets coherentes con el fine-tuned model

---

## 📋 CHECKLIST DECISION

### Antes de usar Kenney:
- [ ] Descargar pack completo para evaluar estilo
- [ ] Verificar que animaciones key (run, jump) existen
- [ ] Comprobar que sprites son reutilizables (no requieren modding original)

### Antes de generar con IA:
- [ ] Configurar LM Studio con modelo GGUF adecuado
- [ ] Preparar prompts estandarizados por categoría
- [ ] Definir seed para consistencia procedural

### Para pipeline híbrido (recomendado):
- [ ] Descargar Kenney Platformer Pack (~50MB)
- [ ] Extraer sprites core player/enemies/tiles
- [ ] Configurar TinyLlama para generación de items variacionales
- [ ] Crear prompts batch generation para enemigos variants

---

## 💡 CONCLUSIÓN FINAL

**Para Mara Survivor, la estrategia óptima es:**

1. **Sprites principales (player, 2-3 enemigos base, tiles):**
   - ⭐⭐⭐ **Reutilizar Kenney Platformer Pack**
   - Customizar con post-procesado ligero (outline consistente)

2. **Items procedurales y variantes de enemigos:**
   - ⭐ Generar con TinyLlama 1.1B (2GB VRAM) o Hermes-3 8B si disponible

3. **Niveles/tiles para áreas procédurales:**
   - Generar proceduralmente con seeds, usar IA solo para consistencia visual

**Racional:** Menor tiempo de desarrollo + calidad prod-ready + flexibilidad para contenido procedimental.
