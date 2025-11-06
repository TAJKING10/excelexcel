# Payroll Application - Deployment Guide

## 📦 Production Build

The production build is ready in the `payroll-app-production.zip` file.

## 🚀 Deployment Options

### Option 1: Static Web Hosting (Netlify, Vercel, etc.)

1. **Extract the zip file**
2. **Upload the contents** to your hosting provider

#### Netlify Deployment:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Vercel Deployment:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 2: Traditional Web Server (Apache, Nginx)

1. **Extract** `payroll-app-production.zip`
2. **Upload contents** to your web server's public directory
3. **Configure your web server** to handle Single Page Application (SPA) routing

#### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache Configuration (.htaccess):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Option 3: Supabase Hosting

Since your app uses Supabase, you can also host on Supabase's edge functions or use their hosting.

## 🔧 Environment Configuration

Your app is configured to use Supabase with the following connection:
- **Supabase URL**: `https://ozkgkgqahgwuwmohslsr.supabase.co`
- **Anon Key**: Already configured in the build

## ✅ What's Included

- ✅ All calculations fixed (Total brut formula corrected)
- ✅ PDF export with conditional row display (zero values hidden)
- ✅ Bidirectional calculation system
- ✅ Tax rate management
- ✅ Employee and company management
- ✅ Monthly and annual payslips
- ✅ Multi-language support (French/English)
- ✅ Dark mode support
- ✅ Responsive design

## 📋 Post-Deployment Checklist

1. ✅ Build completed successfully
2. ⬜ Upload files to hosting provider
3. ⬜ Configure custom domain (if needed)
4. ⬜ Test the deployed application
5. ⬜ Verify Supabase connection works
6. ⬜ Test user authentication
7. ⬜ Test payslip generation and PDF export

## 🔐 Security Notes

- The app uses Supabase Row Level Security (RLS)
- User authentication is handled by Supabase Auth
- All sensitive data is stored securely in Supabase

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 🐛 Troubleshooting

### Blank page after deployment?
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Ensure web server is configured for SPA routing

### PDF export not working?
- Check browser console
- Ensure all assets loaded correctly

## 📞 Support

For issues or questions, check the application logs in your browser's developer console (F12).

---

**Built with:** React + TypeScript + Vite + Supabase + Tailwind CSS
