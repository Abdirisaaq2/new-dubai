import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 shadow-[0_1px_0_rgba(234,179,8,0.12)] sm:px-6 md:px-12 md:py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-yellow-500 text-lg font-bold text-yellow-500">
            ND
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-yellow-500 md:text-2xl">
              New Dubai
            </h1>
            <p className="text-xs text-zinc-300 md:text-sm">
              Men Fashion Store
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Link
            href="/login"
            className="flex-1 rounded-lg border border-yellow-500 px-4 py-2 text-center font-medium text-yellow-500 transition hover:bg-yellow-500 hover:text-black sm:flex-none"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-center font-semibold text-black transition hover:opacity-90 sm:flex-none"
          >
            Sign Up
          </Link>
        </div>
      </div>

      <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 md:py-28">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 50%, rgba(0,0,0,0.50) 100%), url("/images/stylish-men-fashion.jpg")',
          }}
        />

        <div className="mx-auto flex min-h-[58vh] max-w-7xl items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-yellow-500/40 bg-black/50 px-4 py-2 text-sm font-bold text-yellow-400">
              Premium Men Fashion Store
            </div>

            <h2 className="mb-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
              Welcome to <span className="block text-yellow-500">New Dubai</span>
            </h2>

            <p className="mb-8 max-w-2xl text-base leading-8 text-zinc-200 md:text-lg">
              A modern men&apos;s fashion e-commerce platform where customers can
              explore clothing, shoes, perfumes, and accessories with a simple
              and secure shopping experience.
            </p>

            <div className="flex w-full max-w-md flex-col gap-4 sm:w-auto sm:max-w-none sm:flex-row">
              <Link
                href="/register"
                className="rounded-xl bg-yellow-500 px-8 py-3 text-center text-lg font-semibold text-black transition hover:opacity-90"
              >
                Create Account
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-yellow-500 px-8 py-3 text-center text-lg font-semibold text-yellow-500 transition hover:bg-yellow-500 hover:text-black"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 md:px-12">
        <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-yellow-400">
          <h3 className="mb-2 text-xl font-bold text-yellow-500">
            Men Fashion
          </h3>
          <p className="text-zinc-300">
            Explore a complete men-only collection designed for modern style and
            convenience.
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-yellow-400">
          <h3 className="mb-2 text-xl font-bold text-yellow-500">
            Easy Access
          </h3>
          <p className="text-zinc-300">
            Sign up, sign in, and manage your account through a clean and simple
            interface.
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-yellow-400">
          <h3 className="mb-2 text-xl font-bold text-yellow-500">
            Secure System
          </h3>
          <p className="text-zinc-300">
            Built with modern technology to support safe authentication and
            reliable performance.
          </p>
        </div>
      </section>
    </main>
  );
}
