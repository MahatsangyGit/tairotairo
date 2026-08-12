#!/usr/bin/env python3
"""Génère la checklist de mise en production VPS (NGINX + app Tairo) en PDF."""

from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    HRFlowable,
    KeepTogether,
)

# Charte graphique (alignée sur scripts/generate-presentation.py)
BRAND_PRIMARY = colors.HexColor("#069494")
INK = colors.HexColor("#1a2e2e")
MUTED = colors.HexColor("#4a6363")
LIGHT_BG = colors.HexColor("#f0fafa")
BORDER = colors.HexColor("#cfe8e8")
WHITE = colors.white

OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "Checklist_MiseEnProd_VPS_Tairo.pdf"

styles = {
    "title": ParagraphStyle(
        "title", fontName="Helvetica-Bold", fontSize=22, leading=27,
        textColor=INK, alignment=TA_LEFT, spaceAfter=2,
    ),
    "subtitle": ParagraphStyle(
        "subtitle", fontName="Helvetica", fontSize=11.5, leading=15,
        textColor=MUTED, spaceAfter=10,
    ),
    "h2": ParagraphStyle(
        "h2", fontName="Helvetica-Bold", fontSize=13.5, leading=17,
        textColor=BRAND_PRIMARY, spaceBefore=14, spaceAfter=5,
    ),
    "body": ParagraphStyle(
        "body", fontName="Helvetica", fontSize=10, leading=13.5,
        textColor=INK, spaceAfter=4,
    ),
    "small": ParagraphStyle(
        "small", fontName="Helvetica", fontSize=8.6, leading=11.5,
        textColor=MUTED,
    ),
    "code": ParagraphStyle(
        "code", fontName="Courier", fontSize=8.8, leading=11.5,
        textColor=INK, backColor=LIGHT_BG, borderPadding=5,
        spaceBefore=3, spaceAfter=6,
    ),
    "check": ParagraphStyle(
        "check", fontName="Helvetica", fontSize=10, leading=14,
        textColor=INK, leftIndent=2,
    ),
}


def code(txt: str) -> Paragraph:
    return Paragraph(txt.replace("\n", "<br/>").replace(" ", "&nbsp;"), styles["code"])


def checklist(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(i, styles["check"]), leftIndent=14) for i in items],
        bulletType="bullet",
        bulletFontName="Helvetica",
        bulletFontSize=9,
        bulletColor=BRAND_PRIMARY,
        leftIndent=10,
        spaceAfter=4,
    )


story = []

# ── En-tête ───────────────────────────────────────────────────────────────────
header = Table(
    [[Paragraph("Tairo — Checklist mise en production VPS", styles["title"])],
     [Paragraph("NGINX reverse proxy · 2 instances Node · WebSocket · uploads vidéo · object storage + CDN", styles["subtitle"])]],
    colWidths=[17 * cm],
)
header.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
    ("LEFTPADDING", (0, 0), (-1, -1), 14),
    ("RIGHTPADDING", (0, 0), (-1, -1), 14),
    ("TOPPADDING", (0, 0), (-1, 0), 14),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ("ROUNDEDCORNERS", [8, 8, 8, 8]),
]))
story.append(header)
story.append(Spacer(1, 6))

# ── Architecture cible ────────────────────────────────────────────────────────
story.append(Paragraph("1. Architecture cible", styles["h2"]))
story.append(Paragraph(
    "Client → <b>CDN</b> (prod réelle) → <b>NGINX</b> → <b>2 processus Node</b> "
    "(<i>dist/server.js</i>) : <b>127.0.0.1:3001</b> et <b>127.0.0.1:3002</b>.<br/>"
    "Workers séparés : <b>Sharp</b> (images) puis <b>FFmpeg</b> (vidéos) — jamais dans le même processus HTTP.<br/>"
    "Données : <b>PostgreSQL 16</b> (RLS) · <b>Redis 7</b> (BullMQ, rate-limit, realtime) · <b>Object storage</b> (S3/R2/MinIO) pour tous les fichiers.",
    styles["body"],
))

