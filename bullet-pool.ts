/**
 * Bullet Pool
 *
 * Pooled bullet system for shmups and bullet-hell games.
 * Pre-allocates bullets to avoid garbage collection.
 *
 * Usage:
 *   const bullets = new BulletPool(100, { width: 800, height: 600 });
 *   bullets.spawn(player.x, player.y, Math.PI / 2, 300); // Fire upward at 300 px/s
 *   // In game loop: bullets.update(dt); bullets.render();
 */

import { MakkoEngine } from '@makko/engine';

/**
 * Bullet interface
 */
export interface Bullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  angle: number;
  active: boolean;
  damage: number;
  radius: number;
  lifetime: number;
  color: string;
}

/**
 * Screen bounds for bullet culling
 */
export interface Bounds {
  width: number;
  height: number;
}

/**
 * BulletPool - manages pooled bullets with physics and rendering
 */
export class BulletPool {
  private bullets: Bullet[] = [];
  private bounds: Bounds;
  private padding: number = 50;

  constructor(initialSize: number, bounds: Bounds) {
    this.bounds = bounds;

    // Pre-allocate bullets
    for (let i = 0; i < initialSize; i++) {
      this.bullets.push(this.createBullet());
    }
  }

  private createBullet(): Bullet {
    return {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      angle: 0,
      active: false,
      damage: 1,
      radius: 4,
      lifetime: 5000,
      color: '#fff',
    };
  }

  /**
   * Spawn a bullet
   */
  spawn(
    x: number,
    y: number,
    angle: number,
    speed: number,
    config: Partial<Bullet> = {}
  ): Bullet {
    let bullet = this.bullets.find((b) => !b.active);

    if (!bullet) {
      bullet = this.createBullet();
      this.bullets.push(bullet);
    }

    bullet.x = x;
    bullet.y = y;
    bullet.angle = angle;
    bullet.speed = speed;
    bullet.velocityX = Math.cos(angle) * speed;
    bullet.velocityY = Math.sin(angle) * speed;
    bullet.active = true;
    bullet.lifetime = config.lifetime ?? 5000;
    bullet.damage = config.damage ?? 1;
    bullet.radius = config.radius ?? 4;
    bullet.color = config.color ?? '#fff';

    return bullet;
  }

  /**
   * Update all bullets
   */
  update(dt: number): void {
    const dtSec = dt / 1000;

    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      bullet.x += bullet.velocityX * dtSec;
      bullet.y += bullet.velocityY * dtSec;
      bullet.lifetime -= dt;

      // Deactivate if out of bounds or expired
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
   * Get all active bullets (for collision checking)
   */
  getActive(): Bullet[] {
    return this.bullets.filter((b) => b.active);
  }

  /**
   * Check collision with a circle
   */
  checkCollision(
    x: number,
    y: number,
    radius: number
  ): Bullet | null {
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
   * Check and handle collision, deactivating the bullet
   */
  checkAndRemoveCollision(x: number, y: number, radius: number): Bullet | null {
    const bullet = this.checkCollision(x, y, radius);
    if (bullet) {
      bullet.active = false;
    }
    return bullet;
  }

  /**
   * Clear all bullets
   */
  clear(): void {
    for (const bullet of this.bullets) {
      bullet.active = false;
    }
  }

  /**
   * Get count of active bullets
   */
  getActiveCount(): number {
    return this.bullets.filter((b) => b.active).length;
  }

  /**
   * Get total pool size
   */
  getPoolSize(): number {
    return this.bullets.length;
  }
}
