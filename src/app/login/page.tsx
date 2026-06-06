import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="h-16 w-16 rounded-2xl" />
          <h1 className="mt-3 text-xl font-semibold">Pawscriptions</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the household passphrase.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
