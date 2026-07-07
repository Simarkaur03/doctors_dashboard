"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import type { NotificationItem } from "../../../types";

export default function PatientNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(query(collection(db, "notifications"), where("userId", "==", user.uid)), (snapshot) => {
      setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NotificationItem, "id">) })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Notifications</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Care updates</h1>
            {loading ? (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading messages…
              </div>
            ) : notifications.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
