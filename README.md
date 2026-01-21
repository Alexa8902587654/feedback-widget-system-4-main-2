# 📝 Feedback Widget System - Demo

A standalone feedback collection system that can be integrated into trading platforms to capture client feedback, bug reports, and feature requests.

## 🚀 Quick Start

### Open the Demo

1. **Navigate to the folder:**
   ```
   /Users/alba/Downloads/feedback-widget-system/
   ```

2. **Double-click `index.html`** to open in your browser

That's it! No installation, no server needed.

## ✨ Features

### For Clients (Trading Platform Users)
- 💬 **One-Click Feedback** - Purple floating button in bottom-right corner
- 📸 **Screenshot Capture** - Optional screenshot with feedback
- 📝 **Categorization** - Bug report, feature request, improvement, question
- 🎯 **Priority Levels** - Low, medium, high, critical
- ✅ **Instant Confirmation** - Get ticket ID immediately
- 📧 **Email Notifications** - Confirmation email with tracking number

### For Admins (Internal Team)
- 📊 **Dashboard Overview** - Real-time stats (total, open, in-progress, resolved)
- 📋 **Feedback Management** - View all feedback with details
- 🏷️ **Status Tracking** - Open → In Progress → Resolved → Closed
- 🔍 **Session Context** - Auto-captured: URL, browser, device, timestamp
- 👥 **Client Identification** - Auto-populated from trading platform auth

### For Developers
- 🔌 **Easy Integration** - Single script tag + initialization
- 🔐 **JWT Authentication** - Secure client identification
- 💾 **Offline Support** - Queue submissions when offline
- 📱 **Responsive Design** - Works on web, desktop, mobile
- 🎨 **Customizable** - Colors, position, language

## 📚 Demo Pages

The demo includes 3 tabs:

### 1. Demo Platform
Simulates a trading platform where clients can:
- Submit feedback using the widget button
- See confirmation with ticket ID
- Test screenshot capture

### 2. Admin Dashboard
Internal team view showing:
- Real-time statistics
- Feedback list with status badges
- Client information
- Session context

### 3. Integration Guide
Complete documentation for:
- Widget script integration
- Client token generation
- Backend setup
- API endpoints

## 🎯 How It Works

### Client Flow
1. Client clicks the feedback button (purple bubble)
2. Modal opens with feedback form
3. Client fills in:
   - Title (required)
   - Category (bug/feature/improvement/question)
   - Priority (low/medium/high/critical)
   - Description (required)
   - Email (optional, auto-filled from platform)
   - Screenshot (optional checkbox)
4. Client submits
5. System generates ticket ID (e.g., FB-00001)
6. Confirmation shown in modal
7. Feedback appears in admin dashboard

### Data Storage
- Uses **localStorage** for demo persistence
- Data survives page refreshes
- Can be cleared via browser dev tools

### Session Context Auto-Captured
Every feedback submission includes:
- Current URL
- Browser user agent
- Platform (Windows/Mac/Linux)
- Language
- Screen resolution
- Timestamp

## 🔧 Integration into Trading Platform

### Step 1: Include Script
```html
<script src="https://cdn.company.com/feedback-widget/v1/widget.js"></script>
```

### Step 2: Initialize Widget
```javascript
FeedbackWidget.init({
  apiKey: 'fp_live_xxxxx',                    // Your API key
  endpoint: 'https://feedback.company.com/api/widget',
  clientToken: tradingPlatform.generateClientToken(),
  position: 'bottom-right',                   // or 'bottom-left'
  primaryColor: '#667eea',                    // Match your brand
  language: 'en'                              // or 'ru', 'de', etc.
});
```

### Step 3: Backend Token Generation
```javascript
import jwt from 'jsonwebtoken';

function generateFeedbackWidgetToken(clientEmail, clientName) {
  const payload = {
    email: clientEmail,
    name: clientName,
    platform: 'exante-web',
    timestamp: Date.now()
  };

  return jwt.sign(payload, FEEDBACK_WIDGET_API_SECRET, {
    expiresIn: '5m'  // Token expires in 5 minutes
  });
}
```

