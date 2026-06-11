/**
 * Wave Bullet Pool
 *
 * Bullets with sine wave movement patterns.
 * Creates weaving, serpentine bullet streams.
 *
 * Usage:
 *   const waves = new WaveBulletPool(50, { width: 800, height: 600 });
 *   waves.spawn(boss.x, boss.y, Math.PI / 2, 100, 30, 5);
 *   // In game loop: waves.update(dt); waves.render();
 */

import { MakkoEngine } from '@makko/engine';

/**
 * Wave bullet interface
 */
export interface WaveBullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  angle: number;
  baseAngle: number;
  active: boolean;
  damage: number;
  radius: number;
  lifetime: number;
  color: string;
  waveAmplitude: number;
  waveFrequency: number;
  time: number;
}

/**
 * Screen bounds for bullet culling
 */
export interface Bounds {
  width: number;
  height: number;
}

/**
 * WaveBulletPool - bullets with sine wave movement
 */
export class WaveBulletPool {
  private bullets: WaveBullet[] = [];
  private bounds: Bounds;
  private padding: number = 50;

  constructor(initialSize: number, bounds: Bounds) {
    this.bounds = bounds;

    for (let i = 0; i < initialSize; i++) {
      this.bullets.push(this.createBullet());
    }
  }

  private createBullet(): WaveBullet {
    return {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      angle: 0,
      baseAngle: 0,
      active: false,
      damage: 1,
      radius: 4,
      lifetime: 5000,
      color: '#4ff',
      waveAmplitude: 30,
      waveFrequency: 5,
      time: 0,
    };
  }

  /**
   * Spawn a wave bullet
   */
  spawn(
    x: number,
    y: number,
    angle: number,
    speed: number,
    amplitude: number,
    frequency: number,
    config: Partial<WaveBullet> = {}
  ): WaveBullet {
    let bullet = this.bullets.find((b) => !b.active);

    if (!bullet) {
      bullet = this.createBullet();
      this.bullets.push(bullet);
    }

    bullet.x = x;
    bullet.y = y;
    bullet.baseAngle = angle;
    bullet.angle = angle;
    bullet.speed = speed;
    bullet.waveAmplitude = amplitude;
    bullet.waveFrequency = frequency;
    bullet.time = 0;
    bullet.active = true;
    bullet.lifetime = config.lifetime ?? 5000;
    bullet.damage = config.damage ?? 1;
    bullet.radius = config.radius ?? 4;
    bullet.color = config.color ?? '#4ff';

    return bullet;
  }

  /**
   * Spawn a wave spread (multiple wave bullets)
   */
  spawnSpread(
    x: number,
    y: number,
    baseAngle: number,
    count: number,
    speed: number,
    amplitude: number,
    frequency: number,
    spreadAngle: number = Math.PI * 0.5
  ): void {
    const halfSpread = spreadAngle / 2;
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - halfSpread + angleStep * i;
      this.spawn(x, y, angle, speed, amplitude, frequency);
    }
  }

  /**
   * Update all bullets
   */
  update(dt: number): void {
    const dtSec = dt / 1000;

    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      bullet.time += dtSec;

      // Wave perpendicular to travel direction
      const wave =
        Math.sin(bullet.time * bullet.waveFrequency) *
        bullet.waveAmplitude *
        dtSec;
      const perpAngle = bullet.baseAngle + Math.PI / 2;

      // Forward motion + wave motion
      bullet.x += Math.cos(bullet.baseAngle) * bullet.speed * dtSec;
      bullet.y += Math.sin(bullet.baseAngle) * bullet.speed * dtSec;
      bullet.x += Math.cos(perpAngle) * wave;
      bullet.y += Math.sin(perpAngle) * wave;

      bullet.lifetime -= dt;

      if (
        bullet.lifetime <= 0 ||
        bullet.x < -this.padding ||
        bullet.x > this.bounds.width + this.padding ||
        bullet.y < -this.padding ||
        bullet.y > this.bounds.height + this.padding
      ) {
        bullet.active = false;
      }
    }
  }

  /**
   * Get all active bullets
   */
  getActive(): WaveBullet[] {
    return this.bullets.filter((b) => b.active);
  }

  /**
   * Render all bullets
   */
  render(): void {
    const display = MakkoEngine.display;

    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      display.drawCircle(bullet.x, bullet.y, bullet.radius, {
        fill: bullet.color,
      });
    }
  }

  /**
   * Check collision with a circle
   */
  checkCollision(x: number, y: number, radius: number): WaveBullet | null {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      const dx = bullet.x - x;
      const dy = bullet.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius + bullet.radius) {
        return bullet;
      }
    }
    return null;
  }

  /**
   * Clear all bullets
   */
  clear(): void {
    for (const bullet of this.bullets) {
      bullet.active = false;
    }
  }
}
