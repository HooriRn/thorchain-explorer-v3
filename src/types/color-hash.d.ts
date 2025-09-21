declare module "color-hash" {
  interface ColorHashOptions {
    lightness?: number;
    saturation?: number;
    hash?: string;
  }

  class ColorHash {
    constructor(options?: ColorHashOptions);
    hex(str: string): string;
    rgb(str: string): [number, number, number];
    hsl(str: string): [number, number, number];
  }

  export = ColorHash;
}
