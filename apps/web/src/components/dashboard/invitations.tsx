import { Mail } from "lucide-react";
import { respondInvitationAction } from "@/app/actions/org";
import { SubmitButton } from "@/components/auth/submit-button";
import type { MyInvitation } from "@/lib/data";

/** Pending invitations for the signed-in email, with accept / decline. */
export function InvitationBanner({ invites, className = "mb-6" }: { invites: MyInvitation[]; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {invites.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-muted bg-accent-subtle px-4 py-3">
          <Mail size={16} className="text-accent" />
          <p className="min-w-0 flex-1 text-[13px] text-fg">
            {i.invitedBy ? <>{i.invitedBy} invited you</> : "You're invited"} to join <strong className="font-medium">{i.orgName}</strong> as {i.role === "admin" ? "an" : "a"} {i.role}.
          </p>
          <form action={respondInvitationAction} className="flex gap-2">
            <input type="hidden" name="id" value={i.id} />
            <SubmitButton name="accept" value="0" size="sm" variant="invisible">
              Decline
            </SubmitButton>
            <SubmitButton name="accept" value="1" size="sm" variant="primary">
              Join {i.orgName}
            </SubmitButton>
          </form>
        </div>
      ))}
    </div>
  );
}
