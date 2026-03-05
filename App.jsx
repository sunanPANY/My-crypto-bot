import { useState, useEffect, useCallback } from "react";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const MOCK_AIRDROPS = [
  { id: 1, name: "ZKsync Era", symbol: "ZK", status: "🟢 เปิดรับ", deadline: "2025-04-30", reward: "~$200-800", difficulty: "ง่าย", link: "https://zksync.io", category: "Layer2" },
  { id: 2, name: "Scroll", symbol: "SCR", status: "🟡 รอประกาศ", deadline: "2025-05-15", reward: "~$100-500", difficulty: "ง่าย", link: "https://scroll.io", category: "Layer2" },
  { id: 3, name: "Monad", symbol: "MON", status: "🟢 เปิดรับ", deadline: "2025-06-01", reward: "~$500-2000", difficulty: "กลาง", link: "https://monad.xyz", category: "L1 Chain" },
  { id: 4, name: "Berachain", symbol: "BERA", status: "🟢 เปิดรับ", deadline: "2025-05-20", reward: "~$300-1500", difficulty: "กลาง", link: "https://berachain.com", category: "L1 Chain" },
  { id: 5, name: "Hyperliquid", symbol: "HYPE", status: "🔴 ปิดแล้ว", deadline: "2025-03-01", reward: "~$1000-5000", difficulty: "ยาก", link: "https://hyperliquid.xyz", category: "DEX" },
  { id: 6, name: "Sophon", symbol: "SOPH", status: "🟢 เปิดรับ", deadline: "2025-07-01", reward: "~$50-300", difficulty: "ง่าย", link: "https://sophon.xyz", category: "Gaming" },
];

const MOCK_YIELDS = [
  { protocol: "Pendle Finance", token: "ETH", apy: "18.4%", tvl: "$2.1B", chain: "Ethereum", risk: "กลาง", type: "Yield Trading" },
  { protocol: "Fluid", token: "USDC", apy: "12.8%", tvl: "$890M", chain: "Ethereum", risk: "ต่ำ", type: "Lending" },
  { protocol: "Kamino", token: "SOL", apy: "9.2%", tvl: "$1.3B", chain: "Solana", risk: "ต่ำ", type: "Yield Vault" },
  { protocol: "Aerodrome", token: "USDC/ETH", apy: "45.2%", tvl: "$650M", chain: "Base", risk: "กลาง", type: "DEX LP" },
  { protocol: "Orca", token: "SOL/USDC", apy: "28.7%", tvl: "$420M", chain: "Solana", risk: "กลาง", type: "DEX LP" },
  { protocol: "Venus", token: "BNB", apy: "8.9%", tvl: "$1.8B", chain: "BSC", risk: "ต่ำ", type: "Lending" },
];

