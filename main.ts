/**
 * Entry point — boots MakkoEngine and starts the Game.
 */

import { Game } from './game/game';

async function main() {
  // Initialize MakkoEngine with canvas2d renderer
  const MakkoEngine = (window as any).MakkoEngine;
  
  await MakkoEngine.initEngine({
    canvas: document.getElementById('gameCanvas') as HTMLCanvasElement,
    width: 1920,
    height: 1080,
    renderer: 'canvas2d',
    manifests: ['/sprites-manifest.json']
  });

  MakkoEngine.display.setImageSmoothing(false);

  // Capture all game keys
  MakkoEngine.input.capture([
    'Space', 'Enter', 'Escape',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'KeyJ',
    'ControlLeft', 'ControlRight',
    'ShiftLeft', 'ShiftRight',
    'Digit1', 'Digit2', 'Digit3',
    'Numpad1', 'Numpad2', 'Numpad3',
    'KeyP'
  ]);

  // Initialize and start game
  const game = new Game();
  await game.init();
  game.start();
}

main().catch(console.error);
