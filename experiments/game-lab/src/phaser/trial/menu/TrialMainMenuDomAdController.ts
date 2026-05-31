import { trialMainMenuAdTuning } from "../tuning/TrialGameplayTuning";

interface DomBanner {
  readonly container: HTMLDivElement;
  readonly image: HTMLImageElement;
  readonly url: string;
}

export class TrialMainMenuDomAdController {
  private static readonly rootId = "trial-main-menu-ads";
  private readonly root: HTMLDivElement;
  private readonly banners: DomBanner[];

  constructor() {
    document.querySelectorAll(`#${TrialMainMenuDomAdController.rootId}`).forEach((node) => node.remove());
    this.root = document.createElement("div");
    this.root.id = TrialMainMenuDomAdController.rootId;
    this.root.className = "trial-main-menu-ads";
    this.root.hidden = true;
    this.banners = [
      this.createBanner("left", trialMainMenuAdTuning.leftBanner.imagePath, trialMainMenuAdTuning.leftBanner.url),
      this.createBanner("right", trialMainMenuAdTuning.rightBanner.imagePath, trialMainMenuAdTuning.rightBanner.url)
    ];
    for (const banner of this.banners) {
      this.root.appendChild(banner.container);
    }
    document.body.appendChild(this.root);
    this.layout();
    window.addEventListener("resize", this.layout);
  }

  show(): void {
    this.root.hidden = !this.canShow();
    this.layout();
  }

  hide(): void {
    this.root.hidden = true;
    document.querySelectorAll<HTMLDivElement>(`.trial-main-menu-ads`).forEach((node) => {
      node.hidden = true;
    });
  }

  layout = (): void => {
    this.root.style.setProperty("--ad-z-index", `${trialMainMenuAdTuning.depth}`);
    this.root.style.setProperty("--ad-side-padding", `${trialMainMenuAdTuning.sidePaddingPixels}px`);
    this.root.style.setProperty("--ad-top-padding", `${trialMainMenuAdTuning.topPaddingPixels}px`);
    this.root.style.setProperty("--ad-bottom-padding", `${trialMainMenuAdTuning.bottomPaddingPixels}px`);
    this.root.style.setProperty("--ad-max-width", `${trialMainMenuAdTuning.maxWidthPixels}px`);
    this.root.style.setProperty("--ad-alpha", `${trialMainMenuAdTuning.alpha}`);
    this.root.style.setProperty("--ad-hover-scale", `${trialMainMenuAdTuning.hoverScale}`);
    this.root.style.setProperty("--ad-left-scale", `${trialMainMenuAdTuning.leftBanner.scale}`);
    this.root.style.setProperty("--ad-left-offset-x", `${trialMainMenuAdTuning.leftBanner.offsetPixels.x}px`);
    this.root.style.setProperty("--ad-left-offset-y", `${trialMainMenuAdTuning.leftBanner.offsetPixels.y}px`);
    this.root.style.setProperty("--ad-right-scale", `${trialMainMenuAdTuning.rightBanner.scale}`);
    this.root.style.setProperty("--ad-right-offset-x", `${trialMainMenuAdTuning.rightBanner.offsetPixels.x}px`);
    this.root.style.setProperty("--ad-right-offset-y", `${trialMainMenuAdTuning.rightBanner.offsetPixels.y}px`);
  };

  destroy(): void {
    window.removeEventListener("resize", this.layout);
    this.root.remove();
  }

  private createBanner(side: "left" | "right", imagePath: string, url: string): DomBanner {
    const container = document.createElement(url ? "a" : "div") as HTMLDivElement;
    container.className = `trial-main-menu-ad trial-main-menu-ad--${side}`;
    if (url) {
      const link = container as unknown as HTMLAnchorElement;
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.ariaLabel = "Open advertisement";
    }

    const image = document.createElement("img");
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;
    container.appendChild(image);
    return { container, image, url };
  }

  private canShow(): boolean {
    if (!trialMainMenuAdTuning.enabled) {
      return false;
    }

    if (!trialMainMenuAdTuning.localOnly) {
      return true;
    }

    return window.location.hostname === "localhost"
      || window.location.hostname === "127.0.0.1"
      || window.location.hostname === "";
  }
}
