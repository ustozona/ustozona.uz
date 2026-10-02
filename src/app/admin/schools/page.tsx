import { listSchools, listTeachersForAssignment } from "@/server/dal/admin/schools";
import SchoolsTable from "./_components/SchoolsTable";

/* Maktablar — CRUD + oʻqituvchi biriktirish (faqat super_admin). */

export default async function AdminSchoolsPage() {
  // Ketma-ket, `Promise.all` EMAS — sabab `getSignupTrends` izohida (Supavisor).
  const schools = await listSchools();
  const teachers = await listTeachersForAssignment();

  return (
    <div className="p-5">
      <SchoolsTable schools={schools} teachers={teachers} />
    </div>
  );
}
