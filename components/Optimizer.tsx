export type Part = {
  name: string;
  width: number;
  height: number;
  qty: number;
};

export type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  part: Part;
};

export type SheetResult = {
  placements: Placement[];
  usedArea: number;
  wasteArea: number;
  offcuts: { width: number; height: number }[];
};

export function optimize(parts: Part[], sheetW: number, sheetH: number, margin: number): SheetResult[] {
  const expanded: Part[] = [];
  parts.forEach((p) => {
    for (let i = 0; i < p.qty; i++) expanded.push({ ...p, qty: 1 });
  });

  expanded.sort((a, b) => b.width * b.height - a.width * a.height);

  const sheets: SheetResult[] = [];

  type FreeRect = { x: number; y: number; width: number; height: number };

  for (const part of expanded) {
    let placed = false;

    for (const sheet of sheets) {
      const freeRects: FreeRect[] = (sheet as any).freeRects;

      let bestIndex = -1;
      let bestRotated = false;
      let bestWaste = Infinity;

      freeRects.forEach((r, idx) => {
        [[part.width, part.height], [part.height, part.width]].forEach(([w, h], ri) => {
          if (w <= r.width && h <= r.height) {
            const waste = r.width * r.height - w * h;
            if (waste < bestWaste) {
              bestWaste = waste;
              bestIndex = idx;
              bestRotated = ri === 1;
            }
          }
        });
      });

      if (bestIndex >= 0) {
        const r = freeRects.splice(bestIndex, 1)[0];
        const w = bestRotated ? part.height : part.width;
        const h = bestRotated ? part.width : part.height;

        sheet.placements.push({
          x: r.x,
          y: r.y,
          width: w,
          height: h,
          part,
        });

        if (r.width - w > margin) {
          freeRects.push({
            x: r.x + w + margin,
            y: r.y,
            width: r.width - w - margin,
            height: h,
          });
        }

        if (r.height - h > margin) {
          freeRects.push({
            x: r.x,
            y: r.y + h + margin,
            width: r.width,
            height: r.height - h - margin,
          });
        }

        placed = true;
        break;
      }
    }

    if (!placed) {
      const sheet: SheetResult & { freeRects: FreeRect[] } = {
        placements: [],
        usedArea: 0,
        wasteArea: 0,
        offcuts: [],
        freeRects: [
          {
            x: margin,
            y: margin,
            width: sheetW - margin * 2,
            height: sheetH - margin * 2,
          },
        ],
      };
      sheets.push(sheet);
      expanded.unshift(part);
      continue;
    }
  }

  sheets.forEach((sheet: any) => {
    sheet.usedArea = sheet.placements.reduce((s: number, p: Placement) => s + p.width * p.height, 0);
    sheet.wasteArea = sheetW * sheetH - sheet.usedArea;
    sheet.offcuts = sheet.freeRects
      .filter((r: FreeRect) => r.width > 100 && r.height > 100)
      .map((r: FreeRect) => ({ width: Math.round(r.width), height: Math.round(r.height) }));
    delete sheet.freeRects;
  });

  return sheets;
}
