import Phaser from "phaser";
import { getWorldHeight, getWorldWidth } from "../../core/grid/GridMetrics";
import type { WorldMap } from "../../core/world/WorldMap";
import { oneTilePerGameplayCell } from "../../game/world/GridCellMapping";
import { createFixedWorldMap } from "../../game/world/FixedWorldMap";
import { preloadGroundTiles } from "../assets/GroundTileAssetLoader";
import { WorldCameraController } from "../camera/WorldCameraController";
import { GroundSurfaceLayout } from "../rendering/GroundSurfaceLayout";
import { GroundSurfaceRenderer } from "../rendering/GroundSurfaceRenderer";
import {
  groundSurfaceTileOverlapPixels
} from "../rendering/GroundSurfaceSettings";
import {
  createTrialCharacterAnimations,
  preloadTrialCharacterAssets
} from "../trial/character/TrialCharacterAssets";
import { TrialCharacterController } from "../trial/character/TrialCharacterController";
import { TrialPistolArmAttachment } from "../trial/character/TrialPistolArmAttachment";
import { preloadTrialCoinAssets } from "../trial/coin/TrialCoinAssets";
import { TrialCoinManager } from "../trial/coin/TrialCoinManager";
import { TrialCoinWallet } from "../trial/coin/TrialCoinWallet";
import { preloadTrialProjectileAssets } from "../trial/combat/TrialProjectileAssets";
import { TrialProjectileManager } from "../trial/combat/TrialProjectileManager";
import { TrialWeaponFireController } from "../trial/combat/TrialWeaponFireController";
import { preloadTrialDefenseAssets } from "../trial/defense/TrialDefenseAssets";
import { TrialDefenseManager } from "../trial/defense/TrialDefenseManager";
import { getActiveTrialDifficulty } from "../trial/difficulty/TrialDifficultySettings";
import { preloadTrialHeartHudAssets } from "../trial/hud/TrialHeartHudAssets";
import { TrialMainHud } from "../trial/hud/TrialMainHud";
import { preloadTrialMainHudAssets } from "../trial/hud/TrialMainHudAssets";
import { TrialDayNightController } from "../trial/lighting/TrialDayNightController";
import type { TrialDayNightMode } from "../trial/lighting/TrialDayNightController";
import { TrialGameMenuController, type TrialGameMode } from "../trial/menu/TrialGameMenuController";
import { createTrialPersistence } from "../trial/persistence/createTrialPersistence";
import type { TrialAuthResult, TrialCheckpointData } from "../trial/persistence/TrialPersistenceTypes";
import { TrialPlayerHealth } from "../trial/player/TrialPlayerHealth";
import { TrialPlacementController } from "../trial/placement/TrialPlacementController";
import { TrialInventoryHud } from "../trial/shop/TrialInventoryHud";
import { TrialInventoryModel } from "../trial/shop/TrialInventoryModel";
import { preloadTrialShopAssets } from "../trial/shop/TrialShopAssets";
import { TrialShopMenu } from "../trial/shop/TrialShopMenu";
import { TrialGeneratorController } from "../trial/structures/TrialGeneratorController";
import { preloadTrialStructureAssets } from "../trial/structures/TrialStructureAssets";
import { trialApocalypseTuning, trialCameraTuning, trialPlayerHealthTuning } from "../trial/tuning/TrialGameplayTuning";
import { TrialWaveController } from "../trial/waves/TrialWaveController";
import { createTrialZombieAnimations, preloadTrialZombieAssets } from "../trial/zombies/TrialZombieAssets";
import { TrialZombieManager } from "../trial/zombies/TrialZombieManager";

