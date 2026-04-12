# PRAXIS Deployment & Maintenance Guide

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│  Hetzner VPS · 87.99.149.190 · Ubuntu 24.04 · 2GB RAM  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Docker Compose                                  │    │
│  │                                                  │    │
│  │  ┌──────────┐   ┌───────┐   ┌──────────────┐   │    │
│  │  │  nginx   │──▶│ ghost │──▶│  mysql 8.0   │   │    │
│  │  │  :80/443 │   │ :2368 │   │  (ghost_db)  │   │    │
│  │  └──────────┘   └───────┘   └──────────────┘   │    │
│  │       │                                          │    │
│  │       │         ┌───────┐   ┌──────────────┐   │    │
│  │       └────────▶│ umami │──▶│ postgres 15  │   │    │
│  │                 │ :3000 │   │  (umami_db)  │   │    │
│  │                 └───────┘   └──────────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Security: UFW (22/80/443) · fail2ban · SSH key-only    │
│  SSL: Let's Encrypt (auto-renew via certbot timer)      │
└─────────────────────────────────────────────────────────┘
```

**Domains:**
- `praxisplan.org` / `www.praxisplan.org` → Ghost CMS (main site)
- `analytics.praxisplan.org` → Umami analytics dashboard

**Email:** Resend SMTP (smtp.resend.com:587) — configured but requires domain verification in Resend dashboard to send transactional emails.

---

## DNS Records

Set these at your domain registrar (Namecheap):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 87.99.149.190 | 300 |
| A | www | 87.99.149.190 | 300 |
| A | analytics | 87.99.149.190 | 300 |

---

## SSH Access

```bash
# As praxis user (primary — use this)
ssh -i ~/.ssh/praxis_plan praxis@87.99.149.190

# Root login is disabled via /etc/ssh/sshd_config
```

- **User:** `praxis` (has passwordless sudo)
- **Key:** `~/.ssh/praxis_plan`
- **Root SSH:** Disabled
- **Password auth:** Disabled

---

## Project Layout on Server

```
/home/praxis/praxis-site/
├── docker-compose.yml          # Service definitions
├── .env                        # Secrets (never committed)
├── nginx.conf                  # Reverse proxy config (bind-mounted)
├── migrate.js                  # Content migration script
├── index.html                  # Original static site (migration source)
├── manifesto.html              # Original manifesto (migration source)
├── package.json                # Node deps (cheerio for migration)
├── praxis-ghost-theme/         # Ghost theme (bind-mounted into container)
│   ├── package.json
│   ├── default.hbs             # Base layout (includes access gate)
│   ├── index.hbs               # Homepage
│   ├── page.hbs                # Section pages
│   ├── post.hbs                # Individual prompts
│   ├── tag.hbs                 # Tag listing
│   ├── error.hbs               # Error pages
│   ├── partials/
│   │   ├── sidebar.hbs         # Navigation sidebar
│   │   ├── prompt-card.hbs     # Prompt card component
│   │   ├── theme-toggle.hbs    # Dark/light toggle
│   │   └── members-gate.hbs    # Password gate for unauthenticated visitors
│   └── assets/
│       ├── css/style.css       # All styles
│       ├── js/theme.js         # Dark mode toggle
│       ├── js/nav.js           # Sidebar navigation
│       └── img/                # Section images
└── .gitignore
```

---

## Services

### Ghost CMS

- **URL:** https://praxisplan.org
- **Admin:** https://praxisplan.org/ghost/
- **Admin email:** admin@praxisplan.org
- **Admin password:** Pr4x1s2026!Adm1n *(change this)*
- **Version:** Ghost 5 (Alpine)
- **Database:** MySQL 8.0
- **Theme:** `praxis` (bind-mounted from `./praxis-ghost-theme`)

Ghost is configured with:
- `NODE_ENV: production`
- `url: https://praxisplan.org`
- SMTP via Resend (port 587)

### Umami Analytics

- **URL:** https://analytics.praxisplan.org
- **Default login:** admin / umami *(change on first login)*
- **Database:** PostgreSQL 15
- **Tracking:** Automatically embedded in the Ghost theme via `default.hbs`

### Nginx

- Reverse proxy: `praxisplan.org` → Ghost, `analytics.praxisplan.org` → Umami
- SSL termination with Let's Encrypt certificates
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Rate limiting: 10 req/s per IP with burst of 20

---

## Access Gate (Password Protection)

The site is protected by a client-side password gate. Visitors without the correct access code see a login screen; visitors with the code get a cookie and see the full site.

### How it works

1. `default.hbs` runs an inline script on page load that checks for a `praxis_access` cookie
2. If the cookie is missing or doesn't match the expected SHA-256 hash, the HTML attribute `data-locked="true"` is set
3. CSS hides `#praxis-content` and shows `#praxis-gate` when locked
4. The gate (`members-gate.hbs`) presents a password form
5. On submit, the entered code is hashed with SHA-256 in the browser and compared to the stored hash
6. If it matches, a `praxis_access` cookie is set (90-day expiry) and the page reloads
7. Ghost Admin (`/ghost/`) is always accessible regardless of the gate

