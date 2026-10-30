import { redirect } from "next/navigation";

export default function ProductionRedirectPage() {
  redirect("/cutting/entry");
}
