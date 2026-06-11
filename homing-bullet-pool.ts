/**
 * Homing Bullet Pool
 *
 * Bullets that track and home toward targets.
 * Useful for missiles, seeking projectiles, and boss attacks.
 *
 * Usage:
 *   const missiles = new HomingBulletPool(20, { width: 800, height: 600 });
 *   missiles.spawn(boss.x, boss.y, player.x, player.y, 200);
 *   // In game loop: missiles.updateTarget(player.x, player.y); missiles.update(dt);
 */

import { MakkoEngine } from '@makko/engine';

/**
 * Homing bullet interface
 */
export interface HomingBullet {
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
  targetX: number;
  targetY: number;
  turnRate: number;
  homingDuration: number;
}

/**
 * Screen bounds for bullet culling
 */
export interface Bounds {
  width: number;
  height: number;
}

/**
 * HomingBulletPool - missiles that track targets
 */
export class HomingBulletPool {
  private bullets: HomingBullet[] = [];
  private bounds: Bounds;
  private padding: number = 50;

  constructor(initialSize: number, bounds: Bounds) {
    this.bounds = bounds;

    for (let i = 0; i < initialSize; i++) {
      this.bullets.push(this.createBullet());
    }
  }

  private createBullet(): HomingBullet {
    return {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 0,
      speed: 0,
      angle: 0,
      active: false,
      damage: 1,
      radius: 6,
      lifetime: 5000,
      color: '#f0f',
      targetX: 0,
      targetY: 0,
      turnRate: 3,
      homingDuration: 2000,
    };
  }

  /**
   * Spawn a homing bullet
   */
  spawn(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    speed: number,
    config: Partial<HomingBullet> = {}
  ): HomingBullet {
    let bullet = this.bullets.find((b) => !b.active);

    if (!bullet) {
      bullet = this.createBullet();
      this.bullets.push(bullet);
    }

    const angle = Math.atan2(targetY - y, targetX - x);

    bullet.x = x;
    bullet.y = y;
    bullet.angle = angle + (Math.random() - 0.5) * 0.5; // Initial scatter
    bullet.speed = speed;
    bullet.velocityX = Math.cos(bullet.angle) * speed;
    bullet.velocityY = Math.sin(bullet.angle) * speed;
    bullet.targetX = targetX;
    bullet.targetY = targetY;
    bullet.active = true;
    bullet.lifetime = config.lifetime ?? 5000;
    bullet.homingDuration = config.homingDuration ?? 2000;
    bullet.turnRate = config.turnRate ?? 3;
    bullet.damage = config.damage ?? 1;
    bullet.radius = config.radius ?? 6;
    bullet.color = config.color ?? '#f0f';

    return bullet;
  }

  /**
   * Update target position for all active bullets
   */
  updateTarget(targetX: number, targetY: number): void {
    for (const bullet of this.bullets) {
      if (bullet.active) {
        bullet.targetX = targetX;
        bullet.targetY = targetY;
      }
    }
  }

  /**
   * Update all bullets
   */
  update(dt: number): void {
    const dtSec = dt / 1000;

    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      // Homing behavior
      if (bullet.homingDuration > 0) {
        bullet.homingDuration -= dt;

        const targetAngle = Math.atan2(
          bullet.targetY - bullet.y,
          bullet.targetX - bullet.x
        );
        let angleDiff = targetAngle - bullet.angle;

        // Normalize angle difference
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Turn toward target
        const turn =
          Math.sign(angleDiff) *
          Math.min(Math.abs(angleDiff), bullet.turnRate * dtSec);
        bullet.angle += turn;

        bullet.velocityX = Math.cos(bullet.angle) * bullet.speed;
        bullet.velocityY = Math.sin(bullet.angle) * bullet.speed;
      }

      bullet.x += bullet.velocityX * dtSec;
      bullet.y += bullet.velocityY * dtSec;
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
  getActive(): HomingBullet[] {
    return this.bullets.filter((b) => b.active);
  }

  /**
   * Render all bullets
   */
  render(): void {
    const display = MakkoEngine.display;

    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      // Draw as arrow/missile shape
      const tipX = bullet.x + Math.cos(bullet.angle) * 8;
      const tipY = bullet.y + Math.sin(bullet.angle) * 8;
      const leftX = bullet.x + Math.cos(bullet.angle + 2.5) * 6;
      const leftY = bullet.y + Math.sin(bullet.angle + 2.5) * 6;
      const rightX = bullet.x + Math.cos(bullet.angle - 2.5) * 6;
      const rightY = bullet.y + Math.sin(bullet.angle - 2.5) * 6;

      display.drawPolygon(
        [
          { x: tipX, y: tipY },
          { x: leftX, y: leftY },
          { x: rightX, y: rightY },
        ],
        { fill: bullet.color }
      );
    }
  }

  /**
   * Check collision with a circle
   */
  checkCollision(x: number, y: number, radius: number): HomingBullet | null {
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
