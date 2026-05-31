import Phaser from "phaser";
import type { TrialAuthResult, TrialScoreEntry } from "../persistence/TrialPersistenceTypes";
import { trialMainMenuTuning, trialTypographyTuning } from "../tuning/TrialGameplayTuning";
import { TrialMainMenuDomAdController } from "./TrialMainMenuDomAdController";

export type TrialGameMode = "waves" | "apocalypse" | "shootingRange";

type MenuState = "main" | "inGame" | "hidden" | "loss" | "scoreboard" | "auth";
type ScoreboardMode = "waves" | "apocalypse";
type AuthMode = "register" | "signin";

export interface TrialGameMenuControllerOptions {
  readonly scene: Phaser.Scene;
  readonly onStartMode: (mode: TrialGameMode) => void;
  readonly onReturnToMainMenu: () => void;
  readonly onRestart: () => void;
  readonly onLoadCheckpoint: () => Promise<void>;
  readonly onSaveCheckpoint: () => Promise<void>;
  readonly canSaveCheckpoint: () => boolean;
  readonly onRegister: (username: string, pin: string, confirmPin: string) => Promise<TrialAuthResult>;
  readonly onSignIn: (username: string, pin: string) => Promise<TrialAuthResult>;
  readonly getUsername: () => string;
  readonly getScoreboard: (mode: ScoreboardMode) => Promise<readonly TrialScoreEntry[]>;
}

interface MenuButton {
  readonly label: Phaser.GameObjects.Text;
  readonly background?: Phaser.GameObjects.Rectangle;
  readonly input?: MenuInputField;
  readonly action?: () => void;
  isHovered: boolean;
}

interface MenuInputField {
  value: string;
  readonly placeholder: string;
  readonly maxLength: number;
  readonly pinOnly: boolean;
  readonly masked: boolean;
}

export class TrialGameMenuController {
  private readonly scene: Phaser.Scene;
  private readonly onStartMode: (mode: TrialGameMode) => void;
  private readonly onReturnToMainMenu: () => void;
  private readonly onRestart: () => void;
  private readonly onLoadCheckpoint: () => Promise<void>;
  private readonly onSaveCheckpoint: () => Promise<void>;
  private readonly canSaveCheckpoint: () => boolean;
  private readonly onRegister: (username: string, pin: string, confirmPin: string) => Promise<TrialAuthResult>;
  private readonly onSignIn: (username: string, pin: string) => Promise<TrialAuthResult>;
  private readonly getUsername: () => string;
  private readonly getScoreboard: (mode: ScoreboardMode) => Promise<readonly TrialScoreEntry[]>;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly transition: Phaser.GameObjects.Graphics;
  private readonly mainMenuAds: TrialMainMenuDomAdController;
  private readonly scrollbarTrack: Phaser.GameObjects.Rectangle;
  private readonly scrollbarThumb: Phaser.GameObjects.Rectangle;
  private readonly buttons: MenuButton[] = [];
  private readonly escKey: Phaser.Input.Keyboard.Key;
  private state: MenuState = "main";
  private focusedInput: MenuInputField | null = null;
  private authMessageLabel: Phaser.GameObjects.Text | null = null;
  private authMessage = "";
  private scoreboardMode: ScoreboardMode = "waves";
  private scoreboardScores: readonly TrialScoreEntry[] = [];
  private scoreboardOffset = 0;
  private gameplayStarted = false;
  private isTransitioning = false;

  constructor(options: TrialGameMenuControllerOptions) {
    this.scene = options.scene;
    this.onStartMode = options.onStartMode;
    this.onReturnToMainMenu = options.onReturnToMainMenu;
    this.onRestart = options.onRestart;
    this.onLoadCheckpoint = options.onLoadCheckpoint;
    this.onSaveCheckpoint = options.onSaveCheckpoint;
    this.canSaveCheckpoint = options.canSaveCheckpoint;
    this.onRegister = options.onRegister;
    this.onSignIn = options.onSignIn;
    this.getUsername = options.getUsername;
    this.getScoreboard = options.getScoreboard;
    this.overlay = this.scene.add
      .rectangle(0, 0, 1, 1, trialMainMenuTuning.overlayColor, trialMainMenuTuning.overlayAlpha)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(200000);
    this.transition = this.scene.add.graphics().setScrollFactor(0).setDepth(210000).setVisible(false);
    this.mainMenuAds = new TrialMainMenuDomAdController();
    this.scrollbarTrack = this.scene.add.rectangle(0, 0, 8, 1, 0x2a241a, 0).setScrollFactor(0).setDepth(200002);
    this.scrollbarThumb = this.scene.add.rectangle(0, 0, 8, 1, 0xf1c75b, 0).setScrollFactor(0).setDepth(200003);
    this.escKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.scene.input.keyboard!.on("keydown", this.handleKeyboardInput, this);
    this.scene.input.on(Phaser.Input.Events.POINTER_WHEEL, this.handlePointerWheel, this);
    this.scene.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.showMainMenu();
  }

