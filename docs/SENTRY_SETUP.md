# 🔍 Sentry Monitoring Setup Guide

**Estimated Time:** 15 minutes
**Last Updated:** 8 January 2026

---

## ✅ Prerequisites

- Sentry account (free tier available)
- Project deployed to production
- Access to Vercel environment variables

---

## 📋 Step 1: Create Sentry Account & Project (5 min)

### 1.1 Sign Up
1. Go to https://sentry.io
2. Click "Get Started" or "Sign Up"
3. Choose authentication method:
   - GitHub (recommended)
   - Google
   - Email

### 1.2 Create Organization
1. Enter organization name: `Smart Food Manager` (or your company name)
2. Select region: `US` or `EU` (choose closest to users)
3. Click "Create Organization"

### 1.3 Create Project
1. Click "Create Project"
2. Select platform: **React**
3. Set alert frequency: **On every new issue**
4. Project name: `smart-food-manager-production`
5. Click "Create Project"

### 1.4 Copy DSN
1. After project creation, you'll see the DSN
2. Format: `https://xxxxxxxxxxxxx@o000000.ingest.us.sentry.io/0000000`
3. **Copy this value** - you'll need it for environment variables

**Alternative way to find DSN:**
- Settings → Projects → smart-food-manager-production → Client Keys (DSN)

---

## 🔧 Step 2: Configure Environment Variables (3 min)

### 2.1 Local Development (.env)

Edit `.env` file at project root:

```bash
# Add this line
VITE_SENTRY_DSN=https://xxxxxxxxxxxxx@o000000.ingest.us.sentry.io/0000000
```

**Note:** Monitoring is disabled in development by default (logs to console only)

### 2.2 Vercel Production

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add new variable:
   ```
   Name: VITE_SENTRY_DSN
   Value: https://xxxxxxxxxxxxx@o000000.ingest.us.sentry.io/0000000
   Environment: Production, Preview (check both)
   ```
5. Click **Save**
6. Redeploy: Deployments → Latest → Redeploy

---

## 🚨 Step 3: Configure Alerts (5 min)

### 3.1 Email Alerts

1. Sentry Dashboard → Alerts → Create Alert
2. Choose: **Issues**
3. Configure:
   ```
   Alert name: Critical Errors - Production
   Environment: production
   When: A new issue is created
   Then: Send a notification via email
   ```
4. Click **Save Rule**

### 3.2 Slack Integration (Optional)

1. Sentry → Settings → Integrations
2. Search "Slack" → Install
3. Authorize Slack workspace
4. Choose channel: `#alerts-production`
5. Create alert rule:
   ```
   Alert name: High Frequency Errors
   When: Number of events is more than 10 in 1 hour
   Then: Send notification to #alerts-production
   ```

### 3.3 Business Error Alerts

Create specific alerts for business logic errors:

1. Create Alert → Issues
2. Configure:
   ```
   Alert name: Business Logic Errors
   When: An event's tags match ALL of these filters:
     - type equals business_logic
   Then: Send notification via email
   ```

---

## 📊 Step 4: Configure Dashboard (2 min)

### 4.1 Create Custom Dashboard

1. Dashboards → Create Dashboard
2. Name: `Production Health`
3. Add widgets:

**Widget 1: Error Rate**
```
Type: Line Chart
Query: event.type:error
Display: Errors over time
```

**Widget 2: Most Common Errors**
```
Type: Table
Query: event.type:error
Group by: issue
Display: Top 10 issues
```

**Widget 3: Affected Users**
```
Type: Number
Query: event.type:error
Display: Unique users affected
```

**Widget 4: Performance (P95)**
```
Type: Line Chart
Query: transaction.duration
Display: 95th percentile response time
```

### 4.2 Set as Default

1. Dashboard → ... menu → Set as Default
2. This dashboard will show on Sentry homepage

---

## ✅ Step 5: Test Integration (5 min)

