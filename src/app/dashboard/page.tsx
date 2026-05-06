"use client";

import Image from "next/image";
import Link from "next/link";
import { Sunrise, Sunset, Crown, BookOpen, CalendarDays, ChevronLeft, ChevronRight, SquareCheckBig, Plus, ArrowUpRight, FileText, Trash2, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const todayLessons = [
  { id: 1, title: "1-dars.", unit: "No Unit", subject: "Adabiyot", startTime: "08:00", endTime: "08:45", status: "Rejalashtirilgan", color: "rgb(74, 222, 128)", bg: "rgba(74, 222, 128, 0.125)", badgeBg: "rgba(74, 222, 128, 0.082)", badgeBorder: "rgba(74, 222, 128, 0.19)" },
  { id: 2, title: "2-dars.", unit: "No Unit", subject: "Ona tili", startTime: "11:25", endTime: "12:10", status: "Rejalashtirilgan", color: "rgb(251, 191, 36)", bg: "rgba(251, 191, 36, 0.125)", badgeBg: "rgba(251, 191, 36, 0.082)", badgeBorder: "rgba(251, 191, 36, 0.19)" },
  { id: 3, title: "3-dars.", unit: "No Unit", subject: "Adabiyot", startTime: "13:00", endTime: "13:45", status: "Rejalashtirilgan", color: "rgb(248, 113, 113)", bg: "rgba(248, 113, 113, 0.125)", badgeBg: "rgba(248, 113, 113, 0.082)", badgeBorder: "rgba(248, 113, 113, 0.19)" },
  { id: 4, title: "4-dars.", unit: "No Unit", subject: "Ona tili", startTime: "15:30", endTime: "16:15", status: "Rejalashtirilgan", color: "rgb(244, 114, 182)", bg: "rgba(244, 114, 182, 0.125)", badgeBg: "rgba(244, 114, 182, 0.082)", badgeBorder: "rgba(244, 114, 182, 0.19)" },
  { id: 5, title: "5-dars.", unit: "No Unit", subject: "Tarix", startTime: "17:10", endTime: "17:55", status: "Rejalashtirilgan", color: "rgb(251, 146, 60)", bg: "rgba(251, 146, 60, 0.125)", badgeBg: "rgba(251, 146, 60, 0.082)", badgeBorder: "rgba(251, 146, 60, 0.19)" },
];

const monthNamesUz = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    setCurrentMonthDate(new Date());
    setSelectedDate(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const isDay = hour >= 6 && hour < 19;
  
  const getTimelineTop = () => {
    if (hour < 7) return -10;
    if (hour > 18) return 120 * 12 + 10;
    return (hour - 7) * 120 + (minute * 2) + 1;
  };
  
  const greetingText = () => {
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  
  const prevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  const handleDateClick = (day: number) => setSelectedDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day));
  
  const hasLesson = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  };
  
  const isBlockedDay = (year: number, month: number, day: number) => {
    return [12, 13, 14, 15].includes(day); // Testing blocks
  };
  
  const isSameDay = (d1: Date, y: number, m: number, d: number) => {
    return d1.getFullYear() === y && d1.getMonth() === m && d1.getDate() === d;
  };

  const renderCalendarDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const prevDays = Array.from({ length: firstDay }, (_, i) => daysInPrevMonth - firstDay + i + 1);
    const currDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const totalRendered = prevDays.length + currDays.length;
    const neededNext = 42 - totalRendered;
    const nextDays = Array.from({ length: neededNext }, (_, i) => i + 1);
    
    return { year, month, prevDays, currDays, nextDays };
  };
  
  const cal = mounted ? renderCalendarDays() : null;

  const imageSrc = isDay ? "/day.png" : "/night.png";
  const Icon = isDay ? Sunrise : Sunset;
  const iconColor = isDay ? "text-yellow-300" : "text-indigo-300";

  if (!mounted) {
    return <div className="flex-1 min-h-0 bg-card/50 h-full animate-pulse"></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex flex-col px-4 py-2 md:p-8 lg:px-12">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-[1fr] gap-4">
          
          {/* Left Column (Hero & Lessons) */}
          <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
            {/* HERO CARD */}
            <div className="relative overflow-hidden rounded-xl px-5 py-7 md:px-8 md:py-12 text-white">
              <div className={`absolute inset-0 bg-gradient-to-br z-0 ${isDay ? "from-amber-400 via-orange-500 to-rose-500" : "from-slate-800 via-indigo-900 to-purple-900"}`} />
              <Image 
                alt="Manzara" 
                fill 
                className="object-cover object-center z-[1]" 
                src={imageSrc}
                priority
              />
              <div className="absolute inset-0 bg-black/10 z-[2]" />
              <div className="relative z-10 flex items-start justify-between [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]">
                <div className="flex flex-col gap-1 md:gap-1.5">
                  <div className="flex items-center gap-2.5 md:gap-3">
                    <Icon className={`size-7 md:size-8 drop-shadow-lg ${iconColor}`} />
                    <h2 className="text-xl md:text-2xl font-bold">{greetingText()}, Otabek</h2>
                  </div>
                  <p className="text-sm text-white max-w-md text-[15px]">Bugun 5 ta darsingiz va bajarishingiz kerak bo'lgan 1 ta vazifangiz bor.</p>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10 z-[3]" />
              <div className="absolute -bottom-8 -right-4 size-32 rounded-full bg-white/5 z-[3]" />
            </div>

            {/* LESSONS CARD */}
            <div className="bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm py-0 gap-0 h-full flex flex-col overflow-hidden">
              <div className="px-5 pt-6 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted">
                      <BookOpen className="size-5 text-foreground" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <h2 className="text-xl"><span className="font-semibold">Shu haftadagi</span> <span className="font-normal text-muted-foreground">darslar</span></h2>
                    </div>
                  </div>
                  <Link href="/dashboard/lessons" className="hidden md:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Barchasi
                  </Link>
                </div>
              </div>
              <div className="px-0 pb-0 pt-0 flex-1 min-h-0 relative overflow-hidden">
                <style>{`
                  [data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
                  [data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}
                `}</style>
                <div data-radix-scroll-area-viewport="" className="h-full w-full overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="space-y-4 px-5 pb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-foreground">Bugun</span>
                        <span className="text-xs text-muted-foreground">6-may</span>
                      </div>
                      <div className="space-y-2">
                        {todayLessons.map(lesson => (
                          <div key={lesson.id} className="group rounded-xl border p-4 cursor-pointer data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-primary/40 transition-colors duration-300 ease-out hover:bg-muted/40 hover:border-border/80 bg-background border-border">
                            <div className="flex items-center gap-3">
                              <div className="p-3.5 rounded-xl shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3" style={{ backgroundColor: lesson.bg }}>
                                <FileText className="size-7" style={{ color: lesson.color }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors">{lesson.title}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: lesson.color }} />
                                  <span className="truncate max-w-[320px]">
                                    {lesson.unit} &bull; {lesson.startTime} - {lesson.endTime}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-4">
                                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                  <span className="size-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
                                  {lesson.status}
                                </span>
                              </div>
                              <div className="shrink-0 group/actions relative flex items-center before:content-[''] before:absolute before:-inset-y-4 before:-left-10 before:-right-4">
                                <div className="relative z-10 flex items-center gap-0.5 overflow-hidden max-w-0 opacity-0 group-hover/actions:max-w-16 group-hover/actions:opacity-100 transition-all duration-200 ease-out">
                                  <button className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-destructive hover:bg-muted transition-colors shrink-0">
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column (Schedule) */}
          <div className="h-full min-h-0">
            <div className="bg-card text-card-foreground rounded-xl border border-border/50 shadow-sm flex flex-col gap-0 py-0 overflow-hidden h-full">
              <div className="flex items-center px-5 shrink-0" style={{ height: 68 }}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-muted">
                    <Clock className="size-5 text-foreground" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <h2 className="text-xl"><span className="font-semibold">Bugungi</span> <span className="font-normal text-muted-foreground">darslar</span></h2>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <div className="relative border-t border-border/50 flex">
                    <div className="w-12 shrink-0 border-r border-border/50">
                      {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((h, i) => (
                        <div key={i} className="flex items-start justify-center pt-1 border-b border-border/50" style={{ height: 120 }}>
                          <span className="text-[10px] text-muted-foreground font-medium">{h}:00</span>
                        </div>
                      ))}
                    </div>
                    <div className="relative flex-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-b border-border/50" style={{ height: 120 }}>
                          <div className="border-b border-border/20 mt-[60px]" />
                        </div>
                      ))}
                      
                      {/* 9-B Class */}
                      <div className="absolute left-1 right-1 rounded-lg z-[1] group transition-shadow overflow-hidden" style={{ top: 121, height: 88, backgroundColor: "rgba(74, 222, 128, 0.125)" }}>
                        <div className="h-full flex flex-col px-2 pt-2 pb-2">
                          <div className="relative shrink-0 mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <p className="text-xs font-bold truncate min-w-0">9-B</p>
                              <span className="text-[10px] shrink-0 whitespace-nowrap opacity-70">8:00 - 8:45</span>
                            </div>
                            <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="aspect-square h-full rounded-md bg-black/[0.08] hover:bg-black/[0.15] dark:bg-white/[0.12] dark:hover:bg-white/[0.20] flex items-center justify-center transition-colors cursor-pointer" title="Darsni ochish">
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 9-A Class */}
                      <div className="absolute left-1 right-1 rounded-lg z-[1] group transition-shadow overflow-hidden" style={{ top: 531, height: 88, backgroundColor: "rgba(251, 191, 36, 0.125)" }}>
                        <div className="h-full flex flex-col px-2 pt-2 pb-2">
                          <div className="relative shrink-0 mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <p className="text-xs font-bold truncate min-w-0">9-A</p>
                              <span className="text-[10px] shrink-0 whitespace-nowrap opacity-70">11:25 - 12:10</span>
                            </div>
                            <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="aspect-square h-full rounded-md bg-black/[0.08] hover:bg-black/[0.15] dark:bg-white/[0.12] dark:hover:bg-white/[0.20] flex items-center justify-center transition-colors cursor-pointer" title="Darsni ochish">
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 8-A Class */}
                      <div className="absolute left-1 right-1 rounded-lg z-[1] group transition-shadow overflow-hidden" style={{ top: 721, height: 88, backgroundColor: "rgba(248, 113, 113, 0.125)" }}>
                        <div className="h-full flex flex-col px-2 pt-2 pb-2">
                          <div className="relative shrink-0 mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <p className="text-xs font-bold truncate min-w-0">8-A</p>
                              <span className="text-[10px] shrink-0 whitespace-nowrap opacity-70">13:00 - 13:45</span>
                            </div>
                            <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="aspect-square h-full rounded-md bg-black/[0.08] hover:bg-black/[0.15] dark:bg-white/[0.12] dark:hover:bg-white/[0.20] flex items-center justify-center transition-colors cursor-pointer" title="Darsni ochish">
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 7-D Class */}
                      <div className="absolute left-1 right-1 rounded-lg z-[1] group transition-shadow overflow-hidden" style={{ top: 1021, height: 88, backgroundColor: "rgba(244, 114, 182, 0.125)" }}>
                        <div className="h-full flex flex-col px-2 pt-2 pb-2">
                          <div className="relative shrink-0 mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <p className="text-xs font-bold truncate min-w-0">7-D</p>
                              <span className="text-[10px] shrink-0 whitespace-nowrap opacity-70">15:30 - 16:15</span>
                            </div>
                            <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="aspect-square h-full rounded-md bg-black/[0.08] hover:bg-black/[0.15] dark:bg-white/[0.12] dark:hover:bg-white/[0.20] flex items-center justify-center transition-colors cursor-pointer" title="Darsni ochish">
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 8-B Class */}
                      <div className="absolute left-1 right-1 rounded-lg z-[1] group transition-shadow overflow-hidden" style={{ top: 1221, height: 88, backgroundColor: "rgba(251, 146, 60, 0.125)" }}>
                        <div className="h-full flex flex-col px-2 pt-2 pb-2">
                          <div className="relative shrink-0 mb-0.5">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <p className="text-xs font-bold truncate min-w-0">8-B</p>
                              <span className="text-[10px] shrink-0 whitespace-nowrap opacity-70">17:10 - 17:55</span>
                            </div>
                            <div className="absolute top-0 right-0 bottom-0 flex items-stretch gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="aspect-square h-full rounded-md bg-black/[0.08] hover:bg-black/[0.15] dark:bg-white/[0.12] dark:hover:bg-white/[0.20] flex items-center justify-center transition-colors cursor-pointer" title="Darsni ochish">
                                <ArrowUpRight className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current Time Line */}
                      <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-1000 ease-linear" style={{ top: getTimelineTop() }}>
                        <div className="size-2 rounded-full bg-rose-500 -ml-1" />
                        <div className="flex-1 h-[2px] bg-rose-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Calendar & Tasks) */}
          <div className="h-full min-h-0 flex flex-col gap-0">
            <div className="bg-card text-card-foreground gap-6 rounded-xl border border-border/50 shadow-sm py-5 flex flex-col flex-1 min-h-0">
              <div className="px-6 flex flex-col flex-1 min-h-0">
                <div className="shrink-0">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-muted cursor-pointer hover:bg-accent transition-colors" onClick={() => { setCurrentMonthDate(new Date()); setSelectedDate(new Date()); }} title="Bugunga qaytish">
                        <CalendarDays className="size-5 text-foreground" />
                      </div>
                      {cal && (
                        <div className="flex items-baseline gap-1.5 text-xl tracking-tight">
                          <span className="font-semibold">{monthNamesUz[cal.month]}</span>
                          <span className="font-normal text-muted-foreground">({cal.year}-yil)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={prevMonth} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer" aria-label="Oldingi oy">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={nextMonth} className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer" aria-label="Keyingi oy">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 mb-1 mt-2">
                    {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map(d => (
                      <div key={d} className="text-center text-sm font-bold text-foreground py-2">{d}</div>
                    ))}
                  </div>
                  {cal && (
                    <div className="grid grid-cols-7">
                      {/* Previous Month Days */}
                      {cal.prevDays.map((d, i) => (
                        <div key={`prev-${i}`} className="relative flex justify-center py-0.5">
                          <button disabled className="relative z-10 h-9 w-9 inline-flex flex-col items-center justify-center text-sm transition-colors rounded-full opacity-30 pointer-events-none">
                            <span className="leading-none">{d}</span>
                          </button>
                        </div>
                      ))}
                      {/* Current Month Days */}
                      {cal.currDays.map((d) => {
                        const isToday = isSameDay(new Date(), cal.year, cal.month, d);
                        const isSelected = isSameDay(selectedDate, cal.year, cal.month, d);
                        const hasEvent = hasLesson(cal.year, cal.month, d);
                        const blocked = isBlockedDay(cal.year, cal.month, d);
                        return (
                          <div key={`curr-${d}`} className="relative flex justify-center py-0.5 group/day">
                            <button 
                              onClick={() => !blocked && handleDateClick(d)}
                              className={`relative z-10 h-9 w-9 inline-flex flex-col items-center justify-center text-sm transition-all rounded-full ${!blocked ? "hover:bg-accent/80 cursor-pointer" : "cursor-default text-muted-foreground/40"} ${isToday && !blocked ? "font-bold text-primary" : ""} ${isSelected && !isToday && !blocked ? "bg-primary/10 font-semibold" : ""}`}
                              style={isToday && !blocked ? { border: '2px solid #2e3138' } : undefined}
                            >
                              <span className={`leading-none mt-0.5 ${blocked ? "line-through decoration-[1.5px]" : ""}`}>{d}</span>
                              {hasEvent && !blocked && (
                                <span className="absolute bottom-1.5 size-[3px] rounded-full bg-emerald-500 shadow-[0_0_2px_rgba(16,185,129,0.5)] transition-transform group-hover/day:scale-125" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                      {/* Next Month Days */}
                      {cal.nextDays.map((d, i) => (
                        <div key={`next-${i}`} className="relative flex justify-center py-0.5">
                          <button disabled className="relative z-10 h-9 w-9 inline-flex flex-col items-center justify-center text-sm transition-colors rounded-full opacity-30 pointer-events-none">
                            <span className="leading-none">{d}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="my-5 shrink-0" />

                <div className="flex-1 min-h-0 relative overflow-hidden">
                  <div className="h-full w-full overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-muted">
                          <SquareCheckBig className="size-5 text-foreground" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <h3 className="text-xl font-semibold">Vazifalar</h3>
                        </div>
                      </div>
                      <button className="h-7 w-7 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground transition-colors cursor-pointer">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2.5">
                      <div className="px-3 pr-5 py-5 rounded-lg transition-colors bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <button type="button" role="checkbox" className="size-4 shrink-0 rounded-[4px] border-2 border-neutral-300 bg-white transition-shadow cursor-pointer" />
                          <h4 className="font-medium flex-1 text-sm truncate text-foreground">Oʻquvchilarning 3 choraklik davomatlarini qoʻyib chiqish</h4>
                          <span className="text-xs shrink-0 text-rose-500 font-medium">5 Apr</span>
                        </div>
                      </div>
                    </div>

                    <Link href="/dashboard/tasks" className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-3">
                      Barchasi
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