  update(): void {
    if (this.gameplayStarted && this.state === "hidden" && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.showInGameMenu();
    }
    else if (this.state === "inGame" && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.hideMenu();
    }

    this.layout();
  }

  freezesGameplay(): boolean {
    return !this.gameplayStarted && (this.state === "main" || this.state === "scoreboard" || this.state === "auth");
  }

  blocksGameplayInput(): boolean {
    return this.state !== "hidden";
  }

  showLoss(): void {
    if (this.state === "loss") {
      return;
    }

    this.state = "loss";
    this.mainMenuAds.hide();
    this.clearButtons();
    this.overlay.setVisible(true);
    const loss = this.createButton("YOU LOSE", () => undefined);
    loss.label.disableInteractive();
    loss.label.setColor("#ff4b4b").setFontSize(trialMainMenuTuning.lossTextFontSizePixels).setAlpha(0);
    this.buttons.push(loss);
    this.scene.tweens.add({
      targets: loss.label,
      alpha: 1,
      scale: trialMainMenuTuning.lossTextEndScale,
      duration: trialMainMenuTuning.lossTextDurationMs,
      ease: "Cubic.easeOut",
      onStart: () => loss.label.setScale(trialMainMenuTuning.lossTextStartScale),
      onComplete: () => {
        this.clearButtons();
        this.buttons.push(this.createButton("RETRY", () => this.runTransition(this.onRestart)));
        this.buttons.push(this.createButton("RETURN TO MAIN MENU", () => this.runTransition(() => {
          this.gameplayStarted = false;
          this.onReturnToMainMenu();
        })));
        this.layout();
      }
    });
  }

  startModeDirect(mode: TrialGameMode): void {
    this.gameplayStarted = true;
    this.mainMenuAds.hide();
    this.hideMenu();
    this.onStartMode(mode);
  }

  private showMainMenu(): void {
    this.state = "main";
    this.clearButtons();
    this.overlay.setVisible(true);
    this.hideScrollbar();
    this.mainMenuAds.show();
    this.buttons.push(this.createButton(`PLAYER: ${this.getUsername()}`, () => this.showAuth("signin")));
    this.buttons.push(this.createButton("REGISTER", () => this.showAuth("register")));
    this.buttons.push(this.createButton("SIGN IN", () => this.showAuth("signin")));
    this.buttons.push(this.createButton("WAVE MODE", () => this.runTransition(() => this.startMode("waves"))));
    this.buttons.push(this.createButton("APOCALYPSE MODE", () => this.runTransition(() => this.startMode("apocalypse"))));
    this.buttons.push(this.createButton("SHOOTING RANGE", () => this.runTransition(() => this.startMode("shootingRange"))));
    this.buttons.push(this.createButton("LOAD CHECKPOINT", () => this.runTransition(() => void this.onLoadCheckpoint())));
    this.buttons.push(this.createButton("SCOREBOARD", () => void this.showScoreboard()));
    this.buttons.push(this.createButton("SETTINGS", () => undefined));
    this.layout();
  }

  private async showScoreboard(): Promise<void> {
    this.state = "scoreboard";
    this.mainMenuAds.hide();
    this.clearButtons();
    this.overlay.setVisible(true);
    this.scrollbarTrack.setAlpha(0.5);
    this.scrollbarThumb.setAlpha(0.9);
    this.buttons.push(this.createStaticLabel("SCOREBOARD", "#f2e6c9"));
    this.buttons.push(this.createButton(this.scoreboardMode === "waves" ? "WAVE SCORES >" : "< WAVE SCORES", () => {
      this.scoreboardMode = "waves";
      this.scoreboardOffset = 0;
      void this.showScoreboard();
    }));
    this.buttons.push(this.createButton(this.scoreboardMode === "apocalypse" ? "APOCALYPSE SCORES >" : "< APOCALYPSE SCORES", () => {
      this.scoreboardMode = "apocalypse";
      this.scoreboardOffset = 0;
      void this.showScoreboard();
    }));
    this.scoreboardScores = await this.getScoreboard(this.scoreboardMode);
    const visibleScores = this.scoreboardScores.slice(this.scoreboardOffset, this.scoreboardOffset + 8);
    if (visibleScores.length === 0) {
      this.buttons.push(this.createStaticLabel("-"));
    }
    else {
      for (let index = 0; index < visibleScores.length; index++) {
        const score = visibleScores[index];
        this.buttons.push(this.createStaticLabel(`${this.scoreboardOffset + index + 1}. ${score.username}  ${score.label}`, "#d8c79f"));
      }
    }
    this.buttons.push(this.createButton("UP", () => this.scrollScoreboard(-1)));
    this.buttons.push(this.createButton("DOWN", () => this.scrollScoreboard(1)));
    this.buttons.push(this.createButton("BACK", () => this.showMainMenu()));
    this.layout();
  }

