import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  LogOut,
  Send,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  Package,
  Users,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  ClipboardList,
  Upload,
  X,
  Sparkles,
  Save,
  FileDown,
  HelpCircle,
  RefreshCw,
  Eye,
  Edit3,
  Copy,
  Clipboard,
  FileCheck,
  Briefcase,
  History,
} from "lucide-react";
import type { OrderStep } from "@shared/schema";

interface ClassificationMetadata {
  productName?: string;
  productDescription?: string;
  countryOfOrigin?: string;
  industryCategory?: string;
  hsCodesRequested?: number;
  additionalNotes?: string;
  companyName?: string;
  phone?: string;
  packageTier?: string;
  packagePrice?: string;
  deliveryTime?: string;
}

interface OrderSummary {
  id: string;
  customerEmail: string;
  customerName: string | null;
  serviceType: string;
  status: string;
  steps: OrderStep[];
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  uploadCount: number;
  metadata: ClassificationMetadata | null;
  latestMessage: { sender: string; message: string; createdAt: string } | null;
  aiDraftReport: string | null;
  aiGeneratedAt: string | null;
  aiModelUsed: string | null;
  aiSummary: string | null;
  aiClientUpdateDraft: string | null;
  aiMissingDocs: string | null;
  aiNextSteps: string | null;
  aiAssistGeneratedAt: string | null;
  aiReadinessSnapshotText: string | null;
  readinessSnapshotSentAt: string | null;
  aiBrokerPackText: string | null;
  brokerPackSentAt: string | null;
}

interface UploadData {
  id: string;
  orderId: string;
  fileName: string;
  fileSize: string | null;
  mimeType: string | null;
  createdAt: string;
}

interface MessageData {
  id: string;
  orderId: string;
  sender: string;
  message: string;
  createdAt: string;
}

interface OrderDetail {
  order: OrderSummary;
  uploads: UploadData[];
  messages: MessageData[];
}

