# 🔑 Paid API Keys Setup Guide

## Quick Setup for Your Paid FMP and Polygon Keys

### Method 1: Direct Environment File Setup (Recommended)

1. **Edit the environment file:**
```bash
cd /home/user/webapp && nano .env.local
```

2. **Replace the placeholder keys with your real keys:**
```env
# Next.js Environment Variables - PAID API KEYS
# Financial Modeling Prep - PAID ACCOUNT (Real-time data)
FMP_API_KEY=YOUR_ACTUAL_FMP_KEY_HERE

# Polygon.io - PAID ACCOUNT (Premium real-time data)  
POLYGON_API_KEY=YOUR_ACTUAL_POLYGON_KEY_HERE

# Other API keys (for backup sources)
TWELVE_DATA_KEY=demo
ALPHA_VANTAGE_KEY=demo
```

3. **Restart the server to apply:**
```bash
cd /home/user/webapp && pm2 restart nextjs-dev
```

### Method 2: Use the Setup Interface

1. **Open the setup page:** 
   https://3001-inl3yr2quovpdeb6vxlxo-6532622b.e2b.dev/setup-api-keys.html

2. **Enter your paid API keys**
3. **Test each key to verify**
4. **Follow the restart instructions**

---

## Expected Results With Paid APIs

### 🥇 **Polygon (Priority #1)**
- Real-time market data
- High rate limits
- Premium endpoints
- Live trading hours data

### 🏆 **FMP (Priority #2)** 
- Real-time financial quotes
- Comprehensive market data
- Unlimited API calls
- Extended hours data

### 📊 **Data Source Priority:**
1. **Polygon** (if configured) → Real-time premium data
2. **FMP** (if configured) → Real-time financial data  
3. **Yahoo Finance** → Free backup
4. **Enhanced Mock** → Realistic simulation

---

## Testing Your Setup

After configuration, test the APIs:

```bash
# Test the live data endpoint
curl "https://3001-inl3yr2quovpdeb6vxlxo-6532622b.e2b.dev/api/live-data?symbols=AAPL,MSFT&limit=2"
```

Look for:
- `"source": "POLYGON"` or `"source": "FMP"` 
- Real-time price data
- No rate limiting errors

---

## Current Status Commands

```bash
# Check if server is running
cd /home/user/webapp && pm2 status

# View server logs  
cd /home/user/webapp && pm2 logs nextjs-dev --nostream --lines 20

# Restart server after config changes
cd /home/user/webapp && pm2 restart nextjs-dev
```

---

## Your Application URLs

- **Main App:** https://3001-inl3yr2quovpdeb6vxlxo-6532622b.e2b.dev
- **API Setup:** https://3001-inl3yr2quovpdeb6vxlxo-6532622b.e2b.dev/setup-api-keys.html  
- **Live Data API:** https://3001-inl3yr2quovpdeb6vxlxo-6532622b.e2b.dev/api/live-data

Once your paid APIs are configured, you'll have premium real-time data flowing into your scanner! 🚀