### Current access code

**`praxis2026`**

### Changing the access code

```bash
# 1. Generate the SHA-256 hash of your new code
echo -n "yournewcode" | shasum -a 256 | cut -d' ' -f1

# 2. Replace the hash in BOTH files:
#    - praxis-ghost-theme/default.hbs (in the inline <script>)
#    - praxis-ghost-theme/partials/members-gate.hbs (in the checkAccess function)
#    The hash appears once in each file. Search for the old hash and replace.

# 3. Deploy the change
scp -i ~/.ssh/praxis_plan \
  praxis-ghost-theme/default.hbs \
  praxis-ghost-theme/partials/members-gate.hbs \
  praxis@87.99.149.190:/home/praxis/praxis-site/praxis-ghost-theme/
# (members-gate.hbs goes in partials/ — adjust the scp target or copy separately)

ssh -i ~/.ssh/praxis_plan praxis@87.99.149.190 \
  'cd /home/praxis/praxis-site && sudo docker compose restart ghost'
```

Existing users will need to re-enter the new code (their old cookie won't match).

### Security notes

- The gate is client-side. It prevents casual access but is not a security boundary. The HTML content is in the page source behind the CSS `display:none`. This is sufficient for keeping the site private to invited collaborators, not for protecting sensitive secrets.
- Ghost Admin (`/ghost/`) has its own server-side authentication and is fully secure.
- The access code hash is stored in the theme files, not in the database.

---

## Common Operations

### Deploy code changes

```bash
# On your local machine
cd ~/Development/praxis-site

# Edit files locally, then push to GitHub
git add . && git commit -m "description" && git push

# SSH to server and pull
ssh -i ~/.ssh/praxis_plan praxis@87.99.149.190
cd /home/praxis/praxis-site
git pull

# If you changed the Ghost theme:
sudo docker compose restart ghost

# If you changed nginx.conf:
sudo docker compose exec nginx nginx -s reload

# If you changed docker-compose.yml or .env:
sudo docker compose up -d
```

### Quick deploy (one-liner from local)

```bash
# Push theme changes to server without git
scp -i ~/.ssh/praxis_plan -r praxis-ghost-theme/ praxis@87.99.149.190:/home/praxis/praxis-site/praxis-ghost-theme/
ssh -i ~/.ssh/praxis_plan praxis@87.99.149.190 'cd /home/praxis/praxis-site && sudo docker compose restart ghost'
```

### Invite a Ghost staff user (can edit prompts)

1. Go to https://praxisplan.org/ghost/#/settings/staff
2. Click "Invite people"
3. Enter their email and select role:
   - **Author:** Can create and edit their own prompts
   - **Editor:** Can edit all prompts
   - **Administrator:** Full access
4. Share the site access code with them separately

### View logs

```bash
# All services
sudo docker compose logs -f

# Specific service
sudo docker compose logs -f ghost
sudo docker compose logs -f nginx
sudo docker compose logs -f umami

# Last 100 lines
sudo docker compose logs --tail=100 ghost
```

### Restart services

```bash
# Restart everything
sudo docker compose restart

# Restart one service
sudo docker compose restart ghost

# Full rebuild (pulls new images)
sudo docker compose pull
sudo docker compose up -d
```

### Backup

```bash
# Database backup (Ghost/MySQL)
sudo docker compose exec db mysqldump -u ghost -p ghost > backup-$(date +%Y%m%d).sql
# Enter password from .env GHOST_DB_PASS

# Ghost content (images, themes, etc.)
sudo docker cp praxis-site-ghost-1:/var/lib/ghost/content ./ghost-content-backup

# Full export via Ghost Admin:
# Settings > Labs > Export content (JSON)
```

### Restore from backup

```bash
# MySQL restore
sudo docker compose exec -T db mysql -u ghost -p ghost < backup.sql

# Ghost content restore
sudo docker cp ./ghost-content-backup/. praxis-site-ghost-1:/var/lib/ghost/content/
sudo docker compose restart ghost
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot systemd timer. To check or manually renew:

```bash
# Check cert expiry
sudo certbot certificates

# Manual renewal
sudo docker compose stop nginx
sudo certbot renew
sudo docker compose start nginx

# The certbot timer runs twice daily automatically
sudo systemctl status certbot.timer
```

### Add a new subdomain

1. Add DNS A record pointing to 87.99.149.190
2. Stop nginx: `sudo docker compose stop nginx`
3. Get cert: `sudo certbot certonly --standalone -d newsubdomain.praxisplan.org`
4. Add a new `server {}` block in `nginx.conf`
5. Start nginx: `sudo docker compose start nginx`

---

## Security

### Firewall (UFW)

```bash
sudo ufw status              # Check status
sudo ufw allow 22/tcp        # Already configured
sudo ufw allow 80/tcp        # Already configured
sudo ufw allow 443/tcp       # Already configured
# Only these three ports are open
```

### fail2ban

```bash
sudo fail2ban-client status sshd     # Check banned IPs
sudo fail2ban-client set sshd unbanip 1.2.3.4  # Unban an IP
```

Configuration: `/etc/fail2ban/jail.local`
- SSH jail: ban after 3 failed attempts for 1 hour

### SSH Hardening

`/etc/ssh/sshd_config`:
- `PermitRootLogin no`
- `PasswordAuthentication no`
- Key-based auth only

---

## Environment Variables

The `.env` file on the server contains all secrets. **Never commit this file.**

```bash
GHOST_DB_PASS=<mysql password for ghost user>
MYSQL_ROOT_PASS=<mysql root password>
UMAMI_DB_PASS=<postgresql password for umami>
UMAMI_SECRET=<umami app secret>
RESEND_API_KEY=<resend SMTP API key>
```

To regenerate passwords:
```bash
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32
```

---

## Content Architecture

### Ghost Pages (12 sections + manifesto)

Each manifesto section is a Ghost **page** with the internal tag `#section`. The sidebar navigation queries pages with this tag.

| Slug | Title |
|------|-------|
| vision | 01 — Strategic Vision |
| values | 02 — Metaphysical Infrastructure |
| foundations | 03 — Theoretical Foundations |
| architecture | 04 — Functional Architecture |
| power | 05 — Political Authority |
| technology | 06 — Technical Infrastructure |
| civic-engine | 07 — Engagement & Progression |
| communications | 08 — Media Infrastructure |
| coalition | 09 — Scaling Architecture |
| implementation | 10 — Implementation Program |
| working-groups | 11 — Internal Structure |
| resources | 12 — Organizational Resources |
| manifesto | The Manifesto |

### Ghost Posts (57 prompts)

Each prompt is a Ghost **post** tagged with:
- **Category tag** (internal): `#build`, `#tool`, `#model`, `#sop`, `#assess`, `#plan`, or `#guide`
- **Section tag** (internal): `#section-vision`, `#section-values`, etc.
- **Visible section tag**: `01 - Strategic Vision`, etc.

Prompt structure in Ghost:
- **Title** = eyebrow label (e.g., "INSTITUTIONAL MAP")
- **Body** = the prompt question
- **Custom excerpt** = the hint text (max 300 chars)

Category styling is applied via `data-category` attributes in `prompt-card.hbs`, with colors defined in `style.css`:
- BUILD (default dashed border), TOOL (red), MODEL (purple), SOP (green), ASSESS (amber), PLAN (blue), GUIDE (teal)

---

## Migration Script

`migrate.js` parses `index.html` and creates Ghost content via the Admin API. It also imports `manifesto.html` as a Ghost page.

```bash
# Set required env vars
export GHOST_URL=https://praxisplan.org
export GHOST_ADMIN_KEY=<id>:<secret>

# Create an integration in Ghost Admin > Settings > Integrations
# Copy the Admin API key

# Run migration (from local machine, not the server — avoids rate limiting)
npm install cheerio  # first time only
node migrate.js
```

The script is idempotent for tags (finds existing) but will create duplicate posts/pages if run twice. Delete content in Ghost Admin before re-running.

**Important:** Run the migration from your local machine, not the server. The server's nginx rate limiter will block rapid API calls. Your local machine hits the API through the internet and is not subject to the same per-IP rate limit accumulation.

---

## Troubleshooting

### Ghost shows 502/503

```bash
sudo docker compose logs ghost --tail=50
# Usually means Ghost is still booting (takes ~15s) or crashed
sudo docker compose restart ghost
```

### Can't access Ghost Admin

Ghost Admin is at `/ghost/`. If locked out:
```bash
# Reset admin password via CLI inside container
sudo docker compose exec ghost ghost user reset-password --email admin@praxisplan.org
```

### Theme changes not showing

```bash
# Restart Ghost to pick up theme changes
sudo docker compose restart ghost
# Or re-activate in Admin: Settings > Design > praxis > Activate
```

### Access gate not working

- Check that the hash in `default.hbs` and `members-gate.hbs` match
- Clear browser cookies for praxisplan.org and try again
- Check browser console for JavaScript errors

### Disk space issues

```bash
df -h
# Clean Docker images
sudo docker system prune -a
# Clean old logs
sudo truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

### Rate limiting blocking legitimate traffic

Edit `nginx.conf`, adjust `rate=10r/s` and `burst=20`, then:
```bash
sudo docker compose exec nginx nginx -s reload
```

### SMTP / Email not working

Ghost uses Resend SMTP on port 587. Hetzner blocks port 465. If emails fail:
1. Check logs: `sudo docker compose logs ghost --tail=20 | grep -i mail`
2. Verify Resend domain verification at https://resend.com/domains
3. Test connectivity: `timeout 5 openssl s_client -connect smtp.resend.com:587 -starttls smtp`