arch = Table([[code(
    "Client\n"
    "   |\n"
    "   v\n"
    "  CDN (assets /_next/static)\n"
    "   |\n"
    "   v\n"
    " NGINX :443  (TLS, WS, uploads)\n"
    "   |\n"
    "   +--> Node app #1  127.0.0.1:3001\n"
    "   +--> Node app #2  127.0.0.1:3002    (upstream tairo_app, ip_hash = sticky)\n"
    "\n"
    " Workers (hors NGINX) : image-optimize (Sharp) . futur video (FFmpeg)\n"
    " Services : PostgreSQL 16 . Redis 7 . Object storage (S3/R2)"
)]], colWidths=[17 * cm])
arch.setStyle(TableStyle([
    ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(arch)

# ── VPS / système ─────────────────────────────────────────────────────────────
story.append(Paragraph("2. VPS — système et ressources", styles["h2"]))
story.append(checklist([
    "VPS <b>4 vCPU / 8 Go RAM / 40–60 Go NVMe</b> (Ubuntu 22.04/24.04)",
    "Swap 2–4 Go (filet pour pics Sharp/FFmpeg)",
    "Node.js <b>22 LTS ou 24</b> installé",
    "NGINX installé",
    "Redis 7 (persistance activée)",
    "PostgreSQL 16 (local) <b>ou</b> managé (Neon/RDS…) — RLS + <i>set_config</i> supportés",
    "FFmpeg installé (préparer ampianaro vidéo)",
    "Pas de médiathèque sur le disque VPS : fichiers sur object storage",
]))

# ── Application Node ──────────────────────────────────────────────────────────
story.append(Paragraph("3. Application — processus et variables", styles["h2"]))
story.append(Paragraph(
    "Deux processus Node identiques (systemd, PM2 ou Docker), seul le port change :",
    styles["body"],
))
story.append(code(
    "# Instance 1\n"
    "NODE_ENV=production\n"
    "PORT=3001\n"
    "TRUSTED_PROXY_COUNT=1        # NGINX = seul proxy de confiance\n"
    "IMAGE_OPTIMIZE_MODE=queue    # Sharp dans le worker, pas dans l'API\n"
    "REDIS_URL=redis://127.0.0.1:6379\n"
    "DATABASE_URL=postgresql://…\n"
    "STORAGE_BACKEND=s3           # (+ S3_* / AWS_*)\n"
    "\n"
    "# Instance 2 : identique, PORT=3002"
))
story.append(checklist([
    "Process manager qui relance les 2 instances (systemd ×2 ou PM2)",
    "Worker images : <i>NODE_ENV=production node dist/image-optimize-worker.js</i> (concurrency 1)",
    "Crons système vers <i>/api/cron/*</i> avec <b>CRON_SECRET</b> (expire-subscriptions, cleanup-tokens, notification-outbox)",
    "Migrations DB appliquées avant le démarrage (<i>npm run db:migrate:neon</i> ou équivalent)",
]))

# ── NGINX ─────────────────────────────────────────────────────────────────────
story.append(Paragraph("4. NGINX — points à adapter dans deploy/nginx/tairo.conf", styles["h2"]))
story.append(checklist([
    "<b>server_name</b> : domaine principal + <i>ampindramo.*</i> + <i>ampianaro.*</i> (blocs :80 et :443)",
    "<b>ssl_certificate / ssl_certificate_key</b> : chemins réels (Let’s Encrypt ou autre)",
    "<b>upstream tairo_app</b> : ports des instances Node (3001/3002) ; retirer une ligne si une seule instance",
    "<b>client_max_body_size 320m</b> : garder tant que l’upload vidéo admin passe par Node",
    "location vidéo admin : vérifier le pattern <i>^/api/admin/learning/lessons/[^/]+/video/?$</i>",
    "location <b>/ws/messaging</b> : ne pas modifier (upgrade + timeouts 3600 s)",
    "Aucun cache local <i>/_next/static</i> : le CDN s’en charge en prod",
]))
story.append(code(
    "sudo cp deploy/nginx/tairo.conf /etc/nginx/sites-available/tairo.conf\n"
    "sudo ln -s /etc/nginx/sites-available/tairo.conf /etc/nginx/sites-enabled/tairo.conf\n"
    "sudo nginx -t && sudo systemctl reload nginx"
))

# ── Vérifications post-déploiement ────────────────────────────────────────────
story.append(Paragraph("5. Vérifications après déploiement", styles["h2"]))
story.append(checklist([
    "<b>nginx -t</b> OK, reload sans erreur",
    "GET https://&lt;domaine&gt;/api/health → 200 (via NGINX)",
    "WebSocket : connexion <i>wss://&lt;domaine&gt;/ws/messaging</i> stable (pas de 404/502)",
    "Upload image (avatar/portfolio/cover) → 200, fichier visible dans l’object storage",
    "Upload vidéo admin (ampianaro) → pas de 413, pas de timeout",
    "Messagerie temps réel fonctionnelle entre deux navigateurs",
    "Logs : plus de 404 <i>/ws/messaging</i>, plus d’erreur « SharedArrayBuffer »",
    "CDN actif sur <i>/_next/static</i> (headers cache du CDN visibles)",
]))

# ── Sécurité / rappels ────────────────────────────────────────────────────────
story.append(Paragraph("6. Sécurité et rappels", styles["h2"]))
story.append(checklist([
    "<b>TRUSTED_PROXY_COUNT=1</b> — sinon le rate-limit lira une mauvaise IP client",
    "Secrets (JWT_SECRET, CRON_SECRET, clés S3…) hors du repo, en variables d’environnement",
    "Backups : PostgreSQL quotidien + snapshots VPS",
    "Vidéos : upload réservé admin ; utilisateurs = lecture/téléchargement uniquement",
    "Monitoring minimal : logs NGINX + app (pino) + heartbeat worker (clé Redis <i>tairo:image-worker:heartbeat</i>)",
]))

story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", color=BORDER, thickness=0.75))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "Document généré pour le déploiement VPS — repo tairotairo · branche chore/nginx-vps-config · août 2026",
    styles["small"],
))

doc = SimpleDocTemplate(
    str(OUTPUT),
    pagesize=A4,
    leftMargin=2 * cm,
    rightMargin=2 * cm,
    topMargin=1.6 * cm,
    bottomMargin=1.6 * cm,
    title="Tairo — Checklist mise en production VPS",
    author="Tairo",
)
doc.build(story)
print(f"PDF généré : {OUTPUT}")
