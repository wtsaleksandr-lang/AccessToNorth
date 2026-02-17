import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  MessageSquare,
  LogOut,
  Send,
  Paperclip,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import type { OrderStep } from "@shared/schema";

interface OrderData {
  id: string;
  customerEmail: string;
  customerName: string | null;
  serviceType: string;
  status: string;
  steps: OrderStep[];
  createdAt: string;
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

interface PortalData {
  order: OrderData;
  uploads: UploadData[];
  messages: MessageData[];
}

async function apiCall(url: string, options?: RequestInit) {
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

export default function ClientPortal() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  useEffect(() => {
    document.title = "Client Portal - AccessToNorth.com";
    const meta = document.querySelector('meta[name="description"]');
    if (meta)
      meta.setAttribute(
        "content",
        "Track your GST/HST and Business Number registration progress with AccessToNorth.com's secure client portal."
      );
  }, []);

  function handleLoginSuccess(oid: string) {
    setOrderId(oid);
    setLoggedIn(true);
  }

  async function handleLogout() {
    try {
      await fetch("/api/portal/logout", { method: "POST", credentials: "include" });
    } catch {}
    setLoggedIn(false);
    setPortalData(null);
    setOrderId("");
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {!loggedIn ? (
            <LoginForm onSuccess={handleLoginSuccess} />
          ) : (
            <Dashboard
              orderId={orderId}
              portalData={portalData}
              setPortalData={setPortalData}
              onLogout={handleLogout}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: (orderId: string) => void }) {
  const [email, setEmail] = useState("");
  const [oid, setOid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiCall("/api/portal/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), orderId: oid.trim() }),
      });
      onSuccess(res.orderId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center">
      <h1
        className="text-3xl md:text-4xl font-bold font-display mb-3"
        data-testid="text-portal-title"
      >
        Client Portal
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Enter your email and order ID to access your registration dashboard.
      </p>

      <Card className="max-w-md mx-auto" data-testid="card-portal-login">
        <CardHeader>
          <CardTitle className="text-lg">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left space-y-2">
              <Label htmlFor="portal-email">Email Address</Label>
              <Input
                id="portal-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-portal-email"
              />
            </div>
            <div className="text-left space-y-2">
              <Label htmlFor="portal-order-id">Order ID</Label>
              <Input
                id="portal-order-id"
                placeholder="ATN-XXXXXX"
                value={oid}
                onChange={(e) => setOid(e.target.value)}
                required
                data-testid="input-portal-order-id"
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm text-destructive"
                data-testid="text-login-error"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="button-portal-login">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            Your Order ID was sent to your email after payment. Need help?{" "}
            <a href="mailto:operations@accesstonorth.com" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="mt-6"
        onClick={() => (window.location.href = "/")}
        data-testid="button-back-home"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
    </div>
  );
}

function Dashboard({
  orderId,
  portalData,
  setPortalData,
  onLogout,
}: {
  orderId: string;
  portalData: PortalData | null;
  setPortalData: (d: PortalData | null) => void;
  onLogout: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const data = await apiCall(`/api/portal/order/${orderId}`);
      setPortalData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-20" data-testid="loading-dashboard">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !portalData) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <p className="text-destructive font-medium">{error || "Failed to load data"}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={fetchData} data-testid="button-retry">
            Try Again
          </Button>
          <Button variant="ghost" onClick={onLogout} data-testid="button-logout-error">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const { order, uploads, messages } = portalData;
  const doneCount = order.steps.filter((s) => s.state === "done").length;
  const progressPercent = Math.round((doneCount / order.steps.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display" data-testid="text-dashboard-title">
            Your Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Order <span className="font-mono font-medium" data-testid="text-order-id">{order.id}</span>
          </p>
        </div>
        <Button variant="ghost" onClick={onLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Card data-testid="card-order-info">
        <CardContent className="pt-6 space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="font-medium" data-testid="text-service-type">{order.serviceType}</p>
            <Badge variant="secondary" data-testid="badge-status">{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Started {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </CardContent>
      </Card>

      <Card data-testid="card-progress">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Overall</span>
              <span className="text-sm font-bold text-primary" data-testid="text-progress-percent">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-bar"
              />
            </div>
          </div>

          <div className="space-y-2">
            {order.steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-md border ${
                  step.state === "done"
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                    : step.state === "working"
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
                    : "bg-muted/40 border-border"
                }`}
                data-testid={`step-${i}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.state === "done"
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                      : step.state === "working"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.state === "done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : step.state === "working" ? (
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`flex-1 text-sm font-medium ${
                    step.state === "done"
                      ? "text-green-800 dark:text-green-300"
                      : step.state === "working"
                      ? "text-blue-800 dark:text-blue-300"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${
                    step.state === "done"
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : step.state === "working"
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : ""
                  }`}
                >
                  {step.state === "done" ? "Done" : step.state === "working" ? "In Progress" : "Upcoming"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileSection orderId={orderId} uploads={uploads} onRefresh={fetchData} />
        <MessageSection orderId={orderId} messages={messages} onRefresh={fetchData} />
      </div>
    </div>
  );
}

function FileSection({
  orderId,
  uploads,
  onRefresh,
}: {
  orderId: string;
  uploads: UploadData[];
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/portal/order/${orderId}/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(body.message);
      }

      onRefresh();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function formatSize(bytes: string | null) {
    if (!bytes) return "";
    const n = parseInt(bytes, 10);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Card data-testid="card-files">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={handleUpload}
          data-testid="input-file-upload"
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          data-testid="button-upload-file"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? "Uploading..." : "Upload Document"}
        </Button>

        {uploadError && (
          <p className="text-xs text-destructive" data-testid="text-upload-error">
            {uploadError}
          </p>
        )}

        {uploads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No documents uploaded yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploads.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border text-sm"
                data-testid={`upload-item-${u.id}`}
              >
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{u.fileName}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatSize(u.fileSize)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MessageSection({
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
  const [sendError, setSendError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    setSendError("");

    try {
      await apiCall(`/api/portal/order/${orderId}/message`, {
        method: "POST",
        body: JSON.stringify({ message: text.trim() }),
      });
      setText("");
      onRefresh();
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  const sortedMessages = [...messages].reverse();

  return (
    <Card data-testid="card-messages">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-48 overflow-y-auto space-y-2">
          {sortedMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages yet. Send one below.
            </p>
          ) : (
            sortedMessages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-md text-sm ${
                  m.sender === "client"
                    ? "bg-primary/10 dark:bg-primary/20 ml-4"
                    : "bg-muted mr-4"
                }`}
                data-testid={`message-item-${m.id}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {m.sender === "client" ? "You" : "AccessToNorth"}
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
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none text-sm min-h-[2.5rem] max-h-24"
            rows={1}
            data-testid="input-message"
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()} data-testid="button-send-message">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>

        {sendError && (
          <p className="text-xs text-destructive" data-testid="text-send-error">
            {sendError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
