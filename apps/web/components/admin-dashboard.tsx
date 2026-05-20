"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Copy,
  FileUp,
  Globe2,
  Languages,
  MessageSquareText,
  Mic,
  Palette,
  Plug,
  ShieldCheck,
  UserRoundCheck,
  WandSparkles
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const demoSiteId = "site_demo_123";
const embedCode = `<script async src="${API_URL}/embed/assistant.js" data-site-id="${demoSiteId}"></script>`;

const metrics = [
  { label: "Visitors assisted", value: "18.4k", icon: UserRoundCheck },
  { label: "Lead captures", value: "1,248", icon: WandSparkles },
  { label: "Hindi chats", value: "72%", icon: Languages },
  { label: "Resolution rate", value: "91%", icon: ShieldCheck }
];

const traffic = [
  { name: "Mon", visits: 280 },
  { name: "Tue", visits: 420 },
  { name: "Wed", visits: 390 },
  { name: "Thu", visits: 560 },
  { name: "Fri", visits: 690 },
  { name: "Sat", visits: 640 },
  { name: "Sun", visits: 820 }
];

const conversations = [
  { name: "Priya", text: "मुझे pricing और WhatsApp booking के बारे में जानना है.", mood: "Warm lead" },
  { name: "Aarav", text: "Do you provide installation support after purchase?", mood: "Support" },
  { name: "Neha", text: "Refund policy Hindi mein batao.", mood: "Policy" }
];

export function AdminDashboard() {
  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass overflow-hidden rounded-[28px] p-6 sm:p-8"
      >
        <nav className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink">
              <Bot size={24} />
            </span>
            <div>
              <p className="text-sm text-white/60">Website AI Assistant</p>
              <h1 className="text-xl font-semibold">Hindi-first support automation</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/85">Login</button>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">Create account</button>
          </div>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-jade/30 bg-jade/10 px-3 py-1 text-sm text-jade">
              Paste one script. Train from the whole website.
            </p>
            <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
              AI sales, support, chat, and voice for every page.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Crawl pages, index services, FAQs, pricing, policies, documents, and visible page copy. The assistant replies in Hindi or English, matching the visitor's language and input mode.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-saffron px-5 py-3 font-bold text-ink">
                <Plug size={18} /> Generate embed
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-semibold text-white">
                <Activity size={18} /> View analytics
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-ink/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/60">Weekly assisted visitors</span>
              <span className="rounded-full bg-jade/15 px-3 py-1 text-xs text-jade">Live</span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={traffic}>
                  <defs>
                    <linearGradient id="traffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18c987" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#18c987" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="visits" stroke="#18c987" fill="url(#traffic)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((item) => (
          <div key={item.label} className="glass rounded-3xl p-5">
            <item.icon className="mb-5 text-saffron" size={22} />
            <p className="text-3xl font-black">{item.value}</p>
            <p className="mt-1 text-sm text-white/60">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="Embed code" icon={Copy}>
          <div className="rounded-2xl bg-black/45 p-4 font-mono text-sm text-jade">{embedCode}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Pill icon={Globe2} label="Auto crawl" />
            <Pill icon={Brain} label="RAG memory" />
            <Pill icon={Mic} label="Voice ready" />
          </div>
        </Panel>

        <Panel title="Training sources" icon={Brain}>
          <div className="grid gap-3">
            {[
              ["Website crawler", "Visible content, links, pricing, FAQs"],
              ["Upload PDFs/docs", "Policies, catalogs, manuals"],
              ["Manual training", "Owner corrections and trusted answers"]
            ].map(([title, text]) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <FileUp className="text-electric" size={20} />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/55">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Conversations" icon={MessageSquareText}>
          <div className="space-y-3">
            {conversations.map((chat) => (
              <div key={chat.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <strong>{chat.name}</strong>
                  <span className="rounded-full bg-saffron/15 px-3 py-1 text-xs text-saffron">{chat.mood}</span>
                </div>
                <p className="text-sm text-white/65">{chat.text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Assistant controls" icon={Palette}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Control label="Assistant name" value="Asha AI" />
            <Control label="Priority language" value="Hindi" />
            <Control label="Theme" value="Glass dark" />
            <Control label="Voice" value="Enabled" />
            <Control label="Human handoff" value="WhatsApp + live chat" />
            <Control label="Rate limit" value="60 requests / minute" />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Bot; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <Icon size={19} />
        </span>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Pill({ icon: Icon, label }: { icon: typeof Bot; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
      <Icon size={16} /> {label}
    </span>
  );
}

function Control({ label, value }: { label: string; value: string }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</span>
      <span className="mt-2 block font-semibold">{value}</span>
    </label>
  );
}
