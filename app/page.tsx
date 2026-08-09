"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { optimize, Part } from "../components/Optimizer";

const colors = [
  "#2563EB","#10B981","#F59E0B","#EC4899","#8B5CF6","#6366F1","#14B8A6","#F97316"
];

export default function Page() {
  const [project, setProject] = useState("Kitchen Set A01");
  const [sheetW, setSheetW] = useState(2440);
  const [sheetH, setSheetH] = useState(1220);
  const [thickness, setThickness] = useState(18);
  const [margin, setMargin] = useState(5);

  const [parts, setParts] = useState<Part[]>([
    { name: "Sisi kiri", width: 800, height: 400, qty: 2 },
    { name: "Sisi kanan", width: 800, height: 400, qty: 2 },
    { name: "Top", width: 600, height: 400, qty: 1 },
    { name: "Bottom", width: 600, height: 400, qty: 1 },
    { name: "Rak tengah", width: 560, height: 350, qty: 3 },
  ]);

  const reportRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => optimize(parts, sheetW, sheetH, margin), [parts, sheetW, sheetH, margin]);

  const totalUsed = result.reduce((s, r) => s + r.usedArea, 0);
  const totalArea = result.length * sheetW * sheetH;
  const wastePct = totalArea ? ((totalArea - totalUsed) / totalArea) * 100 : 0;

  const exportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    pdf.addImage(img, "PNG", 0, 0, canvas.width * ratio, canvas.height * ratio);
    pdf.save(`${project}.pdf`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">WoodCut Optimizer</h1>
          <p className="text-slate-500">Optimasi pemotongan kayu &amp; export PDF</p>
        </div>
        <button className="btn flex items-center gap-2" onClick={exportPDF}>
          <Download size={18}/> Export PDF
        </button>
      </div>

      <div ref={reportRef} className="grid lg:grid-cols-[420px,1fr] gap-6">
        <div className="card p-5">
          <h2 className="text-xl font-semibold mb-4">Input Proyek</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-500">Nama proyek</label>
              <input className="input mt-1" value={project} onChange={(e)=>setProject(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-500">Panjang</label>
                <input type="number" className="input mt-1" value={sheetW} onChange={(e)=>setSheetW(+e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-500">Lebar</label>
                <input type="number" className="input mt-1" value={sheetH} onChange={(e)=>setSheetH(+e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-500">Ketebalan</label>
                <input type="number" className="input mt-1" value={thickness} onChange={(e)=>setThickness(+e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-500">Trim margin</label>
                <select className="input mt-1" value={margin} onChange={(e)=>setMargin(+e.target.value)}>
                  <option value={5}>5 mm</option>
                  <option value={10}>10 mm</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Daftar potongan</h3>
              <button
                className="text-sm text-blue-600 flex items-center gap-1"
                onClick={() => setParts([...parts, { name: "Part baru", width: 300, height: 300, qty: 1 }])}
              >
                <Plus size={16}/> Tambah
              </button>
            </div>

            <div className="space-y-3">
              {parts.map((p, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      className="input"
                      value={p.name}
                      onChange={(e)=>{
                        const copy=[...parts];
                        copy[i].name=e.target.value;
                        setParts(copy);
                      }}
                    />
                    <button
                      className="ml-2 text-slate-500"
                      onClick={() => setParts(parts.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" className="input" value={p.width} onChange={(e)=>{const c=[...parts]; c[i].width=+e.target.value; setParts(c);}} />
                    <input type="number" className="input" value={p.height} onChange={(e)=>{const c=[...parts]; c[i].height=+e.target.value; setParts(c);}} />
                    <input type="number" className="input" value={p.qty} onChange={(e)=>{const c=[...parts]; c[i].qty=+e.target.value; setParts(c);}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Stat title="Lembar" value={String(result.length)} color="text-blue-600"/>
            <Stat title="Waste" value={`${wastePct.toFixed(1)}%`} color="text-amber-600"/>
            <Stat title="Terpakai" value={`${(totalUsed/1_000_000).toFixed(2)} m²`} color="text-emerald-600"/>
            <Stat title="Sisa" value={`${((totalArea-totalUsed)/1_000_000).toFixed(2)} m²`} color="text-violet-600"/>
          </div>

          {result.map((sheet, idx) => (
            <div key={idx} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Lembar {idx + 1}</h3>
                  <p className="text-sm text-slate-500">{sheetW} × {sheetH} mm • {thickness} mm</p>
                </div>
                <div className="text-sm text-slate-500">
                  Waste {(sheet.wasteArea / (sheetW * sheetH) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="overflow-auto">
                <div
                  className="relative rounded-2xl border border-slate-300 bg-white"
                  style={{ width: 720, height: 360 }}
                >
                  {sheet.placements.map((p, i) => {
                    const scaleX = 720 / sheetW;
                    const scaleY = 360 / sheetH;
                    return (
                      <div
                        key={i}
                        className="absolute rounded-xl text-white text-xs font-medium flex flex-col items-center justify-center text-center p-1"
                        style={{
                          left: p.x * scaleX,
                          top: p.y * scaleY,
                          width: p.width * scaleX,
                          height: p.height * scaleY,
                          background: colors[i % colors.length],
                        }}
                      >
                        <div>{p.part.name}</div>
                        <div className="opacity-90">{p.width} × {p.height}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {sheet.offcuts.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium mb-2">Sisa yang masih bisa dipakai</div>
                  <div className="flex flex-wrap gap-2">
                    {sheet.offcuts.map((o, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        {o.width} × {o.height} mm
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="card p-5">
            <h3 className="text-lg font-semibold mb-4">Daftar potongan</h3>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2">Nama</th>
                    <th className="text-left py-2">Panjang</th>
                    <th className="text-left py-2">Lebar</th>
                    <th className="text-left py-2">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((p, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{p.name}</td>
                      <td>{p.width}</td>
                      <td>{p.height}</td>
                      <td>{p.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`text-2xl font-bold mt-2 ${color}`}>{value}</div>
    </div>
  );
}
