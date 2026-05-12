import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import MediaClient from "./Client";

// Admin/reviewer — media is published content (videos, podcasts, embeds).
export default async function AdminMediaPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canReview(session.user)) redirect("/admin");
    return <MediaClient />;
}
