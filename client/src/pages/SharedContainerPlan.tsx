import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, CopyPlus, Eye, Package, Scale, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useToast } from "@/hooks/use-toast";
import { saveContainerShareTransfer, type EditableSharedPlan } from "@/lib/containerShareTransfer";
import { ContainerViewer3D } from "@/pages/tools/ContainerCalculator";

interface SharedPlanResponse extends EditableSharedPlan {
  token: string;
  createdAt: string;
  expiresAt: string;
}

export default function SharedContainerPlan() {
  const { toast } = useToast();
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<SharedPlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copying, setCopying] = useState(false);

  usePageMeta({
    title: "Shared Container Loading Plan | AccessToNorth.com",
    description: "Open a read-only 3D container loading plan shared with AccessToNorth.",
    canonical: `/share/load-plan/${token || ""}`,
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/shared-load-plans/${encodeURIComponent(token || "")}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "This loading plan could not be opened.");
        return data as SharedPlanResponse;
      })
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "This loading plan could not be opened.");
      });
    return () => { cancelled = true; };
  }, [token]);

  const totals = useMemo(() => {
    if (!plan) return { pieces: 0, weight: 0 };
    const boxes = plan.containers.flatMap((entry) => entry.placed);
    return {
      pieces: boxes.length,
      weight: boxes.reduce((sum, box) => sum + box.weight, 0),
    };
  }, [plan]);

  const active = plan?.containers[activeIndex];
  const metric = plan?.unitSystem === "metric";
  const displayWeight = metric ? totals.weight * 0.453592 : totals.weight;

  const copyPlanToEditor = () => {
    if (!plan || copying) return;
    setCopying(true);
    try {
      saveContainerShareTransfer(plan);
      window.location.assign("/tools/container-calculator?from=shared-plan");
    } catch (reason) {
      setCopying(false);
      toast({
        title: "Could not create an editable copy",
        description: reason instanceof Error ? reason.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-[1500px] px-3 pb-16 pt-24 sm:px-6 lg:px-8">
        {error ? (
          <Card className="mx-auto mt-12 max-w-xl border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold">Loading plan unavailable</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p>
              <Button asChild className="mt-6"><a href="/tools/container-calculator">Create a new plan</a></Button>
            </CardContent>
          </Card>
        ) : !plan || !active ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-label="Loading shared plan" />
          </div>
        ) : (
          <>
            <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="gap-1.5 border-blue-200 bg-blue-50 text-primary hover:bg-blue-50"><Eye className="h-3 w-3" /> Read-only shared plan</Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><CalendarClock className="h-3.5 w-3.5" /> Shared {new Date(plan.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{plan.title}</h1>
                  <p className="mt-1 text-sm text-slate-500">Interactive 3D placement shared through AccessToNorth</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                  {[
                    { icon: Ship, label: "Containers", value: plan.containers.length.toLocaleString() },
                    { icon: Package, label: "Pieces", value: totals.pieces.toLocaleString() },
                    { icon: Scale, label: "Weight", value: `${displayWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${metric ? "kg" : "lbs"}` },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><stat.icon className="h-3 w-3" />{stat.label}</div>
                      <div className="mt-1 truncate text-sm font-bold text-slate-800">{stat.value}</div>
                    </div>
                  ))}
                  </div>
                  <Button type="button" className="h-12 shrink-0 gap-2 px-5" onClick={copyPlanToEditor} disabled={copying} data-testid="button-copy-shared-plan">
                    <CopyPlus className="h-4 w-4" />{copying ? "Preparing…" : "Copy and edit"}
                  </Button>
                </div>
              </div>
            </section>

            {plan.containers.length > 1 && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <Button variant="ghost" size="sm" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))} aria-label="Previous container"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">{active.label} · {active.container.name}</span>
                  <Badge variant="outline">{activeIndex + 1} / {plan.containers.length}</Badge>
                </div>
                <Button variant="ghost" size="sm" disabled={activeIndex === plan.containers.length - 1} onClick={() => setActiveIndex((index) => Math.min(plan.containers.length - 1, index + 1))} aria-label="Next container"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}

            <ContainerViewer3D
              placed={active.placed}
              container={active.container}
              unitSystem={plan.unitSystem}
              planIndex={activeIndex}
              planCount={plan.containers.length}
              onPreviousPlan={activeIndex > 0 ? () => setActiveIndex((index) => Math.max(0, index - 1)) : undefined}
              onNextPlan={activeIndex < plan.containers.length - 1 ? () => setActiveIndex((index) => Math.min(plan.containers.length - 1, index + 1)) : undefined}
            />

            <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:flex-row">
              <span>This snapshot stays unchanged. Copying it creates your own editable plan without changing the sender’s version.</span>
              <Button type="button" size="sm" variant="outline" className="gap-2" onClick={copyPlanToEditor} disabled={copying}><CopyPlus className="h-3.5 w-3.5" />Copy this plan and edit</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
