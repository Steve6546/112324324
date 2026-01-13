# 🔒 Security Guidelines

## Content Security Policy (CSP) Issues

### Fixed Issues

#### 1. iframe Sandbox Bypass Vulnerability
**Problem**: iframe with `allow-scripts` and `allow-same-origin` can escape sandboxing.

**Solution**: Removed `allow-same-origin` from iframe sandbox attribute.

```html
<!-- BEFORE (VULNERABLE) -->
<iframe sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups">

<!-- AFTER (SECURE) -->
<iframe sandbox="allow-scripts allow-modals allow-forms allow-popups">
```

#### 2. Web Worker CSP Violation
**Problem**: Monaco Editor couldn't create web workers due to missing `worker-src` directive.

**Solution**: Added `worker-src 'self' blob:` to CSP.

```html
<!-- CSP with Web Worker support -->
<meta http-equiv="Content-Security-Policy" content="worker-src 'self' blob:;">
```

#### 3. Missing Font and Image Sources
**Problem**: External fonts and images blocked by CSP.

**Solution**: Added specific `font-src` and `img-src` directives.

```html
<!-- Font and Image CSP -->
font-src 'self' https://fonts.gstatic.com data: https://cdnjs.cloudflare.com;
img-src 'self' data: https://generativelanguage.googleapis.com https://images.unsplash.com;
```

#### 4. iframe Content CSP Violations
**Problem**: Generated projects in iframe trying to execute inline scripts.

**Solution**: Added unsafe-inline for iframe content. Tailwind CSS is handled via PostCSS plugin, not CDN.

```html
<!-- iframe Content CSP Support -->
script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:;
style-src 'self' 'unsafe-inline';
connect-src 'self';
```

## Security Headers

### Implemented Headers

```javascript
// vite.config.ts - Development headers
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}
```

```html
<!-- Production headers -->
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta http-equiv="X-Frame-Options" content="DENY" />
<meta http-equiv="X-XSS-Protection" content="1; mode=block" />
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
```

## CSP Configuration

### Development CSP (Relaxed)
```html
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdnjs.cloudflare.com https://esm.sh https://unpkg.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com data: https://cdnjs.cloudflare.com;
    img-src 'self' data: https://generativelanguage.googleapis.com https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos;
    connect-src 'self' https://generativelanguage.googleapis.com https://esm.sh https://cdn.jsdelivr.net;
    worker-src 'self' blob:;
    frame-src 'self' data: blob:;
  ">
```

### Production CSP (Strict)
```html
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https://generativelanguage.googleapis.com https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos;
    connect-src 'self' https://generativelanguage.googleapis.com;
    worker-src 'self' blob:;
    frame-src 'self' data: blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  ">
```

## Security Best Practices

### 1. iframe Security
- ✅ Remove `allow-same-origin` when using `allow-scripts`
- ✅ Use specific sandbox permissions only when needed
- ✅ Consider using `allow-top-navigation` instead of `allow-same-origin`

### 2. CSP Implementation
- ✅ Use `default-src 'self'` as fallback
- ✅ Specify `worker-src` for Web Workers
- ✅ Include `blob:` for dynamic content
- ✅ Limit external domains to trusted sources only

### 3. Headers Security
- ✅ `X-Frame-Options: DENY` prevents clickjacking
- ✅ `X-Content-Type-Options: nosniff` prevents MIME sniffing
- ✅ `X-XSS-Protection` provides XSS protection
- ✅ `Referrer-Policy` controls referrer information

### 4. Permissions Policy
- ✅ Restrict camera/microphone access when not needed
- ✅ Control geolocation access
- ✅ Limit autoplay capabilities

### 5. iframe Content Security
- ✅ Allow Tailwind CSS CDN for generated projects
- ✅ Enable inline scripts for dynamic content
- ✅ Maintain sandbox isolation for security
- ✅ Allow external resources needed by projects

## Testing Security

### CSP Testing Commands

```bash
# Test CSP headers
curl -I http://localhost:5173

# Check for CSP violations in browser console
# Open DevTools → Console → Look for CSP violation messages
```

### Security Audit

```bash
# Run security audit
npm audit

# Check for vulnerable dependencies
npm audit --audit-level=moderate
```

## Deployment Checklist

### Pre-Deployment Security
- [ ] Replace development CSP with production CSP
- [ ] Enable all security headers
- [ ] Test iframe functionality after sandbox changes
- [ ] Verify Monaco Editor Web Workers work
- [ ] Test external font/image loading
- [ ] Validate AI API connections
- [ ] Check for CSP violations in production

### Production Configuration
- [ ] Use `csp.production.html` for production builds
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Implement proper CORS policies
- [ ] Regular security updates

## Monitoring

### CSP Violation Reporting
```javascript
// Enable CSP violation reporting
document.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', e);
  // Send to monitoring service
});
```

### Security Headers Check
```bash
# Check security headers
curl -I https://yourdomain.com
```

## Emergency Response

### If Security Issue Detected:
1. **Stop the deployment** immediately
2. **Assess the vulnerability** severity
3. **Apply security patches** as needed
4. **Update CSP policies** if required
5. **Test thoroughly** before redeployment
6. **Monitor for similar issues**

## Resources

- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Monaco Editor Security](https://github.com/microsoft/monaco-editor#security)