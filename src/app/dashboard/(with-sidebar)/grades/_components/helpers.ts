import { TOPIC_COLOR_HEX, type Assignment, type Grade, type Student, type Topic, type TopicColor } from "@/lib/grades-data";
import { assignmentAverage, studentSummary } from "@/lib/grades-stats";

/** @deprecated Yagona manba: TOPIC_COLOR_HEX (@/lib/grades-data) */
export function topicHex(color: TopicColor): string {
  return TOPIC_COLOR_HEX[color];
}

/**
 * O‘quvchilar "Jami" — endi yagona manbadan (grades-stats).
 * `percent` = SUMMATIV o‘rtacha (formativ chiqarilgan, maxScore normallashgan,
 * Q/T chiqarilgan). `count` = summativ baholar soni.
 */
export function calcStudentTotals(
  students: Student[],
  grades: Grade[],
  assignments: Assignment[],
  topics?: Topic[]
) {
  return students.map((s) => {
    const sm = studentSummary(s.id, assignments, grades, topics);
    return { student: s, percent: sm.summative, count: sm.summativeCount, summary: sm };
  });
}

/** Topshiriq o‘rtachalari — normallashgan, Q/T chiqarilgan (yagona manba). */
export function calcAssignmentAverages(
  assignments: Assignment[],
  grades: Grade[]
) {
  return assignments.map((a) => ({
    assignment: a,
    percent: assignmentAverage(a, grades),
  }));
}

/** @deprecated Yagona manba: scoreBarColor (@/lib/score-colors) */
export { scoreBarColor as barColorForPercent } from "@/lib/score-colors";
