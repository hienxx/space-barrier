/**
 * Pattern Sequencer
 *
 * Execute complex attack sequences for boss battles.
 * Chain multiple bullet patterns with timing and targeting.
 *
 * Usage:
 *   const sequencer = new PatternSequencer(bulletPool);
 *   sequencer.loadPattern(BOSS_PATTERN_1);
 *   // In game loop: sequencer.setPosition(boss.x, boss.y);
 *   //               sequencer.setTarget(player.x, player.y);
 *   //               sequencer.update(dt);
 */

import type { Bullet, BulletPool } from './bullet-pool';
import { BulletEmitter, SpiralEmitter, AimedEmitter } from './bullet-emitter';

/**
 * Pattern step types
 */
export interface PatternStep {
  type: 'circular' | 'spiral' | 'aimed' | 'burst' | 'wait';
  duration?: number;
  count?: number;
  speed?: number;
  spread?: number;
  rotationSpeed?: number;
  config?: Partial<Bullet>;
}

/**
 * PatternSequencer - orchestrates complex attack patterns
 */
export class PatternSequencer {
  private emitter: BulletEmitter;
  private spiralEmitter: SpiralEmitter;
  private aimedEmitter: AimedEmitter;

  private pattern: PatternStep[] = [];
  private currentStepIndex: number = 0;
  private stepTimer: number = 0;
  private isPlaying: boolean = false;
  private loop: boolean = true;

  private targetX: number = 0;
  private targetY: number = 0;

  onPatternComplete?: () => void;
  onStepComplete?: (stepIndex: number, step: PatternStep) => void;

  constructor(pool: BulletPool) {
    this.emitter = new BulletEmitter(pool);
    this.spiralEmitter = new SpiralEmitter(pool);
    this.aimedEmitter = new AimedEmitter(pool);
  }

  /**
   * Set emitter position
   */
  setPosition(x: number, y: number): void {
    this.emitter.x = x;
    this.emitter.y = y;
    this.spiralEmitter.x = x;
    this.spiralEmitter.y = y;
    this.aimedEmitter.x = x;
    this.aimedEmitter.y = y;
  }

  /**
   * Set target position for aimed patterns
   */
  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * Load and start a pattern
   */
  loadPattern(pattern: PatternStep[], loop: boolean = true): void {
    this.pattern = pattern;
    this.loop = loop;
    this.currentStepIndex = 0;
    this.stepTimer = 0;
    this.isPlaying = true;
  }

  /**
   * Stop pattern execution
   */
  stop(): void {
    this.isPlaying = false;
  }

  /**
   * Resume pattern execution
   */
  resume(): void {
    this.isPlaying = true;
  }

  /**
   * Reset to beginning of pattern
   */
  reset(): void {
    this.currentStepIndex = 0;
    this.stepTimer = 0;
    this.isPlaying = true;
  }

  /**
   * Check if sequencer is playing
   */
  isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current step index
   */
  getCurrentStep(): number {
    return this.currentStepIndex;
  }

  /**
   * Update the sequencer
   */
  update(dt: number): void {
    if (!this.isPlaying || this.pattern.length === 0) return;

    const step = this.pattern[this.currentStepIndex];
    this.stepTimer += dt;

    switch (step.type) {
      case 'circular':
        this.emitter.circularSpread(
          step.count ?? 12,
          step.speed ?? 100,
          step.config ?? {}
        );
        this.nextStep();
        break;

      case 'spiral':
        this.spiralEmitter.rotationSpeed = step.rotationSpeed ?? 2;
        this.spiralEmitter.bulletSpeed = step.speed ?? 150;
        if (step.config) {
          this.spiralEmitter.bulletConfig = step.config;
        }
        this.spiralEmitter.update(dt);
        if (this.stepTimer >= (step.duration ?? 2000)) {
          this.nextStep();
        }
        break;

      case 'aimed':
        this.aimedEmitter.spreadShot(
          this.targetX,
          this.targetY,
          step.speed ?? 200,
          step.count ?? 5,
          step.spread ?? 0.5,
          step.config ?? {}
        );
        this.nextStep();
        break;

      case 'burst':
        this.executeBurst(step);
        this.nextStep();
        break;

      case 'wait':
        if (this.stepTimer >= (step.duration ?? 1000)) {
          this.nextStep();
        }
        break;
    }
  }

  private executeBurst(step: PatternStep): void {
    const burstCount = step.count ?? 3;
    const delayMs = 100;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        if (this.isPlaying) {
          this.aimedEmitter.aimAt(
            this.targetX,
            this.targetY,
            step.speed ?? 200,
            step.config ?? {}
          );
        }
      }, i * delayMs);
    }
  }

  private nextStep(): void {
    const currentStep = this.pattern[this.currentStepIndex];
    this.onStepComplete?.(this.currentStepIndex, currentStep);

    this.stepTimer = 0;
    this.currentStepIndex++;

    if (this.currentStepIndex >= this.pattern.length) {
      if (this.loop) {
        this.currentStepIndex = 0;
      } else {
        this.isPlaying = false;
        this.onPatternComplete?.();
      }
    }
  }
}

// ============================================================================
// Example Boss Patterns
// ============================================================================

/**
 * Basic boss pattern - circular bursts with aimed shots
 */
export const BOSS_PATTERN_BASIC: PatternStep[] = [
  { type: 'circular', count: 16, speed: 120 },
  { type: 'wait', duration: 500 },
  { type: 'aimed', count: 7, speed: 180, spread: 0.8 },
  { type: 'wait', duration: 300 },
  { type: 'spiral', duration: 3000, speed: 100, rotationSpeed: 3 },
  { type: 'wait', duration: 1000 },
];

/**
 * Aggressive pattern - fast bursts and dense rings
 */
export const BOSS_PATTERN_AGGRESSIVE: PatternStep[] = [
  { type: 'burst', count: 5, speed: 250 },
  { type: 'wait', duration: 800 },
  { type: 'circular', count: 24, speed: 80 },
  { type: 'wait', duration: 200 },
  { type: 'circular', count: 24, speed: 80 },
  { type: 'wait', duration: 1500 },
];

/**
 * Spiral hell - continuous rotating streams
 */
export const BOSS_PATTERN_SPIRAL: PatternStep[] = [
  { type: 'spiral', duration: 5000, speed: 120, rotationSpeed: 2 },
  { type: 'wait', duration: 500 },
  { type: 'aimed', count: 12, speed: 200, spread: 1.2 },
  { type: 'wait', duration: 1000 },
];

/**
 * Mixed assault - varied attack types
 */
export const BOSS_PATTERN_MIXED: PatternStep[] = [
  { type: 'circular', count: 8, speed: 100, config: { color: '#f88' } },
  { type: 'wait', duration: 300 },
  { type: 'aimed', count: 3, speed: 220, spread: 0.4, config: { color: '#ff8' } },
  { type: 'wait', duration: 400 },
  { type: 'circular', count: 12, speed: 80, config: { color: '#8f8' } },
  { type: 'wait', duration: 600 },
  { type: 'burst', count: 4, speed: 200, config: { color: '#88f' } },
  { type: 'wait', duration: 1000 },
];
