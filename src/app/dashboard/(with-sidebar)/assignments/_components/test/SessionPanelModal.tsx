"use client";

import { useEffect, useState } from "react";
import { Play, Square, Send, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGradesStore } from "@/store/useGradesStore";
import {
  closeSessionAction,
  listSessionsAction,
  publishSessionAction,
  sessionReportAction,
  startSessionAction,
} from "@/server/actions/assess-sessions";
import type { QuizSessionRow, ActivitySetRow } from "@/server/db/schema";
import type { SessionReport } from "@/server/dal/assess/results";

/* Host (oʻqituvchi) sessiya paneli — sessiya boshlash/yopish, natija,
   jurnalga koʻchirish (docs/ost-loyihalar-arxitektura.md, B boʻlim). */

type Props = {
  set: ActivitySetRow;
  /**
   * Sessiya QAYSI sinfga — `set.classId` EMAS, oʻqituvchi turgan sinf.
   *
   * Toʻplamning `classId` si endi «qayerda tuzilgan» degan maʼlumot va
   * `null` boʻlishi mumkin (kutubxonadagi sinfsiz test). Ijro esa doim
   * sinfga tayanadi: `play/join.ts` roʻyxatni, `publish.ts` bahoni
   * `session.classId` dan oladi. `BaholashWorkspace` allaqachon shu
   * qoidada ishlaydi — bu panel ham unga tenglashtirildi.
   */
  classId: string;
  onClose: () => void;
};

export default function SessionPanelModal({ set, classId, onClose }: Props) {
  const [sessions, setSessions] = useState<QuizSessionRow[]>([]);
  const [reports, setReports] = useState<Record<string, SessionReport>>({});
  const [publishTopicId, setPublishTopicId] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const topics = useGradesStore((s) => s.classDataMap[classId]?.topics ?? []);
  const summativeTopics = topics.filter((t) => t.purpose === "summative");

  useEffect(() => {
    listSessionsAction(set.id).then(setSessions);
  }, [set.id]);

  async function handleStart() {
    setBusy("start");
    try {
      const session = await startSessionAction({ setId: set.id, classId, title: set.title });
      setSessions((prev) => [session, ...prev]);
    } finally {
      setBusy(null);
    }
  }

  async function handleClose(sessionId: string) {
    setBusy(sessionId);
    try {
      const updated = await closeSessionAction(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      const report = await sessionReportAction(sessionId);
      setReports((prev) => ({ ...prev, [sessionId]: report }));
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish(sessionId: string) {
    const topicId = publishTopicId[sessionId];
    if (!topicId) return;
    setBusy(sessionId);
    try {
      const result = await publishSessionAction({ sessionId, topicId });
      alert(`${result.publishedCount} ta baho jurnalga koʻchirildi`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(null);
    }
  }

  function copyLink(joinCode: string | null) {
    if (!joinCode) return;
    const url = `${window.location.origin}/play/${joinCode}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sessiyalar — {set.title}</DialogTitle>
        </DialogHeader>

        <Button onClick={handleStart} disabled={busy === "start"} className="self-start">
          <Play className="size-4" /> Yangi sessiya boshlash
        </Button>

        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground">Hali sessiya yoʻq</p>
          )}
          {sessions.map((session) => {
            const report = reports[session.id];
            return (
              <div key={session.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{session.state}</Badge>
                  {session.joinCode && (
                    <button
                      type="button"
                      onClick={() => copyLink(session.joinCode)}
                      className="flex items-center gap-1 font-mono text-sm hover:underline"
                    >
                      {session.joinCode} <Copy className="size-3" />
                    </button>
                  )}
                  <div className="flex-1" />
                  {session.state === "running" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === session.id}
                      onClick={() => handleClose(session.id)}
                    >
                      <Square className="size-3.5" /> Yopish
                    </Button>
                  )}
                </div>

                {session.state === "completed" && (
                  <div className="flex flex-col gap-2">
                    {report ? (
                      <p className="text-xs text-muted-foreground">
                        Aniqlik: {Math.round(report.accuracy * 100)}% ·{" "}
                        {Math.round(report.completionRate * 100)}% yakunlagan
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const r = await sessionReportAction(session.id);
                          setReports((prev) => ({ ...prev, [session.id]: r }));
                        }}
                      >
                        Natijani koʻrish
                      </Button>
                    )}

                    {set.purpose === "summative" && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={publishTopicId[session.id] ?? ""}
                          onValueChange={(v) =>
                            setPublishTopicId((prev) => ({ ...prev, [session.id]: v }))
                          }
                        >
                          <SelectTrigger className="h-8 flex-1 text-xs">
                            <SelectValue placeholder="Toifa tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            {summativeTopics.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          disabled={!publishTopicId[session.id] || busy === session.id}
                          onClick={() => handlePublish(session.id)}
                        >
                          <Send className="size-3.5" /> Jurnalga
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
