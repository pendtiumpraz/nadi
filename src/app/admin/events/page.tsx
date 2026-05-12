import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import EventsClient from "./Client";

// Admin/reviewer — events appear on the public /events page.
export default async function AdminEventsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canReview(session.user)) redirect("/admin");
    return <EventsClient />;
}
