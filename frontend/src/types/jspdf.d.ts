declare module "jspdf" {
  export default class jsPDF {
    constructor(options?: unknown);
    internal: {
      pageSize: {
        getWidth: () => number;
        getHeight: () => number;
      };
    };
    setTextColor(...args: number[]): void;
    setFontSize(size: number): void;
    setFont(family: string, style?: string): void;
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { align?: string },
    ): void;
    setDrawColor(...args: number[]): void;
    setLineWidth(width: number): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    setFillColor(...args: number[]): void;
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: string,
    ): void;
    rect(
      x: number,
      y: number,
      w: number,
      h: number,
      style?: string,
    ): void;
    splitTextToSize(text: string, size: number): string[];
    addPage(): void;
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ): void;
    save(filename: string): void;
  }
}
