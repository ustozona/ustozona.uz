"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const initialTasks = [
  { id: 1, title: "O'quvchilarning 3 choraklik davomat hisobotini tayyorlash", due: "Apr 5", done: false, priority: "high" },
  { id: 2, title: "6-A sinfi uchun yangi dars rejasini yaratish", due: "Apr 10", done: false, priority: "medium" },
  { id: 3, title: "Scratch loyihasini tekshirish va baholash", due: "Apr 15", done: true, priority: "low" },
  { id: 4, title: "7-B sinfi ota-onalariga xabar yuborish", due: "Apr 20", done: false, priority: "medium" },
];

const priorityClass: Record<string, string> = {
  high:   "bg-red-100 text-red-600 border-0",
  medium: "bg-yellow-100 text-yellow-600 border-0",
  low:    "bg-green-100 text-green-600 border-0",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pending.length} ta vazifa kutmoqda</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Yangi vazifa
        </Button>
      </div>

      <div className="space-y-2">
        {pending.map((task) => (
          <Card key={task.id} className="rounded-xl shadow-none hover:bg-muted/20 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <button
                onClick={() => toggle(task.id)}
                className="h-5 w-5 rounded border-2 border-border shrink-0 hover:border-primary transition-colors"
              />
              <p className="text-sm font-medium flex-1">{task.title}</p>
              <Badge className={`text-[11px] shrink-0 ${priorityClass[task.priority]}`}>{task.priority}</Badge>
              <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{task.due}</span>
            </CardContent>
          </Card>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-4 pb-1 px-1">
              Bajarilgan
            </p>
            {done.map((task) => (
              <Card key={task.id} className="rounded-xl shadow-none opacity-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => toggle(task.id)}
                    className="h-5 w-5 rounded border-2 border-primary bg-primary shrink-0 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                  <p className="text-sm text-muted-foreground line-through flex-1">{task.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{task.due}</span>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
