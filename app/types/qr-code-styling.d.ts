declare module "qr-code-styling" {
  export type Extension = "png" | "jpeg" | "svg" | "webp";
  export type DotType =
    | "square"
    | "dots"
    | "rounded"
    | "classy"
    | "classy-rounded"
    | "extra-rounded";
  export type CornerSquareType = "square" | "dot";
  export type CornerDotType = "square" | "dot";

  export interface GradientColorStop {
    offset: number;
    color: string;
  }

  export interface Gradient {
    type: "linear" | "radial";
    rotation?: number;
    colorStops: GradientColorStop[];
  }

  export interface DotsOptions {
    type?: DotType;
    color?: string;
    gradient?: Gradient;
  }

  export interface BackgroundOptions {
    color?: string;
    image?: string;
  }

  export interface ImageOptions {
    imageSize?: number;
    crossOrigin?: string;
    margin?: number;
    hideBackgroundDots?: boolean;
  }

  export interface QROptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    typeNumber?: number;
    mode?: "Byte" | "Numeric" | "Alphanumeric";
  }

  export interface Options {
    width?: number;
    height?: number;
    margin?: number;
    type?: "svg" | "canvas";
    data: string;
    image?: string;
    imageOptions?: ImageOptions;
    qrOptions?: QROptions;
    backgroundOptions?: BackgroundOptions;
    dotsOptions?: DotsOptions;
    cornersSquareOptions?: { type?: CornerSquareType; color?: string };
    cornersDotOptions?: { type?: CornerDotType; color?: string };
  }

  export interface DownloadOptions {
    name?: string;
    extension?: Extension;
  }

  export default class QRCodeStyling {
    constructor(options?: Options);
    update(options?: Partial<Options>): void;
    append(element: HTMLElement): void;
    download(options?: DownloadOptions): Promise<void>;
  }
}


