import { LogoMark } from "@/components/logo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <div className="rounded-2xl border border-line bg-surface p-8 shadow-[var(--br-shadow-lg)] sm:p-10">
        <LogoMark size={40} />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-fg-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div>}
    </>
  );
}

/** Large input sizing for auth forms. */
export const authInput = "h-11 px-3.5 text-[15px]";
