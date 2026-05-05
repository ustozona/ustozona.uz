"use client";

import { useState, useEffect } from "react";
import { 
  GraduationCap, Plus, Search, Target, ChevronDown, ChevronRight, 
  CheckCircle2, Circle, FileText, ArrowUpRight, Pencil, Trash2, X, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CLASSES, classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const BLOOM_LEVELS = [
  { id: 'bilish', label: 'Bilish', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  { id: 'tushunish', label: 'Tushunish', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'qollash', label: 'Qo\'llash', color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { id: 'tahlil', label: 'Tahlil qilish', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { id: 'baholash', label: 'Baholash', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { id: 'yaratish', label: 'Yaratish', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' }
];

const STANDARDS_DATA = [
  { id: "DT.01", covered: true, bloom: "bilish", desc: "O'quvchi kompyuterda ma'lumotlarni tartibga solish uchun fayllarni yaratish, ularga nom berish, joylashuvini belgilash va papkalarga ajratish amallarini bajara oladi.", file: "01. Fayllar iyerarxiyu..." },
  { id: "DT.02", covered: true, bloom: "tushunish", desc: "O'quvchi matnli hujjatlarni to'g'ri saqlay oladi va Word dasturining standart fayl kengaytmasi .docx ekanligini amalda ko'rsatib bera oladi.", file: "01. Fayllar iyerarxiya..." },
  { id: "DT.03", covered: true, bloom: "qollash", desc: "O'quvchi o'z ma'lumotlarini himoya qilish uchun kamida 8 ta belgidan iborat, tarkibida raqamlar, maxsus belgilar hamda katta va kichik harflar qatnashgan 'kuchli parol' yarata oladi.", file: "02. Raqamli xavfsizl..." },
  { id: "DT.04", covered: true, bloom: "tahlil", desc: "O'quvchi elektron pochtani aloqaning 'yozma' turi ekanligini biladi va undan yozma muloqot vositasi sifatida maqsadli foydalana oladi.", file: "03. Elektron pochta..." },
  { id: "DT.05", covered: true, bloom: "tushunish", desc: "O'quvchi 'elektron tijorat' tushunchasini ta'riflay oladi va uning internet (onlayn) orqali tovar yoki xizmatlarni xarid qilish/sotish jarayoni ekanligini real misollarda tushuntira oladi.", file: "04. Elektron tijorat (..." },
  { id: "DT.06", covered: true, bloom: "bilish", desc: "O'quvchi rastr (bitmap) tasvirlarning qanday shakllanishini tushunadi va ular 'piksel (nuqta) matritsasi' yordamida saqlanishini izohlab bera oladi.", file: "05. Tasvirlar arxitekt..." },
  { id: "DT.07", covered: true, bloom: "tahlil", desc: "O'quvchi vektorli grafika texnikasining ishlash prinsipini biladi. U xarita va grafiklarni yaratishda nima uchun aynan vektor grafikasi qo'llanilishini misollar orqali tushuntirib bera oladi.", file: "05. Tasvirlar arxitekt..." },
  { id: "DT.13", covered: false, bloom: "yaratish", desc: "O'quvchi jadvaldagi quruq raqamli ma'lumotlarni ko'rgazmali (vizual) ko'rinishga keltirish hamda o'sish/pasayish tendensiyalarini tahlil qilish uchun diagramma yoki grafiklarni yarata oladi." },
  { id: "DT.14", covered: false, bloom: "bilish", desc: "O'quvchi ma'lumotlar bazasi bilan ishlashdagi 4 ta asosiy - CRUD amallarining nima ekanini aytib bera oladi (Ma'lumotni Yaratish, O'qish, Yangilash va O'chirish)." },
  { id: "DT.15", covered: false, bloom: "tushunish", desc: "O'quvchi IT-tizimlarni joriy qilish usullarini biladi va \"Direct changeover\" usuli - eski tizimni to'xtatib, o'rniga darhol yangisini ishga tushirish ekanini ta'riflay oladi." },
  { id: "DT.16", covered: false, bloom: "qollash", desc: "O'quvchi IT-loyihaning \"Loyihalash\" bosqichida tizim qanday ishlashini qog'ozda yoki dasturda rejalashtira oladi va foydalanuvchilar uchun dastlabki ekran maketlarini (dizaynini) chizib bera oladi." },
  { id: "DT.17", covered: false, bloom: "bilish", desc: "O'quvchi HTML tilining asosiy vazifasi veb-sahifaning asosiy strukturasi va kontentini (skeletini) yaratish ekanligini tushunadi." },
  { id: "DT.18", covered: false, bloom: "tushunish", desc: "O'quvchi CSS texnologiyasining vazifasini tushunadi va u veb-sahifaning dizayni, rangi va tashqi ko'rinishi (stili) uchun mas'ul ekanligini ko'rsata oladi." },
  { id: "DT.19", covered: false, bloom: "tahlil", desc: "O'quvchi veb-sahifaga tugmalar, harakatlar yoki interaktiv effektlar (foydalanuvchi harakatiga reaksiya) qo'shish uchun JavaScript tilidan foydalanilishini tushuntirib bera oladi." },
];

function Sidebar({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const selected = CLASSES.find(c => c.id === selectedId);
  const hex = selected ? CLASS_COLOR_HEX[classColor(selected)] : undefined;

  return (
    <div className="min-w-0 min-h-0 pr-4">
      <div className="h-full grid min-h-0">
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 gap-3 min-h-[4.5rem]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted">
                <GraduationCap className="size-5 text-foreground" aria-hidden />
              </div>
              <h2 className="heading-section">Barcha sinflar</h2>
            </div>
            <button className="size-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Plus className="size-5" aria-hidden />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="px-5 pt-1 pb-5 space-y-1">
                {CLASSES.map(cls => {
                  const isSelected = cls.id === selectedId;
                  const colorHex = CLASS_COLOR_HEX[classColor(cls)];
                  if (isSelected) {
                    return (
                      <button key={cls.id} onClick={() => onSelect(cls.id)}
                        className="w-full flex items-center text-left gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all"
                        style={{ borderColor: colorHex, backgroundColor: `color-mix(in srgb, ${colorHex} 6.3%, transparent)` }}>
                        <div className="p-3.5 rounded-xl shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${colorHex} 12.5%, transparent)` }}>
                          <GraduationCap className="size-7" aria-hidden style={{ color: colorHex }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="heading-small leading-tight truncate block">{cls.name}</span>
                          {cls.time && <span className="text-xs text-muted-foreground/60 mt-0.5 block truncate">{cls.time}</span>}
                        </div>
                      </button>
                    );
                  }
                  const isNoClass = cls.id === "no-class";
                  return (
                    <button key={cls.id}
                      data-state="closed"
                      onClick={() => !isNoClass && onSelect(cls.id)}
                      className="group w-full flex items-center text-left gap-2.5 px-3 py-2 border-2 border-transparent rounded-lg cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1.5 data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-primary/40">
                      <div
                        className={cn("size-2.5 rounded-full shrink-0", isNoClass && "bg-muted-foreground/30")}
                        style={isNoClass ? undefined : { backgroundColor: colorHex }}
                      />
                      <span className="text-sm text-foreground/70 truncate flex-1 transition-all duration-200 ease-out group-hover:text-foreground group-hover:font-semibold">
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          {selected && hex && (
            <div className="group/stats border-t border-border px-5 py-5 space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <a className="relative group/icon p-3.5 rounded-xl shrink-0 block overflow-hidden"
                  title="Sinfni ochish"
                  href={`/dashboard/classes/${selected.id}`}
                  style={{ backgroundColor: `color-mix(in srgb, ${hex} 12.5%, transparent)` }}>
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200" style={{ backgroundColor: hex }} />
                  <GraduationCap className="relative size-7 transition-opacity duration-200 group-hover/icon:opacity-0" aria-hidden style={{ color: hex }} />
                  <ArrowUpRight className="size-7 absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100 text-white" aria-hidden />
                </a>
                <div className="min-w-0 flex-1">
                  <h4 className="heading-small leading-tight truncate">{selected.name}</h4>
                  {selected.time && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{selected.time}</p>}
                </div>
                <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-200">
                  <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Sinfni tahrirlash">
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" title="Sinfni o'chirish">
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="gap-2 text-center grid grid-cols-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${hex} 8.2%, transparent)` }}>
                  <p className="text-lg font-bold">1</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Std. to'plam</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${hex} 8.2%, transparent)` }}>
                  <p className="text-lg font-bold">19</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Standartlar</p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${hex} 8.2%, transparent)` }}>
                  <p className="text-lg font-bold">8</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">O'tilgan</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Qamrov</span>
                  <span className="font-medium">42%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `42%`, backgroundColor: hex }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StandardsPage() {
  const [selectedClassId, setSelectedClassId] = useState("9-a");
  const [expanded, setExpanded] = useState(true);
  const [standards, setStandards] = useState(STANDARDS_DATA);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"database" | "custom">("database");
  
  // Custom Standards State
  const [customSets, setCustomSets] = useState<{ id: string, name: string, subject: string, grade: string, standards: { code: string, desc: string, bloom: string }[] }[]>([]);
  const [newSetName, setNewSetName] = useState("");
  const [newSetSubject, setNewSetSubject] = useState("");
  const [newSetGrade, setNewSetGrade] = useState("");
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [newStdCode, setNewStdCode] = useState("");
  const [newStdDesc, setNewStdDesc] = useState("");
  const [newStdBloom, setNewStdBloom] = useState("bilish");

  const handleCreateSet = () => {
    if (!newSetName || !newSetSubject || !newSetGrade) return;
    const newSet = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSetName,
      subject: newSetSubject,
      grade: newSetGrade,
      standards: []
    };
    setCustomSets([newSet, ...customSets]);
    setNewSetName("");
    setNewSetSubject("");
    setNewSetGrade("");
    setExpandedSetId(newSet.id);
  };

  const handleAddStandard = (setId: string) => {
    if (!newStdCode || !newStdDesc) return;
    setCustomSets(prev => prev.map(s => {
      if (s.id === setId) {
        return { ...s, standards: [...s.standards, { code: newStdCode, desc: newStdDesc, bloom: newStdBloom }] };
      }
      return s;
    }));
    setNewStdCode("");
    setNewStdDesc("");
    setNewStdBloom("bilish");
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  const toggleCovered = (id: string) => {
    setStandards(prev => prev.map(s => s.id === id ? { ...s, covered: !s.covered } : s));
  };

  const total = standards.length;
  const covered = standards.filter(s => s.covered).length;
  const coveragePct = Math.round((covered / total) * 100);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.8rem)] gap-4 p-4 overflow-hidden">
      <div 
        className="flex-1 min-h-0 grid p-3 -m-3"
        style={{
          gridTemplateColumns: "calc(25% + 0.25rem) calc(75% - 0.25rem)",
          gridTemplateRows: "1fr",
        }}
      >
        <Sidebar selectedId={selectedClassId} onSelect={setSelectedClassId} />

        {/* Main Panel */}
        <div className="min-w-0 min-h-0 grid">
          <div className="bg-card rounded-xl border border-border shadow-sm min-w-0 min-h-0 overflow-hidden flex flex-col h-full">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0 gap-3 min-h-[4.5rem]">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="p-2 rounded-lg bg-muted">
                  <Target className="size-5 text-foreground" aria-hidden />
                </div>
                <h1 className="heading-section">Standartlar</h1>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <button className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-card hover:bg-accent transition-all text-muted-foreground hover:text-foreground">
                  <Search className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl border border-transparent bg-foreground text-background font-semibold hover:opacity-90 transition-all text-sm gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Standart qo'shish
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              <div 
                className="border border-border rounded-xl overflow-hidden"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}
              >
                
                {/* Standard Set Header */}
                <div className={cn("rounded-t-xl transition-all", expanded ? "ring-2 ring-inset ring-primary/40" : "")}>
                  <button 
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                  >
                    <div className="p-3.5 rounded-xl shrink-0 bg-muted text-muted-foreground">
                      {expanded ? <ChevronDown className="size-7" /> : <ChevronRight className="size-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="heading-small truncate text-foreground">Informatika (9-sinf uchun diagnostik test asosida)</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium shrink-0">Maxsus</span>
                      </div>
                      <div className="text-caption text-muted-foreground mt-0.5"> • {total} ta standart • {covered} tasi o'tilgan</div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border tabular-nums shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">{coveragePct}%</span>
                  </button>
                </div>

                {/* Standards List */}
                {expanded && (
                  standards.length === 0 ? (
                    <div className="p-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                        <BookOpen className="text-muted-foreground size-8" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Standartlar biriktirilmagan</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        Ushbu sinf nimalarni o'rganishi kerakligini kuzatish uchun standartlar qo'shing.
                      </p>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-6 w-full sm:w-auto"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Standart qo'shish
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-border px-5 py-3 space-y-2 bg-card/50">
                      {standards.map(st => {
                        const bloomInfo = BLOOM_LEVELS.find(b => b.id === st.bloom) || BLOOM_LEVELS[0];
                        return (
                          <div key={st.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/80 transition-colors group">
                            <button 
                              className="mt-0.5 shrink-0 transition-transform active:scale-95" 
                              onClick={() => toggleCovered(st.id)}
                            >
                              {st.covered ? 
                                <CheckCircle2 className="size-5 text-emerald-500" /> : 
                                <Circle className="size-5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold font-mono text-foreground">{st.id}</span>
                                {st.covered && <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">O'tilgan</span>}
                                <Badge variant="outline" className={cn("border-transparent shadow-none px-1.5 py-0 text-[10px]", bloomInfo.color)}>
                                  {bloomInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed pr-4">{st.desc}</p>
                            </div>
                            {st.file && (
                              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0">
                                <FileText className="size-3.5 text-amber-500/70" />
                                <span className="truncate max-w-[150px]">{st.file}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
                
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            onClick={() => setContextMenu(null)}
          >
            <Trash2 className="size-4" />
            <span>Sinfdan olib tashlash</span>
          </button>
        </div>
      )}

      {/* Add Standards Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-card border border-border shadow-xl shadow-foreground/5 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-xl font-bold text-foreground">Standart qo'shish</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 -mr-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-muted/10 flex flex-col min-h-0 p-6">
              <div className="p-5 border border-border rounded-xl space-y-5 bg-card shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nomi</label>
                  <input 
                    value={newSetName}
                    onChange={e => setNewSetName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all" 
                    placeholder="masalan: Informatika DTS" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fan</label>
                    <input 
                      value={newSetSubject}
                      onChange={e => setNewSetSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all" 
                      placeholder="masalan: Informatika" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sinf</label>
                    <input 
                      value={newSetGrade}
                      onChange={e => setNewSetGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all" 
                      placeholder="masalan: 5" 
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={handleCreateSet}
                    disabled={!newSetName || !newSetSubject || !newSetGrade}
                    className="px-5 py-2 bg-foreground text-background hover:opacity-90 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Yaratish
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col space-y-4">
                <div className="flex items-center justify-between px-1">
                   <h3 className="text-sm font-semibold text-foreground">Standartlar</h3>
                   <span className="text-xs text-muted-foreground">{customSets.length} ta to'plam</span>
                </div>
                
                {customSets.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3 opacity-60">
                    <Target className="size-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground font-medium">Maxsus to'plamlar mavjud emas...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customSets.map(set => (
                       <div key={set.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                         {/* Set Header */}
                         <div 
                           className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                           onClick={() => setExpandedSetId(expandedSetId === set.id ? null : set.id)}
                         >
                           <div className="flex items-center gap-3">
                             <div className="text-muted-foreground">
                               {expandedSetId === set.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                             </div>
                             <span className="text-sm font-semibold text-foreground">{set.name} · {set.subject} · {set.grade}</span>
                           </div>
                           <div className="flex items-center gap-4">
                             <span className="text-xs text-muted-foreground">{set.standards.length} ta standart</span>
                             <button 
                               onClick={(e) => e.stopPropagation()}
                               className="px-4 py-1.5 bg-muted text-foreground hover:bg-muted-foreground/20 font-semibold text-sm rounded-lg transition-colors"
                             >
                               Qo'shish
                             </button>
                           </div>
                         </div>
                         
                         {/* Standards List & Add Input */}
                         {expandedSetId === set.id && (
                           <div className="border-t border-border p-4 bg-muted/10 space-y-4">
                             {set.standards.length === 0 ? (
                               <p className="text-sm text-muted-foreground text-center py-4">
                                 Hali standartlar yo'q. Birinchi standartni pastdan qo'shing.
                               </p>
                             ) : (
                               <div className="space-y-2">
                                 {set.standards.map((std, i) => {
                                   const bloomInfo = BLOOM_LEVELS.find(b => b.id === std.bloom) || BLOOM_LEVELS[0];
                                   return (
                                     <div key={i} className="flex items-start justify-between gap-4 p-3 bg-card border border-border rounded-lg group">
                                       <div className="flex gap-4">
                                         <span className="text-sm font-bold font-mono text-foreground px-2 py-0.5 bg-muted rounded border border-border/50 h-fit shrink-0 mt-0.5">{std.code}</span>
                                         <div>
                                           <p className="text-sm text-foreground/80 pt-0.5 leading-relaxed">{std.desc}</p>
                                           <div className="mt-2.5">
                                             <Badge variant="outline" className={cn("border-transparent shadow-none", bloomInfo.color)}>
                                               {bloomInfo.label}
                                             </Badge>
                                           </div>
                                         </div>
                                       </div>
                                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                         <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><Pencil className="size-3.5" /></button>
                                         <button 
                                           onClick={() => {
                                             setCustomSets(prev => prev.map(s => s.id === set.id ? { ...s, standards: s.standards.filter((_, idx) => idx !== i) } : s));
                                           }}
                                           className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                         >
                                           <Trash2 className="size-3.5" />
                                         </button>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             )}
                             
                             {/* Add Input Row */}
                             <div className="flex items-center gap-3 mt-4">
                               <input 
                                 value={newStdCode}
                                 onChange={e => setNewStdCode(e.target.value)}
                                 className="w-24 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all font-mono"
                                 placeholder="Kod"
                               />
                               <div className="relative shrink-0">
                                 <Combobox
                                   items={BLOOM_LEVELS.map(l => l.label)}
                                   value={BLOOM_LEVELS.find(l => l.id === newStdBloom)?.label ?? null}
                                   onValueChange={(val: string | null) => {
                                     const f = BLOOM_LEVELS.find(l => l.label === val);
                                     if (f) setNewStdBloom(f.id);
                                   }}
                                 >
                                   <ComboboxInput
                                     placeholder="Daraja"
                                     showClear
                                   />
                                   <ComboboxContent>
                                     <ComboboxEmpty>Topilmadi</ComboboxEmpty>
                                     <ComboboxList>
                                       {(item: string) => {
                                         const bInfo = BLOOM_LEVELS.find(b => b.label === item);
                                         return (
                                           <ComboboxItem key={item} value={item}>
                                             <span className={cn("px-2 py-0.5 rounded text-xs font-medium", bInfo?.color)}>
                                               {item}
                                             </span>
                                           </ComboboxItem>
                                         );
                                       }}
                                     </ComboboxList>
                                   </ComboboxContent>
                                 </Combobox>
                               </div>
                               <input 
                                 value={newStdDesc}
                                 onChange={e => setNewStdDesc(e.target.value)}
                                 onKeyDown={e => {
                                   if (e.key === "Enter" && newStdCode && newStdDesc) {
                                     handleAddStandard(set.id);
                                   }
                                 }}
                                 className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-all"
                                 placeholder="Standart ta'rifi..."
                               />
                               <button 
                                 onClick={() => handleAddStandard(set.id)}
                                 disabled={!newStdCode || !newStdDesc}
                                 className="p-2 bg-muted text-foreground hover:bg-muted-foreground/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                               >
                                 <Plus className="size-5" />
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
