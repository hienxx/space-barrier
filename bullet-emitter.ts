/**
 * Bullet Emitter
 *
 * Pattern-based bullet emitters for shmups.
 * Circular spreads, spirals, aimed shots, and more.
 *
 * Usage:
 *   const emitter = new BulletEmitter(bulletPool);
 *   emitter.x = boss.x; emitter.y = boss.y;
 *   emitter.circularSpread(16, 100); // 16 bullets in a circle at 100 px/s
 */

import type { BulletPool, Bullet } from './bullet-pool';

/**
 * BulletEmitter - fires bullet patterns
 */
export class BulletEmitter {
  private pool: BulletPool;
  x: number = 0;
  y: number = 0;

  constructor(pool: BulletPool) {
    this.pool = pool;
  }

  /**
   * Fire bullets evenly distributed in a circle
   */
  circularSpread(count: number, speed: number, config: Partial<Bullet> = {}): void {
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i;
      this.pool.spawn(this.x, this.y, angle, speed, config);
    }
  }

  /**
   * Fire bullets in a circle with rotation offset
   */
  circularSpreadRotated(
    count: number,
    speed: number,
    rotation: number,
    config: Partial<Bullet> = {}
  ): void {
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i + rotation;
      this.pool.spawn(this.x, this.y, angle, speed, config);
    }
  }

  /**
   * Fire a single aimed shot at a target
   */
  aimAt(targetX: number, targetY: number, speed: number, config: Partial<Bullet> = {}): void {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.pool.spawn(this.x, this.y, angle, speed, config);
  }

  /**
   * Fire aimed shot with spread (shotgun style)
   */
  aimWithSpread(
    targetX: number,
    targetY: number,
    speed: number,
    count: number,
    spreadAngle: number,
    config: Partial<Bullet> = {}
  ): void {
    const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
    const halfSpread = spreadAngle / 2;
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - halfSpread + angleStep * i;
      this.pool.spawn(this.x, this.y, angle, speed, config);
    }
  }

  /**
   * Fire in a line (forward)
   */
  burst(
    angle: number,
    speed: number,
    count: number,
    delayMs: number,
    config: Partial<Bullet> = {}
  ): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.pool.spawn(this.x, this.y, angle, speed, config);
      }, i * delayMs);
    }
  }
}

/**
 * SpiralEmitter - continuously rotating bullet stream
 */
export class SpiralEmitter {
  private pool: BulletPool;
  private rotation: number = 0;
  private timer: number = 0;

  x: number = 0;
  y: number = 0;
  bulletsPerShot: number = 3;
  fireRate: number = 50; // ms between emissions
  rotationSpeed: number = 2; // radians per second
  bulletSpeed: number = 150;
  bulletConfig: Partial<Bullet> = { color: '#f44' };
  active: boolean = true;

  constructor(pool: BulletPool) {
    this.pool = pool;
  }

  /**
   * Update the spiral emitter
   */
  update(dt: number): void {
    if (!this.active) return;

    this.rotation += this.rotationSpeed * (dt / 1000);
    this.timer += dt;

    while (this.timer >= this.fireRate) {
      this.timer -= this.fireRate;
      this.emit();
    }
  }

  private emit(): void {
    const angleStep = (Math.PI * 2) / this.bulletsPerShot;

    for (let i = 0; i < this.bulletsPerShot; i++) {
      const angle = angleStep * i + this.rotation;
      this.pool.spawn(this.x, this.y, angle, this.bulletSpeed, this.bulletConfig);
    }
  }

  /**
   * Reset the spiral
   */
  reset(): void {
    this.rotation = 0;
    this.timer = 0;
  }
}

/**
 * AimedEmitter - fires at player with variations
 */
export class AimedEmitter {
  private pool: BulletPool;
  x: number = 0;
  y: number = 0;

  constructor(pool: BulletPool) {
    this.pool = pool;
  }

  /**
   * Simple aimed shot
   */
  aimAt(targetX: number, targetY: number, speed: number, config: Partial<Bullet> = {}): void {
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.pool.spawn(this.x, this.y, angle, speed, config);
  }

  /**
   * Predictive aim - leads the target based on velocity
   */
  aimPredictive(
    targetX: number,
    targetY: number,
    targetVelX: number,
    targetVelY: number,
    bulletSpeed: number,
    config: Partial<Bullet> = {}
  ): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeToHit = distance / bulletSpeed;

    const predictedX = targetX + targetVelX * timeToHit;
    const predictedY = targetY + targetVelY * timeToHit;

    this.aimAt(predictedX, predictedY, bulletSpeed, config);
  }

  /**
   * Spread shot toward target
   */
  spreadShot(
    targetX: number,
    targetY: number,
    speed: number,
    count: number,
    spreadAngle: number,
    config: Partial<Bullet> = {}
  ): void {
    const baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
    const halfSpread = spreadAngle / 2;
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle - halfSpread + angleStep * i;
      this.pool.spawn(this.x, this.y, angle, speed, config);
    }
  }
}

// ============================================================================
// Pattern Presets
// ============================================================================

/**
 * Common bullet pattern presets
 */
export const BulletPatterns = {
  /**
   * Basic radial burst
   */
  radialBurst(emitter: BulletEmitter, count: number = 12, speed: number = 100): void {
    emitter.circularSpread(count, speed);
  },

  /**
   * Double ring (two sizes)
   */
  doubleRing(emitter: BulletEmitter, speed1: number = 80, speed2: number = 120): void {
    emitter.circularSpread(12, speed1, { color: '#f88' });
    emitter.circularSpreadRotated(12, speed2, Math.PI / 12, { color: '#88f' });
  },

  /**
   * Aimed triple shot
   */
  tripleShot(
    emitter: BulletEmitter,
    targetX: number,
    targetY: number,
    speed: number = 200
  ): void {
    emitter.aimWithSpread(targetX, targetY, speed, 3, 0.3);
  },

  /**
   * Wall of bullets
   */
  bulletWall(emitter: BulletEmitter, angle: number, count: number = 20, speed: number = 150): void {
    const spread = Math.PI * 0.8;
    for (let i = 0; i < count; i++) {
      const bulletAngle = angle - spread / 2 + (spread * i) / (count - 1);
      emitter.circularSpreadRotated(1, speed, bulletAngle);
    }
  },
};
