import { requireUser } from "@/lib/auth";
import { signOut, updateProfile } from "@/app/actions/auth";
import { Edit, LogOut, User, Mail, Briefcase, Building2, Phone, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile · Huptle HR" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <div className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Account</div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Your profile</h1>
        <p className="text-sm text-text-secondary mt-1 font-medium">
          Manage your personal information and account preferences.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-surface-2/30 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl ring-8 ring-accent/5">
            {user.initials}
          </div>
          <h2 className="text-xl font-black text-text-primary mt-4 tracking-tight">{user.name}</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
            {user.designation}{user.company ? ` · ${user.company}` : ""}
          </p>
          {user.isAdmin && (
            <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
              <ShieldAlert size={11} /> Admin
            </span>
          )}
        </div>

        <form action={updateProfile} className="p-8 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
                <User size={11} /> Full name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
                <Mail size={11} /> Email
              </label>
              <input
                value={user.email}
                readOnly
                className="bg-surface-2/50 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-muted outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="designation" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
                <Briefcase size={11} /> Designation
              </label>
              <input
                id="designation"
                name="designation"
                defaultValue={user.designation}
                className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
                <Building2 size={11} /> Company
              </label>
              <input
                id="company"
                name="company"
                defaultValue={user.company}
                className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 flex items-center gap-1.5">
              <Phone size={11} /> Phone
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={user.phone}
              className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Edit size={16} /> Save changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex flex-col gap-4">
        <h3 className="text-base font-black text-red-500 tracking-tight">Sign out</h3>
        <p className="text-sm text-text-secondary leading-relaxed font-medium">
          End your current session. You&apos;ll need to sign in again to continue.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
