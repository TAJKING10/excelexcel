# Payroll Management System - Deployment Guide

## Overview
This is a production-ready payroll management system built with React, Vite, TypeScript, and Supabase for Luxembourg payroll calculations.

## Features
- Monthly and Annual Payslip Creation & Management
- Luxembourg Tax System Integration
- Multi-user Role-Based Access Control (SUPER_ADMIN, EMPLOYEE)
- Company, Employee, and Individual Management
- PDF Export Functionality
- Real-time Tax Rate Management
- Complete Audit Trail (Edit History)
- Multi-language Support (French default)
- Error Tracking with Sentry

## Prerequisites
- Node.js 18+ and npm
- A Supabase account and project
- Web hosting platform (Netlify, Vercel, AWS, etc.)

## Deployment Steps

### 1. Supabase Database Setup

Your Supabase database migrations are included in the `supabase/migrations` folder.

**Option A: Using Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Manual Setup**
1. Go to your Supabase Dashboard → SQL Editor
2. Run each migration file in the `supabase/migrations` folder in order (by timestamp)

### 2. Environment Variables

Create a `.env` file in your deployment with the following variables:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Sentry Error Monitoring (Optional - Recommended for Production)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Feature Flags (Optional)
VITE_ENABLE_DEBUG=false
VITE_ENVIRONMENT=production
```

**To get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" (VITE_SUPABASE_URL)
4. Copy the "anon public" key (VITE_SUPABASE_ANON_KEY)

### 3. Deploy to Hosting Platform

#### Netlify Deployment
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod --dir=dist`
4. Set environment variables in Netlify Dashboard → Site Settings → Environment Variables

#### Vercel Deployment
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel Dashboard → Settings → Environment Variables

#### Manual Static Hosting
1. Upload the entire `dist` folder to your web server
2. Configure your web server to serve `index.html` for all routes (SPA routing)
3. Ensure environment variables are set on your hosting platform

### 4. Post-Deployment Configuration

#### Create Super Admin User
1. Go to your Supabase Dashboard → Authentication → Users
2. Create a new user manually or use the auth signup API
3. Go to SQL Editor and run:
```sql
UPDATE profiles
SET role = 'SUPER_ADMIN'
WHERE email = 'your-admin-email@example.com';
```

#### Configure Security Settings (Recommended)
1. **Enable Leaked Password Protection**
   - Go to Supabase Dashboard → Authentication → Policies
   - Enable "Leaked Password Protection"

2. **Review RLS Policies**
   - All tables have Row Level Security enabled
   - Review policies in Dashboard → Database → Policies

### 5. Testing Your Deployment

1. Access your deployed URL
2. Login with your admin credentials
3. Verify all features:
   - Create a company
   - Add employees/individuals
   - Create monthly payslips
   - Create annual payslips
   - Export PDFs
   - Test role permissions

## Security Recommendations

1. **Enable HTTPS**: Ensure your hosting platform serves content over HTTPS
2. **Set up CORS**: Configure Supabase CORS settings to only allow your domain
3. **Rate Limiting**: Enable Supabase rate limiting for auth endpoints
4. **Backup Database**: Set up automated Supabase database backups
5. **Monitor Logs**: Use Supabase logs and Sentry for error monitoring

## Database Tables

The system uses the following Supabase tables:
- `profiles` - User accounts and roles
- `user_access` - Granular permissions
- `companies` - Company entities
- `employees` - Employee records
- `individuals` - Individual (non-company) records
- `monthlypayslips` - Monthly payslip data
- `annual_payslips` - Annual payslip aggregations
- `tax_rates` - Tax rate management
- `payslip_edit_history` - Complete audit trail
- `activity_logs` - User activity tracking

## Application Structure

```
dist/                      # Production build files (deploy this)
supabase/
  ├── migrations/          # Database schema migrations
  └── config.toml          # Supabase configuration
public/
  └── _headers             # Security headers for deployment
```

## Default Login Credentials

For testing purposes, the default credentials are:
- Email: irvin@advensys-conseil.lu
- Password: Advensys2025

**IMPORTANT**: Change these credentials immediately after first login!

## Support & Maintenance

### Updating Tax Rates
1. Login as SUPER_ADMIN
2. Navigate to Tax Management
3. Create new tax rate (previous rate auto-archives)

### Viewing Audit Logs
1. Login as SUPER_ADMIN
2. Navigate to Activity Log
3. Filter by entity type, user, or date range

### Database Backups
Supabase automatically backs up your database. To create manual backups:
1. Go to Supabase Dashboard → Database → Backups
2. Click "Create Backup"

## Troubleshooting

### Issue: White screen after deployment
**Solution**: Check browser console for errors. Verify environment variables are set correctly.

### Issue: Cannot login
**Solution**:
1. Check Supabase URL and anon key
2. Verify user exists in Supabase Auth
3. Check user role in `profiles` table

### Issue: PDF export not working
**Solution**: Ensure logo file is accessible at `/assets/logo_groupe.png`

### Issue: Tax calculations incorrect
**Solution**: Verify active tax rate in Tax Management page

## Performance Optimization

The build includes:
- Code splitting for lazy-loaded routes
- Gzip compression
- Minified assets
- Optimized images

For additional optimization:
1. Enable CDN caching for static assets
2. Configure browser caching headers
3. Use the included `_headers` file for security headers

## License & Credits

Built with:
- React 18.2
- TypeScript 5.9
- Vite 6.3
- Supabase
- Tailwind CSS
- shadcn/ui components
- jsPDF for PDF generation

## Version
Version: 1.0.0
Build Date: November 2025

## Contact & Support
For issues or questions, refer to the development team or documentation.