### 5.1 Test Error Capture

1. Open production app: https://your-app.vercel.app
2. Open browser console (F12)
3. Type and execute:
   ```javascript
   throw new Error('Test Sentry Integration');
   ```
4. Check Sentry Dashboard → Issues
5. You should see the test error within 1-2 minutes

### 5.2 Test Business Error

In your app, trigger a business error (e.g., try to sell product with 0 stock)

1. Go to POS
2. Try to add product with 0 stock
3. Check Sentry → Issues → Filter by `type:business_logic`

### 5.3 Test Session Replay

1. Navigate through the app (click buttons, change pages)
2. Trigger an error
3. Go to Sentry → Issues → Click on the error
4. Click "Replays" tab
5. You should see a video replay of the session

---

## 🔒 Step 6: Privacy & Security

### 6.1 Data Scrubbing (Already Configured)

Our configuration already masks:
- ✅ All text content (maskAllText: true)
- ✅ All media (blockAllMedia: true)
- ✅ Sensitive form fields

### 6.2 IP Anonymization

1. Settings → Security & Privacy
2. Enable: **Prevent Storing of IP Addresses**
3. Save

### 6.3 Data Retention

Free tier: 30 days
Paid tier: 90 days (recommended for production)

---

## 📈 Step 7: Monitor Key Metrics

### Metrics to Track Daily:

1. **Error Rate**
   - Target: < 0.1% of requests
   - Alert if: > 1% for 1 hour

2. **Affected Users**
   - Target: < 5% of daily active users
   - Alert if: > 10%

3. **Response Time (P95)**
   - Target: < 2 seconds
   - Alert if: > 5 seconds

4. **Business Errors**
   - Stock issues
   - Cash discrepancies
   - Payment failures

---

## 🐛 Troubleshooting

### "No events received"

**Check:**
1. DSN is correct in Vercel env vars
2. App is deployed to production
3. VITE_APP_ENV=production
4. Browser console shows: `[MONITORING] Sentry initialisé`

**Solution:**
```bash
# Verify env var
vercel env ls

# Redeploy
vercel --prod
```

### "Session replays not working"

**Check:**
1. Sentry plan includes replays (free tier: 50 replays/month)
2. Sample rate is not 0
3. Browser supports replays (Chrome, Firefox, Safari)

### "Too many events (quota exceeded)"

**Solution:**
1. Reduce sample rates in `monitoring.ts`:
   ```typescript
   tracesSampleRate: 0.05, // 5% instead of 10%
   replaysSessionSampleRate: 0.05, // 5% instead of 10%
   ```
2. Add more filters in `beforeSend`
3. Upgrade Sentry plan

---

## 💰 Pricing (as of 2026)

### Free Tier (Developer)
- 5,000 errors/month
- 10,000 performance units/month
- 50 session replays/month
- 30 days retention
- **Good for:** Testing, small projects

### Team Plan ($26/month)
- 50,000 errors/month
- 100,000 performance units/month
- 500 session replays/month
- 90 days retention
- Slack integration
- **Good for:** Production apps, small teams

### Business Plan ($80/month)
- Unlimited errors
- Unlimited performance
- Unlimited replays
- Custom retention
- Priority support
- **Good for:** Enterprise, high-traffic apps

**Recommendation:** Start with Free tier, upgrade to Team when you have 10+ active restaurants

---

## ✅ Checklist

- [ ] Sentry account created
- [ ] Project created (React)
- [ ] DSN copied
- [ ] VITE_SENTRY_DSN added to Vercel
- [ ] App redeployed
- [ ] Email alerts configured
- [ ] Dashboard created
- [ ] Test error captured
- [ ] Session replay tested
- [ ] IP anonymization enabled

---

## 📞 Support

**Sentry Documentation:** https://docs.sentry.io/platforms/javascript/guides/react/

**Common Issues:**
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

**Contact:** support@sentry.io
