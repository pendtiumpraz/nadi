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
            <h1 className="admin-page-title">Pending QC / Review</h1>
            <p className="admin-page-desc">Articles submitted for quality control. Approve to send the consent form to the author, or request changes with notes.</p>
            <ReviewQueue />
        </div>
    );
}
