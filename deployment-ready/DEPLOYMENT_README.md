# Payroll System - Production Deployment Package

This package contains everything needed to deploy the Payroll System to production.

## Package Contents

- **dist/** - Production build of the application (static files ready to serve)
- **supabase/** - Database migrations and configuration
- **public/** - Static assets and security headers configuration
- **.env.example** - Environment variables template
- **.htaccess** - Apache server configuration (if applicable)

## Deployment Instructions

### 1. Environment Setup

Copy `.env.example` to `.env` and configure the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=your_sentry_dsn (optional)
```

### 2. Database Setup

If you're using Supabase:

1. Create a new Supabase project at https://supabase.com
2. Run the migrations in the `supabase/migrations/` folder in order
3. Copy your project URL and anon key to the `.env` file

### 3. Deploy Static Files

The `dist/` folder contains the built application. Deploy these files to your hosting provider:

#### Option A: Netlify/Vercel
1. Connect your repository or upload the `dist/` folder
2. Set environment variables in the hosting dashboard
3. Deploy

#### Option B: Traditional Web Server (Apache/Nginx)
1. Upload the contents of `dist/` to your web server's document root
2. Ensure the `.htaccess` file is in place (for Apache) or configure Nginx accordingly
3. Configure environment variables on the server

#### Option C: Cloudflare Pages
1. Upload the `dist/` folder
2. Add the `_headers` file from the `public/` folder to the root
3. Configure environment variables in Cloudflare dashboard

### 4. Security Headers

The `public/_headers` file contains security configurations for Cloudflare Pages and similar platforms. Make sure these headers are properly configured on your hosting platform.

### 5. Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test database connection
- [ ] Test user authentication
- [ ] Verify Excel file upload functionality
- [ ] Test payslip generation and PDF export
- [ ] Check all role-based access controls
- [ ] Verify mobile responsiveness

## Application Features

- Multi-company payroll management
- Excel file import with Advensys format support
- Monthly and annual payslip generation
- PDF export with Luxembourg compliance
- Role-based access control (Admin, Employee)
- Tax rate management
- User access management
- Activity logging

## Tech Stack

- React 18.2
- TypeScript
- Vite 6.3.5
- Supabase (Backend & Auth)
- Tailwind CSS
- Radix UI Components
- Recharts (Analytics)
- jsPDF (PDF Generation)
- xlsx (Excel Processing)

## Support

For issues or questions, please refer to the main project documentation or contact the development team.

## Version

Build Date: 2025-11-19
Version: 1.0.0
