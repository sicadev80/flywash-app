export type OpeningItem = {
  width: number;
  height: number;
};

export function sumOpenings(openings: OpeningItem[]) {
  return openings.reduce((sum, o) => sum + Math.max(0, o.width) * Math.max(0, o.height), 0);
}

export function calcFacadeRectangleNet(width: number, height: number, openings: OpeningItem[] = []) {
  const gross = Math.max(0, width) * Math.max(0, height);
  const openingsArea = Math.min(gross, sumOpenings(openings));
  return {
    gross,
    openingsArea,
    net: Math.max(0, gross - openingsArea),
  };
}

export function calcFacadeLShapeNet(
  width1: number,
  height1: number,
  width2: number,
  height2: number,
  openings: OpeningItem[] = [],
) {
  const gross =
    Math.max(0, width1) * Math.max(0, height1) +
    Math.max(0, width2) * Math.max(0, height2);
  const openingsArea = Math.min(gross, sumOpenings(openings));
  return {
    gross,
    openingsArea,
    net: Math.max(0, gross - openingsArea),
  };
}
