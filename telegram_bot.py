"""
Crypto Intelligence Bot - Fixed Version
"""

import logging
import os
from telegram import Bot, Update
from telegram.ext import Application, CommandHandler, ContextTypes
from apscheduler.schedulers.background import BackgroundScheduler
import requests
from datetime import datetime
import asyncio

TOKEN = os.environ.get("TELEGRAM_TOKEN", "")
CHAT_ID = os.environ.get("CHAT_ID", "")

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

AIRDROPS = [
    {"name": "ZKsync Era", "symbol": "ZK", "status": "เปิดรับ", "reward": "$200-800", "deadline": "2025-04-30", "difficulty": "ง่าย", "link": "https://zksync.io"},
    {"name": "Monad", "symbol": "MON", "status": "เปิดรับ", "reward": "$500-2000", "deadline": "2025-06-01", "difficulty": "กลาง", "link": "https://monad.xyz"},
    {"name": "Berachain", "symbol": "BERA", "status": "เปิดรับ", "reward": "$300-1500", "deadline": "2025-05-20", "difficulty": "กลาง", "link": "https://berachain.com"},
    {"name": "Sophon", "symbol": "SOPH", "status": "เปิดรับ", "reward": "$50-300", "deadline": "2025-07-01", "difficulty": "ง่าย", "link": "https://sophon.xyz"},
]

YIELDS = [
    {"protocol": "Aerodrome", "pair": "USDC/ETH", "apy": 45.2, "chain": "Base", "risk": "กลาง"},
    {"protocol": "Pendle Finance", "pair": "ETH", "apy": 18.4, "chain": "Ethereum", "risk": "กลาง"},
    {"protocol": "Orca", "pair": "SOL/USDC", "apy": 28.7, "chain": "Solana", "risk": "กลาง"},
    {"protocol": "Fluid", "pair": "USDC", "apy": 12.8, "chain": "Ethereum", "risk": "ต่ำ"},
    {"protocol": "Kamino", "pair": "SOL", "apy": 9.2, "chain": "Solana", "risk": "ต่ำ"},
]


def fetch_meme_coins():
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "category": "meme-token",
            "order": "percent_change_24h_desc",
            "per_page": 10,
            "price_change_percentage": "24h"
        }
        r = requests.get(url, params=params, timeout=10)
        if r.status_code == 200:
            data = r.json()
            return sorted(data, key=lambda x: x.get("price_change_percentage_24h") or 0, reverse=True)[:8]
    except Exception as e:
        logger.error(f"ดึงมีม coin ไม่ได้: {e}")
    return []


def fetch_crypto_prices():
    try:
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "ids": "bitcoin,ethereum,solana,binancecoin",
            "order": "market_cap_desc",
            "per_page": 4,
            "price_change_percentage": "24h"
        }
        r = requests.get(url, params=params, timeout=10)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        logger.error(f"ดึงราคาไม่ได้: {e}")
    return []


def build_report():
    now = datetime.now().strftime("%d/%m/%Y %H:%M น.")
    prices = fetch_crypto_prices()

    lines = []
    lines.append("🚀 *รายงาน Crypto Intelligence*")
    lines.append(f"📅 {now}\n")

    lines.append("*💎 ราคาเหรียญหลัก:*")
    if prices:
        for c in prices:
            chg = c.get("price_change_percentage_24h") or 0
            emoji = "📈" if chg >= 0 else "📉"
            sign = "+" if chg >= 0 else ""
            price = c.get("current_price", 0)
            lines.append(f"{emoji} *{c.get('symbol','').upper()}*: ${price:,.2f} ({sign}{chg:.1f}%)")
    else:
        lines.append("⚠️ ดึงราคาไม่ได้ชั่วคราว")

    lines.append("\n*🪂 แอร์ดรอปที่เปิดรับอยู่:*")
    for a in [x for x in AIRDROPS if x["status"] == "เปิดรับ"]:
        lines.append(f"• *{a['name']}* (${a['symbol']}) — {a['reward']} | {a['difficulty']} | หมด {a['deadline']}")

    lines.append("\n*💰 Yield Farming น่าสนใจ:*")
    for y in sorted(YIELDS, key=lambda x: x["apy"], reverse=True)[:3]:
        lines.append(f"• *{y['protocol']}* ({y['pair']}) — `{y['apy']}% APY` | {y['chain']}")

    lines.append("\n━━━━━━━━━━━━━━━━━━")
    lines.append("⚠️ _ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน_")

    return "\n".join(lines)


