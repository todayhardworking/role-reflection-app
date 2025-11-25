import { redirect } from "next/navigation";

export default function LegacyWeeklyReportRedirect() {
  redirect("/weekly/summary");
}
