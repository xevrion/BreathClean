import Image from "next/image";

import { Calendar, Mail, MapPin, Shield, User } from "lucide-react";

import type { UserData } from "./types";

export default function ProfileCard({ user }: { user: UserData }) {
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Banner */}
      <div className="from-bc-primary relative h-32 bg-gradient-to-r to-emerald-400">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-10 h-20 w-20 rounded-full bg-white/20" />
          <div className="absolute top-12 right-32 h-12 w-12 rounded-full bg-white/15" />
        </div>
      </div>

      {/* Avatar + Info */}
      <div className="relative px-6 pb-6">
        <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="relative">
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name}
                className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="bg-bc-primary flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white shadow-lg">
                <User className="h-12 w-12 text-white" />
              </div>
            )}
            {user.emailVerified && (
              <div className="absolute -right-1 -bottom-1 rounded-full bg-white p-1">
                <Shield className="text-bc-primary h-5 w-5" />
              </div>
            )}
          </div>

          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {memberSince}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                New Delhi, India
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