async def send_report_async():
    try:
        bot = Bot(token=TOKEN)
        msg = build_report()
        await bot.send_message(chat_id=CHAT_ID, text=msg, parse_mode="Markdown")
        logger.info("✅ ส่งรายงานสำเร็จ")
    except Exception as e:
        logger.error(f"❌ ส่งไม่ได้: {e}")


def send_scheduled_report():
    asyncio.run(send_report_async())


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🚀 *Crypto Intelligence Bot พร้อมใช้งาน!*\n\n"
        "คำสั่งที่ใช้ได้:\n"
        "/report — รายงานภาพรวมทั้งหมด\n"
        "/airdrops — รายการแอร์ดรอป\n"
        "/yields — Yield Farming สูงสุด\n"
        "/meme — มีม Coin Trending 🔥",
        parse_mode="Markdown"
    )


async def cmd_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ กำลังดึงข้อมูล...")
    msg = build_report()
    await update.message.reply_text(msg, parse_mode="Markdown")


async def cmd_airdrops(update: Update, context: ContextTypes.DEFAULT_TYPE):
    lines = ["*🪂 แอร์ดรอปทั้งหมด:*\n"]
    for a in AIRDROPS:
        emoji = "🟢" if a["status"] == "เปิดรับ" else "🔴"
        lines.append(f"{emoji} *{a['name']}* (${a['symbol']})")
        lines.append(f"   รางวัล: {a['reward']} | ความยาก: {a['difficulty']}")
        lines.append(f"   หมดเขต: {a['deadline']}\n")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def cmd_yields(update: Update, context: ContextTypes.DEFAULT_TYPE):
    lines = ["*💰 Yield Farming (เรียงตาม APY):*\n"]
    for i, y in enumerate(sorted(YIELDS, key=lambda x: x["apy"], reverse=True), 1):
        lines.append(f"{i}. *{y['protocol']}* — {y['pair']}")
        lines.append(f"   APY: `{y['apy']}%` | {y['chain']} | เสี่ยง: {y['risk']}\n")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def cmd_meme(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ กำลังดึงข้อมูลมีม coin...")
    coins = fetch_meme_coins()
    now = datetime.now().strftime("%d/%m/%Y %H:%M น.")
    lines = [f"🎰 *มีม Coin Trending วันนี้*", f"📅 {now}\n"]

    if coins:
        for i, c in enumerate(coins, 1):
            chg = c.get("price_change_percentage_24h") or 0
            price = c.get("current_price", 0)
            mcap = c.get("market_cap", 0)
            emoji = "🔥" if chg > 20 else "📈" if chg > 0 else "📉"
            sign = "+" if chg >= 0 else ""

            # แสดงราคาตามขนาด
            if price < 0.000001:
                price_str = f"${price:.10f}"
            elif price < 0.01:
                price_str = f"${price:.6f}"
            else:
                price_str = f"${price:,.4f}"

            mcap_str = f"${mcap/1e9:.2f}B" if mcap > 1e9 else f"${mcap/1e6:.1f}M"

            lines.append(f"{emoji} *{i}. {c.get('symbol','').upper()}* — {price_str}")
            lines.append(f"   การเปลี่ยนแปลง: `{sign}{chg:.1f}%` | MCap: {mcap_str}")
            lines.append(f"   ชื่อ: {c.get('name','')}\n")
    else:
        lines.append("⚠️ ดึงข้อมูลไม่ได้ชั่วคราว")

    lines.append("━━━━━━━━━━━━━━━━━━")
    lines.append("⚠️ _มีม coin ความเสี่ยงสูงมาก ลงทุนเท่าที่รับได้_")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


def main():
    logger.info("🚀 เริ่มต้น Crypto Intelligence Bot")

    scheduler = BackgroundScheduler(timezone="Asia/Bangkok")
    scheduler.add_job(send_scheduled_report, "cron", hour=8, minute=0)
    scheduler.start()
    logger.info("⏰ ตั้งส่งรายงานทุกวัน 08:00 น.")

    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("report", cmd_report))
    app.add_handler(CommandHandler("airdrops", cmd_airdrops))
    app.add_handler(CommandHandler("yields", cmd_yields))
    app.add_handler(CommandHandler("meme", cmd_meme))

    logger.info("✅ Bot พร้อมรับคำสั่ง")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