  private showAuth(mode: AuthMode): void {
    this.state = "auth";
    this.mainMenuAds.hide();
    this.focusedInput = null;
    this.authMessageLabel = null;
    this.authMessage = "";
    this.clearButtons();
    this.overlay.setVisible(true);
    this.hideScrollbar();
    this.buttons.push(this.createStaticLabel(mode === "register" ? "REGISTER" : "SIGN IN", "#f2e6c9"));
    const username = this.createInputField("PLAYER NAME", 24, false, false);
    const pin = this.createInputField("6 DIGIT PIN", 6, true, true);
    this.buttons.push(username);
    this.buttons.push(pin);

    let confirmPin: MenuButton | null = null;
    if (mode === "register") {
      confirmPin = this.createInputField("CONFIRM PIN", 6, true, true);
      this.buttons.push(confirmPin);
    }

    const message = this.createStaticLabel(this.authMessage, "#e6b15a");
    this.authMessageLabel = message.label;
    this.buttons.push(message);
    this.buttons.push(this.createButton(mode === "register" ? "CREATE PLAYER" : "SIGN IN", () => void (async () => {
      const result = mode === "register"
        ? await this.onRegister(username.input!.value, pin.input!.value, confirmPin?.input?.value ?? "")
        : await this.onSignIn(username.input!.value, pin.input!.value);
      this.authMessage = result.message;
      if (result.success) {
        this.showMainMenu();
        return;
      }
      this.refreshAuthMessage();
    })()));
    this.buttons.push(this.createButton("BACK", () => this.showMainMenu()));
    this.focusedInput = username.input ?? null;
    this.layout();
  }

  private showInGameMenu(): void {
    this.state = "inGame";
    this.mainMenuAds.hide();
    this.clearButtons();
    this.overlay.setVisible(true);
    this.buttons.push(this.createButton("RETURN TO MAIN MENU", () => this.runTransition(() => {
      this.gameplayStarted = false;
      this.onReturnToMainMenu();
    })));
    if (this.canSaveCheckpoint()) {
      this.buttons.push(this.createButton("SAVE CHECKPOINT", () => void this.onSaveCheckpoint()));
    }
    this.buttons.push(this.createButton("SETTINGS", () => undefined));
    this.layout();
  }

  private hideMenu(): void {
    this.state = "hidden";
    this.mainMenuAds.hide();
    this.clearButtons();
    this.overlay.setVisible(false);
  }

  private startMode(mode: TrialGameMode): void {
    this.gameplayStarted = true;
    this.mainMenuAds.hide();
    this.hideMenu();
    this.onStartMode(mode);
  }