export class FixedWorldScene extends Phaser.Scene {
  private readonly map: WorldMap;
  private readonly surfaceLayout: GroundSurfaceLayout;
  private groundSurface?: Phaser.GameObjects.Image;
  private trialCharacter?: TrialCharacterController;
  private trialPistolArm?: TrialPistolArmAttachment;
  private trialProjectileManager?: TrialProjectileManager;
  private trialWeaponFireController?: TrialWeaponFireController;
  private trialMainHud?: TrialMainHud;
  private trialCoinWallet?: TrialCoinWallet;
  private trialCoinManager?: TrialCoinManager;
  private trialInventoryHud?: TrialInventoryHud;
  private trialShopMenu?: TrialShopMenu;
  private trialPlacementController?: TrialPlacementController;
  private trialGenerator?: TrialGeneratorController;
  private trialDefenseManager?: TrialDefenseManager;
  private trialZombieManager?: TrialZombieManager;
  private trialWaveController?: TrialWaveController;
  private trialGameMenu?: TrialGameMenuController;
  private readonly persistence = createTrialPersistence();
  private apocalypseScoreText?: Phaser.GameObjects.Text;
  private playerHealth?: TrialPlayerHealth;
  private trialInventory?: TrialInventoryModel;
  private dayNightController?: TrialDayNightController;
  private lastDayNightMode: TrialDayNightMode = "day";
  private currentGameMode: TrialGameMode | null = null;
  private restartMode: TrialGameMode | null = null;
  private checkpointToLoad: TrialCheckpointData | null = null;
  private gameOverShown = false;
  private scoreSavedForCurrentRun = false;
  private cameraController?: WorldCameraController;

  constructor() {
    super("FixedWorldScene");
    this.map = createFixedWorldMap();
    this.surfaceLayout = new GroundSurfaceLayout({
      map: this.map,
      tileOverlapPixels: groundSurfaceTileOverlapPixels
    });
  }

  init(data?: { readonly startMode?: TrialGameMode | null; readonly checkpoint?: TrialCheckpointData | null; readonly forceMainMenu?: boolean }): void {
    if (data?.forceMainMenu) {
      this.restartMode = null;
      this.checkpointToLoad = null;
      return;
    }

    this.restartMode = data?.startMode ?? null;
    this.checkpointToLoad = data?.checkpoint ?? null;
  }

  preload(): void {
    preloadGroundTiles(this);
    preloadTrialCharacterAssets(this);
    preloadTrialProjectileAssets(this);
    preloadTrialCoinAssets(this);
    preloadTrialShopAssets(this);
    preloadTrialZombieAssets(this);
    preloadTrialHeartHudAssets(this);
    preloadTrialMainHudAssets(this);
    preloadTrialStructureAssets(this);
    preloadTrialDefenseAssets(this);
  }

