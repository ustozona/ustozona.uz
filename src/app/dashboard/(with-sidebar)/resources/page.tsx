import { getLibrary } from "@/server/dal/library";
import LibraryWorkspace from "./_components/LibraryWorkspace";

/* MATERIALLAR — oʻqituvchi tuzgan mazmunning sinfdan tashqaridagi uyi.

   Nega server komponenti: roʻyxat butunlay bazadan keladi va client
   store'i yoʻq (jurnal/darslardan farqli). Filtr va qidiruv esa mahalliy
   holat — u `LibraryWorkspace` da. */
export default async function ResourcesPage() {
  const items = await getLibrary();
  return <LibraryWorkspace items={items} />;
}
