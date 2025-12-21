import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  TrendingDown,
  RotateCcw,
  Play,
  Download,
  GitCompare,
  Loader2,
  AlertCircle,
  Info,
  LayoutGrid,
  ListFilter,
  CheckCircle,
} from "lucide-react";

// IMPORTANT: Use your API service located at ../lib/api
// Ensure ../lib/api exports: `allExperiments` with a `getExperiments(): Promise<AllExperiments | null>`
import { allExperiments ,Model} from "../lib/api";

// ---- Types (mirror backend) ----
export interface Result {
  id: number;
  modality: string;
  tokens_used: number;
  time_taken_seconds: string;
  cost_usd: string;
  accuracy_score: string;
  response_text: string;
  experiment: number;
  model: Model;
}

export interface Experiment {
  id: number;
  results: Result[];
  timestamp: string;
  modalities: string[];
  source_content_url: string | null;
  data_types: string[];
  task_prompt: string;
}

export type AllExperiments = Experiment[];

// ---- Helpers ----
const toNum = (v: string | number | null | undefined) => {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.+-eE]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const fmtCurrency = (n: number) => `$${n.toFixed(4)}`;
const fmtSecs = (n: number) => `${n.toFixed(2)}s`;
const qualityBadge = (q: number) => {
  if (q >= 0.9) return <Badge className="bg-green-600 hover:bg-green-600">Excellent</Badge>;
  if (q >= 0.8) return <Badge variant="secondary">Good</Badge>;
  return <Badge variant="destructive">Fair</Badge>;
};

// Aggregate by key helper
const aggregateBy = <T, K extends string | number | symbol, N extends string>(
  arr: T[],
  key: (t: T) => K,
  reducers: Record<N, (items: T[]) => any>
): Array<Record<N | "_key", any>> => {
  const map = new Map<K, T[]>();
  arr.forEach((it) => {
    const k = key(it);
    map.set(k, [...(map.get(k) || []), it]);
  });
  return Array.from(map.entries()).map(([k, items]) => {
    const base: any = { _key: k };
    Object.entries(reducers).forEach(([name, fn]) => {
      base[name] = (fn as (items: T[]) => any)(items);
    });
    return base;
  });
};