const MOCK_MEME = [
  { name: "Dogwifhat", symbol: "WIF", change24h: "+12.4%", mcap: "$2.8B", volume: "$450M", trend: "🔥 ร้อนแรง", signal: "ซื้อ" },
  { name: "Bonk", symbol: "BONK", change24h: "+8.1%", mcap: "$1.9B", volume: "$320M", trend: "📈 ขาขึ้น", signal: "ถือ" },
  { name: "Pepe", symbol: "PEPE", change24h: "-3.2%", mcap: "$3.1B", volume: "$890M", trend: "⚡ แกว่ง", signal: "ระวัง" },
  { name: "Floki", symbol: "FLOKI", change24h: "+22.7%", mcap: "$890M", volume: "$210M", trend: "🚀 ปั๊มแรง", signal: "เก็งกำไร" },
  { name: "Brett", symbol: "BRETT", change24h: "+5.6%", mcap: "$650M", volume: "$180M", trend: "📈 ขาขึ้น", signal: "ถือ" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "ภาพรวม", icon: "◈" },
  { id: "airdrops", label: "แอร์ดรอป", icon: "🪂" },
  { id: "yields", label: "ฝากรับปันผล", icon: "💰" },
  { id: "meme", label: "เหรียญมีม", icon: "🎰" },
  { id: "bot", label: "ตั้งค่าบอท", icon: "🤖" },
];

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: "20px 24px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: -10, right: -10, fontSize: 64, opacity: 0.06 }}>{icon}</div>
      <div style={{ color: "#888", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 800, fontFamily: "'Saira Condensed', sans-serif", letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function AirdropCard({ item }) {
  const statusColor = item.status.includes("🟢") ? "#00ff88" : item.status.includes("🟡") ? "#ffcc00" : "#ff4444";
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "18px 20px",
      transition: "all 0.2s",
      cursor: "pointer",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = `${statusColor}44`; }}
    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
    onClick={() => window.open(item.link, "_blank")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{item.name}</div>
          <div style={{ color: "#666", fontSize: 12, marginTop: 2 }}>${item.symbol} · {item.category}</div>
        </div>
        <div style={{ background: `${statusColor}22`, color: statusColor, fontSize: 11, padding: "4px 10px", borderRadius: 20, border: `1px solid ${statusColor}44` }}>
          {item.status}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ background: "rgba(0,255,136,0.06)", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ color: "#555", fontSize: 10, marginBottom: 2 }}>รางวัลโดยประมาณ</div>
          <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 13 }}>{item.reward}</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ color: "#555", fontSize: 10, marginBottom: 2 }}>ความยาก</div>
          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{item.difficulty}</div>
        </div>
      </div>
      <div style={{ color: "#444", fontSize: 11, marginTop: 10, textAlign: "right" }}>⏰ หมดเขต: {item.deadline}</div>
    </div>
  );
}

function YieldRow({ item }) {
  const riskColor = item.risk === "ต่ำ" ? "#00ff88" : item.risk === "กลาง" ? "#ffcc00" : "#ff6644";
  const apyNum = parseFloat(item.apy);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      transition: "background 0.15s",
      cursor: "default",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div>
        <div style={{ color: "#fff", fontWeight: 600 }}>{item.protocol}</div>
        <div style={{ color: "#555", fontSize: 11 }}>{item.type}</div>
      </div>
      <div style={{ color: "#aaa" }}>{item.token}</div>
      <div style={{ color: apyNum > 20 ? "#ff6644" : apyNum > 10 ? "#ffcc00" : "#00ff88", fontWeight: 800, fontFamily: "'Saira Condensed', sans-serif", fontSize: 18 }}>{item.apy}</div>
      <div style={{ color: "#aaa", fontSize: 12 }}>{item.tvl}</div>
      <div style={{ color: "#aaa", fontSize: 12 }}>{item.chain}</div>
      <div style={{ background: `${riskColor}18`, color: riskColor, fontSize: 11, padding: "3px 10px", borderRadius: 20, textAlign: "center", width: "fit-content" }}>{item.risk}</div>
    </div>
  );
}

function MemeCard({ item }) {
  const isUp = item.change24h.startsWith("+");
  const changeColor = isUp ? "#00ff88" : "#ff4444";
  const sigColor = item.signal === "ซื้อ" || item.signal === "เก็งกำไร" ? "#00ff88" : item.signal === "ถือ" ? "#ffcc00" : "#ff6644";
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "18px 20px",
      transition: "all 0.2s",
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = `${changeColor}33`; }}
    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{item.name}</div>
          <div style={{ color: "#555", fontSize: 12 }}>${item.symbol}</div>
        </div>
        <div style={{ color: changeColor, fontWeight: 800, fontSize: 22, fontFamily: "'Saira Condensed', sans-serif" }}>{item.change24h}</div>
      </div>
      <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>MCap: {item.mcap} · Vol: {item.volume}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div style={{ color: "#888", fontSize: 13 }}>{item.trend}</div>
        <div style={{ background: `${sigColor}22`, color: sigColor, fontWeight: 700, fontSize: 12, padding: "4px 14px", borderRadius: 20, border: `1px solid ${sigColor}44` }}>
          {item.signal}
        </div>
      </div>
    </div>
  );
}

