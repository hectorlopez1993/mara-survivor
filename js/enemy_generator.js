// js/enemy_generator.js - Generador procedural de enemigos con IA

window.EnemyGenerator = {
  
  // Generar enemigo desde prompt de LLM
  generateFromPrompt: async function(type, features) {
    const backend = window.AI_BACKEND;
    if (!backend) {
      console.warn("AI_BACKEND not loaded, using fallback grid");
      return { type, grid: this.getBaseGrid(type) };
    }
    
    const prompt = backend.enemyPrompt(type, features || ["antenna", "glowing eyes"]);
    const gridData = await backend.generateSprite(prompt);
    
    if (gridData && Array.isArray(gridData)) {
      return { type, grid: gridData };
    } else {
      // Fallback a grid base si falla la generación IA
      console.log("Using fallback grid for", type);
      return { type, grid: this.getBaseGrid(type) };
    }
  },
  
  // Obtener grids base (enemigos por defecto)
  getBaseGrid: function(type) {
    const grids = {
      "robot_basic": [
        "..RRR.....",
        ".RhhhhhR..",
        ".R...h...R",
        ".R......hR.",
        ".R......hR.",
        ".R...h...R",
        ".RhhhhhR..",
        "..........",
      ],
      "zombie_basic": [
        "..nnn.....",
        ".nnnnnnn..",
        ".nnNNNnn..",
        "..nnnnnn..",
        ".nnnnnnn..",
        "n.n...n.n.",
        "n......n.n",
        "..........",
      ],
      "goblin_basic": [
        "..kkk.....",
        ".kkk.kkk..",
        ".k..n...k.",
        ".k...n...k.",
        ".k..n...k.",
        ".kkk.kkk..",
        "..kkk.....",
        "..........",
      ],
    };
    return grids[type] || grids["robot_basic"];
  },
  
  // Obtener array de enemigos base para inicialización
  getBaseEnemies: function() {
    return [
      { name: "robot_basic", grid: this.getBaseGrid("robot_basic") },
      { name: "zombie_basic", grid: this.getBaseGrid("zombie_basic") },
      { name: "goblin_basic", grid: this.getBaseGrid("goblin_basic") },
    ];
  }
};
