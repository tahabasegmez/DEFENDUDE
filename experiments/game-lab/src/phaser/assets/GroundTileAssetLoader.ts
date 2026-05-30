import Phaser from "phaser";
import { groundTileCatalog } from "../../game/tiles/GroundTileCatalog";

const groundTileAssetBasePath = "/assets/ground_tiles";

export function preloadGroundTiles(scene: Phaser.Scene): void {
  for (const tile of groundTileCatalog) {
    scene.load.image(tile.assetKey, `${groundTileAssetBasePath}/${tile.fileName}`);
  }
}
