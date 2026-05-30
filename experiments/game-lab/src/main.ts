import Phaser from "phaser";
import { createGameConfig } from "./phaser/createGameConfig";
import "./styles.css";

const gameRootId = "game-root";

window.addEventListener("contextmenu", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest(`#${gameRootId}`) !== null || target instanceof HTMLCanvasElement) {
    event.preventDefault();
  }
});

new Phaser.Game(createGameConfig(gameRootId));