async function adminApi(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message || `Error ${res.status}`);
  }
  return res.json();
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin Dashboard - AccessToNorth.com";
    adminApi("/api/admin/check")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {}
    setAuthenticated(false);
    setSelectedOrderId(null);
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-primary" />
            <h1 className="font-bold text-sm md:text-base">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {selectedOrderId ? (
          <OrderDetailView
            orderId={selectedOrderId}
            onBack={() => setSelectedOrderId(null)}
          />
        ) : (
          <OrdersList onSelectOrder={(id) => setSelectedOrderId(id)} />
        )}
      </main>
    </div>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminApi("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() || undefined, password }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm" data-testid="card-admin-login">
        <CardHeader className="text-center">
          <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email (optional for legacy password)</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="you@accesstonorth.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive" data-testid="text-admin-login-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersList({ onSelectOrder }: { onSelectOrder: (id: string) => void }) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi("/api/admin/orders");
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={loadOrders}>Try Again</Button>
      </div>
    );
  }

  const doneCount = orders.filter(o => o.status === "Complete").length;
  const activeCount = orders.filter(o => o.status === "In Progress").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold" data-testid="text-orders-heading">All Orders</h2>
        <Button variant="outline" size="sm" onClick={loadOrders} data-testid="button-refresh-orders">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-orders">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold">{doneCount}</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No orders yet. Orders are created automatically when customers complete payment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const done = order.steps.filter(s => s.state === "done").length;
            const pct = Math.round((done / order.steps.length) * 100);
            return (
              <Card
                key={order.id}
                className="hover-elevate cursor-pointer"
                onClick={() => onSelectOrder(order.id)}
                data-testid={`card-order-${order.id}`}
              >
                <CardContent className="py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm" data-testid={`text-order-id-${order.id}`}>{order.id}</span>
                      <Badge variant="secondary" className="text-[10px]">{order.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {order.customerEmail}
                      {order.customerName ? ` — ${order.customerName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.serviceType}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {order.messageCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {order.uploadCount}
                    </span>
                    <span className="font-medium text-primary">{pct}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetailView({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editSteps, setEditSteps] = useState<OrderStep[]>([]);
  const [editStatus, setEditStatus] = useState("");

  async function loadOrder() {
    setLoading(true);
    setError("");
    try {
      const detail = await adminApi(`/api/admin/orders/${orderId}`);
      setData(detail);
      setEditSteps(detail.order.steps);
      setEditStatus(detail.order.status);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function handleSaveSteps() {
    setSaving(true);
    try {
      await adminApi(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ steps: editSteps, status: editStatus }),
      });
      await loadOrder();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function updateStepState(index: number, state: OrderStep["state"]) {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, state } : s));
  }

  function updateStepLabel(index: number, label: string) {
    setEditSteps(prev => prev.map((s, i) => i === index ? { ...s, label } : s));
  }

  function moveStep(index: number, direction: "up" | "down") {
    setEditSteps(prev => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  }

  function removeStep(index: number) {
    setEditSteps(prev => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    setEditSteps(prev => [...prev, { label: "New Step", state: "upcoming" }]);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <p className="text-destructive">{error || "Failed to load"}</p>
        <Button variant="outline" onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const { order, uploads, messages } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-orders">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-bold font-mono" data-testid="text-detail-order-id">{order.id}</h2>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
      </div>

      <Card data-testid="card-order-detail-info">
        <CardContent className="pt-6 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Customer</p>
              <p className="font-medium">{order.customerName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p className="font-medium">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Service</p>
              <p className="font-medium">{order.serviceType}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Created</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.metadata && order.serviceType.includes("HS Classification") && (
        <Card data-testid="card-classification-metadata">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Classification Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Product Name</p>
                <p className="font-medium">{order.metadata.productName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Country of Origin</p>
                <p className="font-medium">{order.metadata.countryOfOrigin || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Package</p>
                <p className="font-medium">{order.metadata.packageTier ? `${order.metadata.packageTier.charAt(0).toUpperCase() + order.metadata.packageTier.slice(1)} (${order.metadata.packagePrice})` : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">HS Codes Requested</p>
                <p className="font-medium">{order.metadata.hsCodesRequested || "—"}</p>
              </div>
              {order.metadata.industryCategory && (
                <div>
                  <p className="text-muted-foreground text-xs">Industry</p>
                  <p className="font-medium">{order.metadata.industryCategory}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Delivery</p>
                <p className="font-medium">{order.metadata.deliveryTime || "—"}</p>
              </div>
              {order.metadata.phone && (
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{order.metadata.phone}</p>
                </div>
              )}
            </div>
            {order.metadata.productDescription && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Product Description</p>
                <p className="text-sm">{order.metadata.productDescription}</p>
              </div>
            )}
            {order.metadata.additionalNotes && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-xs mb-1">Additional Notes</p>
                <p className="text-sm">{order.metadata.additionalNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-step-editor">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Progress Steps
            </span>
            <div className="flex items-center gap-2">
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="w-36" data-testid="select-order-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Awaiting Payment">Awaiting Payment</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {editSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border" data-testid={`admin-step-${i}`}>
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStep(i, "up")} disabled={i === 0}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveStep(i, "down")} disabled={i === editSteps.length - 1}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={step.label}
                onChange={(e) => updateStepLabel(i, e.target.value)}
                className="flex-1 text-sm"
                data-testid={`input-step-label-${i}`}
              />
              <Select value={step.state} onValueChange={(v) => updateStepState(i, v as OrderStep["state"])}>
                <SelectTrigger className="w-28" data-testid={`select-step-state-${i}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeStep(i)} data-testid={`button-remove-step-${i}`}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={addStep} data-testid="button-add-step">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Step
            </Button>
            <Button size="sm" onClick={handleSaveSteps} disabled={saving} data-testid="button-save-steps">
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AdminAiAssistCard orderId={orderId} order={order} />

      {order.serviceType.includes("HS Classification") && (
        <AdminSendReportSection
          orderId={orderId}
          order={order}
          onRefresh={loadOrder}
        />
      )}

      {showReadinessSnapshot(order.serviceType) && (
        <AdminReadinessSnapshotCard orderId={orderId} order={order} />
      )}

      {showBrokerPack(order.serviceType) && (
        <AdminBrokerPackCard orderId={orderId} order={order} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminFilesSection uploads={uploads} />
        <AdminMessagesSection orderId={orderId} messages={messages} onRefresh={loadOrder} />
      </div>

      <AdminAuditTimeline orderId={orderId} refreshKey={data?.order.updatedAt ?? ""} />
    </div>
  );
}

interface AuditEventRow {
  id: number;
  orderId: string;
  actorId: number | null;
  actorEmail: string | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

function AdminAuditTimeline({ orderId, refreshKey }: { orderId: string; refreshKey: string }) {
  const [events, setEvents] = useState<AuditEventRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAudit() {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/audit?limit=50`);
      setEvents(data.events as AuditEventRow[]);
    } catch (err: any) {
      setError(err.message || "Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudit();
    // refreshKey changes whenever the order is re-fetched (post-mutation),
    // so the timeline refreshes itself after any save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, refreshKey]);

  return (
    <Card data-testid="card-audit-timeline">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Audit Trail
            {events && events.length > 0 && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-audit-count">
                {events.length}
              </Badge>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAudit}
            disabled={loading}
            data-testid="button-audit-refresh"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !events && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading audit events…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive py-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {events && events.length === 0 && (
          <p className="text-sm text-muted-foreground py-2" data-testid="text-audit-empty">
            No admin mutations recorded yet. New status changes, step edits, and messages will appear here.
          </p>
        )}

        {events && events.length > 0 && (
          <ol className="space-y-3" data-testid="list-audit-events">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="border border-border rounded-md p-3 text-sm"
                data-testid={`audit-event-${ev.id}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatAuditAction(ev.action)}
                    </Badge>
                    {ev.fieldName && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {ev.fieldName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ev.actorEmail ? (
                    <span data-testid={`audit-actor-${ev.id}`}>
                      by <span className="font-medium text-foreground">{ev.actorEmail}</span>
                      {ev.actorId ? ` (#${ev.actorId})` : ""}
                    </span>
                  ) : (
                    <span className="italic">by legacy/system actor</span>
                  )}
                </p>
                {(ev.oldValue || ev.newValue) && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {ev.oldValue !== null && (
                      <div>
                        <p className="text-muted-foreground">Old</p>
                        <pre className="bg-muted/40 rounded p-2 whitespace-pre-wrap break-all">
                          {ev.oldValue}
                        </pre>
                      </div>
                    )}
                    {ev.newValue !== null && (
                      <div>
                        <p className="text-muted-foreground">New</p>
                        <pre className="bg-muted/40 rounded p-2 whitespace-pre-wrap break-all">
                          {ev.newValue}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function formatAuditAction(action: string): string {
  return action.replace(/_/g, " ");
}

function showReadinessSnapshot(serviceType: string): boolean {
  const types = ["CARM", "GST/HST", "Business Number", "Complete Importer", "Non-Resident"];
  return types.some(t => serviceType.includes(t));
}

function showBrokerPack(serviceType: string): boolean {
  const types = ["Complete Importer", "HS Classification", "CARM"];
  return types.some(t => serviceType.includes(t));
}

function AdminAiAssistCard({ orderId, order }: { orderId: string; order: OrderSummary }) {
  const [summary, setSummary] = useState(order.aiSummary || "");
  const [clientUpdate, setClientUpdate] = useState(order.aiClientUpdateDraft || "");
  const [missingDocs, setMissingDocs] = useState(order.aiMissingDocs || "");
  const [nextSteps, setNextSteps] = useState(order.aiNextSteps || "");
  const [loading, setLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async (type: string) => {
    setLoading(type);
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/ai-${type}`, { method: "POST" });
      switch (type) {
        case "summary": setSummary(data.text); break;
        case "client-update": setClientUpdate(data.text); break;
        case "missing-docs": setMissingDocs(data.text); break;
        case "next-steps": setNextSteps(data.text); break;
      }
    } catch (err: any) {
      console.error(`AI ${type} error:`, err);
    } finally {
      setLoading(null);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const sections = [
    { key: "summary", label: "Summarize Order", value: summary },
    { key: "client-update", label: "Draft Client Update", value: clientUpdate },
    { key: "missing-docs", label: "Missing Documents", value: missingDocs },
    { key: "next-steps", label: "Next Steps", value: nextSteps },
  ];

  return (
    <Card data-testid="card-ai-assist">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Assist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {sections.map((s) => (
            <Button
              key={s.key}
              variant="outline"
              size="sm"
              onClick={() => handleGenerate(s.key)}
              disabled={loading === s.key}
              data-testid={`button-ai-${s.key}`}
            >
              {loading === s.key ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1" />
              )}
              {s.label}
            </Button>
          ))}
        </div>
        {sections.map((s) =>
          s.value ? (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(s.value, s.key)}
                  data-testid={`button-copy-${s.key}`}
                >
                  {copied === s.key ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <div className="border rounded-md p-3 text-sm whitespace-pre-wrap" data-testid={`text-ai-${s.key}`}>
                {s.value}
              </div>
            </div>
          ) : null
        )}
      </CardContent>
    </Card>
  );
}

function AdminReadinessSnapshotCard({ orderId, order }: { orderId: string; order: OrderSummary }) {
  const [text, setText] = useState(order.aiReadinessSnapshotText || "");
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(order.readinessSnapshotSentAt || "");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/readiness-snapshot`, { method: "POST" });
      setText(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to generate snapshot");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/readiness-snapshot/export-pdf`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Readiness_Snapshot_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("This will send the readiness snapshot to the customer. Continue?")) return;
    setSending(true);
    setError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/readiness-snapshot/send`, { method: "POST" });
      setSentAt(data.sentAt || new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Failed to send snapshot");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card data-testid="card-readiness-snapshot">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" />
          Import Readiness Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm" data-testid="text-snapshot-error">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">{error}</span>
            <button className="ml-auto" onClick={() => setError("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {sentAt && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm" data-testid="text-snapshot-sent">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">
              Already Sent {new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          data-testid="button-generate-snapshot"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
          {text ? "Regenerate Snapshot" : "Generate Snapshot"}
        </Button>

        {text && (
          <>
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none" data-testid="div-snapshot-preview">
              <DraftPreview text={text} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                data-testid="button-snapshot-export-pdf"
              >
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1" />}
                Export PDF
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !!sentAt}
                data-testid="button-snapshot-send"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                Send to Client
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AdminBrokerPackCard({ orderId, order }: { orderId: string; order: OrderSummary }) {
  const [text, setText] = useState(order.aiBrokerPackText || "");
  const [generating, setGenerating] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentAt, setSentAt] = useState(order.brokerPackSentAt || "");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/broker-pack`, { method: "POST" });
      setText(data.text);
    } catch (err: any) {
      setError(err.message || "Failed to generate pack");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/broker-pack/export-pdf`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Broker_Pack_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("This will send the broker handoff pack to the customer. Continue?")) return;
    setSending(true);
    setError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/broker-pack/send`, { method: "POST" });
      setSentAt(data.sentAt || new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Failed to send pack");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card data-testid="card-broker-pack">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Broker Handoff Pack
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm" data-testid="text-broker-pack-error">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">{error}</span>
            <button className="ml-auto" onClick={() => setError("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {sentAt && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm" data-testid="text-broker-pack-sent">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">
              Already Sent {new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          data-testid="button-generate-broker-pack"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
          {text ? "Regenerate Pack" : "Generate Pack"}
        </Button>

        {text && (
          <>
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none" data-testid="div-broker-pack-preview">
              <DraftPreview text={text} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                data-testid="button-broker-pack-export-pdf"
              >
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1" />}
                Export PDF
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !!sentAt}
                data-testid="button-broker-pack-send"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                Send to Client
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AdminSendReportSection({
  orderId,
  order,
  onRefresh,
}: {
  orderId: string;
  order: OrderSummary;
  onRefresh: () => void;
}) {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(order.status === "Delivered");
  const reportInputRef = useRef<HTMLInputElement>(null);

  const [draftReport, setDraftReport] = useState<string>(order.aiDraftReport || "");
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [sendingPdf, setSendingPdf] = useState(false);
  const [aiModel, setAiModel] = useState<string>(order.aiModelUsed || "");
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string>(order.aiGeneratedAt || "");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [draftError, setDraftError] = useState("");
  const [draftSuccess, setDraftSuccess] = useState("");

  const handleGenerateDraft = async () => {
    setGenerating(true);
    setDraftError("");
    setDraftSuccess("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/generate-draft`, {
        method: "POST",
      });
      setDraftReport(data.draft);
      setAiModel(data.model);
      setAiGeneratedAt(data.generatedAt);
      setDraftSuccess("Draft generated successfully");
      onRefresh();
    } catch (err: any) {
      setDraftError(err.message || "Failed to generate draft");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setDraftError("");
    try {
      await adminApi(`/api/admin/orders/${orderId}/save-draft`, {
        method: "POST",
        body: JSON.stringify({ draft: draftReport }),
      });
      setDraftSuccess("Draft saved");
      setTimeout(() => setDraftSuccess(""), 3000);
    } catch (err: any) {
      setDraftError(err.message || "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    setDraftError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/export-pdf`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draftReport }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setDraftError(err.message || "Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!confirm("This will email the customer requesting additional information and put the order on hold. Continue?")) return;
    setRequestingInfo(true);
    setDraftError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/request-info`, {
        method: "POST",
        body: JSON.stringify({ draft: draftReport }),
      });
      setDraftSuccess(`Sent ${data.questionsCount} question(s) to customer. Order set to On Hold.`);
      onRefresh();
    } catch (err: any) {
      setDraftError(err.message || "Failed to request info");
    } finally {
      setRequestingInfo(false);
    }
  };

  const handleSendPdfReport = async () => {
    if (!confirm("This will generate a PDF from the current draft, email it to the customer, and mark the order as Delivered. Continue?")) return;
    setSendingPdf(true);
    setDraftError("");
    try {
      const data = await adminApi(`/api/admin/orders/${orderId}/send-pdf-report`, {
        method: "POST",
        body: JSON.stringify({ draft: draftReport }),
      });
      setSent(true);
      setDraftSuccess(data.message);
      onRefresh();
    } catch (err: any) {
      setDraftError(err.message || "Failed to send report");
    } finally {
      setSendingPdf(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Only PDF files are accepted for reports.");
        return;
      }
      setReportFile(file);
    }
  };

  const handleSendManualReport = async () => {
    if (!reportFile) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("report", reportFile);

      const res = await fetch(`/api/admin/orders/${orderId}/send-report`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send report");

      setSent(true);
      setReportFile(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to send report");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card data-testid="card-report-delivered">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Report Delivered</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                The classification report has been sent to {order.customerEmail}.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex-shrink-0"
              onClick={() => {
                const link = document.createElement("a");
                link.href = `/api/admin/orders/${orderId}/report/download`;
                link.download = `Report_${orderId}.pdf`;
                link.click();
              }}
              data-testid="button-download-sent-report"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-ai-report">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Classification Report
          </span>
          {aiModel && (
            <span className="text-xs text-muted-foreground font-normal">
              Model: {aiModel}
              {aiGeneratedAt && ` | ${new Date(aiGeneratedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {draftError && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm" data-testid="text-draft-error">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-destructive">{draftError}</span>
            <button className="ml-auto" onClick={() => setDraftError("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {draftSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm" data-testid="text-draft-success">
            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">{draftSuccess}</span>
            <button className="ml-auto" onClick={() => setDraftSuccess("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {!draftReport ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate an AI draft report based on the order details, product information, and uploaded documents. You can then review, edit, and send it.
            </p>
            <Button
              onClick={handleGenerateDraft}
              disabled={generating}
              className="w-full"
              data-testid="button-generate-draft"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Draft Report
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or upload manually</span>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => reportInputRef.current?.click()}
              data-testid="dropzone-report-upload"
            >
              {reportFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{reportFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(reportFile.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    className="ml-2 p-1 rounded hover-elevate cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReportFile(null);
                      if (reportInputRef.current) reportInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload a manually prepared report (PDF)</p>
                  <p className="text-xs text-muted-foreground">Max 20MB</p>
                </>
              )}
              <input
                ref={reportInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-report-file"
              />
            </div>
            {reportFile && (
              <Button
                onClick={handleSendManualReport}
                disabled={sending}
                className="w-full"
                data-testid="button-send-manual-report"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Manual Report to Customer
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex border rounded-md overflow-visible">
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "edit" ? "bg-primary text-primary-foreground" : "hover-elevate"}`}
                  onClick={() => setViewMode("edit")}
                  data-testid="button-edit-mode"
                >
                  <Edit3 className="w-3 h-3 mr-1 inline" />
                  Edit
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "preview" ? "bg-primary text-primary-foreground" : "hover-elevate"}`}
                  onClick={() => setViewMode("preview")}
                  data-testid="button-preview-mode"
                >
                  <Eye className="w-3 h-3 mr-1 inline" />
                  Preview
                </button>
              </div>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                data-testid="button-save-draft"
              >
                {savingDraft ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateDraft}
                disabled={generating}
                data-testid="button-regenerate-draft"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                Regenerate
              </Button>
            </div>

            {viewMode === "edit" ? (
              <Textarea
                value={draftReport}
                onChange={(e) => setDraftReport(e.target.value)}
                className="font-mono text-xs min-h-[400px] resize-y"
                data-testid="textarea-draft-report"
              />
            ) : (
              <div
                className="border rounded-md p-4 min-h-[400px] max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                data-testid="div-draft-preview"
              >
                <DraftPreview text={draftReport} />
              </div>
            )}

            <div className="flex gap-2 flex-wrap pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestInfo}
                disabled={requestingInfo}
                data-testid="button-request-info"
              >
                {requestingInfo ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5 mr-1" />}
                Request More Info
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                data-testid="button-export-pdf"
              >
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileDown className="w-3.5 h-3.5 mr-1" />}
                Export PDF
              </Button>
              <div className="flex-1" />
              <Button
                size="sm"
                onClick={handleSendPdfReport}
                disabled={sendingPdf}
                data-testid="button-send-pdf-report"
              >
                {sendingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                Send Report to Customer
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DraftPreview({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      elements.push(<h4 key={i} className="text-sm font-semibold mt-3 mb-1">{trimmed.replace(/^###\s*/, "")}</h4>);
    } else if (trimmed.startsWith("## ")) {
      elements.push(<h3 key={i} className="text-base font-bold text-primary mt-4 mb-2 border-b pb-1">{trimmed.replace(/^##\s*/, "")}</h3>);
    } else if (trimmed.startsWith("# ")) {
      elements.push(<h2 key={i} className="text-lg font-bold mt-4 mb-2">{trimmed.replace(/^#\s*/, "")}</h2>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2 text-sm">
          <span className="text-muted-foreground flex-shrink-0">&bull;</span>
          <span dangerouslySetInnerHTML={{ __html: formatBold(trimmed.replace(/^[-*]\s*/, "")) }} />
        </div>
      );
    } else if (trimmed.match(/^\d+[\.\)]/)) {
      elements.push(
        <p key={i} className="ml-2 text-sm" dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />);
    }
  }

  return <>{elements}</>;
}

function formatBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

function AdminFilesSection({ uploads }: { uploads: UploadData[] }) {
  function formatSize(bytes: string | null) {
    if (!bytes) return "";
    const n = parseInt(bytes, 10);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleDownload(uploadId: string, fileName: string) {
    const link = document.createElement("a");
    link.href = `/api/admin/uploads/${uploadId}/download`;
    link.download = fileName;
    link.click();
  }

  return (
    <Card data-testid="card-admin-files">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Client Documents ({uploads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded by the client yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border text-sm"
                data-testid={`admin-upload-${u.id}`}
              >
                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{u.fileName}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{formatSize(u.fileSize)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(u.id, u.fileName)}
                  data-testid={`button-download-${u.id}`}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminMessagesSection({
  orderId,
  messages,
  onRefresh,
}: {
  orderId: string;
  messages: MessageData[];
  onRefresh: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await adminApi(`/api/admin/orders/${orderId}/message`, {
        method: "POST",
        body: JSON.stringify({ message: text.trim() }),
      });
      setText("");
      onRefresh();
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  const sortedMessages = [...messages].reverse();

  return (
    <Card data-testid="card-admin-messages">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-2">
          {sortedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No messages yet.</p>
          ) : (
            sortedMessages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-md text-sm ${
                  m.sender === "admin"
                    ? "bg-primary/10 dark:bg-primary/20 ml-4"
                    : "bg-muted mr-4"
                }`}
                data-testid={`admin-message-${m.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {m.sender === "admin" ? "You (Admin)" : "Client"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p>{m.message}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            placeholder="Reply to client..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none text-sm min-h-[2.5rem] max-h-24"
            rows={1}
            data-testid="input-admin-message"
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()} data-testid="button-admin-send">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
