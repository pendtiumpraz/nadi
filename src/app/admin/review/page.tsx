import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canReview } from "@/lib/permissions";
import ReviewQueue from "@/components/ReviewQueue";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canReview(session.user)) redirect("/admin");

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Review Queue</h1>
            <p className="admin-page-desc">Articles, media, and events submitted for review. Approve to publish, or send back to the author with notes.</p>
            <ReviewQueue />
        </div>
    );
}
