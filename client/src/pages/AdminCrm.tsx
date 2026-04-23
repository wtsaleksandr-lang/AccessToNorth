import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminCopilot, type AdminCopilotContext } from "@/components/AdminCopilot";
import {
  Users,
  Briefcase,
  ListChecks,
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  FileText,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";

type CrmView = "overview" | "clients" | "services" | "activity" | "service-detail";

interface OverviewData {
  clientStatusCounts: Array<{ status: string; count: number }>;
  serviceStatusCounts: Array<{ status: string; count: number }>;
  taskStatusCounts: Array<{ status: string; count: number }>;
  recentActivity: ActivityRow[];
}
interface ClientRow {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  status: string;
  serviceCount: number;
  createdAt: string;
}
interface ServiceRow {
  id: string;
  clientId: string;
  clientEmail: string | null;
  clientName: string | null;
  serviceKey: string;
  serviceName: string;
  status: string;
  progress: { delivered: number; total: number };
  createdAt: string;
}
interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: string;
  priority: string;
  handledBy: string;
  waitingOn: string | null;
  assignedTo: number | null;
  dueAt: string | null;
  deliveredAt: string | null;
}
interface ActivityRow {
  id: number;
  actorType: string;
  actorId: string | null;
  action: string;
  message: string | null;
  createdAt: string;
  clientId: string | null;
  clientServiceId: string | null;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    lead: { bg: "bg-slate-100", text: "text-slate-700" },
    onboarding: { bg: "bg-amber-100", text: "text-amber-800" },
    pending: { bg: "bg-slate-100", text: "text-slate-700" },
    in_progress: { bg: "bg-blue-100", text: "text-blue-800" },
    active: { bg: "bg-emerald-100", text: "text-emerald-800" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-800" },
    not_started: { bg: "bg-slate-100", text: "text-slate-700" },
    waiting: { bg: "bg-amber-100", text: "text-amber-800" },
    blocked: { bg: "bg-red-100", text: "text-red-800" },
    delivered: { bg: "bg-emerald-100", text: "text-emerald-800" },
    cancelled: { bg: "bg-slate-200", text: "text-slate-700" },
    paused: { bg: "bg-slate-200", text: "text-slate-700" },
    churned: { bg: "bg-slate-300", text: "text-slate-700" },
  };
  const style = map[status] ?? { bg: "bg-slate-100", text: "text-slate-700" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminCrm() {
  const [view, setView] = useState<CrmView>("overview");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotContext, setCopilotContext] = useState<AdminCopilotContext>({
    currentPage: "overview",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold font-display text-slate-900">AccessToNorth — Service CRM</h1>
            <span className="text-xs text-slate-400">Operational dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshKey((k) => k + 1)}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (window.location.href = "/admin")}>
              Legacy view
            </Button>
          </div>
        </div>
        <nav className="container mx-auto px-4 md:px-6 flex gap-1">
          {(
            [
              { key: "overview", icon: Activity, label: "Overview" },
              { key: "clients", icon: Users, label: "Clients" },
              { key: "services", icon: Briefcase, label: "Services" },
              { key: "activity", icon: ListChecks, label: "Activity log" },
            ] as const
          ).map((tab) => {
            const active = view === tab.key || (tab.key === "services" && view === "service-detail");
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setView(tab.key);
                  setSelectedServiceId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
                data-testid={`crm-tab-${tab.key}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6">
        {view === "overview" && <OverviewView refreshKey={refreshKey} />}
        {view === "clients" && <ClientsView refreshKey={refreshKey} />}
        {view === "services" && (
          <ServicesView
            refreshKey={refreshKey}
            onSelect={(id) => {
              setSelectedServiceId(id);
              setView("service-detail");
            }}
          />
        )}
        {view === "service-detail" && selectedServiceId && (
          <ServiceDetailView
            serviceId={selectedServiceId}
            refreshKey={refreshKey}
            onBack={() => setView("services")}
            onMutate={() => setRefreshKey((k) => k + 1)}
            onContext={(ctx) => setCopilotContext({ currentPage: "service-detail", ...ctx })}
          />
        )}
        {view === "activity" && <ActivityView refreshKey={refreshKey} />}
      </main>

      <AdminCopilot
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        context={copilotContext}
      />
    </div>
  );
}

// ─── Views ────────────────────────────────────────────────────────────────

function OverviewView({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api<OverviewData>("/api/admin/crm/overview").then(setData).catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <ErrorBlock message={error} />;
  if (!data) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CountCard
          icon={<Users className="w-5 h-5 text-primary" />}
          title="Clients by status"
          rows={data.clientStatusCounts}
        />
        <CountCard
          icon={<Briefcase className="w-5 h-5 text-primary" />}
          title="Services by status"
          rows={data.serviceStatusCounts}
        />
        <CountCard
          icon={<ListChecks className="w-5 h-5 text-primary" />}
          title="Tasks by status"
          rows={data.taskStatusCounts}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentActivity.slice(0, 12).map((row) => (
                <ActivityRowItem key={row.id} row={row} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClientsView({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRows(null);
    setError(null);
    api<ClientRow[]>("/api/admin/crm/clients").then(setRows).catch((e) => setError(e.message));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.companyName ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  if (error) return <ErrorBlock message={error} />;
  if (!rows) return <LoadingBlock />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">Clients ({rows.length})</CardTitle>
          <Input
            placeholder="Search by email, name, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs h-8 text-sm"
            data-testid="input-clients-search"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Name / Company</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Services</th>
                <th className="py-2 pr-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="py-3 pr-4 font-medium text-slate-800">{row.email}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    <div>{row.name || "—"}</div>
                    {row.companyName && (
                      <div className="text-xs text-slate-400">{row.companyName}</div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{row.serviceCount}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs">{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">No clients match.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ServicesView({
  refreshKey,
  onSelect,
}: {
  refreshKey: number;
  onSelect: (id: string) => void;
}) {
  const [rows, setRows] = useState<ServiceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setRows(null);
    setError(null);
    const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    api<ServiceRow[]>(`/api/admin/crm/services${qs}`).then(setRows).catch((e) => setError(e.message));
  }, [refreshKey, statusFilter]);

  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "onboarding", "in_progress", "waiting", "blocked", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === s
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/30"
            }`}
            data-testid={`services-filter-${s}`}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {!rows ? (
            <LoadingBlock />
          ) : rows.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">No services match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                    <th className="py-2 px-4">Client</th>
                    <th className="py-2 px-4">Service</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Progress</th>
                    <th className="py-2 px-4">Started</th>
                    <th className="py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((svc) => (
                    <tr
                      key={svc.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => onSelect(svc.id)}
                      data-testid={`service-row-${svc.id}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{svc.clientName || svc.clientEmail}</div>
                        {svc.clientName && svc.clientEmail && (
                          <div className="text-xs text-slate-400">{svc.clientEmail}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{svc.serviceName}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={svc.status} />
                      </td>
                      <td className="py-3 px-4">
                        <ProgressPill progress={svc.progress} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(svc.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceDetailView({
  serviceId,
  refreshKey,
  onBack,
  onMutate,
  onContext,
}: {
  serviceId: string;
  refreshKey: number;
  onBack: () => void;
  onMutate: () => void;
  onContext?: (ctx: Partial<AdminCopilotContext>) => void;
}) {
  const [data, setData] = useState<{
    service: any;
    tasks: TaskRow[];
    onboarding: any | null;
    client: any | null;
    activity: ActivityRow[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api<typeof data>(`/api/admin/crm/services/${serviceId}`)
      .then((d: any) => {
        setData(d);
        if (d && onContext) {
          onContext({
            currentClientName: d.client?.name ?? null,
            currentClientEmail: d.client?.email ?? null,
            currentServiceName: d.service?.serviceName ?? null,
            currentServiceStatus: d.service?.status ?? null,
            openTasks: (d.tasks ?? [])
              .filter((t: TaskRow) => t.status !== "delivered" && t.status !== "cancelled")
              .map((t: TaskRow) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                waitingOn: t.waitingOn,
                priority: t.priority,
              })),
            recentActivity: (d.activity ?? []).slice(0, 10).map((a: ActivityRow) => ({
              action: a.action,
              message: a.message,
              actorType: a.actorType,
            })),
          });
        }
      })
      .catch((e) => setError(e.message));
  }, [serviceId, refreshKey, onContext]);

  async function updateTask(taskId: string, status: string) {
    setMutating(taskId);
    try {
      await api(`/api/admin/crm/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onMutate();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setMutating(null);
    }
  }

  if (error) return <ErrorBlock message={error} />;
  if (!data) return <LoadingBlock />;

  const { service, tasks, onboarding, client, activity } = data;
  const progress = {
    delivered: tasks.filter((t) => t.status === "delivered").length,
    total: tasks.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to services
        </Button>
        {data.client && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `/admin/view-as-client?clientId=${data.client.id}&serviceId=${data.service.id}`;
              window.open(url, "_blank");
            }}
            data-testid="button-view-as-client"
          >
            View as client →
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Service</p>
                  <CardTitle className="text-xl">{service.serviceName}</CardTitle>
                </div>
                <StatusBadge status={service.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoField label="Client">{client?.name || client?.email || "—"}</InfoField>
                <InfoField label="Email">{client?.email || "—"}</InfoField>
                <InfoField label="Service key"><span className="font-mono text-xs">{service.serviceKey}</span></InfoField>
                <InfoField label="Started">{formatDate(service.startedAt)}</InfoField>
                <InfoField label="Completed">{formatDate(service.completedAt)}</InfoField>
                <InfoField label="Progress">
                  <ProgressPill progress={progress} />
                </InfoField>
              </div>

              {service.config && Object.keys(service.config).length > 0 && (
                <details className="border border-slate-200 rounded-md p-3">
                  <summary className="text-sm font-medium text-slate-700 cursor-pointer">
                    Service config ({Object.keys(service.config).length} fields)
                  </summary>
                  <pre className="text-xs text-slate-600 mt-3 overflow-x-auto">
                    {JSON.stringify(service.config, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fulfillment tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-sm text-slate-500 py-4">
                  No tasks provisioned. Check that service_task_templates is seeded for this service_key.
                </p>
              )}
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  mutating={mutating === task.id}
                  onUpdate={(s) => updateTask(task.id, s)}
                />
              ))}
            </CardContent>
          </Card>

          {onboarding && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Onboarding submission</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <InfoField label="Status"><StatusBadge status={onboarding.status} /></InfoField>
                  <InfoField label="Submitted">{formatDateTime(onboarding.submittedAt)}</InfoField>
                  <InfoField label="AI processed">{formatDateTime(onboarding.aiProcessedAt)}</InfoField>
                  <InfoField label="Token expires">{formatDate(onboarding.tokenExpiresAt)}</InfoField>
                </div>
                {onboarding.responses && (
                  <details className="border border-slate-200 rounded-md p-3">
                    <summary className="text-sm font-medium text-slate-700 cursor-pointer">
                      Responses ({Object.keys(onboarding.responses).length} fields)
                    </summary>
                    <pre className="text-xs text-slate-600 mt-3 overflow-x-auto">
                      {JSON.stringify(onboarding.responses, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity log</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((row) => (
                    <ActivityRowItem key={row.id} row={row} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityView({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setRows(null);
    api<ActivityRow[]>("/api/admin/crm/activity?limit=200")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <ErrorBlock message={error} />;
  if (!rows) return <LoadingBlock />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No activity yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <ActivityRowItem key={row.id} row={row} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Small components ────────────────────────────────────────────────────

function CountCard({ icon, title, rows }: { icon: React.ReactNode; title: string; rows: Array<{ status: string; count: number }> }) {
  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        <p className="text-2xl font-bold text-slate-900 mb-3">{total}</p>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.status} className="flex items-center justify-between text-xs">
              <StatusBadge status={row.status} />
              <span className="text-slate-600 font-medium">{row.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressPill({ progress }: { progress: { delivered: number; total: number } }) {
  if (progress.total === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const pct = Math.round((progress.delivered / progress.total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-600 font-medium tabular-nums">
        {progress.delivered}/{progress.total}
      </span>
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}

function TaskCard({
  task,
  mutating,
  onUpdate,
}: {
  task: TaskRow;
  mutating: boolean;
  onUpdate: (status: string) => void;
}) {
  const statusIcon = useMemo(() => {
    if (task.status === "delivered") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (task.status === "in_progress") return <Clock className="w-4 h-4 text-blue-600" />;
    if (task.status === "blocked") return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (task.status === "waiting") return <Pause className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  }, [task.status]);

  return (
    <div className="p-3 border border-slate-200 rounded-md">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusIcon}
            <p className="font-medium text-slate-800 text-sm truncate">{task.title}</p>
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 ml-6">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={task.status} />
          {task.waitingOn && (
            <Badge variant="outline" className="text-[10px]">waiting on {task.waitingOn}</Badge>
          )}
          {task.priority === "urgent" && (
            <Badge className="bg-red-600 text-white text-[10px]">urgent</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 ml-6 mt-2">
        {task.status !== "in_progress" && task.status !== "delivered" && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() => onUpdate("in_progress")}
            className="h-7 text-xs"
            data-testid={`task-start-${task.id}`}
          >
            {mutating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Start
          </Button>
        )}
        {task.status !== "waiting" && task.status !== "delivered" && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() => onUpdate("waiting")}
            className="h-7 text-xs"
            data-testid={`task-wait-${task.id}`}
          >
            Waiting
          </Button>
        )}
        {task.status !== "blocked" && task.status !== "delivered" && (
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() => onUpdate("blocked")}
            className="h-7 text-xs"
          >
            Blocked
          </Button>
        )}
        {task.status !== "delivered" && (
          <Button
            size="sm"
            disabled={mutating}
            onClick={() => onUpdate("delivered")}
            className="h-7 text-xs"
            data-testid={`task-deliver-${task.id}`}
          >
            {mutating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Mark delivered
          </Button>
        )}
      </div>
    </div>
  );
}

function ActivityRowItem({ row }: { row: ActivityRow }) {
  const actorBadge = {
    human: <Badge variant="outline" className="text-[10px]">human</Badge>,
    ai_agent: <Badge className="bg-purple-600 text-white text-[10px]">ai</Badge>,
    system: <Badge variant="secondary" className="text-[10px]">system</Badge>,
  }[row.actorType as "human" | "ai_agent" | "system"] ?? <Badge variant="outline">{row.actorType}</Badge>;

  return (
    <div className="py-2.5 text-sm">
      <div className="flex items-start gap-2 flex-wrap">
        {actorBadge}
        <span className="font-medium text-slate-800">{row.action}</span>
        {row.actorId && <span className="text-xs text-slate-500">by {row.actorId}</span>}
        <span className="text-xs text-slate-400 ml-auto">{formatDateTime(row.createdAt)}</span>
      </div>
      {row.message && <p className="text-xs text-slate-600 mt-1 ml-1">{row.message}</p>}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}
function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-sm">
      <AlertTriangle className="w-4 h-4 inline mr-1" />
      {message}
    </div>
  );
}