// ---- Multi-select (headless) ----
const MultiSelect: React.FC<{
  options: Array<{ label: string; value: number }>;
  value: number[];
  onChange: (next: number[]) => void;
  placeholder?: string;
}> = ({ options, value, onChange, placeholder = "Select experiments" }) => {
  const [open, setOpen] = useState(false);

  const toggle = (val: number) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  const label =
    value.length === 0
      ? placeholder
      : `${value.length} selected`;

  return (
    <div className="relative">
      <Button variant="outline" className="min-w-[220px] justify-between" onClick={() => setOpen((o) => !o)}>
        <span className="flex items-center gap-2"><ListFilter className="h-4 w-4" /> {label}</span>
        <span className="text-muted-foreground">▼</span>
      </Button>
      {open && (
        <div className="absolute z-20 mt-2 w-[320px] rounded-2xl border bg-popover p-2 shadow-xl">
          <div className="max-h-64 overflow-auto">
            {options.map((opt) => {
              const active = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between hover:bg-accent ${
                    active ? "bg-accent" : ""
                  }`}
                >
                  <span>{opt.label}</span>
                  {active ? <CheckCircle className="h-4 w-4 text-green-600" /> : null}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => onChange([])}>Clear</Button>
            <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Main Component ----
const Results: React.FC = () => {
  const [experiments, setExperiments] = useState<AllExperiments>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selections
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // multi-select for single/cumulative views
  const [compareIds, setCompareIds] = useState<number[]>([]); // exactly two for compare

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await allExperiments.getExperiments();
        if (mounted) {
          if (data) {
            setExperiments(data);
            // Default select the first experiment if available
            if (data.length > 0) setSelectedIds([data[0].id]);
          } else {
            setError("Failed to fetch experiments");
          }
        }
      } catch (e: any) {
        setError(e?.message || "Unexpected error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo(
    () => experiments.map((e) => ({ label: `#${e.id} • ${new Date(e.timestamp).toLocaleString()}`, value: e.id })),
    [experiments]
  );

  const selectedExperiments = useMemo(
    () => experiments.filter((e) => selectedIds.includes(e.id)),
    [experiments, selectedIds]
  );

  const compareA = experiments.find((e) => compareIds[0] === e.id) || null;
  const compareB = experiments.find((e) => compareIds[1] === e.id) || null;

  // ---- Derived data builders ----
  const buildCostByModality = (exps: Experiment[]) => {
    const rows = exps.flatMap((e) => e.results.map((r) => ({
      exp: e.id,
      modality: r.modality,
      cost: toNum(r.cost_usd),
    })));
    const grouped = aggregateBy(rows, (x) => x.modality, {
      cost: (items) => items.reduce((s, it) => s + toNum(it.cost), 0),
    });
    return grouped.map((g) => ({ modality: String(g._key), cost: g.cost }));
  };

  const buildCostVsAccuracy = (exps: Experiment[]) =>
    exps.flatMap((e) =>
      e.results.map((r) => ({
        exp: e.id,
        modality: r.modality,
        cost: toNum(r.cost_usd),
        accuracy: toNum(r.accuracy_score) * (toNum(r.accuracy_score) > 1 ? 1 : 100), // normalize if 0-1 or 0-100
      }))
    );

  const buildLatencySeries = (exps: Experiment[]) => {
    const rows = exps.flatMap((e) => e.results.map((r) => ({
      exp: e.id,
      modality: r.modality,
      time: toNum(r.time_taken_seconds),
    })));
    const grouped = aggregateBy(rows, (x) => x.modality, {
      time: (items) => items.reduce((s, it) => s + toNum(it.time), 0) / Math.max(items.length, 1), // avg
    });
    return grouped.map((g) => ({ modality: String(g._key), time: g.time }));
  };

  const buildTableRows = (exps: Experiment[]) =>
    exps.flatMap((e) =>
      e.results.map((r) => ({
        key: `${e.id}-${r.id}`,
        exp: e.id,
        modality: r.modality,
        tokens: toNum(r.tokens_used),
        cost: toNum(r.cost_usd),
        time: toNum(r.time_taken_seconds),
        accuracy: toNum(r.accuracy_score),
        model: r.model,
        response: r.response_text,
      }))
    );

  const buildCompareRadar = (a: Experiment | null, b: Experiment | null) => {
    if (!a || !b) return [] as Array<{ metric: string; A: number; B: number }>;
    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
    const A = {
      cost: sum(a.results.map((r) => toNum(r.cost_usd))),
      time: avg(a.results.map((r) => toNum(r.time_taken_seconds))),
      acc: avg(a.results.map((r) => toNum(r.accuracy_score))),
      tokens: sum(a.results.map((r) => toNum(r.tokens_used))),
    };
    const B = {
      cost: sum(b.results.map((r) => toNum(r.cost_usd))),
      time: avg(b.results.map((r) => toNum(r.time_taken_seconds))),
      acc: avg(b.results.map((r) => toNum(r.accuracy_score))),
      tokens: sum(b.results.map((r) => toNum(r.tokens_used))),
    };
    // Normalize values to 0..1 for radar by dividing by max(A,B)
    const norm = (a: number, b: number) => {
      const m = Math.max(a, b, 1e-9);
      return [a / m, b / m];
    };
    const [costA, costB] = norm(A.cost, B.cost);
    const [timeA, timeB] = norm(A.time, B.time);
    const [accA, accB] = norm(A.acc, B.acc);
    const [tokA, tokB] = norm(A.tokens, B.tokens);
    return [
      { metric: "Total Cost", A: costA, B: costB },
      { metric: "Avg Time", A: timeA, B: timeB },
      { metric: "Avg Accuracy", A: accA, B: accB },
      { metric: "Total Tokens", A: tokA, B: tokB },
    ];
  };

  // Derived datasets
  const costByModality = useMemo(() => buildCostByModality(selectedExperiments), [selectedExperiments]);
  const costVsAccuracy = useMemo(() => buildCostVsAccuracy(selectedExperiments), [selectedExperiments]);
  const latencySeries = useMemo(() => buildLatencySeries(selectedExperiments), [selectedExperiments]);
  const tableRows = useMemo(() => buildTableRows(selectedExperiments), [selectedExperiments]);
  const radarData = useMemo(() => buildCompareRadar(compareA, compareB), [compareA, compareB]);

  const totalCost = useMemo(() => tableRows.reduce((s, r) => s + r.cost, 0), [tableRows]);
  const avgAcc = useMemo(() => {
    const arr = tableRows.map((r) => r.accuracy).filter((x) => Number.isFinite(x));
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  }, [tableRows]);
  const avgTime = useMemo(() => {
    const arr = tableRows.map((r) => r.time).filter((x) => Number.isFinite(x));
    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
  }, [tableRows]);

  // Export helper
  const exportJSON = () => {
    const payload = {
      selectedIds,
      experiments: selectedExperiments,
      aggregates: { totalCost, avgAcc, avgTime },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `experiments_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading experiments…</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" /> Failed to load</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}><RotateCcw className="h-4 w-4 mr-2" /> Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">Results & Analysis</h1>
          <p className="text-muted-foreground mt-2">Interactive results fetched from your backend experiments API</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJSON}><Download className="mr-2 h-4 w-4" /> Export JSON</Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Select Experiments</CardTitle>
          <CardDescription>Choose one or more experiments to render per-experiment and cumulative views. Use compare mode to contrast two experiments.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected (single/cumulative)</div>
            <MultiSelect options={options} value={selectedIds} onChange={setSelectedIds} />
            <div className="text-xs text-muted-foreground">Currently selected: {selectedIds.length || 0}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2"><GitCompare className="h-4 w-4" /> Compare exactly two</div>
            <MultiSelect options={options} value={compareIds} onChange={(v) => setCompareIds(v.slice(-2))} placeholder="Pick two experiments" />
            <div className="text-xs text-muted-foreground">Pick 2 to enable comparison</div>
          </div>
        </CardContent>
      </Card>

      {/* Details for each selected experiment */}
      {selectedExperiments.map((exp) => (
        <Card key={exp.id} className="border-neutral-200 dark:border-neutral-700">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Experiment #{exp.id}</CardTitle>
                <CardDescription>
                  <span className="inline-flex items-center gap-2"><Info className="h-4 w-4" /> {new Date(exp.timestamp).toLocaleString()}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {exp.modalities?.map((m) => (
                  <Badge key={m} variant="secondary">{m}</Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-muted-foreground">Data Types</div>
                <div className="text-sm mt-1">{exp.data_types?.join(", ") || "—"}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-muted-foreground">Source URL</div>
                <a className="text-sm text-tech-blue hover:underline break-all" href={exp.source_content_url || "#"} target="_blank" rel="noreferrer">
                  {exp.source_content_url || "—"}
                </a>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-muted-foreground">Avg Accuracy</div>
                <div className="mt-1">{qualityBadge(
                  (() => {
                    const arr = exp.results.map((r) => toNum(r.accuracy_score));
                    return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
                  })()
                )}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-muted-foreground">Total Cost</div>
                <div className="text-sm mt-1 font-medium">
                  {fmtCurrency(exp.results.reduce((s, r) => s + toNum(r.cost_usd), 0))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-muted-foreground">Task Prompt</div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{exp.task_prompt}</div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts">Interactive Charts</TabsTrigger>
          <TabsTrigger value="table">Detailed Results</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative View</TabsTrigger>
          <TabsTrigger value="compare">Compare Two</TabsTrigger>
        </TabsList>

        {/* Charts per current selection (combined points, modality aggregations) */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Cost by Modality (Selected)</CardTitle>
                    <CardDescription>Sum of costs grouped by modality across selected experiments</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { /* hook for rerun */ }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costByModality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="modality" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" /> Reproduce Figure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Cost vs Accuracy</CardTitle>
                    <CardDescription>Each point is one result across the selected experiments</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cost" name="Cost ($)" />
                    <YAxis dataKey="accuracy" name="Accuracy" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter data={costVsAccuracy} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Average Latency by Modality</CardTitle>
                  <CardDescription>Mean time_taken_seconds across selected experiments</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={latencySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modality" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="time" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table */}
        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results (Selected)</CardTitle>
              <CardDescription>All rows from the selected experiments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exp</TableHead>
                    <TableHead>Modality</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="text-muted-foreground">#{row.exp}</TableCell>
                      <TableCell className="font-medium">{row.modality}</TableCell>
                      <TableCell>{row.tokens.toLocaleString()}</TableCell>
                      <TableCell>{fmtCurrency(row.cost)}</TableCell>
                      <TableCell>{fmtSecs(row.time)}</TableCell>
                      <TableCell>{(row.accuracy > 1 ? row.accuracy : row.accuracy * 100).toFixed(2)}%</TableCell>
                      <TableCell>{row.model.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-green-600" /> Summary (Selected)</CardTitle>
              <CardDescription>Aggregated KPIs for the current selection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                  <div className="text-2xl font-bold">{fmtCurrency(totalCost)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Average Accuracy</div>
                  <div className="text-2xl font-bold">{(avgAcc > 1 ? avgAcc : avgAcc * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Average Latency</div>
                  <div className="text-2xl font-bold">{fmtSecs(avgTime)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative view across selected (already cumulative by aggregation above, but show dedicated area) */}
        <TabsContent value="cumulative" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Cost by Modality</CardTitle>
              <CardDescription>Shows total spend across all selected experiments grouped by modality</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={costByModality}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modality" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cumulative Cost vs Accuracy</CardTitle>
              <CardDescription>All results from selected experiments in one plot</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cost" name="Cost ($)" />
                  <YAxis dataKey="accuracy" name="Accuracy" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={costVsAccuracy} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compare exactly two */}
        <TabsContent value="compare" className="space-y-6">
          {compareIds.length !== 2 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5" /> Pick two experiments to compare</CardTitle>
                <CardDescription>Use the selector above to choose exactly two experiments.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[compareA, compareB].map((exp, i) => (
                  <Card key={exp?.id || i}>
                    <CardHeader>
                      <CardTitle>Experiment #{exp?.id}</CardTitle>
                      <CardDescription>{exp ? new Date(exp.timestamp).toLocaleString() : "—"}</CardDescription>
                    </CardHeader>
                    {!!exp && (
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs text-muted-foreground">Total Cost</div>
                          <div className="font-medium">
                            {fmtCurrency(exp.results.reduce((s, r) => s + toNum(r.cost_usd), 0))}
                          </div>
                        </div>
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs text-muted-foreground">Avg Accuracy</div>
                          <div>{(() => {
                            const arr = exp.results.map((r) => toNum(r.accuracy_score));
                            const v = arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
                            return `${(v > 1 ? v : v * 100).toFixed(2)}%`;
                          })()}</div>
                        </div>
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs text-muted-foreground">Avg Latency</div>
                          <div>{(() => {
                            const arr = exp.results.map((r) => toNum(r.time_taken_seconds));
                            const v = arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;
                            return fmtSecs(v);
                          })()}</div>
                        </div>
                        <div className="rounded-2xl border p-3">
                          <div className="text-xs text-muted-foreground">Total Tokens</div>
                          <div>{exp.results.reduce((s, r) => s + toNum(r.tokens_used), 0).toLocaleString()}</div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Normalized Radar Comparison</CardTitle>
                  <CardDescription>Each metric is scaled 0–1 by the max value among the two experiments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={radarData} outerRadius={120}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis />
                      <Radar name={`#${compareIds[0]}`} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name={`#${compareIds[1]}`} dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost vs Accuracy (Both Experiments)</CardTitle>
                  <CardDescription>Colors indicate experiment A vs B</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cost" name="Cost ($)" />
                      <YAxis dataKey="accuracy" name="Accuracy" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Legend />
                      <Scatter
                        name={`#${compareIds[0]}`}
                        data={compareA ? compareA.results.map((r) => ({ cost: toNum(r.cost_usd), accuracy: toNum(r.accuracy_score) })) : []}
                        fill="#8884d8"
                      />
                      <Scatter
                        name={`#${compareIds[1]}`}
                        data={compareB ? compareB.results.map((r) => ({ cost: toNum(r.cost_usd), accuracy: toNum(r.accuracy_score) })) : []}
                        fill="#82ca9d"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Results;
