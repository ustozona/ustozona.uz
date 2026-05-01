"use client";

import { useState, useMemo } from "react";
import { CLASS_COLOR_TOKENS, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { CLASSES, classColor } from "@/lib/grades-data";
import ClassListPanel from "@/components/ClassListPanel";
import { cn } from "@/lib/utils";

type Student = {
  id: number;
  name: string;
  initials: string;
  classId: string;
  studentId: string;
  status: "Active" | "Away" | "Inactive";
  grade?: number;
  attendance?: number;
  email?: string;
  parentEmail?: string;
  phone?: string;
};

const STUDENTS: Student[] = [
  { id: 1,  name: "Abbos Mamaraimov",    initials: "AM", classId: "8-a", studentId: "ID-1138", status: "Active", grade: 56,  attendance: 100 },
  { id: 2,  name: "Azizbek Jo'rayev",    initials: "AJ", classId: "8-a", studentId: "ID-1139", status: "Active", grade: 60,  attendance: 88  },
  { id: 3,  name: "Diyorbek Suyundikov", initials: "DS", classId: "8-a", studentId: "ID-1140", status: "Active", grade: 69,  attendance: 92  },
  { id: 4,  name: "Durdona Abduhakimova",initials: "DA", classId: "8-a", studentId: "ID-1141", status: "Active", grade: 69,  attendance: 96  },
  { id: 5,  name: "Hojimurod Hurramov",  initials: "HH", classId: "8-a", studentId: "ID-1142", status: "Active", grade: 78,  attendance: 100 },
  { id: 6,  name: "Madina Eshmirzayeva", initials: "ME", classId: "8-a", studentId: "ID-1143", status: "Active", grade: 62,  attendance: 100 },
  { id: 7,  name: "Marjona Allamurodova",initials: "MA", classId: "8-a", studentId: "ID-1144", status: "Active", grade: 59,  attendance: 88  },
  { id: 8,  name: "Muhammadali Xoliqov", initials: "MX", classId: "8-a", studentId: "ID-1145", status: "Active", grade: 72,  attendance: 96  },
  { id: 9,  name: "Nodira Toshpulatova", initials: "NT", classId: "8-a", studentId: "ID-1146", status: "Active", grade: 81,  attendance: 100 },
  { id: 10, name: "Oybek Raximov",       initials: "OR", classId: "8-a", studentId: "ID-1147", status: "Active", grade: 65,  attendance: 84  },
  { id: 11, name: "Sarvinoz Yusupova",   initials: "SY", classId: "8-a", studentId: "ID-1148", status: "Active", grade: 74,  attendance: 96  },
  { id: 12, name: "Sherzod Mirzayev",    initials: "SM", classId: "8-a", studentId: "ID-1149", status: "Active", grade: 68,  attendance: 92  },
  { id: 13, name: "Zulfiya Nazarova",    initials: "ZN", classId: "8-a", studentId: "ID-1150", status: "Active", grade: 83,  attendance: 100 },
  { id: 14, name: "Alisher Toshmatov",   initials: "AT", classId: "6-a", studentId: "ID-1001", status: "Active", grade: 88,  attendance: 96  },
  { id: 15, name: "Barno Yusupova",      initials: "BY", classId: "6-a", studentId: "ID-1002", status: "Active", grade: 75,  attendance: 88  },
];

const STATUS_STYLES: Record<Student["status"], string> = {
  Active:   "bg-green-100 text-green-700",
  Away:     "bg-orange-100 text-orange-700",
  Inactive: "bg-muted text-muted-foreground",
};

const STATUS_DOT: Record<Student["status"], string> = {
  Active:   "bg-green-500",
  Away:     "bg-orange-500",
  Inactive: "bg-muted-foreground",
};

// Avatar colors — cycle through a set
const AVATAR_COLORS = [
  "bg-rose-400", "bg-orange-400", "bg-amber-400", "bg-emerald-400",
  "bg-teal-400", "bg-sky-400", "bg-indigo-400", "bg-violet-400",
  "bg-pink-400", "bg-red-400", "bg-cyan-400", "bg-purple-400",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

// Icons
function IconGraduationCap({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>
  );
}
function IconUsers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.34-4.34"/>
    </svg>
  );
}
function IconFilter({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function IconSortAsc({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/><path d="M11 12h4"/><path d="M11 16h7"/><path d="M11 20h10"/>
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
function IconTrendUp({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}
function IconClipboard({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  );
}
function IconMail({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function IconPhone({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.56 4.89 2 2 0 0 1 3.53 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function IconExternalLink({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
  );
}

export default function StudentsPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("8-a");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(1);

  const studentsInClass = useMemo(
    () => STUDENTS.filter((s) => s.classId === selectedClassId),
    [selectedClassId]
  );

const selectedStudent = STUDENTS.find(s => s.id === selectedStudentId) ?? null;
  const selectedClass = CLASSES.find(c => c.id === selectedClassId)!;
  const selColor = classColor(selectedClass);
  const selTokens = CLASS_COLOR_TOKENS[selColor];
  const selHex = CLASS_COLOR_HEX[selColor];


  return (
    <div className="flex h-full min-h-0 gap-4 p-4">

      {/* ── Column 1: All Classes ── */}
      <div className="w-[280px] shrink-0 h-full">
        <ClassListPanel
          selectedClassId={selectedClassId}
          onSelect={(id) => { setSelectedClassId(id); setSelectedStudentId(null); }}
        />
      </div>

      {/* ── Col 2+3: Students list — always flex-1, naturally shrinks when col4 appears ── */}
      <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden flex-1 min-w-0">
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <IconUsers className="size-4 text-muted-foreground" />
            <span className="text-base font-bold">Students</span>
            <span className="text-sm text-muted-foreground">({studentsInClass.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconEdit />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconSearch />
            </button>
            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <IconFilter />
            </button>
            <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-muted text-muted-foreground text-xs transition-colors">
              <IconSortAsc />
              Sort: Name
            </button>
            <div className="w-px h-5 bg-border mx-0.5" />
            <button className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity">
              <IconPlus className="size-3" />
              New Student
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-md bg-foreground text-background hover:opacity-90 transition-opacity">
              <IconChevronDown className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5 scrollbar-thin">
          {studentsInClass.map((student) => {
            const isSelected = selectedStudentId === student.id;
            return (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(isSelected ? null : student.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                  isSelected ? "bg-rose-50 border-rose-300" : "border-transparent bg-card hover:bg-muted/30"
                )}
              >
                <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold", avatarColor(student.id))}>
                  {student.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Student ID: {student.studentId}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {student.grade !== undefined && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
                      <IconTrendUp className="text-orange-500" />
                      {student.grade}%
                    </span>
                  )}
                  {student.attendance !== undefined && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                      <IconClipboard className="text-blue-500" />
                      {student.attendance}%
                    </span>
                  )}
                  <span className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", STATUS_STYLES[student.status])}>
                    <span className={cn("size-1.5 rounded-full", STATUS_DOT[student.status])} />
                    {student.status}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Col 4: Student profile — slides in from right when student selected ── */}
      <div className={cn(
        "shrink-0 flex flex-col rounded-2xl bg-card overflow-hidden transition-all duration-300 ease-in-out",
        selectedStudent ? "w-[320px] border border-border opacity-100" : "w-0 opacity-0 pointer-events-none border-0"
      )}>
        {selectedStudent && (
          <div className="w-[320px] flex-1 overflow-y-auto scrollbar-thin">
            {/* Header banner */}
            <div className={cn("relative h-28 shrink-0", selTokens.badgeBg)} style={{ background: `linear-gradient(135deg, ${selHex}40, ${selHex}20)` }}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 size-24 rounded-full opacity-20" style={{ background: selHex }} />
                <div className="absolute top-4 right-16 size-12 rounded-full opacity-15" style={{ background: selHex }} />
              </div>
            </div>

            {/* Avatar overlapping banner */}
            <div className="px-5 pb-4">
              <div className="relative -mt-8 mb-3 flex justify-center">
                <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold ring-4 ring-card", avatarColor(selectedStudent.id))}>
                  {selectedStudent.initials}
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-center mb-2">
                <span className={cn("flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full", STATUS_STYLES[selectedStudent.status])}>
                  <span className={cn("size-1.5 rounded-full", STATUS_DOT[selectedStudent.status])} />
                  {selectedStudent.status}
                </span>
              </div>

              {/* Name & ID */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold leading-tight">{selectedStudent.name}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{selectedStudent.studentId}</p>
              </div>

              {/* View Profile button */}
              <button
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 mb-5"
                style={{ background: selHex }}
              >
                View Profile
              </button>

              {/* Classes */}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-2">Classes</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: `${selHex}20`, color: selHex }}
                  >
                    {selectedClass.name}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <p className="text-sm font-semibold mb-3">Contact</p>
                <div className="flex flex-col gap-3">
                  {[
                    { icon: <IconMail className="size-4 text-muted-foreground" />, label: "Student Email", value: selectedStudent.email },
                    { icon: <IconMail className="size-4 text-muted-foreground" />, label: "Parent Email",  value: selectedStudent.parentEmail },
                    { icon: <IconPhone className="size-4 text-muted-foreground" />, label: "Phone Number", value: selectedStudent.phone },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-muted-foreground/60">{value ?? "Not provided"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
