"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
const APRIL_2026 = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, null, null],
];
const TODAY = 27;

const scheduleItems = [
  {
    id: 1,
    title: "To'garak (1-guruh)",
    time: "9:00 – 11:00",
    startHour: 9,
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
];

const lessonsThisWeek = [
  { id: 1, title: "05. Scratch muhitida vizuallik va ovoz dizayni", group: "Diagnostika testi", classBadge: "6-B", classColor: "blue" },
  { id: 2, title: "05. Scratch muhitida vizuallik va ovoz dizayni", group: "Diagnostika testi", classBadge: "6-D", classColor: "indigo" },
  { id: 3, title: "05. Scratch muhitida vizuallik va ovoz dizayni", group: "Diagnostika testi", classBadge: "6-A", classColor: "green" },
];

const classBadgeStyles: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700",
  indigo: "bg-indigo-100 text-indigo-700",
  green: "bg-green-100 text-green-700",
};

const hours = [8, 9, 10, 11, 12, 13];

function hourLabel(h: number) {
  return `${h.toString().padStart(2, "0")}:00`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}

export default function DashboardPage() {
  return (
    <div
      className="
        grid gap-4 p-4 h-full min-h-0
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        auto-rows-min
      "
    >
      {/* Greeting banner — col-span 2 */}
      <div
        className="
          col-span-1 sm:col-span-2 xl:col-span-2
          relative rounded-2xl overflow-hidden min-h-[180px] flex items-end p-6
        "
        style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2a6b8a 45%, #3db89a 72%, #f0c060 100%)" }}
      >
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-full">
            <polygon points="0,200 200,60 350,120 500,20 650,100 800,40 800,200" fill="black" />
            <polygon points="0,200 150,100 300,150 450,50 600,120 750,70 800,200" fill="black" opacity="0.5" />
          </svg>
        </div>
        <div className="absolute top-5 right-14 h-14 w-14 rounded-full bg-yellow-300/80 blur-md" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-300 text-lg">☀</span>
            <h2 className="text-2xl font-bold text-white tracking-tight">{greeting()}, Foydalanuvchi</h2>
          </div>
          <p className="text-white/75 text-sm">Bugun bajarilishi kerak bo'lgan 1 ta vazifangiz bor.</p>
        </div>
      </div>

      {/* Schedule — col-span 1, takes rows 1-2 on xl */}
      <Card className="col-span-1 sm:col-span-1 xl:col-span-1 xl:row-span-2 rounded-2xl shadow-none flex flex-col overflow-hidden min-w-0 max-h-[600px]">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold">
            Jadval <span className="text-muted-foreground font-normal">Bugun</span>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex-1 overflow-y-auto scrollbar-thin p-0">
          {hours.map((hour) => {
            const event = scheduleItems.find((e) => e.startHour === hour);
            return (
              <div key={hour} className="flex gap-2 border-t border-border/40 min-h-[58px]">
                <div className="w-12 shrink-0 py-2 pl-3 text-[11px] text-muted-foreground font-medium">
                  {hourLabel(hour)}
                </div>
                <div className="flex-1 py-1 pr-2 relative min-w-0">
                  {event && (
                    <div className={`rounded-lg border p-2 text-xs ${event.color}`}>
                      <p className="font-semibold leading-tight truncate">{event.title}</p>
                      <p className="opacity-60 mt-0.5 text-[10px]">{event.time}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Calendar — col-span 1 */}
      <Card className="col-span-1 sm:col-span-1 xl:col-span-1 rounded-2xl shadow-none min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
              </svg>
              <CardTitle className="text-sm font-semibold truncate">Aprel 2026</CardTitle>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/70 py-0.5">{d}</div>
            ))}
          </div>
          {APRIL_2026.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`text-center text-[11px] py-[3px] rounded-full mx-px cursor-pointer transition-colors select-none ${
                    day === TODAY
                      ? "bg-foreground text-background font-bold"
                      : day
                      ? "hover:bg-muted text-foreground"
                      : "text-transparent"
                  }`}
                >
                  {day ?? "."}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lessons — col-span 2 */}
      <Card className="col-span-1 sm:col-span-2 xl:col-span-2 rounded-2xl shadow-none min-w-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            <CardTitle className="text-base font-semibold truncate">
              Darslar <span className="text-muted-foreground font-normal">Shu hafta</span>
            </CardTitle>
            <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[11px] shrink-0">{lessonsThisWeek.length}</Badge>
          </div>
          <Link href="/dashboard/lessons" className="shrink-0">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2">Barchasi</Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Shanba · 2-may</p>
          {lessonsThisWeek.map((lesson) => (
            <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer min-w-0">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{lesson.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                  <span className="text-xs text-muted-foreground truncate">{lesson.group}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <Badge className={`${classBadgeStyles[lesson.classColor]} hover:${classBadgeStyles[lesson.classColor]} border-0 text-[11px] font-medium px-2`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 inline-block mr-1" />
                  {lesson.classBadge}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-[11px] font-medium px-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
                  Rejalashtirilgan
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tasks — col-span 1 */}
      <Card className="col-span-1 sm:col-span-1 xl:col-span-1 rounded-2xl shadow-none min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <CardTitle className="text-sm font-semibold truncate">Vazifalar</CardTitle>
            </div>
            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-3 pb-3">
          <div className="flex items-start gap-2 py-2 min-w-0">
            <div className="h-4 w-4 rounded border border-border shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-snug flex-1 truncate">O'quvchilarning 3-choraklik davo...</p>
            <span className="text-[10px] text-muted-foreground shrink-0">5-apr</span>
          </div>
          <Link href="/dashboard/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 inline-block">
            Barchasi
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
