"""
🚀 CRYPTO INTELLIGENCE BOT - Telegram Bot
แจ้งเตือนอัตโนมัติ: แอร์ดรอป, Yield Farming, เหรียญมีม
ฟรี 100% - Deploy บน Railway

วิธีใช้:
1. pip install -r requirements.txt
2. ตั้ง TELEGRAM_TOKEN และ CHAT_ID ใน environment variables
3. python bot.py
"""

import asyncio
import os
import logging
from telegram import Bot
from telegram.ext import Application, CommandHandler, ContextTypes
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import aiohttp
from datetime import datetime

# ===== CONFIG =====
TOKEN = os.environ.get("TELEGRAM_TOKEN", "ใส่ token ของคุณที่นี่")
CHAT_ID = os.environ.get("CHAT_ID", "ใส่ chat_id ของคุณที่นี่")
REPORT_HOUR = int(os.environ.get("REPORT_HOUR", "8"))
REPORT_MINUTE = int(os.environ.get("REPORT_MINUTE", "0"))

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ===== ข้อมูล Airdrop (อัพเดตด้วยตัวเองหรือต่อ API) =====
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


# ===== ดึงราคาจาก CoinGecko =====
async def fetch_crypto_prices():
    """ดึงราคาเหรียญหลักจาก CoinGecko API"""
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "ids": "bitcoin,ethereum,solana,binancecoin",
        "order": "market_cap_desc",
        "per_page": 4,
        "price_change_percentage": "24h"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
    except Exception as e:
        logger.error(f"ดึงราคาไม่ได้: {e}")
    return []


async def fetch_top_gainers():
    """ดึงเหรียญที่ขึ้นแรงที่สุด 5 อันดับ"""
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "percent_change_24h_desc",
        "per_page": 100,
        "price_change_percentage": "24h",
        "category": "meme-token"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return sorted(data, key=lambda x: x.get("price_change_percentage_24h") or 0, reverse=True)[:5]
    except Exception as e:
        logger.error(f"ดึง gainers ไม่ได้: {e}")
    return []


# ===== สร้างข้อความรายงาน =====
async def build_daily_report():
    now = datetime.now().strftime("%d/%m/%Y %H:%M น.")
    prices = await fetch_crypto_prices()
    gainers = await fetch_top_gainers()

    lines = []
    lines.append(f"🚀 *รายงาน Crypto Intelligence*")
    lines.append(f"📅 {now}")
    lines.append("")

    # ราคาเหรียญหลัก
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
    lines.append("")

    # แอร์ดรอป
    lines.append("*🪂 แอร์ดรอปที่เปิดรับอยู่:*")
    active = [a for a in AIRDROPS if a["status"] == "เปิดรับ"]
    for a in active:
        lines.append(f"• [{a['name']}]({a['link']}) `${a['symbol']}` — รางวัล {a['reward']} | {a['difficulty']} | หมด {a['deadline']}")
    lines.append("")

    # Yield สูงสุด
    lines.append("*💰 Yield Farming น่าสนใจ:*")
    top_yields = sorted(YIELDS, key=lambda x: x["apy"], reverse=True)[:3]
    for y in top_yields:
        lines.append(f"• *{y['protocol']}* ({y['pair']}) — `{y['apy']}% APY` | {y['chain']} | ความเสี่ยง: {y['risk']}")
    lines.append("")

    # มีม coin trending
    if gainers:
        lines.append("*🔥 มีม Coin Trending วันนี้:*")
        for c in gainers[:5]:
            chg = c.get("price_change_percentage_24h") or 0
            price = c.get("current_price", 0)
            lines.append(f"🎰 *{c.get('symbol','').upper()}*: ${price:,.6f} (+{chg:.1f}%)")
        lines.append("")

    lines.append("━━━━━━━━━━━━━━━━━━")
    lines.append("⚠️ _ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน_")
    lines.append("_Crypto มีความเสี่ยงสูง ลงทุนเท่าที่รับได้_")

    return "\n".join(lines)


