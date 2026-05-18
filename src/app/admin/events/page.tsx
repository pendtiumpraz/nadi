import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventsClient from "./Client";

// All four roles can land here. The API filters non-publisher queries to
// their own rows; admin / reviewer see every event so they can moderate.
export default async function AdminEventsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    return <EventsClient />;
}
