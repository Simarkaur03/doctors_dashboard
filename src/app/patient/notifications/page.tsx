"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { BackLink } from "../../../components/ui/BackLink";
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
      <main className="bg-accent p-4 md:p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          <BackLink href="/patient/dashboard" />
          <Card>
            <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No notifications.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-3">
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