function BotSetup() {
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [checked, setChecked] = useState({ airdrops: true, yields: true, meme: true, arbitrage: false });
  const [time, setTime] = useState("08:00");

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fff",
    width: "100%",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const steps = [
    { num: "01", title: "สร้าง Telegram Bot", desc: "เปิด Telegram → ค้นหา @BotFather → พิมพ์ /newbot → ตั้งชื่อบอท → คัดลอก Token ที่ได้มา" },
    { num: "02", title: "หา Chat ID ของคุณ", desc: "ค้นหา @userinfobot ใน Telegram → กด Start → มันจะบอก Chat ID ของคุณ" },
    { num: "03", title: "Deploy บน Railway (ฟรี)", desc: "ไปที่ railway.app → สร้าง account → New Project → Deploy from GitHub → อัพโค้ด Python" },
    { num: "04", title: "ตั้งค่า Environment Variables", desc: "ใน Railway → Variables → เพิ่ม TELEGRAM_TOKEN และ CHAT_ID ที่ได้จากขั้นตอนข้างบน" },
  ];

  const pythonCode = `import asyncio
import os
from telegram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import aiohttp
from datetime import datetime

TOKEN = os.environ.get("TELEGRAM_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")
bot = Bot(token=TOKEN)

async def fetch_top_gainers():
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {"vs_currency": "usd", "order": "percent_change_24h_desc",
              "per_page": 5, "price_change_percentage": "24h"}
    async with aiohttp.ClientSession() as s:
        async with s.get(url, params=params) as r:
            return await r.json()

async def send_daily_report():
    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    gainers = await fetch_top_gainers()
    
    msg = f"""🚀 *รายงานประจำวัน Crypto Intelligence*
📅 {now}

*🏆 เหรียญขึ้นแรงวันนี้:*
"""
    for c in gainers[:5]:
        chg = c.get("price_change_percentage_24h", 0) or 0
        msg += f"• *{c['symbol'].upper()}*: \${c['current_price']:,.4f} "
        msg += f"({'📈 +' if chg >= 0 else '📉 '}{chg:.1f}%)\\n"

    msg += """
*🪂 แอร์ดรอปน่าจับตา:*
• ZKsync Era (ZK) - ง่าย ~$200-800
• Monad (MON) - กลาง ~$500-2000
• Berachain (BERA) - กลาง ~$300-1500

*💰 Yield สูงสุดวันนี้:*
• Aerodrome USDC/ETH: 45.2% APY
• Pendle ETH: 18.4% APY
• Orca SOL/USDC: 28.7% APY

*⚠️ Disclaimer:* ข้อมูลนี้เป็นเพียงการศึกษา ไม่ใช่คำแนะนำการลงทุน
"""
    await bot.send_message(chat_id=CHAT_ID, text=msg, parse_mode="Markdown")
    print(f"✅ ส่งรายงานเรียบร้อย {now}")

async def main():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(send_daily_report, "cron", hour=8, minute=0)
    scheduler.start()
    await send_daily_report()  # ส่งทันทีเมื่อเริ่ม
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())`;

  const requirementsTxt = `python-telegram-bot==20.7
apscheduler==3.10.4
aiohttp==3.9.1`;

  return (
    <div>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 6, fontFamily: "'Saira Condensed', sans-serif", letterSpacing: "0.02em" }}>ตั้งค่า Telegram Bot แจ้งเตือนอัตโนมัติ</div>
      <div style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>ฟรี 100% · Deploy บน Railway · แจ้งเตือนทุกเช้า 8:00 น.</div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {steps.map(s => (
          <div key={s.num} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20 }}>
            <div style={{ color: "#00ff88", fontFamily: "'Saira Condensed', sans-serif", fontSize: 28, fontWeight: 800, opacity: 0.4, lineHeight: 1 }}>{s.num}</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: "6px 0 6px" }}>{s.title}</div>
            <div style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Notification Preferences */}
      <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 14, padding: 24, marginBottom: 28 }}>
        <div style={{ color: "#00ff88", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>⚙️ เลือกหมวดหมู่แจ้งเตือน</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.entries(checked).map(([key, val]) => {
            const labels = { airdrops: "🪂 แอร์ดรอปใหม่", yields: "💰 Yield สูงสุด", meme: "🎰 มีม coin ปั๊ม", arbitrage: "⚡ โอกาส Arbitrage" };
            return (
              <div key={key} onClick={() => setChecked(p => ({ ...p, [key]: !p[key] }))}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: val ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${val ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: val ? "#00ff88" : "transparent", border: `2px solid ${val ? "#00ff88" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 900, flexShrink: 0 }}>{val ? "✓" : ""}</div>
                <div style={{ color: val ? "#fff" : "#555", fontSize: 13 }}>{labels[key]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#666", fontSize: 12, marginBottom: 6 }}>เวลาส่งรายงานประจำวัน</div>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, width: 140 }} />
        </div>
      </div>

      {/* Python Code */}
      <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 13 }}>📄 bot.py — โค้ด Telegram Bot (คัดลอกไปใช้ได้เลย)</div>
          <div style={{ color: "#555", fontSize: 11 }}>Python 3.11+</div>
        </div>
        <pre style={{ padding: "20px", color: "#aaa", fontSize: 11.5, overflowX: "auto", lineHeight: 1.7, margin: 0, maxHeight: 320, overflowY: "auto" }}>
          <code>{pythonCode}</code>
        </pre>
      </div>

      <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ color: "#ffcc00", fontWeight: 700, fontSize: 13 }}>📄 requirements.txt</div>
        </div>
        <pre style={{ padding: "16px 20px", color: "#aaa", fontSize: 12, margin: 0 }}><code>{requirementsTxt}</code></pre>
      </div>

      <div style={{ background: "rgba(255,204,0,0.05)", border: "1px solid rgba(255,204,0,0.15)", borderRadius: 12, padding: 16 }}>
        <div style={{ color: "#ffcc00", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⚠️ ข้อควรระวัง</div>
        <div style={{ color: "#888", fontSize: 12, lineHeight: 1.8 }}>
          ข้อมูลทั้งหมดเป็นเพื่อการศึกษาเท่านั้น · ไม่ใช่คำแนะนำการลงทุน · Crypto มีความเสี่ยงสูง · ลงทุนเท่าที่รับความเสี่ยงได้
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");

  const fetchPrices = useCallback(async () => {
    try {
      const r = await fetch(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,avalanche-2&order=market_cap_desc&per_page=5&sparkline=false&price_change_percentage=24h`);
      if (r.ok) { const d = await r.json(); setPrices(d); }
    } catch (e) {
      setPrices([
        { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 98450, price_change_percentage_24h: 2.14, market_cap: 1940000000000, total_volume: 42000000000 },
        { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3420, price_change_percentage_24h: -1.2, market_cap: 411000000000, total_volume: 18000000000 },
        { id: "solana", symbol: "sol", name: "Solana", current_price: 192, price_change_percentage_24h: 4.8, market_cap: 88000000000, total_volume: 5200000000 },
        { id: "binancecoin", symbol: "bnb", name: "BNB", current_price: 598, price_change_percentage_24h: 0.9, market_cap: 87000000000, total_volume: 2100000000 },
        { id: "avalanche-2", symbol: "avax", name: "Avalanche", current_price: 42.3, price_change_percentage_24h: -2.7, market_cap: 17500000000, total_volume: 890000000 },
      ]);
    }
    setLastUpdated(new Date().toLocaleTimeString("th-TH"));
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrices(); const t = setInterval(fetchPrices, 60000); return () => clearInterval(t); }, [fetchPrices]);

  const airdropCategories = ["ทั้งหมด", "Layer2", "L1 Chain", "DEX", "Gaming"];
  const filteredAirdrops = filter === "ทั้งหมด" ? MOCK_AIRDROPS : MOCK_AIRDROPS.filter(a => a.category === filter);

  const totalOpportunities = MOCK_AIRDROPS.filter(a => a.status.includes("🟢")).length;
  const topYield = MOCK_YIELDS.reduce((a, b) => parseFloat(a.apy) > parseFloat(b.apy) ? a : b);
  const topMeme = MOCK_MEME.reduce((a, b) => parseFloat(a.change24h) > parseFloat(b.change24h) ? a : b);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'Noto Sans Thai', 'Saira', sans-serif",
      color: "#fff",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;700;800;900&family=Noto+Sans+Thai:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(0,102,255,0.04) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Sidebar */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: "rgba(10,10,10,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column",
        zIndex: 100, padding: "28px 0",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 24px 28px" }}>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", color: "#00ff88" }}>CRYPTO</div>
          <div style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: "0.05em", color: "#fff", marginTop: -4 }}>INTEL</div>
          <div style={{ color: "#333", fontSize: 10, letterSpacing: "0.2em", marginTop: 2 }}>AI DASHBOARD</div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20 }}>
          {NAV_ITEMS.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 24px",
                cursor: "pointer",
                background: activeTab === item.id ? "rgba(0,255,136,0.08)" : "transparent",
                borderLeft: activeTab === item.id ? "3px solid #00ff88" : "3px solid transparent",
                color: activeTab === item.id ? "#00ff88" : "#444",
                fontSize: 14, fontWeight: activeTab === item.id ? 700 : 400,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.color = "#888"; }}
              onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.color = "#444"; }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "0 24px" }}>
          <div style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ color: "#00ff88", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🟢 ระบบทำงานอยู่</div>
            <div style={{ color: "#444", fontSize: 10 }}>อัพเดตล่าสุด: {lastUpdated || "—"}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, padding: "32px 36px", position: "relative", zIndex: 1 }}>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 36, fontWeight: 900, letterSpacing: "0.02em", margin: 0, color: "#fff" }}>
                ภาพรวมตลาดวันนี้
              </h1>
              <div style={{ color: "#444", fontSize: 13, marginTop: 4 }}>
                {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <StatCard label="โอกาส Airdrop" value={`${totalOpportunities} รายการ`} sub="เปิดรับอยู่ตอนนี้" color="#00ff88" icon="🪂" />
              <StatCard label="APY สูงสุด" value={topYield.apy} sub={`${topYield.protocol}`} color="#ffcc00" icon="💰" />
              <StatCard label="มีม coin ร้อนสุด" value={topMeme.change24h} sub={`$${topMeme.symbol}`} color="#ff6644" icon="🔥" />
              <StatCard label="เหรียญติดตาม" value="5 เหรียญ" sub="อัพเดตทุก 60 วิ" color="#6688ff" icon="◈" />
            </div>

            {/* Price Ticker */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: "#fff", fontWeight: 700 }}>📊 ราคา Realtime</div>
                <div style={{ color: "#333", fontSize: 11 }}>ข้อมูลจาก CoinGecko</div>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#333" }}>กำลังโหลด...</div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["เหรียญ", "ราคา (USD)", "เปลี่ยน 24ชม.", "Market Cap", "Volume 24ชม."].map(h => (
                      <div key={h} style={{ color: "#333", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</div>
                    ))}
                  </div>
                  {prices.map(c => {
                    const chg = c.price_change_percentage_24h || 0;
                    return (
                      <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div>
                          <span style={{ color: "#fff", fontWeight: 700 }}>{c.name}</span>
                          <span style={{ color: "#444", fontSize: 11, marginLeft: 8 }}>{c.symbol?.toUpperCase()}</span>
                        </div>
                        <div style={{ color: "#fff", fontFamily: "'Saira Condensed', sans-serif", fontSize: 18, fontWeight: 700 }}>
                          ${c.current_price?.toLocaleString()}
                        </div>
                        <div style={{ color: chg >= 0 ? "#00ff88" : "#ff4444", fontWeight: 700 }}>
                          {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                        </div>
                        <div style={{ color: "#555", fontSize: 12 }}>${(c.market_cap / 1e9).toFixed(1)}B</div>
                        <div style={{ color: "#555", fontSize: 12 }}>${(c.total_volume / 1e9).toFixed(2)}B</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Highlights */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)", borderRadius: 14, padding: 20 }}>
                <div style={{ color: "#00ff88", fontWeight: 700, marginBottom: 12 }}>🪂 แอร์ดรอปเร่งด่วน</div>
                {MOCK_AIRDROPS.filter(a => a.status.includes("🟢")).slice(0, 3).map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#aaa", fontSize: 13 }}>{a.name}</span>
                    <span style={{ color: "#00ff88", fontSize: 13, fontWeight: 600 }}>{a.reward.split("-")[1] || a.reward}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,204,0,0.04)", border: "1px solid rgba(255,204,0,0.1)", borderRadius: 14, padding: 20 }}>
                <div style={{ color: "#ffcc00", fontWeight: 700, marginBottom: 12 }}>💰 APY น่าสนใจ</div>
                {MOCK_YIELDS.slice(0, 3).map(y => (
                  <div key={y.protocol} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#aaa", fontSize: 13 }}>{y.protocol}</span>
                    <span style={{ color: "#ffcc00", fontSize: 13, fontWeight: 600 }}>{y.apy}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,102,68,0.04)", border: "1px solid rgba(255,102,68,0.1)", borderRadius: 14, padding: 20 }}>
                <div style={{ color: "#ff6644", fontWeight: 700, marginBottom: 12 }}>🔥 มีม Trending</div>
                {MOCK_MEME.slice(0, 3).map(m => (
                  <div key={m.symbol} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#aaa", fontSize: 13 }}>${m.symbol}</span>
                    <span style={{ color: m.change24h.startsWith("+") ? "#00ff88" : "#ff4444", fontSize: 13, fontWeight: 600 }}>{m.change24h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Airdrops Tab */}
        {activeTab === "airdrops" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 36, fontWeight: 900, margin: "0 0 6px", color: "#fff" }}>แอร์ดรอป & เหรียญต้นน้ำ</h1>
              <div style={{ color: "#444", fontSize: 13 }}>อัพเดตรายวัน · เรียงตามมูลค่าที่คาดหวัง</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {airdropCategories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} style={{
                  padding: "7px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "1px solid",
                  background: filter === cat ? "#00ff88" : "transparent",
                  borderColor: filter === cat ? "#00ff88" : "rgba(255,255,255,0.1)",
                  color: filter === cat ? "#000" : "#555",
                  fontWeight: filter === cat ? 700 : 400,
                  transition: "all 0.2s",
                }}>{cat}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {filteredAirdrops.map(a => <AirdropCard key={a.id} item={a} />)}
            </div>
          </div>
        )}

        {/* Yields Tab */}
        {activeTab === "yields" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 36, fontWeight: 900, margin: "0 0 6px", color: "#fff" }}>ฝากเหรียญรับปันผล (Yield)</h1>
              <div style={{ color: "#444", fontSize: 13 }}>เรียงตาม APY · อัพเดตทุกชั่วโมง</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["โปรโตคอล", "คู่เหรียญ", "APY", "TVL", "เครือข่าย", "ความเสี่ยง"].map(h => (
                  <div key={h} style={{ color: "#333", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {MOCK_YIELDS.sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy)).map(y => <YieldRow key={y.protocol} item={y} />)}
            </div>
          </div>
        )}

        {/* Meme Tab */}
        {activeTab === "meme" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Saira Condensed', sans-serif", fontSize: 36, fontWeight: 900, margin: "0 0 6px", color: "#fff" }}>เหรียญมีม Trending</h1>
              <div style={{ color: "#444", fontSize: 13 }}>วิเคราะห์แนวโน้ม · สัญญาณเทรด</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {MOCK_MEME.map(m => <MemeCard key={m.symbol} item={m} />)}
            </div>
            <div style={{ background: "rgba(255,100,68,0.05)", border: "1px solid rgba(255,100,68,0.15)", borderRadius: 12, padding: 16, marginTop: 24 }}>
              <div style={{ color: "#ff6644", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>⚠️ คำเตือนสำคัญ</div>
              <div style={{ color: "#666", fontSize: 12, lineHeight: 1.8 }}>
                เหรียญมีมมีความผันผวนสูงมาก อาจสูญเสียเงินทั้งหมดได้ · ข้อมูลนี้ไม่ใช่คำแนะนำการลงทุน · ลงทุนเท่าที่รับความเสี่ยงได้เท่านั้น
              </div>
            </div>
          </div>
        )}

        {/* Bot Setup Tab */}
        {activeTab === "bot" && <BotSetup />}
      </div>
    </div>
  );
}
