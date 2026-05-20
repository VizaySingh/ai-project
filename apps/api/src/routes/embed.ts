import { Router } from "express";
import { config } from "../config.js";

export const embedRouter = Router();

embedRouter.get("/assistant.js", (req, res) => {
  res.type("application/javascript");
  res.setHeader("Cache-Control", "public, max-age=300");
  const apiBase = config.API_BASE_URL;

  res.send(`
(function () {
  const script = document.currentScript;
  const siteId = script && script.getAttribute("data-site-id");
  if (!siteId || window.__WebsiteAIAssistantLoaded) return;
  window.__WebsiteAIAssistantLoaded = true;

  const apiBase = ${JSON.stringify(apiBase)};
  const state = {
    open: false,
    mode: "text",
    messages: [],
    conversationId: null,
    visitorId: localStorage.getItem("wai_visitor_id") || crypto.randomUUID()
  };
  localStorage.setItem("wai_visitor_id", state.visitorId);
  const root = document.createElement("div");
  root.id = "website-ai-assistant-root";
  document.body.appendChild(root);

  const style = document.createElement("style");
  style.textContent = \`
    #website-ai-assistant-root { position: fixed; z-index: 2147483647; right: 18px; bottom: 18px; font-family: Arial, sans-serif; color: #f8fbff; }
    .wai-button { width: 62px; height: 62px; border: 0; border-radius: 50%; cursor: pointer; color: #0d1020; background: linear-gradient(135deg,#ffb02e,#18c987); box-shadow: 0 18px 48px rgba(0,0,0,.28); font-weight: 900; }
    .wai-panel { width: min(390px, calc(100vw - 28px)); height: min(640px, calc(100vh - 104px)); margin-bottom: 14px; border: 1px solid rgba(255,255,255,.16); border-radius: 26px; background: rgba(10,14,29,.88); backdrop-filter: blur(22px); overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,.36); display: flex; flex-direction: column; }
    .wai-head { padding: 16px; border-bottom: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; gap: 12px; }
    .wai-avatar { width: 42px; height: 42px; border-radius: 16px; background: #18c987; color: #0d1020; display: grid; place-items: center; font-weight: 900; }
    .wai-chat { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .wai-msg { max-width: 86%; padding: 11px 13px; border-radius: 18px; line-height: 1.45; font-size: 14px; }
    .wai-assistant { align-self: flex-start; background: #fff; color: #0d1020; }
    .wai-user { align-self: flex-end; background: #4f8cff; color: #fff; }
    .wai-form { padding: 12px; display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,.1); }
    .wai-input { flex: 1; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; background: rgba(255,255,255,.08); color: #fff; padding: 0 13px; outline: none; min-width: 0; }
    .wai-send, .wai-voice { width: 42px; height: 42px; border-radius: 50%; border: 0; cursor: pointer; background: #18c987; color: #0d1020; font-weight: 900; }
    .wai-voice { background: rgba(255,255,255,.12); color: #fff; }
    @media (max-width: 520px) { #website-ai-assistant-root { right: 10px; bottom: 10px; } .wai-panel { height: calc(100vh - 92px); } }
  \`;
  document.head.appendChild(style);

  function pagePayload() {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script,style,noscript,svg,canvas").forEach((node) => node.remove());
    return {
      siteId,
      url: location.href,
      title: document.title,
      text: clone.innerText.replace(/\\s+/g, " ").trim().slice(0, 60000),
      links: Array.from(document.links).map((a) => a.href).filter((href) => href.startsWith(location.origin)).slice(0, 100)
    };
  }

  async function indexCurrentPage() {
    try {
      await fetch(apiBase + "/api/crawl/page", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(pagePayload())
      });
    } catch (_) {}
  }

  function render() {
    root.innerHTML = state.open ? panelHtml() + buttonHtml("×") : buttonHtml("AI");
    const toggle = root.querySelector(".wai-button");
    toggle.onclick = () => { state.open = !state.open; render(); };
    const form = root.querySelector(".wai-form");
    if (form) form.onsubmit = sendMessage;
    const voice = root.querySelector(".wai-voice");
    if (voice) voice.onclick = startVoice;
    const chat = root.querySelector(".wai-chat");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }

  function buttonHtml(label) {
    return '<button class="wai-button" aria-label="Open AI assistant">' + label + '</button>';
  }

  function panelHtml() {
    const msgs = state.messages.length ? state.messages : [{ role: "assistant", content: "नमस्ते! मैं इस वेबसाइट की जानकारी के आधार पर आपकी मदद कर सकती हूँ." }];
    return '<section class="wai-panel"><div class="wai-head"><div class="wai-avatar">AI</div><div><strong>Asha AI</strong><div style="font-size:12px;opacity:.62">Hindi + English support</div></div></div><div class="wai-chat">' +
      msgs.map((m) => '<div class="wai-msg wai-' + m.role + '">' + escapeHtml(m.content) + '</div>').join("") +
      '</div><form class="wai-form"><button type="button" class="wai-voice" aria-label="Voice">🎙</button><input class="wai-input" name="message" placeholder="Hindi or English..." autocomplete="off" /><button class="wai-send" aria-label="Send">➜</button></form></section>';
  }

  async function sendMessage(event) {
    event.preventDefault();
    const input = event.target.message;
    const message = input.value.trim();
    if (!message) return;
    input.value = "";
    state.messages.push({ role: "user", content: message });
    render();
    try {
      const response = await fetch(apiBase + "/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, message, pageUrl: location.href, mode: "text", visitorId: state.visitorId, conversationId: state.conversationId })
      });
      const data = await response.json();
      state.conversationId = data.conversationId || state.conversationId;
      state.messages.push({ role: "assistant", content: data.answer || "Sorry, I could not answer that yet." });
    } catch (_) {
      state.messages.push({ role: "assistant", content: "Connection issue. Please try again." });
    }
    render();
  }

  function startVoice() {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      state.messages.push({ role: "assistant", content: "Voice is not supported in this browser. You can continue with chat." });
      render();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      const fakeEvent = { preventDefault() {}, target: { message: { value: transcript } } };
      sendMessage(fakeEvent);
    };
    recognition.start();
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  indexCurrentPage();
  render();
})();`);
});
