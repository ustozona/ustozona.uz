import { listSchools, listTeachersForAssignment } from "@/server/dal/admin/schools";
import SchoolsTable from "./_components/SchoolsTable";

/* Maktablar — CRUD + oʻqituvchi biriktirish (faqat super_admin). */

export default async function AdminSchoolsPage() {
  const [schools, teachers] = await Promise.all([
    listSchools(),
    listTeachersForAssignment(),
  ]);

  return (
    <div className="p-5">
      <SchoolsTable schools={schools} teachers={teachers} />
    </div>
  );
}
