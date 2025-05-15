import { useEffect, useRef, useState } from 'react';
import { Box, styled, Typography } from '@mui/material';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  emoji: string;
}

const BOID_COUNT = 50;
const SEPARATION_RADIUS = 80;
const ALIGNMENT_RADIUS = 80;
const COHESION_RADIUS = 60;
const MAX_SPEED = 5;
const MAX_FORCE = 0.2;
const EMOJI_SIZE = 48;

const EMOJIS = ['🤖', '🦾', '🔧', '⚙️'];

// Simpler DPI scaling helper
const getDpiScale = (): number => window.devicePixelRatio || 1;

const StageContainer = styled(Box)({
  width: '100%',
  height: '100vh',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
  position: 'relative',
  overflow: 'hidden',
});

const CenteredText = styled(Typography)({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'rgba(255, 255, 255, 0.9)',
  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  userSelect: 'none',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  fontSize: '3rem',
  padding: '1rem 2rem',
  borderRadius: '12px',
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
});

export function PromptingStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const boidsRef = useRef<Boid[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const initializeBoids = () => {
    const boids: Boid[] = [];

    for (let i = 0; i < BOID_COUNT; i++) {
      boids.push({
        x: Math.random() * containerSize.width,
        y: Math.random() * containerSize.height,
        vx: (Math.random() - 0.5) * MAX_SPEED * 2, // More varied initial velocities
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
        rotation: Math.random() * 360,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)]
      });
    }
    boidsRef.current = boids;
  };

  const updateBoid = (boid: Boid, boids: Boid[]) => {
    // Separation
    let separationX = 0;
    let separationY = 0;
    let separationCount = 0;

    // Alignment
    let alignmentX = 0;
    let alignmentY = 0;
    let alignmentCount = 0;

    // Cohesion
    let cohesionX = 0;
    let cohesionY = 0;
    let cohesionCount = 0;

    boids.forEach((other) => {
      if (other === boid) return;

      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Separation
      if (distance < SEPARATION_RADIUS) {
        separationX -= dx / distance;
        separationY -= dy / distance;
        separationCount++;
      }

      // Alignment
      if (distance < ALIGNMENT_RADIUS) {
        alignmentX += other.vx;
        alignmentY += other.vy;
        alignmentCount++;
      }

      // Cohesion
      if (distance < COHESION_RADIUS) {
        cohesionX += other.x;
        cohesionY += other.y;
        cohesionCount++;
      }
    });

    // Apply separation
    if (separationCount > 0) {
      const force = MAX_FORCE * 1.5;
      boid.vx += (separationX / separationCount) * force;
      boid.vy += (separationY / separationCount) * force;
    }

    // Apply alignment
    if (alignmentCount > 0) {
      alignmentX /= alignmentCount;
      alignmentY /= alignmentCount;
      boid.vx += (alignmentX - boid.vx) * MAX_FORCE;
      boid.vy += (alignmentY - boid.vy) * MAX_FORCE;
    }

    // Apply cohesion
    if (cohesionCount > 0) {
      cohesionX = cohesionX / cohesionCount - boid.x;
      cohesionY = cohesionY / cohesionCount - boid.y;
      const distance = Math.sqrt(cohesionX * cohesionX + cohesionY * cohesionY);
      if (distance > 0) {
        boid.vx += (cohesionX / distance) * MAX_FORCE;
        boid.vy += (cohesionY / distance) * MAX_FORCE;
      }
    }

    // Limit speed
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
    if (speed > MAX_SPEED) {
      boid.vx = (boid.vx / speed) * MAX_SPEED;
      boid.vy = (boid.vy / speed) * MAX_SPEED;
    }

    // Update position
    boid.x += boid.vx;
    boid.y += boid.vy;

    // Wrap around screen
    if (boid.x < -EMOJI_SIZE) boid.x = containerSize.width + EMOJI_SIZE;
    if (boid.x > containerSize.width + EMOJI_SIZE) boid.x = -EMOJI_SIZE;
    if (boid.y < -EMOJI_SIZE) boid.y = containerSize.height + EMOJI_SIZE;
    if (boid.y > containerSize.height + EMOJI_SIZE) boid.y = -EMOJI_SIZE;

    // Update rotation to match movement direction
    boid.rotation = Math.atan2(boid.vy, boid.vx) * (180 / Math.PI);
  };

  const drawBoids = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas - use container size instead of canvas size to account for DPI scaling
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    // Draw each boid
    boidsRef.current.forEach(boid => {
      ctx.save();
      
      // Move to boid position and rotate
      ctx.translate(boid.x, boid.y);
      ctx.rotate(boid.rotation * Math.PI / 180);
      
      // Draw emoji with crisp rendering
      ctx.font = `${EMOJI_SIZE}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.imageSmoothingEnabled = false; // Disable antialiasing for sharper emojis
      ctx.fillText(boid.emoji, 0, 0);
      
      ctx.restore();
    });
  };

  const animate = () => {
    boidsRef.current.forEach(boid => updateBoid(boid, boidsRef.current));
    drawBoids();
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scale = getDpiScale();
        
        // Set canvas size accounting for DPI
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        
        // Scale all canvas operations
        ctx.scale(scale, scale);
        
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      initializeBoids();
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [containerSize]);

  return (
    <StageContainer>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <CenteredText>Robots Working...</CenteredText>
    </StageContainer>
  );
} 