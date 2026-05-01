import type { Assignment, Grade, Student, TopicColor } from "@/lib/grades-data";

const TOPIC_HEX: Record<TopicColor, string> = {
  blue: "#0EA5E9",
  violet: "#8B5CF6",
  orange: "#FB923C",
  red: "#EF4444",
  green: "#4ADE80",
  teal: "#14B8A6",
  pink: "#EC4899",
  amber: "#F59E0B",
};

export function topicHex(color: TopicColor): string {
  return TOPIC_HEX[color];
}

export function calcStudentTotals(
  students: Student[],
  grades: Grade[]
) {
  return students.map((s) => {
    const sg = grades.filter((g) => g.studentId === s.id && g.score !== null);
    const total = sg.reduce((sum, g) => sum + (g.score ?? 0), 0);
    const max = sg.length * 100;
    const percent = max > 0 ? (total / max) * 100 : 0;
    return { student: s, percent, count: sg.length };
  });
}

export function calcAssignmentAverages(
  assignments: Assignment[],
  grades: Grade[]
) {
  return assignments.map((a) => {
    const ag = grades.filter(
      (g) => g.assignmentId === a.id && g.score !== null
    );
    const total = ag.reduce((sum, g) => sum + (g.score ?? 0), 0);
    const percent = ag.length > 0 ? total / ag.length : 0;
    return { assignment: a, percent };
  });
}

export function barColorForPercent(percent: number): string {
  if (percent >= 90) return "rgb(34 197 94)";
  if (percent >= 80) return "rgb(132 204 22)";
  if (percent >= 70) return "rgb(250 204 21)";
  if (percent >= 60) return "rgb(249 115 22)";
  return "rgb(239 68 68)";
}
