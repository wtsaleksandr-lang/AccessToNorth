/**
 * Admin-only read-only preview of what a specific client sees about a
 * specific client_service. Opens in a new tab from AdminCrm.
 *
 * Uses the admin session (cookie) — no client login required, no writes
 * allowed, just a mirror of the portal-facing data.
 */
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  Pause,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface ViewData {
  service: {
    id: string;
    serviceName: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  client: { id: string; name: string | null; email: string };
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    waitingOn: string | null;
    orderIndex: number;
  }>;
  onboarding: { status: string; submittedAt: string | null } | null;
}

async function api<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AdminViewAsClient() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const serviceId = params.get("serviceId");

  const [data, setData] = useState<ViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) {
      setError("Missing serviceId");
      return;
    }
    api<ViewData>(`/api/admin/crm/services/${serviceId}`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  }, [serviceId]);

  if (error) {
    return (
      <Shell>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-800">{error}</p>
            <Link href="/admin/crm" className="text-sm text-primary hover:underline mt-3 inline-block">
              Back to CRM
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const { service, client, tasks, onboarding } = data;
  const delivered = tasks.filter((t) => t.status === "delivered").length;
  const total = tasks.length;
  const pct = total ? Math.round((delivered / total) * 100) : 0;

  return (
    <Shell>
      {/* Admin impersonation banner */}
      <div className="bg-amber-500 text-slate-900 px-4 py-2 text-sm flex items-center gap-2 justify-center sticky top-0 z-20">
        <Eye className="w-4 h-4" aria-hidden="true" />
        <strong>Admin preview</strong> — you're viewing what{" "}
        <span className="font-mono">{client.email}</span> sees in their portal.
        <Link href="/admin/crm" className="underline ml-2">
          <ArrowLeft className="w-3 h-3 inline" /> Back to CRM
        </Link>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 max-w-3xl">
        {/* Mirrors the client portal service detail */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Your service</p>
          <h1 className="text-2xl font-bold font-display text-slate-900 mt-1">{service.serviceName}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
            <Badge variant="secondary">{service.status.replace(/_/g, " ")}</Badge>
            {service.startedAt && <span>Started {formatDate(service.startedAt)}</span>}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Progress</p>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {delivered} of {total} steps complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-base font-bold text-slate-900 mb-4">Your tasks</h2>
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-md border ${
                    task.status === "delivered"
                      ? "bg-emerald-50 border-emerald-200"
                      : task.status === "in_progress"
                        ? "bg-blue-50 border-blue-200"
                        : task.status === "blocked"
                          ? "bg-red-50 border-red-200"
                          : task.status === "waiting"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.status === "delivered" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : task.status === "in_progress" ? (
                        <Clock className="w-4 h-4 text-blue-600" />
                      ) : task.status === "blocked" ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : task.status === "waiting" ? (
                        <Pause className="w-4 h-4 text-amber-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                      )}
                      {task.waitingOn === "client" && task.status !== "delivered" && (
                        <p className="text-xs text-amber-700 font-medium mt-1">
                          Action required from you
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {task.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {onboarding && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-slate-800 mb-1">Onboarding intake</p>
              <p className="text-xs text-slate-500">
                Status: <strong>{onboarding.status.replace(/_/g, " ")}</strong>
                {onboarding.submittedAt && ` · Submitted ${formatDate(onboarding.submittedAt)}`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
