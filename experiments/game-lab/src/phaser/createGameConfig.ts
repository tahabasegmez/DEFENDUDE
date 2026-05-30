import Phaser from "phaser";
import { FixedWorldScene } from "./scenes/FixedWorldScene";

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#111111",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    scene: [FixedWorldScene]
  };
}