# ===== ส่งรายงาน =====
async def send_daily_report(context=None):
    """ส่งรายงานประจำวันไปยัง Telegram"""
    try:
        bot = Bot(token=TOKEN)
        message = await build_daily_report()
        await bot.send_message(
            chat_id=CHAT_ID,
            text=message,
            parse_mode="Markdown",
            disable_web_page_preview=True
        )
        logger.info(f"✅ ส่งรายงานสำเร็จ {datetime.now().strftime('%H:%M')}")
    except Exception as e:
        logger.error(f"❌ ส่งรายงานไม่ได้: {e}")


async def send_alert(message: str):
    """ส่งแจ้งเตือนฉุกเฉิน"""
    try:
        bot = Bot(token=TOKEN)
        await bot.send_message(chat_id=CHAT_ID, text=f"🚨 *แจ้งเตือน!*\n\n{message}", parse_mode="Markdown")
    except Exception as e:
        logger.error(f"ส่ง alert ไม่ได้: {e}")


# ===== Commands =====
async def cmd_start(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🚀 *Crypto Intelligence Bot พร้อมใช้งาน!*\n\n"
        "คำสั่งที่ใช้ได้:\n"
        "/report — รายงานล่าสุดทันที\n"
        "/airdrops — รายการแอร์ดรอปทั้งหมด\n"
        "/yields — Yield Farming สูงสุด\n"
        "/help — ความช่วยเหลือ",
        parse_mode="Markdown"
    )

async def cmd_report(update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("⏳ กำลังดึงข้อมูล...")
    message = await build_daily_report()
    await update.message.reply_text(message, parse_mode="Markdown", disable_web_page_preview=True)

async def cmd_airdrops(update, context: ContextTypes.DEFAULT_TYPE):
    lines = ["*🪂 แอร์ดรอปทั้งหมด:*\n"]
    for a in AIRDROPS:
        status_emoji = "🟢" if a["status"] == "เปิดรับ" else "🔴"
        lines.append(f"{status_emoji} *{a['name']}* (${a['symbol']})")
        lines.append(f"   รางวัล: {a['reward']} | ความยาก: {a['difficulty']}")
        lines.append(f"   หมดเขต: {a['deadline']}")
        lines.append(f"   🔗 {a['link']}\n")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown", disable_web_page_preview=True)

async def cmd_yields(update, context: ContextTypes.DEFAULT_TYPE):
    sorted_yields = sorted(YIELDS, key=lambda x: x["apy"], reverse=True)
    lines = ["*💰 Yield Farming ทั้งหมด (เรียงตาม APY):*\n"]
    for i, y in enumerate(sorted_yields, 1):
        lines.append(f"{i}. *{y['protocol']}* — {y['pair']}")
        lines.append(f"   APY: `{y['apy']}%` | {y['chain']} | เสี่ยง: {y['risk']}\n")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


# ===== Main =====
async def main():
    logger.info("🚀 เริ่มต้น Crypto Intelligence Bot")

    # ส่งรายงานทันทีที่เริ่ม
    await send_daily_report()

    # ตั้ง Scheduler
    scheduler = AsyncIOScheduler(timezone="Asia/Bangkok")
    scheduler.add_job(
        send_daily_report,
        "cron",
        hour=REPORT_HOUR,
        minute=REPORT_MINUTE,
        id="daily_report"
    )
    scheduler.start()
    logger.info(f"⏰ ตั้งส่งรายงานทุกวัน {REPORT_HOUR:02d}:{REPORT_MINUTE:02d} น.")

    # ตั้ง Bot Commands
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("report", cmd_report))
    app.add_handler(CommandHandler("airdrops", cmd_airdrops))
    app.add_handler(CommandHandler("yields", cmd_yields))

    logger.info("✅ Bot พร้อมรับคำสั่ง")
    await app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    asyncio.run(main())