  private createButton(text: string, action: () => void): MenuButton {
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${trialMainMenuTuning.itemFontSizePixels}px`,
      color: "#f2e6c9",
      stroke: "#130f0a",
      strokeThickness: 6
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200001).setInteractive({ useHandCursor: true });
    const button = { label, action, isHovered: false };
    label.on(Phaser.Input.Events.POINTER_OVER, () => {
      button.isHovered = true;
      this.layout();
      this.scene.tweens.add({ targets: label, scale: this.getButtonScale(button), duration: 120, ease: "Sine.easeOut" });
    });
    label.on(Phaser.Input.Events.POINTER_OUT, () => {
      button.isHovered = false;
      this.layout();
      this.scene.tweens.add({ targets: label, scale: this.getButtonScale(button), alpha: 1, duration: 120, ease: "Sine.easeOut" });
    });
    label.on(Phaser.Input.Events.POINTER_DOWN, () => {
      label.setAlpha(trialMainMenuTuning.itemPressedAlpha);
      action();
    });
    return button;
  }

  private createStaticLabel(text: string, color = "#f2e6c9"): MenuButton {
    const label = this.scene.add.text(0, 0, text, {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${trialMainMenuTuning.itemFontSizePixels}px`,
      color,
      stroke: "#130f0a",
      strokeThickness: 6
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200001);
    return { label, isHovered: false };
  }

  private createInputField(placeholder: string, maxLength: number, pinOnly: boolean, masked: boolean): MenuButton {
    const input: MenuInputField = { value: "", placeholder, maxLength, pinOnly, masked };
    const background = this.scene.add.rectangle(0, 0, 360, 46, 0x17130e, 0.86)
      .setStrokeStyle(2, 0xf1c75b, 0.7)
      .setScrollFactor(0)
      .setDepth(200000);
    const label = this.scene.add.text(0, 0, placeholder, {
      fontFamily: trialTypographyTuning.fontFamily,
      fontSize: `${Math.round(trialMainMenuTuning.itemFontSizePixels * 0.7)}px`,
      color: "#d8c79f",
      stroke: "#130f0a",
      strokeThickness: 4
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200001).setInteractive({ useHandCursor: true });
    const button: MenuButton = { label, background, input, isHovered: false };
    label.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.focusedInput = input;
      this.refreshInputLabels();
    });
    background.setInteractive({ useHandCursor: true });
    background.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.focusedInput = input;
      this.refreshInputLabels();
    });
    return button;
  }

  private runTransition(action: () => void): void {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    const radius = this.getMaxRadius();
    this.transition.setVisible(true);
    this.drawTransitionCircle(0);
    this.scene.tweens.addCounter({
      from: 0,
      to: radius,
      duration: trialMainMenuTuning.transitionDurationMs,
      ease: "Cubic.easeIn",
      onUpdate: (tween) => this.drawTransitionCircle(tween.getValue() ?? 0),
      onComplete: () => {
        action();
        this.scene.time.delayedCall(trialMainMenuTuning.transitionHoldMs, () => {
          this.scene.tweens.addCounter({
            from: radius,
            to: 0,
            duration: trialMainMenuTuning.transitionDurationMs,
            ease: "Cubic.easeOut",
            onUpdate: (tween) => this.drawTransitionCircle(tween.getValue() ?? 0),
            onComplete: () => {
              this.transition.clear().setVisible(false);
              this.isTransitioning = false;
            }
          });
        });
      }
    });
  }

  private drawTransitionCircle(radius: number): void {
    const focus = this.getTransitionFocus();
    this.transition.clear();
    this.transition.fillStyle(0x000000, 1);
    this.transition.fillCircle(focus.x, focus.y, radius / this.getCameraZoom());
  }

  private getMaxRadius(): number {
    const width = this.scene.cameras.main.width || this.scene.scale.width;
    const height = this.scene.cameras.main.height || this.scene.scale.height;
    const focus = this.getTransitionFocus();
    const zoom = this.getCameraZoom();
    const corners = [
      { x: 0, y: 0 },
      { x: width / zoom, y: 0 },
      { x: 0, y: height / zoom },
      { x: width / zoom, y: height / zoom }
    ];
    return Math.max(...corners.map((corner) => Phaser.Math.Distance.Between(focus.x, focus.y, corner.x, corner.y))) * zoom;
  }

  private getTransitionFocus(): { readonly x: number; readonly y: number } {
    const width = this.scene.cameras.main.width || this.scene.scale.width;
    const height = this.scene.cameras.main.height || this.scene.scale.height;
    const zoom = this.getCameraZoom();
    return {
      x: (width / 2 + trialMainMenuTuning.transitionFocusOffsetPixels.x) / zoom,
      y: (height / 2 + trialMainMenuTuning.transitionFocusOffsetPixels.y) / zoom
    };
  }

  private clearButtons(): void {
    for (const button of this.buttons) {
      button.background?.destroy();
      button.label.destroy();
    }
    this.buttons.length = 0;
    this.authMessageLabel = null;
  }

  private layout(): void {
    const width = this.scene.cameras.main.width || this.scene.scale.width;
    const height = this.scene.cameras.main.height || this.scene.scale.height;
    const zoom = this.getCameraZoom();
    const overscan = trialMainMenuTuning.overlayOverscanMultiplier;
    const overlayWidth = width * overscan / zoom;
    const overlayHeight = height * overscan / zoom;
    this.overlay
      .setPosition(-(overlayWidth - width / zoom) / 2, -(overlayHeight - height / zoom) / 2)
      .setSize(overlayWidth, overlayHeight);
    const centerX = (width / 2 + trialMainMenuTuning.menuOffsetPixels.x) / zoom;
    const centerY = (height / 2 + trialMainMenuTuning.menuOffsetPixels.y) / zoom;
    const step = trialMainMenuTuning.itemSpacingPixels * trialMainMenuTuning.menuScale * trialMainMenuTuning.itemHoverScale / zoom;
    const startY = centerY - ((this.buttons.length - 1) * step) / 2;

    for (let index = 0; index < this.buttons.length; index++) {
      const button = this.buttons[index];
      button.label
        .setPosition(centerX, startY + index * step)
        .setScale(this.getButtonScale(button));
      button.background
        ?.setPosition(centerX, startY + index * step)
        .setSize(380 / zoom, 48 / zoom)
        .setScale(trialMainMenuTuning.menuScale);
    }

    this.refreshInputLabels();
    this.layoutScoreboardScrollbar(centerX, startY, step, zoom);
    this.mainMenuAds.layout();
  }

  private getButtonScale(button: MenuButton): number {
    const hoverScale = button.isHovered ? trialMainMenuTuning.itemHoverScale : 1;
    return trialMainMenuTuning.menuScale * hoverScale / this.getCameraZoom();
  }

  private getCameraZoom(): number {
    return this.scene.cameras.main.zoom || 1;
  }

  private handleKeyboardInput(event: KeyboardEvent): void {
    if (this.state !== "auth" || !this.focusedInput) {
      return;
    }

    if (event.key === "Backspace") {
      this.focusedInput.value = this.focusedInput.value.slice(0, -1);
      this.refreshInputLabels();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      this.focusNextInput();
      return;
    }

    if (event.key.length !== 1 || this.focusedInput.value.length >= this.focusedInput.maxLength) {
      return;
    }

    if (this.focusedInput.pinOnly && !/\d/.test(event.key)) {
      return;
    }

    if (!this.focusedInput.pinOnly && !/[a-zA-Z0-9_-]/.test(event.key)) {
      return;
    }

    this.focusedInput.value += event.key;
    this.refreshInputLabels();
  }

  private handlePointerWheel(_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number): void {
    if (this.state !== "scoreboard") {
      return;
    }

    this.scrollScoreboard(deltaY > 0 ? 1 : -1);
  }

  private focusNextInput(): void {
    const inputs = this.buttons.map((button) => button.input).filter((input): input is MenuInputField => Boolean(input));
    if (inputs.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, inputs.indexOf(this.focusedInput!));
    this.focusedInput = inputs[(currentIndex + 1) % inputs.length];
    this.refreshInputLabels();
  }

  private refreshInputLabels(): void {
    for (const button of this.buttons) {
      if (!button.input) {
        continue;
      }

      const text = button.input.value.length > 0
        ? button.input.masked ? "*".repeat(button.input.value.length) : button.input.value
        : button.input.placeholder;
      button.label.setText(text);
      button.label.setColor(button.input.value.length > 0 ? "#f2e6c9" : "#8f8066");
      button.background?.setStrokeStyle(2, this.focusedInput === button.input ? 0xffd86b : 0xf1c75b, this.focusedInput === button.input ? 1 : 0.45);
    }
  }

  private refreshAuthMessage(): void {
    this.authMessageLabel?.setText(this.authMessage).setColor("#e6b15a");
  }

  private scrollScoreboard(direction: number): void {
    const maxOffset = Math.max(0, this.scoreboardScores.length - 8);
    const nextOffset = Phaser.Math.Clamp(this.scoreboardOffset + direction, 0, maxOffset);
    if (nextOffset === this.scoreboardOffset) {
      return;
    }

    this.scoreboardOffset = nextOffset;
    void this.showScoreboard();
  }

  private layoutScoreboardScrollbar(centerX: number, startY: number, step: number, zoom: number): void {
    if (this.state !== "scoreboard") {
      this.hideScrollbar();
      return;
    }

    const trackHeight = step * 8;
    const trackX = centerX + 360 / zoom;
    const trackY = startY + step * 5;
    this.scrollbarTrack
      .setVisible(true)
      .setPosition(trackX, trackY)
      .setSize(8 / zoom, trackHeight);

    const visibleRatio = this.scoreboardScores.length <= 0 ? 1 : Math.min(1, 8 / this.scoreboardScores.length);
    const thumbHeight = Math.max(28 / zoom, trackHeight * visibleRatio);
    const maxOffset = Math.max(1, this.scoreboardScores.length - 8);
    const progress = maxOffset <= 0 ? 0 : this.scoreboardOffset / maxOffset;
    const thumbTravel = trackHeight - thumbHeight;
    this.scrollbarThumb
      .setVisible(true)
      .setPosition(trackX, trackY - trackHeight / 2 + thumbHeight / 2 + thumbTravel * progress)
      .setSize(8 / zoom, thumbHeight);
  }

  private hideScrollbar(): void {
    this.scrollbarTrack.setVisible(false).setAlpha(0);
    this.scrollbarThumb.setVisible(false).setAlpha(0);
  }
}
