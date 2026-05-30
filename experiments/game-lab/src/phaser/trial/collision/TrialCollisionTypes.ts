export interface TrialCollisionBody {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly radiusPixels: number;
  readonly marginPixels: number;
  readonly collisionExtentsPixels?: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  readonly collisionMarginsPixels?: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
  };
  isBlocking(): boolean;
}

export interface TrialCollisionRect {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}
