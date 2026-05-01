"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ClassListPanel from "@/components/ClassListPanel";

const attendanceData = [
  { student: "Alisher Toshmatov", initials: "AT", present: 48, absent: 2, late: 1 },
  { student: "Barno Yusupova", initials: "BY", present: 44, absent: 5, late: 2 },
  { student: "Dilnoza Karimova", initials: "DK", present: 51, absent: 0, late: 0 },
  { student: "Eldor Xasanov", initials: "EX", present: 42, absent: 7, late: 3 },
  { student: "Feruza Nazarova", initials: "FN", present: 49, absent: 2, late: 0 },
];

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState("6-a");

  return (
    <div className="flex h-full min-h-0 gap-4 p-4">
      <div className="w-[280px] shrink-0 h-full">
        <ClassListPanel
          selectedClassId={selectedClassId}
          onSelect={setSelectedClassId}
        />
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Davomat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">6-A sinfi · 2025–2026</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Jami darslar", value: "51", color: "text-foreground" },
            { label: "O'rtacha davomat", value: "93%", color: "text-green-600" },
            { label: "Sababsiz qolganlar", value: "5", color: "text-red-500" },
          ].map((c) => (
            <Card key={c.label} className="rounded-2xl shadow-none">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium mb-1">{c.label}</p>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl shadow-none">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider">O'quvchi</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Keldi</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Kelmadi</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Kech qoldi</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Davomat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((row) => {
                const total = row.present + row.absent + row.late;
                const pct = Math.round((row.present / total) * 100);
                return (
                  <TableRow key={row.student} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-[10px] font-semibold">
                            {row.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">{row.student}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold text-green-600 tabular-nums">{row.present}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-red-500 tabular-nums">{row.absent}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-yellow-600 tabular-nums">{row.late}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? "bg-green-500" : pct >= 80 ? "bg-yellow-400" : "bg-red-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
