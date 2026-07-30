/**
 * Juice Effect - Partículas fluidas interativas com goo blur
 * Baseado em efeito de fluido viscoso com hover interaction
 */

class JuiceEffect {
  constructor(container, options = {}) {
    this.container = container;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];
    
    // Configurações
    this.options = {
      density: options.density || 35,
      particleColor: options.particleColor || "#7355F7",
      particleSize: options.particleSize || 12,
      speed: options.speed || 1.5,
      hoverEnabled: options.hoverEnabled !== false,
      hoverRadius: options.hoverRadius || 120,
      ...options
    };

    // Mouse tracking
    this.mouse = {
      x: -9999,
      y: -9999,
      prevX: -9999,
      prevY: -9999,
      speed: 0,
      active: false
    };

    this.setup();
    this.bindEvents();
    this.animate();
  }

  setup() {
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.filter = "blur(6px)";
    this.canvas.style.opacity = "0.8";
    
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    this.container.appendChild(this.canvas);

    this.resize();
    this.initParticles();

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.initParticles();
  }

  initParticles() {
    const count = Math.max(20, Math.min(300, Math.round(this.options.density * 3)));
    this.particles = [];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseSize: this.options.particleSize * (0.7 + Math.random() * 0.6),
        repX: 0,
        repY: 0,
        life: Math.random()
      });
    }
  }

  bindEvents() {
    this.container.addEventListener("mousemove", (e) => {
      const rect = this.container.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      
      if (this.mouse.prevX > -9999) {
        const ddx = mx - this.mouse.prevX;
        const ddy = my - this.mouse.prevY;
        this.mouse.speed = Math.sqrt(ddx * ddx + ddy * ddy);
      }
      
      this.mouse.prevX = mx;
      this.mouse.prevY = my;
      this.mouse.x = mx;
      this.mouse.y = my;
      this.mouse.active = true;
    });

    this.container.addEventListener("mouseleave", () => {
      this.mouse.active = false;
      this.mouse.x = -9999;
      this.mouse.y = -9999;
      this.mouse.speed = 0;
    });
  }

  animate = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    this.mouse.speed *= 0.92;
    
    const hovering = this.options.hoverEnabled && this.mouse.active;

    this.ctx.fillStyle = this.options.particleColor;
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Movimento suave
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy -= 0.002; // Gravidade leve

      // Hover repulsion
      if (hovering) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const distSq = dx * dx + dy * dy;
        const cutoff = this.options.hoverRadius;
        
        if (distSq > 0 && distSq < cutoff * cutoff) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const falloff = 1 - dist / cutoff;
          
          const push = falloff * this.mouse.speed * 0.08;
          p.repX += nx * push;
          p.repY += ny * push;
          
          const targetRepX = nx * (cutoff - dist) * 0.2;
          const targetRepY = ny * (cutoff - dist) * 0.2;
          p.repX += (targetRepX - p.repX) * 0.12;
          p.repY += (targetRepY - p.repY) * 0.12;
        }
      }

      if (!hovering) {
        p.repX *= 0.95;
        p.repY *= 0.95;
      }

      p.x += p.vx * this.options.speed;
      p.y += p.vy * this.options.speed;
      p.x += p.repX;
      p.y += p.repY;

      // Bounce nas bordas
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Draw particle
      const sizeVar = 0.8 + Math.sin(p.life * 0.05) * 0.2;
      const size = p.baseSize * sizeVar;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fill();

      p.life += 0.02;
    }

    requestAnimationFrame(this.animate);
  }
}

// Auto-init quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) {
    new JuiceEffect(heroVisual, {
      density: 28,
      particleColor: "rgba(115, 85, 247, 0.4)",
      particleSize: 14,
      speed: 1.2,
      hoverEnabled: true,
      hoverRadius: 140
    });
  }
});
