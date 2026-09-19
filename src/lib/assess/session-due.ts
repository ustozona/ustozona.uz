/** Sessiya muddati oʻtganmi. Muddatsiz sessiya hech qachon oʻtmaydi.

    Neytral modulda: oʻqituvchi DAL'i (`dal/assess`) ham, ishtirokchi
    qatlami (`dal/play`) ham shu yerdan oladi — play qatlami oʻqituvchi
    DAL'ini import qilmaydi (eslint chegarasi). */
export function isSessionPastDue(session: { dueAt: Date | null }, now = new Date()): boolean {
  return !!session.dueAt && session.dueAt.getTime() < now.getTime();
}
