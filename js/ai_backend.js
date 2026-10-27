// js/ai_backend.js - Backend local para generación procedural de sprites con IA

const AI_BACKEND = {
  
  // Configuración del modelo - ADAPTAR A TU INSTALACIÓN LM STUDIO
  modelConfig: {
    modelName: "Llama-3-8B-Instruct-Q4_K_M.gguf", // CAMBIAR a tu modelo GGUF instalado en LM Studio
    temperature: 0.7,
    topP: 0.9,
    n_ctx: 2048,
  },
  
  // Endpoint local de LM Studio (o OpenCode CLI)
  endpoint: "http://localhost:1234/v1/chat/completions", // Verificar puerto en LM Studio
  
  // Generar sprite desde prompt con IA
  generateSprite: async function(prompt) {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.modelConfig.modelName,
          messages: [
            {
              role: "system",
              content: "You generate pixel art sprites in grid format (16xN characters where . is transparent). Return ONLY a JSON array of strings, no markdown formatting, no explanation text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: this.modelConfig.temperature,
          top_p: this.modelConfig.topP,
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parsear grid del output de LLM
      return this.parseGrid(content);
    } catch (error) {
      console.error("AI sprite generation failed:", error);
      return null; // Fallback a grid base si falla
    }
  },
  
  // Prompt template para enemigo
  enemyPrompt: function(type, features) {
    return `
      Generate a pixel art ${type} enemy for Mara Survivor, grid-based format (16x8 chars):
      - Style: retro synthwave palette (R=red, h=pink, w=white, k=gray, n=brown)
      - Features: ${features.join(", ")}
      - Format: 16 columns x 8 rows where . = transparent
      - Output: JSON array of strings ONLY (no markdown, no explanation text)
      Example format: ["..RRR.....", ".RhhhhhR..", ".........."]
    `;
  },
  
  // Prompt template para item
  itemPrompt: function(itemType) {
    return `
      Generate a ${itemType} item for Mara Survivor, grid-based format (16x8 chars):
      - Style: retro synthwave palette (R=red, G=green, B=blue, k=gray)
      - Features: simple icon + glow effect, clear symbol representing function
      - Format: 16 columns x 8 rows where . = transparent
      - Output: JSON array of strings ONLY (no markdown, no explanation text)
    `;
  },
  
  // Parsear output de LLM a grid
  parseGrid: function(content) {
    if (!content || typeof content !== 'string') return null;
    const clean = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) return null;
    
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse grid from LLM output:", e, content.substring(0, 100));
    }
    return null;
  }
};

window.AI_BACKEND = AI_BACKEND;

// Helper para Sprites (si no existe ya)
function Sprites_getFromGrid(gridRows) {
  if (!gridRows || !Array.isArray(gridRows)) return null;
  const h = gridRows.length;
  const w = gridRows[0] ? gridRows[0].length : 16;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  const palMap = (window.Sprites && window.Sprites.PAL) ? window.Sprites.PAL : {
    h: [27, 27, 36], k: [26, 24, 34], u: [139, 92, 246], s: [246, 203, 164],
    W: [244, 240, 255], w: [242, 242, 246], p: [201, 182, 238], S: [219, 158, 116],
    r: [244, 160, 168], R: [232, 64, 64], n: [90, 58, 26], g: [63, 174, 106],
    b: [60, 90, 166], d: [20, 20, 26]
  };
  
  for (let y = 0; y < h; y++) {
    const row = gridRows[y] || "";
    for (let x = 0; x < w; x++) {
      const ch = row[x] || ".";
      if (ch === ".") continue;
      
      const pal = palMap[ch] || palMap[ch.toLowerCase()] || [255, 255, 255]; // Fallback blanco
      ctx.fillStyle = `rgb(${pal[0]},${pal[1]},${pal[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  
  return c;
}

// Integrar con Sprites existente
if (window.Sprites) {
  window.Sprites.getFromGrid = Sprites_getFromGrid;
}
