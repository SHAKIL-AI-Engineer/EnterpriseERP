import { redirect } from "next/navigation";

export default function EmployeeStatusRedirectPage() {
  redirect("/management/human-resource/separations");
}
