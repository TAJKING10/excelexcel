# 🚀 DEPLOYMENT GUIDE FOR OVHCLOUD

## ✅ YOUR DOMAINS
- Primary: `https://payslip.advensys-conseil.lu`
- Alternate: `https://www.payslip.advensys-conseil.lu`

---

## 📋 STEP-BY-STEP DEPLOYMENT CHECKLIST

### ✅ STEP 1: SUPABASE CONFIGURATION (DO THIS FIRST!)

1. Go to: https://supabase.com/dashboard/project/ozkgkgqahgwuwmohslsr

2. **Authentication → URL Configuration:**
   - Click "Authentication" → "URL Configuration"
   - Set **Site URL** to:
     ```
     https://payslip.advensys-conseil.lu
     ```
   - Add **Redirect URLs** (click "Add URL" for each):
     ```
     https://payslip.advensys-conseil.lu/**
     https://www.payslip.advensys-conseil.lu/**
     ```
   - Click **SAVE**

3. **Verify API Settings:**
   - Go to "Settings" → "API"
   - Confirm Project URL: `https://ozkgkgqahgwuwmohslsr.supabase.co` ✅
   - Confirm Anon Key matches your .env file ✅

---

### ✅ STEP 2: BUILD COMPLETED
✅ Already done! The `dist` folder is ready with all production files.

---

### ✅ STEP 3: FILEZILLA UPLOAD

#### Connect to OVHcloud:
1. Open FileZilla
2. Enter your OVHcloud FTP credentials:
   - **Host:** `ftp.payslip.advensys-conseil.lu` (or IP from OVHcloud)
   - **Username:** Your FTP username
   - **Password:** Your FTP password
   - **Port:** 21 (or 22 for SFTP)
3. Click **Quickconnect**

#### Upload Files:
1. Navigate to your web root directory (usually `/www/` or `/public_html/`)

2. **Upload ALL files from the `dist` folder:**
   - `index.html`
   - `assets/` folder (contains all JS/CSS files)
   - Any other folders/files inside `dist`

3. **Upload the `.htaccess` file** (from project root)
   - This file is CRITICAL for React Router to work!

4. **DO NOT upload:**
   - `.env` file (environment variables are already embedded in build)
   - `node_modules/`
   - `src/` folder
   - `package.json`
   - Any development files

---

### 📁 FINAL FILE STRUCTURE ON SERVER

```
/www/  (or /public_html/)
├── .htaccess              ← UPLOAD THIS
├── index.html             ← FROM dist FOLDER
├── assets/                ← FROM dist FOLDER
│   ├── index-DCJjPA8A.js
│   ├── index-Donq1cBc.css
│   └── ...other files
└── (any other folders from dist)
```

---

## ✅ VERIFICATION CHECKLIST (After Upload)

Test these on your live website:

### 1. **Basic Load Test**
- [ ] Visit `https://payslip.advensys-conseil.lu`
- [ ] Page loads without white screen
- [ ] No console errors (press F12 to check)
- [ ] CSS/styles are loading correctly

### 2. **Routing Test**
- [ ] Click through different pages
- [ ] Refresh page (F5) - should NOT get 404 error
- [ ] Test direct URL access (e.g., `/admin/dashboard`)

### 3. **Authentication Test**
- [ ] Login with username: `Admin`
- [ ] Login succeeds without errors
- [ ] After login, user stays logged in after refresh
- [ ] Logout works correctly

### 4. **Database Operations Test**
- [ ] Create a new company
- [ ] Create a new individual
- [ ] View existing data
- [ ] Edit data
- [ ] Delete data (optional)
- [ ] All operations save to Supabase successfully

### 5. **Translation Test**
- [ ] Switch between English and French
- [ ] Translations appear correctly
- [ ] No missing translation keys

### 6. **WWW Redirect Test**
- [ ] Visit `https://www.payslip.advensys-conseil.lu`
- [ ] Should redirect to `https://payslip.advensys-conseil.lu`

---

## 🔧 TROUBLESHOOTING GUIDE

### Problem: White screen / Blank page
**Solution:**
1. Press F12, check Console tab for errors
2. Verify all files from `dist` uploaded correctly
3. Check if `.htaccess` file exists on server
4. Clear browser cache (Ctrl+Shift+R)

### Problem: 404 error on page refresh
**Solution:**
1. Verify `.htaccess` file uploaded to root directory
2. Check OVHcloud has mod_rewrite enabled (usually enabled by default)
3. Check file permissions (644 for files, 755 for folders)

### Problem: "Missing Supabase environment variables"
**Solution:**
1. Rebuild: `npm run build`
2. Verify `.env` file exists during build
3. Re-upload the new `dist` folder

### Problem: Login not working / Authentication errors
**Solution:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Verify both URLs are added to Redirect URLs
3. Check browser console for detailed error message
4. Verify anon key in `.env` matches Supabase Dashboard

### Problem: CORS errors / API blocked
**Solution:**
1. Supabase automatically handles CORS
2. Check `.htaccess` headers are correct
3. Verify Supabase URL in code matches dashboard

### Problem: Data not saving / Database errors
**Solution:**
1. Check Supabase Dashboard → Project Settings → API
2. Verify RLS (Row Level Security) policies are correct
3. Check browser console for specific error messages
4. Test direct database connection in Supabase Dashboard

---

## 📞 SUPPORT INFORMATION

**Supabase Project:**
- Project ID: `ozkgkgqahgwuwmohslsr`
- Project URL: `https://ozkgkgqahgwuwmohslsr.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/ozkgkgqahgwuwmohslsr

**Environment Variables (embedded in build):**
- ✅ VITE_SUPABASE_URL: Configured
- ✅ VITE_SUPABASE_ANON_KEY: Configured

---

## 🎯 WHAT MAKES THIS DEPLOYMENT WORK

✅ **Environment Variables:** Embedded during build (Vite handles this)
✅ **Supabase Backend:** Cloud-based, accessible from anywhere
✅ **Authentication:** Works via Supabase Auth with proper URL configuration
✅ **Database:** Automatic sync with Supabase PostgreSQL
✅ **Routing:** Handled by `.htaccess` React Router configuration
✅ **HTTPS:** OVHcloud provides SSL certificate
✅ **CORS:** Supabase handles automatically
✅ **Assets:** Relative paths ensure proper loading

---

## ✅ FINAL CHECKLIST BEFORE GOING LIVE

- [ ] Supabase URLs configured in dashboard
- [ ] Project built successfully (`npm run build`)
- [ ] All files from `dist` uploaded via FileZilla
- [ ] `.htaccess` file uploaded to web root
- [ ] Tested login functionality
- [ ] Tested database operations (create/read/update)
- [ ] Tested page navigation and refresh
- [ ] Checked browser console for errors
- [ ] Verified both domains work (www and non-www)

---

## 🎉 SUCCESS!

Once all checkboxes are marked, your application is live and fully functional!

**Live URL:** https://payslip.advensys-conseil.lu
