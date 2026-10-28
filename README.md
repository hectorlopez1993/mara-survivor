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

## 🎮 Controles

- **WASD** - Movimiento del jugador
- **Mouse** - Apuntar y atacar
- **Espacio** - Saltar / Defender
- **Click Izquierdo** - Atacar
- **Tab** - Abrir menú
- **R** - Reiniciar nivel

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