  create(): void {
    createTrialCharacterAnimations(this);
    createTrialZombieAnimations(this);
    const difficulty = getActiveTrialDifficulty();
    const playerHealth = new TrialPlayerHealth(trialPlayerHealthTuning.maxHalfHearts);
    this.playerHealth = playerHealth;
    const coinWallet = new TrialCoinWallet();
    this.trialCoinWallet = coinWallet;
    const inventory = new TrialInventoryModel({
      pistolMagazine: 0,
      smgMagazine: 3,
      shotgunMagazine: 2,
      rifleMagazine: 2,
      rocket: 4,
      woodenFence: 4,
      metalFence: 2,
      electricFence: 1,
      lightTurret: 1,
      machinegunTurret: 1,
      heavyTurret: 0,
      mine: 3
    });
    this.trialInventory = inventory;
    this.renderStageBackground();
    this.groundSurface = new GroundSurfaceRenderer({
      scene: this,
      map: this.map,
      surfaceWidth: this.surfaceLayout.surfaceWidth,
      surfaceHeight: this.surfaceLayout.surfaceHeight,
      stride: this.surfaceLayout.stride
    }).render();
    const generator = new TrialGeneratorController({
      scene: this,
      map: this.map,
      surfaceLayout: this.surfaceLayout
    });
    this.trialGenerator = generator;
    const character = new TrialCharacterController({
      scene: this,
      surfaceLayout: this.surfaceLayout,
      gridCellMapping: oneTilePerGameplayCell,
      startCell: {
        column: Math.floor(this.map.grid.columns / 2),
        row: Math.floor(this.map.grid.rows / 2) + 4
      },
      health: playerHealth
    });
    this.trialCharacter = character;
    this.trialPistolArm = new TrialPistolArmAttachment({
      scene: this,
      body: character.getBodySprite()
    });
    this.trialProjectileManager = new TrialProjectileManager(this);
    const projectileManager = this.trialProjectileManager;
    this.trialCoinManager = new TrialCoinManager(this, coinWallet);
    const defenseManager = new TrialDefenseManager({
      scene: this,
      map: this.map,
      surfaceLayout: this.surfaceLayout,
      projectileManager,
      difficulty
    });
    this.trialDefenseManager = defenseManager;
    this.trialWeaponFireController = new TrialWeaponFireController(
      this,
      this.trialPistolArm,
      projectileManager,
      difficulty.friendlyProjectileDamagesStructures
    );
    this.trialZombieManager = new TrialZombieManager({
      scene: this,
      surfaceLayout: this.surfaceLayout,
      primaryTargets: [character, generator],
      obstacleTargets: defenseManager.getObstacleMeleeTargets(),
      difficulty,
      onZombieDeath: (x, y, coinDropCount) => this.trialCoinManager?.dropCoins(x, y, coinDropCount)
    });
    this.trialPlacementController = new TrialPlacementController({
      scene: this,
      surfaceLayout: this.surfaceLayout,
      character,
      inventory,
      defenseManager,
      onSelectionCleared: () => this.trialInventoryHud?.clearSelection()
    });
    this.trialMainHud = new TrialMainHud(this, playerHealth, coinWallet, this.trialWeaponFireController);
    this.trialInventoryHud = new TrialInventoryHud(this, inventory, (itemId) => this.trialPlacementController?.setSelectedItem(itemId));
    this.trialShopMenu = new TrialShopMenu(this, coinWallet, inventory, (item) => {
      this.trialWeaponFireController?.addPurchasedAmmo(item.id);
    });
    this.cameraController = new WorldCameraController({
      scene: this,
      camera: this.cameras.main,
      target: character.getFollowTarget(),
      boundsProvider: () => this.getCameraBounds(),
      zoom: trialCameraTuning.zoom,
      followLerp: trialCameraTuning.followLerp
    });
    this.cameraController.start();
    this.dayNightController = new TrialDayNightController(this, generator);
    this.trialWaveController = new TrialWaveController({
      scene: this,
      onWaveIntroStart: () => this.startWaveIntro(),
      onWaveIntroComplete: (waveNumber) => this.startWaveCombat(waveNumber)
    });
    this.trialGameMenu = new TrialGameMenuController({
      scene: this,
      onStartMode: (mode) => this.startGameMode(mode),
      onReturnToMainMenu: () => void this.returnToMainMenu(),
      onRestart: () => this.scene.restart({ startMode: this.currentGameMode ?? "waves" }),
      onLoadCheckpoint: () => this.loadCheckpointFromMenu(),
      onSaveCheckpoint: () => this.saveCheckpoint("manual"),
      canSaveCheckpoint: () => this.currentGameMode === "waves",
      onRegister: (username, pin, confirmPin) => this.registerPlayer(username, pin, confirmPin),
      onSignIn: (username, pin) => this.signInPlayer(username, pin),
      getUsername: () => this.persistence.getUsername(),
      getScoreboard: (mode) => this.persistence.getScores(mode, 100)
    });
    this.apocalypseScoreText = this.add.text(0, 0, "", {
      fontFamily: "Arial",
      fontSize: `${trialApocalypseTuning.scoreHud.fontSizePixels}px`,
      color: "#f2e6c9",
      stroke: "#130f0a",
      strokeThickness: 6
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100502).setVisible(false);
    this.lastDayNightMode = this.dayNightController.getMode();
    this.syncPreparationUiForDayNight();
    this.trialMainHud.setVisible(false);
    this.trialInventoryHud.setVisible(false);
    this.trialWaveController.setEnabled(false);
    if (this.restartMode) {
      this.trialGameMenu.startModeDirect(this.restartMode);
    }
    else if (this.checkpointToLoad) {
      this.startFromCheckpoint(this.checkpointToLoad);
    }
  }

  update(time: number, delta: number): void {
    this.trialGameMenu?.update();
    if (this.trialGameMenu?.freezesGameplay()) {
      return;
    }
    const inputBlocked = this.trialGameMenu?.blocksGameplayInput() ?? false;
    const structureBlockers = this.getStructureBlockers();
    const zombieBlockers = this.trialZombieManager?.getCollisionBodies() ?? [];

    if (!inputBlocked || this.trialCharacter?.isDead()) {
      this.trialCharacter?.update(time, delta, [...structureBlockers, ...zombieBlockers]);
    }
    this.trialPistolArm?.update();
    const pointerOverUi = Boolean(this.trialShopMenu?.isPointerOverInteractiveArea() || this.trialInventoryHud?.isPointerOverInteractiveArea());
    if (!inputBlocked && !pointerOverUi && !this.trialCharacter?.isDead() && !this.trialShopMenu?.isActive() && !this.trialPlacementController?.hasSelection()) {
      this.trialWeaponFireController?.update(delta);
    }
    const isNight = this.currentGameMode === "apocalypse" || this.currentGameMode === "shootingRange" || (this.trialWaveController?.isWaveNightActive() ?? false);
    const zombieTargets = this.trialZombieManager?.getDamageableTargets() ?? [];
    this.trialDefenseManager?.update(delta, zombieTargets);
    this.trialProjectileManager?.update(
      delta,
      zombieTargets,
      this.getStructureDamageTargets(),
      this.surfaceLayout.stride
    );
    if (isNight) {
      this.trialZombieManager?.update(delta, [
        ...structureBlockers,
        ...(this.trialCharacter && !this.trialCharacter.isDead() ? [this.trialCharacter] : []),
        ...zombieBlockers
      ]);
    }
    this.trialGenerator?.update();
    if (this.trialCharacter) {
      this.trialCoinManager?.update(delta, this.trialCharacter);
    }
    this.trialMainHud?.update();
    this.trialInventoryHud?.update();
    if (!inputBlocked) {
      this.trialShopMenu?.update();
      this.trialPlacementController?.update();
    }
    this.trialWaveController?.update();
    this.updateApocalypseScoreHud();
    this.dayNightController?.update(
      this.trialProjectileManager?.getLightSources() ?? []
    );
    this.handleDayNightTransitions();
    this.handleWaveCompletion();
    this.handleGameOver();
  }

  private startGameMode(mode: TrialGameMode): void {
    this.currentGameMode = mode;
    this.gameOverShown = false;
    this.scoreSavedForCurrentRun = false;
    this.trialMainHud?.setVisible(true);

    if (mode === "waves") {
      this.dayNightController?.setMode("day");
      this.trialWaveController?.setEnabled(true);
      this.syncPreparationUiForDayNight();
      return;
    }

    if (mode === "shootingRange") {
      this.dayNightController?.setMode("day");
      this.trialWaveController?.setEnabled(false);
      this.trialZombieManager?.startShootingRange();
      this.trialShopMenu?.setCanOpen(false);
      this.trialPlacementController?.setEnabled(false);
      this.trialInventoryHud?.setVisible(false);
      return;
    }

    this.trialWaveController?.setEnabled(false);
    this.dayNightController?.setMode("night");
    this.trialCoinWallet?.add(200);
    this.trialZombieManager?.startApocalypse();
    this.syncPreparationUiForDayNight();
  }

  private startWaveIntro(): void {
    this.dayNightController?.setMode("night");
    this.trialMainHud?.setVisible(false);
    this.trialInventoryHud?.setVisible(false);
    this.trialShopMenu?.setCanOpen(false);
    this.trialPlacementController?.setEnabled(false);
    this.trialInventoryHud?.clearSelection();
  }

  private startWaveCombat(waveNumber: number): void {
    this.trialMainHud?.setVisible(true);
    this.trialZombieManager?.startWave(waveNumber);
    this.syncPreparationUiForDayNight();
  }

  private handleWaveCompletion(): void {
    if (this.currentGameMode !== "waves" || !(this.trialWaveController?.isWaveNightActive() && this.trialZombieManager?.isWaveComplete())) {
      return;
    }

    this.trialZombieManager.finishWave();
    this.dayNightController?.setMode("day");
    this.trialWaveController.completeWave();
    this.syncPreparationUiForDayNight();
    void this.saveCheckpoint("wave-complete");
  }

  private handleGameOver(): void {
    if (this.gameOverShown || !this.currentGameMode) {
      return;
    }

    if (!(this.trialCharacter?.isDead() || this.trialGenerator?.isDead())) {
      return;
    }

    this.gameOverShown = true;
    void this.saveScore();
    this.trialShopMenu?.setCanOpen(false);
    this.trialPlacementController?.setEnabled(false);
    this.trialGameMenu?.showLoss();
  }

  private handleDayNightTransitions(): void {
    const mode = this.dayNightController?.getMode();
    if (!mode || mode === this.lastDayNightMode) {
      return;
    }

    this.lastDayNightMode = mode;
    if (mode === "night") {
      this.trialZombieManager?.startNight();
    }
    else {
      this.trialZombieManager?.killAll();
    }
    this.syncPreparationUiForDayNight();
  }

  private syncPreparationUiForDayNight(): void {
    if (this.currentGameMode === "shootingRange") {
      this.trialInventoryHud?.setDayMode(false);
      this.trialShopMenu?.setCanOpen(false);
      this.trialPlacementController?.setEnabled(false);
      return;
    }

    const isApocalypse = this.currentGameMode === "apocalypse";
    const isDay = isApocalypse || !(this.dayNightController?.isNight() ?? false);
    this.trialInventoryHud?.setDayMode(isDay);
    this.trialShopMenu?.setCanOpen(isDay);
    this.trialPlacementController?.setEnabled(isDay);
    if (!isDay) {
      this.trialInventoryHud?.clearSelection();
    }
  }

  private async loadCheckpointFromMenu(): Promise<void> {
    const checkpoint = await this.persistence.loadCheckpoint(this.persistence.getUsername());
    if (!checkpoint) {
      window.alert("No checkpoint found for this player.");
      return;
    }

    if (checkpoint.mode !== "waves") {
      window.alert("Only wave checkpoints can be loaded.");
      return;
    }

    this.scene.restart({ checkpoint });
  }

  private startFromCheckpoint(checkpoint: TrialCheckpointData): void {
    this.trialGameMenu?.startModeDirect(checkpoint.mode);
    this.applyCheckpoint(checkpoint);
    if (checkpoint.mode === "waves") {
      this.trialWaveController?.setCompletedWave(checkpoint.completedWave);
      this.dayNightController?.setMode("day");
      this.syncPreparationUiForDayNight();
    }
  }

  private applyCheckpoint(checkpoint: TrialCheckpointData): void {
    this.trialCoinWallet?.setTotal(checkpoint.coinTotal);
    this.playerHealth?.setCurrentHalfHearts(checkpoint.playerHealthHalfHearts);
    this.trialGenerator?.restoreHealth(checkpoint.generatorHealthHalfHearts);
    this.trialInventory?.restore(checkpoint.inventory);
    this.trialWeaponFireController?.restore(checkpoint.weapons);
  }

  private async saveCheckpoint(_reason: "manual" | "wave-complete"): Promise<void> {
    if (!this.currentGameMode || !this.playerHealth || !this.trialCoinWallet || !this.trialInventory || !this.trialWeaponFireController || !this.trialGenerator) {
      return;
    }

    if (this.currentGameMode !== "waves") {
      return;
    }

    const completedWave = this.trialWaveController?.getCompletedWave() ?? 0;
    await this.persistence.saveCheckpoint({
      username: this.persistence.getUsername(),
      mode: "waves",
      completedWave,
      coinTotal: this.trialCoinWallet.getTotal(),
      playerHealthHalfHearts: this.playerHealth.getSnapshot().currentHalfHearts,
      generatorHealthHalfHearts: this.trialGenerator.getHealthSnapshot().currentHalfHearts,
      inventory: this.trialInventory.getSnapshot(),
      weapons: this.trialWeaponFireController.getSaveData(),
      savedAtIso: new Date().toISOString()
    });
  }

  private async saveScore(): Promise<void> {
    if (!this.currentGameMode || this.scoreSavedForCurrentRun) {
      return;
    }

    if (this.currentGameMode === "shootingRange") {
      return;
    }

    const score = this.currentGameMode === "waves"
      ? this.trialWaveController?.getCompletedWave() ?? 0
      : this.currentGameMode === "apocalypse"
        ? this.getApocalypseScore()
        : 0;
    const label = this.currentGameMode === "apocalypse" ? `${score} PTS` : `WAVE ${score}`;
    await this.persistence.addScore({
      username: this.persistence.getUsername(),
      mode: this.currentGameMode,
      score,
      label,
      createdAtIso: new Date().toISOString()
    });
    this.scoreSavedForCurrentRun = true;
  }

  private async returnToMainMenu(): Promise<void> {
    if (this.currentGameMode === "apocalypse" || this.currentGameMode === "waves") {
      await this.saveScore();
    }

    this.scene.restart({ forceMainMenu: true, startMode: null, checkpoint: null });
  }

  private async registerPlayer(username: string, pin: string, confirmPin: string): Promise<TrialAuthResult> {
    if (pin !== confirmPin) {
      return { success: false, message: "PIN confirmation does not match." };
    }

    try {
      return await this.persistence.register(username, pin);
    }
    catch {
      return { success: false, message: "Register failed. Check Supabase setup." };
    }
  }

  private async signInPlayer(username: string, pin: string): Promise<TrialAuthResult> {
    try {
      return await this.persistence.signIn(username, pin);
    }
    catch {
      return { success: false, message: "Sign in failed. Check Supabase setup." };
    }
  }

  private updateApocalypseScoreHud(): void {
    if (!this.apocalypseScoreText) {
      return;
    }

    const isVisible = this.currentGameMode === "apocalypse" && !this.gameOverShown;
    this.apocalypseScoreText.setVisible(isVisible);
    if (!isVisible) {
      return;
    }

    const width = this.cameras.main.width || this.scale.width;
    const zoom = this.cameras.main.zoom || 1;
    const score = this.getApocalypseScore();
    const scoreHud = trialApocalypseTuning.scoreHud;
    this.apocalypseScoreText
      .setText(`SCORE ${score}`)
      .setFontSize(scoreHud.fontSizePixels)
      .setPosition((width + scoreHud.offsetPixels.x) / zoom, scoreHud.offsetPixels.y / zoom)
      .setScale(scoreHud.scale / zoom);
  }

  private getApocalypseScore(): number {
    const secondsPerPoint = Math.max(1, trialApocalypseTuning.scoreSecondsPerPoint);
    return Math.floor((this.trialZombieManager?.getApocalypseElapsedMs() ?? 0) / (secondsPerPoint * 1000));
  }

  private renderStageBackground(): void {
    const width = getWorldWidth(this.map.grid);
    const height = getWorldHeight(this.map.grid);

    this.add.rectangle(width / 2, height / 2, width * 1.4, height * 1.4, 0x111111, 1).setDepth(0);
  }

  private getCameraBounds(): Phaser.Geom.Rectangle {
    return this.groundSurface?.getBounds() ?? new Phaser.Geom.Rectangle(
      0,
      0,
      getWorldWidth(this.map.grid),
      getWorldHeight(this.map.grid)
    );
  }

  private getStructureBlockers() {
    return [
      ...(this.trialGenerator?.isBlocking() ? [this.trialGenerator] : []),
      ...(this.trialDefenseManager?.getCollisionBodies() ?? [])
    ];
  }

  private getStructureDamageTargets() {
    return [
      ...(this.trialGenerator?.isDamageable() ? [this.trialGenerator] : []),
      ...(this.trialDefenseManager?.getStructureDamageTargets() ?? [])
    ];
  }
}
