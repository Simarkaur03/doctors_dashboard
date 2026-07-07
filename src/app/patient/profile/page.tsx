"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { fetchUserProfile, saveUserProfile } from "../../../lib/patient";
import { toast } from "../../../lib/toast";

export default function PatientProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (!user?.uid) return;
    fetchUserProfile(user.uid)
      .then((profile) => {
        if (profile) {
          setEmail(profile.email);
          setName(profile.name);
          setPhone(profile.phone || "");
          setDateOfBirth(profile.dateOfBirth || "");
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const validate = () => {
    const nextErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (phone.trim() && !/^[0-9+()\-.\s]{7,20}$/.test(phone.trim())) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/patient/login");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await saveUserProfile(user.uid, { name: name.trim(), phone: phone.trim(), dateOfBirth });
      toast.success("Profile updated.");
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <h1 className="text-xl font-semibold text-slate-900">Profile</h1>

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <Input label="Email" type="email" value={email} disabled readOnly />
                <Input
                  label="Full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={errors.name}
                  required
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  error={errors.phone}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {saving ? "Saving" : "Save changes"}
                </Button>
              </form>
            )}
          </Card>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