## 📦 What's Included

```
feedback-widget-system/
├── index.html          # Main demo page with widget + admin dashboard
├── app.js              # All JavaScript logic (widget + storage)
├── README.md           # This file
└── backend/            # Backend structure (for future development)
    ├── package.json
    ├── tsconfig.json
    └── prisma/
```

## 🎨 Customization

### Change Widget Color
Edit the CSS in `index.html`:
```css
.feedback-widget-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Change Widget Position
In the CSS, modify:
```css
.feedback-widget-btn {
  bottom: 30px;
  right: 30px;  /* Change to 'left: 30px' for left side */
}
```

### Add More Categories
In `index.html`, add options:
```html
<option value="your_category">🎯 Your Category</option>
```

Update the icons in `app.js`:
```javascript
const iconMap = {
  'your_category': '🎯',
  // ...
};
```

## 📊 Sample Data

The demo comes with 3 example feedback items:
1. **Bug Report** - Chart loading performance issue (In Progress)
2. **Feature Request** - Dark mode support (Open)
3. **Feature Request** - CSV export for trade history (Resolved)

### Clear Sample Data
To start fresh, open browser console and run:
```javascript
localStorage.clear();
location.reload();
```

## 🚢 Next Steps: Production Deployment

To deploy this as a real system, you'll need:

### Backend API
- Express.js server
- PostgreSQL/SQLite database
- Prisma ORM
- JWT authentication
- Email service (Nodemailer/SendGrid)
- Screenshot storage (S3/local filesystem)

### Widget SDK
- Build with esbuild/webpack
- Host on CDN (Cloudflare/Vercel)
- Version management (v1, v2, etc.)
- Browser compatibility testing

### Admin Dashboard
- React + TypeScript + Vite
- TanStack Query for data fetching
- Recharts for analytics
- Authentication (admin users)

### Deployment Platforms
**Recommended:** Railway or Fly.io
- One-command deployment
- Built-in PostgreSQL
- Auto-scaling
- ~$5-15/month

## 📧 Email Notifications

When deployed with backend, the system sends:

**To Client:**
```
Subject: Feedback Received - Ticket #FB-00001

Thank you for your feedback!

Ticket ID: FB-00001
Title: Chart loading is slow
Status: Open

We'll keep you updated on the progress.
```

**To Internal Team:**
```
Subject: New Feedback: Chart loading is slow

Priority: High
Category: Bug Report
Client: john.doe@exante.com
Platform: Web

[View in Dashboard]
```

## 🔐 Security Features

- JWT token authentication (5-minute expiry)
- CORS protection
- Rate limiting (10 submissions per minute)
- Input sanitization
- SQL injection prevention (when using backend)
- XSS protection

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Success Metrics

The system tracks:
- Total feedback submissions
- Feedback by status (open/in-progress/resolved)
- Average response time
- Top clients by feedback count
- Feedback volume over time
- Category distribution

## 💡 Tips

1. **Test the Widget:** Click the purple button to submit test feedback
2. **View Admin Dashboard:** Click "Admin Dashboard" tab to see all submissions
3. **Check Session Context:** Look at the console logs to see captured context
4. **Try Screenshots:** Enable screenshot checkbox (simulated in demo)
5. **Test Offline:** Disable network in DevTools, submit feedback, re-enable network

## 📝 Implementation Plan

See the full implementation plan at:
```
/Users/alba/.claude/plans/cozy-strolling-horizon.md
```

This includes:
- Phase 1: Backend API (Week 1)
- Phase 2: Widget SDK (Week 1-2)
- Phase 3: Admin Dashboard (Week 2-3)
- Phase 4: Client Portal (Week 3)
- Phase 5: Deployment (Week 3-4)

Total timeline: **3-4 weeks for production-ready system**

## 🤝 Support

For questions or issues:
- Check the Integration Guide tab in the demo
- Review the implementation plan
- Test with the demo platform page

---

**Ready to get started?** Double-click `index.html` and try submitting feedback! 🚀
