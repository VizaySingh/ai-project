"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Copy,
  Database,
  FileText,
  Globe2,
  Languages,
  Lock,
  LogOut,
  MessageSquareText,
  Mic,
  Plug,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  WandSparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type User = { id: string; email: string; name?: string | null };
type Site = {
  id: string;
  name: string;
  domain: string;
  assistantName: string;
  theme: string;
  voiceEnabled: boolean;
  languages: string[];
  embedCode: string;
  _count?: { conversations: number; pages: number; chunks: number; events: number };
};
type Analytics = {
  visitorsAssisted: number;
  leads: number;
  voiceSessions: number;
  conversations: number;
  pages: number;
  chunks: number;
};
type Conversation = {
  id: string;
  visitorId: string;
  language: string;
  mode: string;
  messages: Array<{ id: string; role: string; content: string }>;
};

export function OwnerConsole() {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [message, setMessage] = useState("");
  const selectedSite = useMemo(() => sites.find((site) => site.id === selectedSiteId) ?? sites[0], [selectedSiteId, sites]);

  useEffect(() => {
    const saved = localStorage.getItem("assistant_token") ?? "";
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("assistant_token", token);
    loadDashboard(token);
  }, [token]);

  useEffect(() => {
    if (selectedSite?.id && token) {
      void loadSiteData(selectedSite.id, token);
    }
  }, [selectedSite?.id, token]);

  async function loadDashboard(authToken = token) {
    try {
      const [me, siteList] = await Promise.all([
        api<{ user: User }>("/api/auth/me", { authToken }),
        api<{ sites: Site[] }>("/api/sites", { authToken })
      ]);
      setUser(me.user);
      setSites(siteList.sites);
      setSelectedSiteId((current) => current || siteList.sites[0]?.id || "");
    } catch {
      localStorage.removeItem("assistant_token");
      setToken("");
      setUser(null);
    }
  }

  async function loadSiteData(siteId: string, authToken = token) {
    const [summary, inbox] = await Promise.all([
      api<Analytics>(`/api/analytics/${siteId}/summary`, { authToken }),
      api<{ conversations: Conversation[] }>(`/api/conversations/${siteId}`, { authToken })
    ]);
    setAnalytics(summary);
    setConversations(inbox.conversations);
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>, mode: "login" | "signup") {
    event.preventDefault();
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await api<{ token: string; user: User }>(`/api/auth/${mode}`, {
        method: "POST",
        body: {
          email: String(form.get("email")),
          password: String(form.get("password")),
          name: String(form.get("name") || "")
        }
      });
      setUser(response.user);
      setToken(response.token);
      setMessage(mode === "signup" ? "Account created. Your database-backed workspace is ready." : "Logged in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function createSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      const form = new FormData(event.currentTarget);
      const response = await api<{ site: Site }>("/api/sites", {
        method: "POST",
        authToken: token,
        body: {
          name: String(form.get("name")),
          domain: String(form.get("domain")),
          assistantName: String(form.get("assistantName") || "Asha AI"),
          theme: String(form.get("theme") || "dark"),
          voiceEnabled: form.get("voiceEnabled") === "on",
          languages: ["hi", "en"]
        }
      });
      setSites((current) => [response.site, ...current]);
      setSelectedSiteId(response.site.id);
      event.currentTarget.reset();
      setMessage("Website saved in database and embed code generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create website.");
    }
  }

  async function trainSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSite || !token) return;
    try {
      const form = new FormData(event.currentTarget);
      await api("/api/training/text", {
        method: "POST",
        authToken: token,
        body: {
          siteId: selectedSite.id,
          title: String(form.get("title") || "Manual training"),
          text: String(form.get("text"))
        }
      });
      event.currentTarget.reset();
      await loadSiteData(selectedSite.id);
      setMessage("Training content indexed and stored.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Training failed.");
    }
  }

  async function crawlSite() {
    if (!selectedSite || !token) return;
    try {
      const result = await api<{ indexed: string[] }>("/api/crawl/site", {
        method: "POST",
        authToken: token,
        body: { siteId: selectedSite.id, startUrl: selectedSite.domain, maxPages: 10 }
      });
      await loadSiteData(selectedSite.id);
      setMessage(`Crawler indexed ${result.indexed.length} page(s).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Crawler failed.");
    }
  }

  if (!token || !user) {
    return (
      <div className="space-y-5">
        <HeroShell />
        <section className="grid gap-5 lg:grid-cols-2">
          <AuthPanel title="Create owner account" icon={UserPlus} mode="signup" onSubmit={handleAuth} />
          <AuthPanel title="Login" icon={Lock} mode="login" onSubmit={handleAuth} />
        </section>
        {message && <Status>{message}</Status>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HeroShell user={user} onLogout={() => {
        localStorage.removeItem("assistant_token");
        setToken("");
        setUser(null);
      }} />

      {message && <Status>{message}</Status>}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric icon={Activity} label="Visitors assisted" value={String(analytics?.visitorsAssisted ?? 0)} />
        <Metric icon={MessageSquareText} label="Conversations" value={String(analytics?.conversations ?? selectedSite?._count?.conversations ?? 0)} />
        <Metric icon={Globe2} label="Pages indexed" value={String(analytics?.pages ?? selectedSite?._count?.pages ?? 0)} />
        <Metric icon={Database} label="Knowledge chunks" value={String(analytics?.chunks ?? selectedSite?._count?.chunks ?? 0)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Create website" icon={Plug}>
          <form className="grid gap-3" onSubmit={createSite}>
            <Input name="name" label="Website name" placeholder="Acme Store" />
            <Input name="domain" label="Website URL" placeholder="https://example.com" />
            <Input name="assistantName" label="Assistant name" placeholder="Asha AI" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Select name="theme" label="Theme" options={["dark", "light", "auto"]} />
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-white/70">Voice enabled</span>
                <input name="voiceEnabled" type="checkbox" defaultChecked className="h-5 w-5 accent-jade" />
              </label>
            </div>
            <button className="rounded-full bg-saffron px-5 py-3 font-bold text-ink">Save website</button>
          </form>
        </Panel>

        <Panel title="Database websites" icon={Database}>
          <div className="mb-4 flex flex-wrap gap-2">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSiteId(site.id)}
                className={selectedSite?.id === site.id ? "rounded-full bg-jade px-4 py-2 text-sm font-bold text-ink" : "rounded-full border border-white/10 px-4 py-2 text-sm text-white/75"}
              >
                {site.name}
              </button>
            ))}
          </div>
          {selectedSite ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/55">{selectedSite.domain}</p>
                <h3 className="mt-1 text-2xl font-black">{selectedSite.assistantName}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge icon={Languages} label={selectedSite.languages.join(" + ")} />
                  <Badge icon={Mic} label={selectedSite.voiceEnabled ? "Voice on" : "Voice off"} />
                  <Badge icon={ShieldCheck} label={selectedSite.theme} />
                </div>
              </div>
              <div className="rounded-2xl bg-black/45 p-4 font-mono text-xs leading-6 text-jade">{selectedSite.embedCode}</div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => navigator.clipboard?.writeText(selectedSite.embedCode)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm">
                  <Copy size={16} /> Copy embed
                </button>
                <button onClick={crawlSite} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
                  <RefreshCw size={16} /> Crawl website
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white/60">Create your first website to generate the embed code.</p>
          )}
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Manual training" icon={Brain}>
          <form className="grid gap-3" onSubmit={trainSite}>
            <Input name="title" label="Training title" placeholder="Pricing FAQ" />
            <label className="grid gap-2">
              <span className="text-sm text-white/65">Trusted answer text</span>
              <textarea name="text" required rows={7} className="rounded-2xl border border-white/10 bg-white/5 p-4 outline-none focus:border-jade" placeholder="Paste FAQs, policy, pricing, booking process, or support details..." />
            </label>
            <button disabled={!selectedSite} className="rounded-full bg-jade px-5 py-3 font-bold text-ink disabled:opacity-40">Train assistant</button>
          </form>
        </Panel>

        <Panel title="Conversation inbox" icon={MessageSquareText}>
          <div className="space-y-3">
            {conversations.length ? conversations.map((conversation) => (
              <div key={conversation.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <strong className="text-sm">Visitor {conversation.visitorId.slice(0, 8)}</strong>
                  <span className="rounded-full bg-saffron/15 px-3 py-1 text-xs text-saffron">{conversation.language} / {conversation.mode}</span>
                </div>
                <p className="text-sm text-white/65">{conversation.messages.at(-1)?.content ?? "No messages yet"}</p>
              </div>
            )) : <p className="text-white/60">Conversations will appear here after visitors chat with the widget.</p>}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function HeroShell({ user, onLogout }: { user?: User; onLogout?: () => void }) {
  return (
    <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden rounded-[28px] p-6 sm:p-8">
      <nav className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink"><Bot size={24} /></span>
          <div>
            <p className="text-sm text-white/60">Website AI Assistant</p>
            <h1 className="text-xl font-semibold">Owner dashboard + database</h1>
          </div>
        </div>
        {user && (
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85">
            <LogOut size={16} /> {user.email}
          </button>
        )}
      </nav>
      <p className="mb-3 inline-flex rounded-full border border-jade/30 bg-jade/10 px-3 py-1 text-sm text-jade">
        Groq + Sarvam AI, Hindi-first, database-backed
      </p>
      <h2 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">Build, train, embed, and manage website assistants.</h2>
      <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
        Create owner accounts, store websites in PostgreSQL, generate one-line embed scripts, crawl pages, train answers, and review customer conversations.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Badge icon={WandSparkles} label="AI sales + support" />
        <Badge icon={FileText} label="FAQ/doc training" />
        <Badge icon={Database} label="Prisma database" />
      </div>
    </motion.header>
  );
}

function AuthPanel({ title, icon: Icon, mode, onSubmit }: { title: string; icon: typeof Bot; mode: "login" | "signup"; onSubmit: (event: FormEvent<HTMLFormElement>, mode: "login" | "signup") => void }) {
  return (
    <Panel title={title} icon={Icon}>
      <form className="grid gap-3" onSubmit={(event) => onSubmit(event, mode)}>
        {mode === "signup" && <Input name="name" label="Name" placeholder="Website Owner" />}
        <Input name="email" label="Email" placeholder="owner@example.com" type="email" />
        <Input name="password" label="Password" placeholder="Minimum 8 characters" type="password" />
        <button className="rounded-full bg-saffron px-5 py-3 font-bold text-ink">{mode === "signup" ? "Create account" : "Login"}</button>
      </form>
    </Panel>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><Icon size={19} /></span>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <Icon className="mb-5 text-saffron" size={22} />
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-white/60">{label}</p>
    </div>
  );
}

function Badge({ icon: Icon, label }: { icon: typeof Bot; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75"><Icon size={16} /> {label}</span>;
}

function Status({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-jade/20 bg-jade/10 px-4 py-3 text-sm text-jade">{children}</div>;
}

function Input({ name, label, placeholder, type = "text" }: { name: string; label: string; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-white/65">{label}</span>
      <input name={name} type={type} required className="rounded-full border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-jade" placeholder={placeholder} />
    </label>
  );
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm text-white/65">{label}</span>
      <select name={name} className="rounded-full border border-white/10 bg-ink px-4 py-3 outline-none focus:border-jade">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

async function api<T = unknown>(path: string, options: { method?: string; authToken?: string; body?: unknown } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.authToken ? { authorization: `Bearer ${options.authToken}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}
