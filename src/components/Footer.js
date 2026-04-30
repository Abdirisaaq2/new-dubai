"use client";

export default function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-yellow-500/20 bg-black text-white">
      {/* background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(234,179,8,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(234,179,8,0.10),transparent_28%),linear-gradient(135deg,#000000_0%,#070707_45%,#111111_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,rgba(250,204,21,0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgba(250,204,21,0.35)_1px,transparent_1px)] bg-[size:46px_46px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-12 md:grid-cols-3">
          {/* LEFT */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-yellow-500 bg-yellow-500/10 text-xl font-black text-yellow-400 shadow-lg shadow-yellow-500/10">
                ND
              </div>

              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-yellow-400 sm:text-4xl">
                  New Dubai
                </h2>
                <p className="mt-1 text-sm font-medium text-zinc-300">
                  Men Fashion Shop
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-300">
              Premium men fashion store focused on style, confidence,
              elegance, and a clean shopping experience for modern customers.
            </p>

            <h3 className="mt-7 text-xl font-extrabold text-yellow-400">
              Social Media
            </h3>

            <div className="mt-4 flex items-center gap-4">
              <a
                href="https://wa.me/252634454644"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/40 bg-zinc-950/80 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-yellow-400 hover:bg-yellow-500/10"
              >
                <img
                  src="/social/whatsapp.png"
                  alt="WhatsApp"
                  className="h-6 w-6 object-contain transition duration-300 group-hover:scale-110"
                />
              </a>

              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/40 bg-zinc-950/80 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-yellow-400 hover:bg-yellow-500/10"
              >
                <img
                  src="/social/facebook.png"
                  alt="Facebook"
                  className="h-6 w-6 object-contain transition duration-300 group-hover:scale-110"
                />
              </a>

              <a
                href="https://instagram.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/40 bg-zinc-950/80 shadow-lg shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-yellow-400 hover:bg-yellow-500/10"
              >
                <img
                  src="/social/instagram.png"
                  alt="Instagram"
                  className="h-6 w-6 object-contain transition duration-300 group-hover:scale-110"
                />
              </a>
            </div>
          </div>

          {/* CENTER */}
          <div>
            <h3 className="text-2xl font-extrabold text-yellow-400 sm:text-3xl">
              Why Choose Us
            </h3>

            <ul className="mt-6 space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 7h11l4 4v6H3z" />
                    <circle cx="7.5" cy="17.5" r="1.5" />
                    <circle cx="16.5" cy="17.5" r="1.5" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">
                  Fast delivery service
                </span>
              </li>

              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">
                  Secure checkout system
                </span>
              </li>

              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 9l4-4h10l4 4-9 10L3 9z" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">
                  Premium quality products
                </span>
              </li>

              <li className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur transition hover:border-yellow-500/30 hover:bg-yellow-500/5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="8" r="3" />
                    <path d="M12 11l6 3v3l-6 4-6-4v-3l6-3z" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">
                  Trusted men fashion brand
                </span>
              </li>
            </ul>
          </div>

          {/* RIGHT */}
          <div>
            <h3 className="text-2xl font-extrabold text-yellow-400 sm:text-3xl">
              Contact Us
            </h3>

            <div className="mt-6 space-y-4 text-sm text-gray-400">
              <p className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12.81.3 1.6.57 2.36a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 5 5l1.72-1.12a2 2 0 0 1 2.11-.45c.76.27 1.55.45 2.36.57a2 2 0 0 1 1.72 2z" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">
                  +252 63 4454644
                </span>
              </p>

              <p className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                </span>
                <span className="break-all font-medium text-zinc-100">
                  carwonewdubai@gmail.com
                </span>
              </p>

              <p className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21s6-5.33 6-10a6 6 0 1 0-12 0c0 4.67 6 10 6 10z" />
                    <circle cx="12" cy="11" r="2" />
                  </svg>
                </span>
                <span className="font-medium text-zinc-100">Somalia</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-zinc-400 md:flex-row">
          <p>© {new Date().getFullYear()} New Dubai. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <a href="#" className="transition hover:text-yellow-400">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-yellow-400">
              Terms
            </a>
            <a href="#" className="transition hover:text-yellow-400">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
