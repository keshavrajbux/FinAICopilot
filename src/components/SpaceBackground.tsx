import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

interface Asteroid {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  driftX: number;
  driftY: number;
  vertices: { angle: number; radius: number }[];
  opacity: number;
  color: string;
}

interface Planet {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  glowColor: string;
  glowIntensity: number;
  hasRing: boolean;
  ringColor: string;
  ringTilt: number;
  rotationPhase: number;
  driftSpeed: number;
  driftAngle: number;
}

interface Moon {
  planetIndex: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  size: number;
  color: string;
}

interface Comet {
  x: number;
  y: number;
  speed: number;
  angle: number;
  tailLength: number;
  size: number;
  opacity: number;
  particles: { offsetX: number; offsetY: number; size: number; opacity: number }[];
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color1: string;
  color2: string;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
}

// Pre-computed constellation connection for O(1) drawing
interface ConstellationLine {
  star1Index: number;
  star2Index: number;
  opacity: number;
}

const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const constellationsRef = useRef<ConstellationLine[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const planetsRef = useRef<Planet[]>([]);
  const moonsRef = useRef<Moon[]>([]);
  const cometsRef = useRef<Comet[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Color palettes for cosmic objects
    const planetColors = [
      { color1: '#6366f1', color2: '#4338ca', glow: '#818cf8' }, // Indigo
      { color1: '#8b5cf6', color2: '#6d28d9', glow: '#a78bfa' }, // Purple
      { color1: '#ec4899', color2: '#be185d', glow: '#f472b6' }, // Pink
      { color1: '#06b6d4', color2: '#0891b2', glow: '#22d3ee' }, // Cyan
      { color1: '#f97316', color2: '#c2410c', glow: '#fb923c' }, // Orange (gas giant)
      { color1: '#10b981', color2: '#047857', glow: '#34d399' }, // Emerald
    ];

    const asteroidColors = [
      '#4a4a5a', '#5a5a6a', '#6a6a7a', '#3a3a4a', '#7a7a8a'
    ];

    // Pre-compute constellation connections once (O(n²) but only on init)
    const computeConstellations = () => {
      const connectionDistance = 120;
      const maxConnections = 50;
      constellationsRef.current = [];

      for (let i = 0; i < starsRef.current.length && constellationsRef.current.length < maxConnections; i++) {
        for (let j = i + 1; j < starsRef.current.length && constellationsRef.current.length < maxConnections; j++) {
          const star1 = starsRef.current[i];
          const star2 = starsRef.current[j];
          const dx = star1.x - star2.x;
          const dy = star1.y - star2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance && ((i * j) % 47 === 0)) {
            const opacity = (1 - distance / connectionDistance) * 0.12;
            constellationsRef.current.push({
              star1Index: i,
              star2Index: j,
              opacity,
            });
          }
        }
      }
    };

    // Initialize asteroids
    const initAsteroids = () => {
      const asteroidCount = prefersReducedMotion ? 5 : 12;
      asteroidsRef.current = [];

      for (let i = 0; i < asteroidCount; i++) {
        const vertexCount = Math.floor(Math.random() * 4) + 6; // 6-9 vertices
        const vertices = [];
        for (let v = 0; v < vertexCount; v++) {
          vertices.push({
            angle: (v / vertexCount) * Math.PI * 2,
            radius: 0.7 + Math.random() * 0.6, // Irregular shape
          });
        }

        asteroidsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 20 + 10,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.01,
          driftX: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.3,
          driftY: prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.3,
          vertices,
          opacity: Math.random() * 0.4 + 0.3,
          color: asteroidColors[Math.floor(Math.random() * asteroidColors.length)],
        });
      }
    };

    // Initialize planets
    const initPlanets = () => {
      planetsRef.current = [];
      const planetCount = 3;

      // Predefined positions to avoid overlap with main content
      const positions = [
        { x: 0.08, y: 0.15 },  // Top left
        { x: 0.92, y: 0.75 },  // Bottom right
        { x: 0.85, y: 0.12 },  // Top right
      ];

      for (let i = 0; i < planetCount; i++) {
        const colorSet = planetColors[Math.floor(Math.random() * planetColors.length)];
        const hasRing = Math.random() > 0.5;

        planetsRef.current.push({
          x: positions[i].x * canvas.width,
          y: positions[i].y * canvas.height,
          radius: Math.random() * 40 + 30,
          color1: colorSet.color1,
          color2: colorSet.color2,
          glowColor: colorSet.glow,
          glowIntensity: Math.random() * 0.3 + 0.2,
          hasRing,
          ringColor: hasRing ? `${colorSet.glow}40` : '',
          ringTilt: Math.random() * 0.3 + 0.1,
          rotationPhase: Math.random() * Math.PI * 2,
          driftSpeed: prefersReducedMotion ? 0 : Math.random() * 0.1 + 0.05,
          driftAngle: Math.random() * Math.PI * 2,
        });
      }
    };

    // Initialize moons
    const initMoons = () => {
      moonsRef.current = [];

      planetsRef.current.forEach((planet, planetIndex) => {
        const moonCount = Math.floor(Math.random() * 2) + 1; // 1-2 moons per planet
        for (let i = 0; i < moonCount; i++) {
          moonsRef.current.push({
            planetIndex,
            orbitRadius: planet.radius * (1.8 + Math.random() * 0.8),
            orbitSpeed: prefersReducedMotion ? 0 : (Math.random() * 0.5 + 0.3) * (Math.random() > 0.5 ? 1 : -1),
            orbitPhase: Math.random() * Math.PI * 2,
            size: Math.random() * 6 + 4,
            color: '#c4c4d4',
          });
        }
      });
    };

    // Initialize nebulae
    const initNebulae = () => {
      nebulaeRef.current = [
        {
          x: canvas.width * 0.7,
          y: canvas.height * 0.25,
          radius: canvas.width * 0.35,
          color1: 'rgba(99, 102, 241, 0.12)',
          color2: 'rgba(139, 92, 246, 0.06)',
          opacity: 1,
          pulseSpeed: 0.0005,
          pulsePhase: 0,
        },
        {
          x: canvas.width * 0.15,
          y: canvas.height * 0.8,
          radius: canvas.width * 0.3,
          color1: 'rgba(236, 72, 153, 0.1)',
          color2: 'rgba(167, 139, 250, 0.05)',
          opacity: 1,
          pulseSpeed: 0.0007,
          pulsePhase: Math.PI,
        },
        {
          x: canvas.width * 0.5,
          y: canvas.height * 0.5,
          radius: canvas.width * 0.25,
          color1: 'rgba(6, 182, 212, 0.08)',
          color2: 'rgba(16, 185, 129, 0.04)',
          opacity: 1,
          pulseSpeed: 0.0006,
          pulsePhase: Math.PI / 2,
        },
      ];
    };

    // Set canvas size and reinitialize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      computeConstellations();
      initAsteroids();
      initPlanets();
      initMoons();
      initNebulae();
    };

    // Initialize stars
    const initStars = () => {
      const baseDensity = prefersReducedMotion ? 5000 : 3000;
      const starCount = Math.floor((canvas.width * canvas.height) / baseDensity);
      starsRef.current = [];

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.02 + 0.01,
          twinkleSpeed: prefersReducedMotion ? 0 : Math.random() * 0.03 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Create shooting star occasionally
    const maybeCreateShootingStar = () => {
      if (prefersReducedMotion) return;
      if (Math.random() < 0.002 && shootingStarsRef.current.length < 3) {
        shootingStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.5,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 4,
          opacity: 1,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        });
      }
    };

    // Create comet occasionally
    const maybeCreateComet = () => {
      if (prefersReducedMotion) return;
      if (Math.random() < 0.0005 && cometsRef.current.length < 1) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
          particles.push({
            offsetX: Math.random() * 30 - 15,
            offsetY: Math.random() * 60,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
          });
        }

        cometsRef.current.push({
          x: -50,
          y: Math.random() * canvas.height * 0.4,
          speed: Math.random() * 1.5 + 1,
          angle: Math.PI / 6 + (Math.random() - 0.5) * 0.2,
          tailLength: 150,
          size: Math.random() * 8 + 6,
          opacity: 1,
          particles,
        });
      }
    };

    // Draw gradient background
    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );

      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.3, '#0d0d20');
      gradient.addColorStop(0.6, '#0a0a18');
      gradient.addColorStop(1, '#050510');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw animated nebulae
    const drawNebulae = (time: number) => {
      nebulaeRef.current.forEach((nebula) => {
        const pulse = prefersReducedMotion ? 1 : 0.8 + Math.sin(time * nebula.pulseSpeed + nebula.pulsePhase) * 0.2;

        const nebulaGradient = ctx.createRadialGradient(
          nebula.x,
          nebula.y,
          0,
          nebula.x,
          nebula.y,
          nebula.radius * pulse
        );

        nebulaGradient.addColorStop(0, nebula.color1);
        nebulaGradient.addColorStop(0.5, nebula.color2);
        nebulaGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
    };

    // Draw planets with atmospheric glow
    const drawPlanets = (time: number) => {
      planetsRef.current.forEach((planet, index) => {
        // Subtle drift animation
        const driftX = prefersReducedMotion ? 0 : Math.sin(time * 0.0003 + index) * 5;
        const driftY = prefersReducedMotion ? 0 : Math.cos(time * 0.0002 + index) * 3;
        const x = planet.x + driftX;
        const y = planet.y + driftY;

        // Outer glow (atmosphere)
        const glowGradient = ctx.createRadialGradient(
          x, y, planet.radius * 0.8,
          x, y, planet.radius * 2
        );
        glowGradient.addColorStop(0, `${planet.glowColor}40`);
        glowGradient.addColorStop(0.5, `${planet.glowColor}15`);
        glowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(x, y, planet.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw ring behind planet if tilted back
        if (planet.hasRing) {
          drawPlanetRing(ctx, x, y, planet, true);
        }

        // Planet body gradient
        const bodyGradient = ctx.createRadialGradient(
          x - planet.radius * 0.3,
          y - planet.radius * 0.3,
          0,
          x,
          y,
          planet.radius
        );
        bodyGradient.addColorStop(0, planet.color1);
        bodyGradient.addColorStop(0.7, planet.color2);
        bodyGradient.addColorStop(1, '#1a1a2e');

        ctx.beginPath();
        ctx.fillStyle = bodyGradient;
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Surface details (bands for gas giants)
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.clip();

        // Horizontal bands
        for (let i = 0; i < 5; i++) {
          const bandY = y - planet.radius + (planet.radius * 2 / 5) * i + planet.radius * 0.2;
          ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.sin(i + planet.rotationPhase) * 0.05})`;
          ctx.fillRect(x - planet.radius, bandY, planet.radius * 2, planet.radius * 0.15);
        }
        ctx.restore();

        // Inner highlight
        const highlightGradient = ctx.createRadialGradient(
          x - planet.radius * 0.4,
          y - planet.radius * 0.4,
          0,
          x,
          y,
          planet.radius
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        highlightGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = highlightGradient;
        ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw ring in front of planet
        if (planet.hasRing) {
          drawPlanetRing(ctx, x, y, planet, false);
        }
      });
    };

    // Draw planet ring
    const drawPlanetRing = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      planet: Planet,
      behind: boolean
    ) => {
      const innerRadius = planet.radius * 1.3;
      const outerRadius = planet.radius * 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, planet.ringTilt);

      // Only draw the appropriate half
      ctx.beginPath();
      if (behind) {
        ctx.arc(0, 0, outerRadius, Math.PI, Math.PI * 2);
        ctx.arc(0, 0, innerRadius, Math.PI * 2, Math.PI, true);
      } else {
        ctx.arc(0, 0, outerRadius, 0, Math.PI);
        ctx.arc(0, 0, innerRadius, Math.PI, 0, true);
      }
      ctx.closePath();

      const ringGradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
      ringGradient.addColorStop(0, `${planet.glowColor}60`);
      ringGradient.addColorStop(0.5, `${planet.glowColor}30`);
      ringGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = ringGradient;
      ctx.fill();
      ctx.restore();
    };

    // Draw moons orbiting planets
    const drawMoons = (time: number) => {
      moonsRef.current.forEach((moon) => {
        const planet = planetsRef.current[moon.planetIndex];
        if (!planet) return;

        const driftX = prefersReducedMotion ? 0 : Math.sin(time * 0.0003 + moon.planetIndex) * 5;
        const driftY = prefersReducedMotion ? 0 : Math.cos(time * 0.0002 + moon.planetIndex) * 3;

        const orbitAngle = prefersReducedMotion
          ? moon.orbitPhase
          : moon.orbitPhase + time * moon.orbitSpeed * 0.001;

        const moonX = planet.x + driftX + Math.cos(orbitAngle) * moon.orbitRadius;
        const moonY = planet.y + driftY + Math.sin(orbitAngle) * moon.orbitRadius * 0.4; // Elliptical orbit

        // Moon glow
        const glowGradient = ctx.createRadialGradient(
          moonX, moonY, 0,
          moonX, moonY, moon.size * 2
        );
        glowGradient.addColorStop(0, 'rgba(200, 200, 220, 0.3)');
        glowGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(moonX, moonY, moon.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Moon body
        const bodyGradient = ctx.createRadialGradient(
          moonX - moon.size * 0.3,
          moonY - moon.size * 0.3,
          0,
          moonX,
          moonY,
          moon.size
        );
        bodyGradient.addColorStop(0, '#e4e4ec');
        bodyGradient.addColorStop(0.7, moon.color);
        bodyGradient.addColorStop(1, '#8a8a9a');

        ctx.beginPath();
        ctx.fillStyle = bodyGradient;
        ctx.arc(moonX, moonY, moon.size, 0, Math.PI * 2);
        ctx.fill();

        // Crater details
        ctx.fillStyle = 'rgba(100, 100, 110, 0.3)';
        ctx.beginPath();
        ctx.arc(moonX + moon.size * 0.2, moonY + moon.size * 0.1, moon.size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX - moon.size * 0.3, moonY - moon.size * 0.2, moon.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Draw asteroids
    const drawAsteroids = (_time: number) => {
      asteroidsRef.current.forEach((asteroid) => {
        // Update position with drift
        asteroid.x += asteroid.driftX;
        asteroid.y += asteroid.driftY;
        asteroid.rotation += asteroid.rotationSpeed;

        // Wrap around screen
        if (asteroid.x < -50) asteroid.x = canvas.width + 50;
        if (asteroid.x > canvas.width + 50) asteroid.x = -50;
        if (asteroid.y < -50) asteroid.y = canvas.height + 50;
        if (asteroid.y > canvas.height + 50) asteroid.y = -50;

        // Parallax effect
        const parallaxMultiplier = prefersReducedMotion ? 0 : 0.02;
        const parallaxX = (mouseRef.current.x - canvas.width / 2) * parallaxMultiplier;
        const parallaxY = (mouseRef.current.y - canvas.height / 2) * parallaxMultiplier;

        const x = asteroid.x + parallaxX;
        const y = asteroid.y + parallaxY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(asteroid.rotation);

        // Draw irregular asteroid shape
        ctx.beginPath();
        asteroid.vertices.forEach((vertex, i) => {
          const vx = Math.cos(vertex.angle) * asteroid.size * vertex.radius;
          const vy = Math.sin(vertex.angle) * asteroid.size * vertex.radius;
          if (i === 0) {
            ctx.moveTo(vx, vy);
          } else {
            ctx.lineTo(vx, vy);
          }
        });
        ctx.closePath();

        // Asteroid gradient
        const gradient = ctx.createRadialGradient(
          -asteroid.size * 0.3,
          -asteroid.size * 0.3,
          0,
          0,
          0,
          asteroid.size
        );
        gradient.addColorStop(0, asteroid.color);
        gradient.addColorStop(0.7, '#3a3a4a');
        gradient.addColorStop(1, '#2a2a3a');

        ctx.fillStyle = gradient;
        ctx.globalAlpha = asteroid.opacity;
        ctx.fill();

        // Subtle outline
        ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Crater details
        ctx.fillStyle = 'rgba(30, 30, 40, 0.4)';
        ctx.beginPath();
        ctx.arc(asteroid.size * 0.2, asteroid.size * 0.1, asteroid.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-asteroid.size * 0.25, -asteroid.size * 0.15, asteroid.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
      });
    };

    // Draw comets
    const drawComets = () => {
      if (prefersReducedMotion) {
        cometsRef.current = [];
        return;
      }

      cometsRef.current = cometsRef.current.filter((comet) => {
        comet.x += Math.cos(comet.angle) * comet.speed;
        comet.y += Math.sin(comet.angle) * comet.speed;

        // Remove if off screen
        if (comet.x > canvas.width + 200 || comet.y > canvas.height + 200) {
          return false;
        }

        // Draw tail particles
        comet.particles.forEach((particle) => {
          const px = comet.x - Math.cos(comet.angle) * particle.offsetY + particle.offsetX;
          const py = comet.y - Math.sin(comet.angle) * particle.offsetY + particle.offsetX * 0.3;

          ctx.beginPath();
          ctx.fillStyle = `rgba(180, 200, 255, ${particle.opacity * comet.opacity})`;
          ctx.arc(px, py, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw tail gradient
        const tailGradient = ctx.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - Math.cos(comet.angle) * comet.tailLength,
          comet.y - Math.sin(comet.angle) * comet.tailLength
        );
        tailGradient.addColorStop(0, `rgba(200, 220, 255, ${comet.opacity * 0.8})`);
        tailGradient.addColorStop(0.3, `rgba(150, 180, 255, ${comet.opacity * 0.4})`);
        tailGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.strokeStyle = tailGradient;
        ctx.lineWidth = comet.size * 0.8;
        ctx.lineCap = 'round';
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(
          comet.x - Math.cos(comet.angle) * comet.tailLength,
          comet.y - Math.sin(comet.angle) * comet.tailLength
        );
        ctx.stroke();

        // Draw comet head glow
        const headGlow = ctx.createRadialGradient(
          comet.x, comet.y, 0,
          comet.x, comet.y, comet.size * 3
        );
        headGlow.addColorStop(0, `rgba(220, 240, 255, ${comet.opacity})`);
        headGlow.addColorStop(0.3, `rgba(180, 200, 255, ${comet.opacity * 0.5})`);
        headGlow.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = headGlow;
        ctx.arc(comet.x, comet.y, comet.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw comet head
        ctx.beginPath();
        ctx.fillStyle = `rgba(240, 250, 255, ${comet.opacity})`;
        ctx.arc(comet.x, comet.y, comet.size, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });
    };

    // Draw stars with twinkle effect
    const drawStars = (time: number) => {
      starsRef.current.forEach((star) => {
        const twinkle = prefersReducedMotion ? 0 : Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const currentOpacity = star.opacity * (0.6 + twinkle * 0.4);

        const parallaxMultiplier = prefersReducedMotion ? 0 : 0.05;
        const parallaxX = (mouseRef.current.x - canvas.width / 2) * star.speed * parallaxMultiplier;
        const parallaxY = (mouseRef.current.y - canvas.height / 2) * star.speed * parallaxMultiplier;

        const x = star.x + parallaxX;
        const y = star.y + parallaxY;

        // Draw star glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        gradient.addColorStop(0.3, `rgba(200, 220, 255, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    // Draw shooting stars
    const drawShootingStars = () => {
      if (prefersReducedMotion) {
        shootingStarsRef.current = [];
        return;
      }

      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.015;

        if (star.opacity <= 0) return false;

        const gradient = ctx.createLinearGradient(
          star.x,
          star.y,
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(0.3, `rgba(200, 220, 255, ${star.opacity * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        );
        ctx.stroke();

        // Glow effect at head
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 8);
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });
    };

    // Draw pre-computed constellation connections - O(n) instead of O(n²)
    const drawConstellations = () => {
      ctx.lineWidth = 0.5;

      constellationsRef.current.forEach((connection) => {
        const star1 = starsRef.current[connection.star1Index];
        const star2 = starsRef.current[connection.star2Index];

        if (star1 && star2) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${connection.opacity})`;
          ctx.beginPath();
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
          ctx.stroke();
        }
      });
    };

    // Draw space dust particles (tiny floating specks)
    const drawSpaceDust = (time: number) => {
      if (prefersReducedMotion) return;

      const dustCount = 50;
      for (let i = 0; i < dustCount; i++) {
        const x = ((i * 137.5 + time * 0.01) % canvas.width);
        const y = ((i * 89.3 + time * 0.005) % canvas.height);
        const size = (i % 3) * 0.3 + 0.3;
        const opacity = 0.1 + (i % 5) * 0.05;

        ctx.beginPath();
        ctx.fillStyle = `rgba(180, 180, 200, ${opacity})`;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Animation loop
    const startTime = Date.now();
    const animate = () => {
      const time = Date.now() - startTime;

      drawBackground();
      drawNebulae(time);
      drawSpaceDust(time);
      drawConstellations();
      drawPlanets(time);
      drawMoons(time);
      drawAsteroids(time);
      drawStars(time);
      maybeCreateShootingStar();
      drawShootingStars();
      maybeCreateComet();
      drawComets();

      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse move handler for parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (!prefersReducedMotion) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={-1}
      overflow="hidden"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default SpaceBackground;
