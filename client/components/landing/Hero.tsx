import Image from "next/image";
import Link from "next/link";

import { ExternalLink, Lock, MapPin, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <header className="bg-bc-bg-light dark:bg-bc-bg-dark relative overflow-hidden pt-32 pb-20 md:pt-38 md:pb-32">
      <div className="map-texture pointer-events-none absolute inset-0" />
      <div className="hero-gradient pointer-events-none absolute inset-0" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* Left content */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="bg-bc-primary h-2 w-2 animate-pulse rounded-full" />
            Live AQI Data Active
          </div>

          <h1 className="text-5xl leading-[1.1] font-extrabold text-slate-900 md:text-7xl dark:text-white">
            Breathe Easier on <span className="text-bc-primary">Every</span>{" "}
            Journey
          </h1>

          <p className="max-w-xl text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            Health-first route planning for the urban commuter. Experience a
            powerful web tool designed for any browser—prioritizing your lungs
            with real-time air quality data.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-[0_6px_0_0_#166534,0_8px_16px_rgba(0,0,0,0.2)] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#166534,0_6px_12px_rgba(0,0,0,0.2)] active:translate-y-[5px] active:shadow-[0_1px_0_0_#166534,0_2px_4px_rgba(0,0,0,0.2)]"
            >
              Start Now <ExternalLink className="h-5 w-5" />
            </Link>
            <button className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-white to-slate-100 px-8 py-4 text-lg font-bold shadow-[0_6px_0_0_#cbd5e1,0_8px_16px_rgba(0,0,0,0.1)] transition-all duration-150 hover:translate-y-[2px] hover:shadow-[0_4px_0_0_#cbd5e1,0_6px_12px_rgba(0,0,0,0.1)] active:translate-y-[5px] active:shadow-[0_1px_0_0_#cbd5e1,0_2px_4px_rgba(0,0,0,0.1)] dark:from-slate-700 dark:to-slate-800 dark:text-white dark:shadow-[0_6px_0_0_#1e293b,0_8px_16px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_4px_0_0_#1e293b,0_6px_12px_rgba(0,0,0,0.3)] dark:active:shadow-[0_1px_0_0_#1e293b,0_2px_4px_rgba(0,0,0,0.3)]">
              <PlayCircle className="h-5 w-5" /> Watch Demo
            </button>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              <Image
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDberzDCfqsIX6fDB8NDes-T6M3v1OQ_iJw-nuzucGxJBJP_pdXUFfBu-0NFqK2LTsO5mxmCHoorkypLbxOayus3TChvmB1h-1hg8IuQ9JJSkQ3Q95VtoRyadEJDhm2nYb9GeMlOg4CmZ3nBWXzoZWGFpOjB1pqMZH4QLvxuxy2GOMU7L1LWmEuv9TTOlGgvjUX-d4W8dHcWEhGckC4GxE-FW8u40JZGCW0FCV5IEsnkjC7O-0a_P5mBmmy7D-t3sanACFQ0c0NFdA4"
                width={40}
                height={40}
              />
              <Image
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDO73IBTqivONDvIZQ_m_tKAXbYpjiXowWp8AJKxwRKW-X_4VNq6NxkJlgSGFzJaAbjeVssuTVGIkcMbAlUn5VA8W462ZoP9A3RMf34lxjiTRYCxX01Ud4Th7-HKAOqL1kmzApDvGH2MNuCvctkcq_A21ObSGET_dl-eeZob8cLKsFnJRTsil2RLxJvI9TNE6_rI4h5dV0CYPOt846EJbRziVnZlfCmEjU84V_N0opNUvO-r_I56AZyCgDkfjuR4D5z6JI5ZNy7FoE7"
                width={40}
                height={40}
              />
              <Image
                alt="User"
                className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-900"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdb8aPPXygMIH6cItHFkIeQIjgnFPleeGp7ztJRHRqwcp5MDj0Cjl0vrjTxlWtafJ1750MIyR08J2Jk6V-_U3aKT3RSHKcqOofP2g203YgmYPRXaTzLJDttksWHDfQWZiZT7_0rVsQAl4WPFvE_adUzMJuirdaSXEDxIfXxx_xqSwGlXfZaZ4ic7S1paD4rSFTyDd4xXChXNq0uHIKF2p5hutevK-218dLMV41lm50AZvLFjsaif7UXmNwofvE96bvsxZpfzcZWJ7d"
                width={40}
                height={40}
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold dark:border-slate-900 dark:bg-slate-800">
                +100
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Joined by 100+ healthy commuters online
            </p>
          </div>
        </div>

        {/* Right - Map preview */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-[44px] bg-[#2bee6c]/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:border-slate-700/50 dark:bg-slate-900">
            {/* Browser chrome */}
            <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-slate-50 px-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-[11px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                <Lock className="h-2.5 w-2.5" />
                breathclean.dev/home
              </div>
              <div className="w-14" />
            </div>

            {/* Map area */}
            <div className="p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  alt="Map interface"
                  className="h-full w-full object-cover opacity-55"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjzTyQx-fPBBSOFMOiXqJbGHwy8VoJK-VumptPqFOn86n8xVqQdp_u6ZIkUcZEwRUf1Vb0mMO-sCfJjPRX5Pu25XfPbuo0aXBlaFJ71ChJp7wznVWUWZFX3Lwn7W9M25cnUIsAkdcFIa1ROkSB-gnGyyGX45Kg9gF3RK9-6uTrdhqHJEtoo3NB8gjP2E95ui0IaMC7X3DPhWlhfGrWdMt5C0j-9-uBTtiK_Tzu2ZKWBoVA9SExwuhgZVRjUWSEPKS1uRdGqEvI9BuY"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-emerald-900/10" />

                {/* Route input card */}
                <div className="absolute top-4 left-4 w-[210px] rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:bg-slate-900/95">
                  <div className="relative space-y-3">
                    <div className="absolute top-[18px] left-[4px] h-[26px] w-px border-l-2 border-dashed border-slate-300 dark:border-slate-600" />

                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-[#2bee6c] bg-white" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                          From
                        </p>
                        <p className="truncate text-[11px] font-bold text-slate-800 dark:text-white">
                          Sunset Blvd, 1202
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-rose-500" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                          To
                        </p>
                        <p className="truncate text-[11px] font-bold text-slate-800 dark:text-white">
                          Grand Park Central
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-900/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2bee6c]" />
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                      Live AQI · Good along route
                    </span>
                  </div>
                </div>

                {/* Score card */}
                <div className="absolute right-4 bottom-4 w-[175px] rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:bg-slate-900/95">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                        Cleanest Route
                      </p>
                      <p className="text-[12px] font-extrabold text-slate-800 dark:text-white">
                        Via Main St
                      </p>
                    </div>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                      <span className="text-sm leading-none font-black text-[#2bee6c]">
                        92
                      </span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#2bee6c] to-emerald-400" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 text-center dark:divide-slate-800">
                    <div className="pr-1">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        18m
                      </p>
                      <p className="text-[8px] text-slate-400">time</p>
                    </div>
                    <div className="px-1">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        2.4km
                      </p>
                      <p className="text-[8px] text-slate-400">dist</p>
                    </div>
                    <div className="pl-1">
                      <p className="text-[11px] font-bold text-[#2bee6c]">
                        Good
                      </p>
                      <p className="text-[8px] text-slate-400">AQI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
