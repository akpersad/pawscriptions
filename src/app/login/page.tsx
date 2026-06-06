import { PawMark } from "@/components/PawMark";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="rounded-[1.5rem]"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <PawMark size={76} className="rounded-[1.5rem]" />
          </div>
          <h1 className="mt-5 font-display text-[1.75rem] leading-none text-ink">Pawscriptions</h1>
          <p className="mt-2 text-sm text-muted">Enter the household passphrase to continue.</p>
        </div>
        <div className="rounded-card bg-surface p-6 shadow-[var(--shadow-md)]">
          <LoginForm next={next ?? "/"} />
        </div>
      </div>
    </main>
  );
}
