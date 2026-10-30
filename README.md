# Mara Survivor - Pixel Art Game with AI Integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pixel Art](https://img.shields.io/badge/Art%20Style-Pixel%20Art-blue)]()
[![AI Powered](https://img.shields.io/badge/AI-Integrated-green)]()

<div align="center">

**Un juego de aventura pixel art con inteligencia artificial para NPCs y generación procedimental**

[![Demo](https://img.shields.io/badge/Demo-Available-blue)](#)

</div>

## 🎮 Descripción del Proyecto

Mara Survivor es un juego de aventura en tiempo real con arte pixel art, que combina técnicas modernas de inteligencia artificial para crear NPCs con comportamiento emergente, generación procedimental de sprites y sistemas de diálogo inteligentes.

### Características Principales

- 🎨 **Arte Pixel Art** - Estética retro con animaciones fluidas
- 🤖 **IA para NPCs** - Comportamiento emergente usando modelos ligeros (GGUF)
- 🔄 **Generación Procedimental** - Sprites y items generados dinámicamente
- 💬 **Sistema de Diálogo** - IA integrada para interacciones inteligentes
- ⚔️ **Combate en Tiempo Real** - Múltiples armas y mejoras progresivas
- 🏆 **Progresión Infinita** - Niveles infinitos con dificultad escalable

## 🎬 Directo infinito (progresión entre partidas)

Cada victoria sube un **nivel de directo** que se guarda en el navegador y **nunca baja**.
La siguiente partida es más dura: +25 % de vida enemiga, +4 % de velocidad, +6 % de daño
y de frecuencia de aparición, y +15 % de Bits para compensar. Los topes de velocidad,
daño y enemigos vivos evitan que un nivel alto congele el juego.

- **Biomas en ciclo de 3**: Cabaña → Oficina → Plató → Cabaña… El nivel 0 siempre es la
  cabaña de Mara (suelo de madera, alfombra y peluches tirados); la oficina y el plató
  traen sus propios props (escritorio, cámara, trípode, foco).
- **Enemigos nuevos por nivel**: el **Hater** (nivel 1) dispara dislikes, el **Reclutador**
  (nivel 2) embiste, la **Influencer** (nivel 3) acelera a los enemigos cercanos.
- **Jefa final nueva**: desde el nivel 2, la **Pelirroja** sustituye a la Burocracia como
  jefa final (la Burocracia pasa al minuto 12). Es un homenaje/parodia a la streamer
  **Zeling**: usa solo coletillas públicas de sus clips ("NO ME VAN A MATAR, SOY MUY BUENA
  EN ESTO", "¿QUÉ COJONES ES ESTO?", "ESTO NO ES UN BAIT, ES CONTENIDO"). Sin polémicas.
- **Armas desbloqueables en la tienda**: **Táper de mamá** (arco + comida que ralentiza),
  **Vaso de alcohol** (charco que termina en llamas) y **Lanza de corazones** (estocada +
  corazones teledirigidos).
- **Alejandro** empieza con el Táper, siempre activo; ya no depende de que aparezca el
  compañero. Si lleva el arma "Alejandro", quien aparece es Mara con flashes de cámara.
- **Tienda con pestañas**: MEJORAS (13 filas, incluida la **Maldición del Chat**: más
  dificultad a cambio de más Bits y XP) y ARSENAL (Alejandro + las tres armas nuevas).

## 🛠️ Tecnologías

### Frontend
- HTML5 Canvas
- Vanilla JavaScript ES6+
- CSS3 con animaciones

### Backend AI (Opcional)
- Modelos GGUF ejecutables en LM Studio
- Integración con APIs locales de IA

### Frameworks de IA
- Ara Canan - NPC comportamiento emergente
- Procedural Generation - Sprites generativos
- Pathfinding AI - Navegación inteligente

## 📦 Instalación

### Requisitos

- Node.js v16+ (recomendado)
- LM Studio con modelos GGUF (para features de IA)

### Clonar y Ejecutar

```bash
git clone https://github.com/TU_USUARIO/mara-survivor.git
cd mara-survivor
npm install  # Si hay dependencias

# Abrir en navegador
open index.html
```

### Subir a OVH (hosting compartido con PHP)

El juego es estático y funciona sin servidor, pero el **ranking online** necesita PHP:

1. Sube el proyecto completo por FTP (incluye `api/`).
2. Da permisos de escritura a `api/data/` (`chmod 755` o `775`).
3. Abre la web: el ranking se detecta solo. Si el API falla, el juego sigue en modo local.

Archivos que genera el ranking en tiempo de ejecución (no se suben al repo):
`api/data/scores.php`, `api/data/rate.php` y `api/data/.lock`.

El API limita el nombre a 16 caracteres, la duración a 16 minutos, las bajas a 20 000,
el nivel de directo a 0–999, y permite un envío cada 6 segundos por IP. La tabla muestra
el distintivo `D#N` con el nivel de directo de cada marca; las marcas antiguas valen `D#0`.

## 🎮 Controles

- **WASD / flechas** - Moverte
- **Ataque** - Automático (apuntas con el movimiento)
- **1 / 2 / 3** - Elegir mejora al subir de nivel
- **R / S** - Reroll / saltar en la pantalla de mejora
- **M** - Silenciar sonido
- **ESC** - Pausa

## 🤖 Configuración de IA (Opcional)

Para habilitar las capacidades de IA, configura LM Studio con los siguientes modelos:

### Modelos Sugeridos

| Rol | Modelo Recomendado | VRAM |
|-----|-------------------|------|
| Orquestador | Llama-3.2-3B-Instruct | ~3.5GB |
| Frontend/UI | Phi-3-mini-4k-instruct | ~2.3GB |
| Backend API | Gemma-2-9B-it-Q4_K_M | ~7GB |
| QA Testing | Zephyr-7b-beta | ~5GB |
| Security | TinyLlama-1.1B-Chat | ~1.5GB |

### Configurar LM Studio

1. Abre LM Studio → Browse models
2. Descarga modelos `.gguf` desde HuggingFace
3. Coloca en: `~/.lm-studio/models/` o `C:\LM_Studio\models\`
4. Configura vía `.env.local` (ver archivo AGENTS.md)

## 📁 Estructura del Proyecto

```
Mara Survivor/
├── index.html              # Punto de entrada
├── css/                    # Estilos
│   └── style.css
├── js/                     # Scripts del juego
│   ├── game.js            # Lógica principal del juego
│   ├── player.js          # Jugador y movimientos
│   ├── enemies.js         # Sistema de enemigos
│   ├── enemy_generator.js | Generación procedimental
│   ├── sprites.js         # Gestión de sprites
│   ├── particles.js       # Efectos visuales
│   ├── emotes.js          # Expresiones faciales
│   ├── ui.js              # Interfaz de usuario
│   ├── weapons.js         | Sistema de armas
│   ├── upgrades.js        | Mejoras y progresión
│   ├── ai_backend.js      | Integración IA
│   └── audio.js           | Sistema de audio
├── assets/                 # Recursos
│   ├── emotes/            | Expresiones faciales
│   └── sprites/           | Sprites del juego
├── tests/                  | Pruebas QA
│   ├── qa-test.html       | Test suite principal
│   ├── qa-player.html     | Tests de jugador
│   ├── qa-sprites.html    | Tests de sprites
│   └── out/               | Capturas de pruebas
├── research/               | Investigación
│   ├── pixel_art_games.md | Benchmark de juegos similares
│   └── assets_comparison.md| Análisis de recursos
├── AGENTS.md              # Sistema multi-agente
└── README_IA.md           | Documentación técnica IA
```

## 🧪 Pruebas y QA

El proyecto incluye un sistema completo de pruebas:

- **Smoke Tests** - Verificación básica de funcionalidad
- **Visual Regression** - Comparación de capturas de pantalla
- **AI Validation** - Pruebas de generación procedimental
- **Performance** - Análisis de rendimiento con IA activada

```bash
npm test  # Ejecutar todas las pruebas
npm run visual:regression  # Tests visuales
```

## 📊 Benchmarks y Referencias

### Juegos Pixel Art con IA Investigados

- [Ara Canan](https://github.com/AraCanan) - NPC con comportamiento emergente
- [Procedural Generation](https://github.com/karpiuk/ai-art-gen) - Sprites generativos
- [AI Pathfinding](https://github.com/broderickwu/ai-pathfinding) - Navegación inteligente

### Recursos de Sprites Reutilizados

- [OpenGameArt.org](https://opengameart.org) - Sprites CC0/CC-BY
- [Kenney.nl Assets](https://kenney.nl/assets) - Plataformas MIT
- [itch.io Game Assets](https://itch.io/game-assets) - Pixel art variado

## 🔒 Seguridad

### Archivos Sensibles (NO SUBIR A GITHUB)

El proyecto incluye un sistema de agents con configuraciones que **NUNCA** deben subirirse:

- `.env` - Variables de entorno con claves API
- `AGENTS.md` - Configuración detallada de modelos IA
- Cualquier archivo con credenciales o contraseñas

**Nota:** La documentación técnica (`README_IA.md`) es segura y contiene información pública sobre la arquitectura del sistema.

## 📄 Licencia

Este proyecto está disponible bajo la licencia MIT.

```text
Copyright (c) 2026 Mara Survivor Development

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una branch (`git checkout -b feature/nueva-feature`)
3. Commit de cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la branch (`git push origin feature/nueva-feature`)
5. Abrir Pull Request

## 📞 Contacto

Para consultas o reportes de bugs, abre un issue en el repositorio.

---

**¡Disfruta de Mara Survivor!** 🎮✨
