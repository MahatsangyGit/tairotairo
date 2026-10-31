# -*- coding: utf-8 -*-
"""Réorganisation + uniformisation du modèle Tairo 3 états."""
import json, re, copy
import openpyxl
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.chart import LineChart, Reference, Series

PATH = '/Users/macbookair/Desktop/Etude Tairo/Excel base/Modele_Tairo_3_etats.xlsx'
WORK = '/Users/macbookair/Desktop/tairotairo/.excel_work'
OUT = f'{WORK}/Modele_Tairo_3_etats_NOUVEAU.xlsx'

# ---------------------------------------------------------------- baseline
wbv = openpyxl.load_workbook(PATH, data_only=True)
baseline = {}
def snap(sheet, coords):
    ws = wbv[sheet]
    for c in coords:
        baseline[f'{sheet}!{c}'] = ws[c].value
snap('P&L', [f'{c}{r}' for c in 'BCD' for r in (30,31,32,34,35)])
snap('Tresorerie', ['AM25'])
snap('Bilan', ['AM18'])
snap('KPI', [f'{c}{r}' for c in 'BCD' for r in (33,35,36,42,64,65,69)])
# valeurs pour la mise à jour du Lisez-moi
pl = wbv['P&L']; tre = wbv['Tresorerie']; pv = wbv['Plan ventes']
ca = [pl[f'{c}30'].value for c in 'BCD']
ebitda = [pl[f'{c}31'].value for c in 'BCD']
treso_row = [tre.cell(row=25, column=c).value for c in range(4, 39)]  # D..AM = M1..M36 (D=4)
treso_min = min(v for v in treso_row if isinstance(v, (int, float)))
treso_m36 = tre['AM25'].value
ebitda_m = [pl.cell(row=18, column=c).value for c in range(2, 38)]
first_pos = next((i+1 for i, v in enumerate(ebitda_m) if isinstance(v, (int, float)) and v > 0), None)
collab_row = [pv.cell(row=41, column=c).value for c in range(2, 38)]
collab_m = next((i+1 for i, v in enumerate(collab_row) if v == 1), None)
json.dump(baseline, open(f'{WORK}/baseline.json', 'w'))
print('baseline OK — CA:', [round(x/1e6,1) for x in ca], 'treso_min:', round(treso_min/1e6,1),
      'first EBITDA>0:', first_pos, 'collab2:', collab_m)

# ---------------------------------------------------------------- chargement
wb = openpyxl.load_workbook(PATH, data_only=False)
P = wb['Parametres']

# lecture complète de l'ancien Parametres (valeurs + formats)
old = {}
for r in range(1, 151):
    old[r] = [(P.cell(row=r, column=c).value, P.cell(row=r, column=c).number_format) for c in range(1, 9)]

# ---------------------------------------------------------------- correction Tresorerie D6:AM6 (encaissement stress générique)
T = wb['Tresorerie']
from openpyxl.utils import get_column_letter
for col in range(4, 40):  # D..AM = M1..M36
    L = get_column_letter(col)
    m = col - 3
    ca_col = get_column_letter(m + 1)  # P&L col B = M1
    T[f'{L}6'] = (f"=IF(Parametres!$B$104=1,"
                  f"IF({L}$3-Parametres!$B$111>=1,INDEX('P&L'!$B$5:$AK$5,1,{L}$3-Parametres!$B$111),0)"
                  f"*(1-Parametres!$B$109),'P&L'!{ca_col}5)")

# ---------------------------------------------------------------- Dashboard : suppression doublons (lignes 41-42)
D = wb['Dashboard']
assert 'Apport en fonds propres (V2.3' in str(D['A41'].value)
D.delete_rows(41, 2)

# ---------------------------------------------------------------- nouveau layout Parametres
STD = ['Libellé', 'Valeur base', 'Unité', 'Valeur scénario', 'Note']
GROWTH = [old[91][c][0] for c in range(8)]
CAPEX_H = ['Équipement', 'Quantité', 'PU (Ar TTC)', 'Total (Ar)', 'Durée (ans)', 'Note']

layout = [
    ('title', 'TAIRO — HYPOTHÈSES (MGA HT) — MODÈLE 3 ÉTATS'),
    ('row', 2), ('row', 3), ('blank',),
    ('section', '1 · REVENUS — ABONNEMENT PRESTATAIRE (Tairo Ampio+, visibilité optionnelle)'),
    ('cols', STD), ('row', 7), ('row', 8), ('row', 9), ('blank',),
    ('section', '2 · REVENUS — MISE EN LIGNE VIDÉO (Tairo Ampianaro B2B, clients professionnels)'),
    ('cols', STD), ('row', 13), ('row', 14), ('row', 15), ('blank',),
    ('section', '3 · REVENUS — PRESTATIONS (Tairo Ampio, commission prélevée sur le prestataire)'),
    ('cols', STD), ('row', 19), ('row', 20), ('row', 21), ('row', 22), ('row', 23), ('row', 24),
    ('row', 25), ('row', 26), ('blank',),
    ('section', '4 · REVENUS — LOCATION MATÉRIEL PRO (Ampindramo PRO, commission par paliers)'),
    ('cols', STD), ('row', 30), ('row', 31), ('row', 32), ('row', 33), ('row', 34), ('row', 35),
    ('row', 36), ('blank',),
    ('section', '5 · REVENUS — LOCATION MATÉRIEL PARTICULIERS (Ampindramo C2C)'),
    ('cols', STD), ('row', 40), ('row', 41), ('row', 42), ('blank',),
    ('section', '6 · CROISSANCE MENSUELLE PAR SEGMENT — PAR ANNÉE (ralentissement progressif)'),
    ('cols', GROWTH), ('row', 92), ('row', 93), ('row', 94), ('row', 95), ('row', 96), ('blank',),
    ('section', '7 · PLAFOND DE CROISSANCE SI COLLAB 2 ABSENT (années 2–3)'),
    ('cols', STD), ('row', 142), ('row', 143), ('blank',),
    ('section', '8 · COÛTS VARIABLES — COGS ET COÛTS OPÉRATIONNELS LIÉS AU VOLUME'),
    ('cols', STD), ('row', 46), ('row', 47), ('row', 148), ('row', 149), ('row', 150), ('row', 48),
    ('blank',),
    ('section', '9 · OPEX MENSUEL (charges fixes)'),
    ('cols', STD), ('row', 52), ('row', 53), ('row', 54), ('row', 55), ('row', 56), ('row', 57),
    ('row', 58), ('row', 59), ('row', 60), ('blank',),
    ('section', '10 · ACQUISITION & CAC (hypothèses clients + split offre / demande)'),
    ('cols', STD), ('row', 61), ('row', 62), ('row', 85), ('row', 86), ('row', 87), ('row', 88),
    ('row', 120), ('row', 121), ('row', 122), ('blank',),
    ('section', "11 · COLD START (M1–M6) — budget + subvention d'offre"),
    ('cols', STD), ('row', 115), ('row', 116), ('row', 117), ('blank',),
    ('section', '12 · CAPACITÉ D\u2019EXÉCUTION — 2E COLLABORATEUR (embauche + déclencheur de trésorerie)'),
    ('cols', STD), ('row', 100), ('row', 101), ('row', 136), ('row', 137), ('row', 138), ('row', 139),
    ('blank',),
    ('section', '13 · CAPEX (investissements)'),
    ('cols', CAPEX_H), ('row', 66), ('row', 67), ('row', 68), ('blank',),
    ('section', '14 · FINANCEMENT'),
    ('cols', STD), ('row', 72), ('row', 73), ('row', 74), ('row', 75), ('blank',),
    ('section', '15 · FISCALITÉ MADAGASCAR (LF 2026) — IS SYNTHÉTIQUE / IR RÉGIME RÉEL'),
    ('cols', STD), ('row', 79), ('row', 80), ('row', 81), ('row', 82), ('row', 83), ('blank',),
    ('section', '16 · LIQUIDITÉ — KPI UNIQUEMENT (ne bride pas les volumes du plan de ventes)'),
    ('cols', STD), ('row', 125), ('row', 126), ('row', 127), ('row', 128), ('row', 129), ('row', 130),
    ('row', 131), ('row', 132), ('row', 133), ('blank',),
    ('section', '17 · STRESS TEST — SCÉNARIO DÉGRADÉ COMBINÉ (indépendant de Prudent / Base / Optimiste)'),
    ('cols', STD), ('row', 104), ('row', 105), ('row', 106), ('row', 107), ('row', 108), ('row', 109),
    ('row', 110), ('row', 111),
]

# calcul du mapping ancien -> nouveau
rowmap = {}
new_r = 0
placed = []  # (new_row, kind, payload)
for item in layout:
    new_r += 1
    placed.append((new_r, item))
    if item[0] == 'row':
        rowmap[item[1]] = new_r
rowmap[2] = 2  # sécurité (B2 déjà mappé par layout)
LAST_ROW = new_r

# vérifie que toutes les lignes Parametres référencées ailleurs sont mappées
ref_pat = re.compile(r"Parametres!\$?[A-H]\$?(\d{1,3})")
needed = set()
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if isinstance(c.value, str) and c.value.startswith('='):
                for m in ref_pat.finditer(c.value):
                    needed.add(int(m.group(1)))
missing = needed - set(rowmap)
assert not missing, f'lignes non mappées: {missing}'

# refs internes de Parametres (sans préfixe) : vérifier qu'elles sont mappées
loc_pat = re.compile(r"(?<![A-Za-z0-9_.!$])(\$?)([A-H])(\$?)(\d{1,3})(?![\d(])")
internal = set()
for r in range(1, 151):
    for v, _ in old[r]:
        if isinstance(v, str) and v.startswith('='):
            # retire les refs préfixées (autre onglet) avant scan local
            stripped = re.sub(r"[A-Za-z_][A-Za-z0-9_.]*!\$?[A-H]\$?\d{1,3}", '', v)
            for m in loc_pat.finditer(stripped):
                internal.add(int(m.group(4)))
miss2 = internal - set(rowmap)
assert not miss2, f'refs internes non mappées: {miss2}'

def remap_local(f):
    def sub(m):
        return f'{m.group(1)}{m.group(2)}{m.group(3)}{rowmap[int(m.group(4))]}'
    # protège les refs préfixées d'un autre onglet
    parts = re.split(r"([A-Za-z_][A-Za-z0-9_.]*!\$?[A-H]\$?\d{1,3})", f)
    return ''.join(p if i % 2 else loc_pat.sub(sub, p) for i, p in enumerate(parts))

# ---------------------------------------------------------------- réécriture de Parametres
# efface tout
for r in range(1, max(151, LAST_ROW + 5)):
    for c in range(1, 9):
        cell = P.cell(row=r, column=c)
        cell.value = None
        cell.number_format = 'General'
        cell.font = Font(name='Calibri', size=10)
        cell.fill = PatternFill()
        cell.border = Border()
        cell.alignment = Alignment()

section_rows, colhdr_rows, data_rows, title_rows, blank_rows = [], [], [], [], []
for new_row, item in placed:
    kind = item[0]
    if kind == 'title':
        P.cell(row=new_row, column=1, value=item[1]); title_rows.append(new_row)
    elif kind == 'section':
        P.cell(row=new_row, column=1, value=item[1]); section_rows.append(new_row)
    elif kind == 'cols':
        for i, h in enumerate(item[1]):
            if h is not None:
                P.cell(row=new_row, column=i+1, value=h)
        colhdr_rows.append(new_row)
    elif kind == 'row':
        r_old = item[1]
        for c in range(1, 9):
            v, fmt = old[r_old][c-1]
            if v is None:
                continue
            if isinstance(v, str) and v.startswith('='):
                v = remap_local(v)
            cell = P.cell(row=new_row, column=c, value=v)
            cell.number_format = fmt
        data_rows.append(new_row)
    else:
        blank_rows.append(new_row)

# validation de données sur B2
dv = DataValidation(type='list', formula1='"1,2,3"', allow_blank=False, showErrorMessage=True)
P.add_data_validation(dv)
dv.add('B2')

# ---------------------------------------------------------------- remap des références externes
def remap_ext(f):
    def sub(m):
        return f"Parametres!{m.group(1)}{m.group(2)}{m.group(3)}{rowmap[int(m.group(4))]}"
    return re.sub(r"Parametres!(\$?)([A-H])(\$?)(\d{1,3})", sub, f)

for ws in wb.worksheets:
    if ws.title == 'Parametres':
        continue
    for row in ws.iter_rows():
        for c in row:
            if isinstance(c.value, str) and 'Parametres!' in c.value and c.value.startswith('='):
                c.value = remap_ext(c.value)

# ---------------------------------------------------------------- corrections de textes
LM = wb['Lisez-moi']
def fmt_m(x): return f"{x/1e6:.1f}".replace('.', ',')
LM['A33'] = '2. Cellules à texte BLEU sur fond JAUNE : hypothèses modifiables ; texte NOIR : calculs ; texte VERT : références vers un autre onglet.'
LM['A38'] = "— Salaires fondateur et collab 1 inchangés (1 M Ar/mois chacun). Collab 2 (400 k) : plus d'embauche automatique en M13."
LM['A43'] = '— Cold-start 6 mois : pub = MAX(400 k ; 6 % du CA) + take rate Ampio −2 points (13,25 % → 11,25 %), puis retour au mix.'
LM['A46'] = '— Plancher IR corrigé 1 M + 1 % CA.'
LM['A48'] = 'LECTURE DES RÉSULTATS BASE (valeurs recalculées du classeur, stress off)'
LM['A49'] = f"— CA A1 / A2 / A3 : {fmt_m(ca[0])} / {fmt_m(ca[1])} / {fmt_m(ca[2])} M Ar"
LM['A50'] = f"— EBITDA A1 / A2 / A3 : {fmt_m(ebitda[0])} / {fmt_m(ebitda[1])} / {fmt_m(ebitda[2])} M Ar"
LM['A51'] = f"— Trésorerie min / M36 : {fmt_m(treso_min)} / {fmt_m(treso_m36)} M Ar"
LM['A52'] = f"— Premier mois EBITDA > 0 : {first_pos if first_pos else '> 36'}"
LM['A53'] = f"— Mois d'embauche collab 2 : {collab_m if collab_m else '> 36'}"
LM['A62'] = "4. Cold-start, split CAC, liquidité KPI et trigger d'embauche se règlent dans Parametres (sections 10 à 12 et 16)."
LM['A71'] = '— Support / modération 1 000 Ar × (prestations + loc pro + C2C).'
LM['A73'] = '— Provision litiges 1,0 % du GMV.'
LM['A83'] = '— Texte bleu + fond jaune : hypothèse. Texte noir : calcul. Texte vert : lien vers un autre onglet.'
sup_r, ver_r, lit_r = rowmap[148], rowmap[149], rowmap[150]
wb['Contribution']['A22'] = ("Lecture : les coûts variables suivent le volume (transactions, nouveaux, GMV). "
    "Les OPEX fixes ne bougent qu'avec l'inflation, le scénario et l'embauche collab 2. "
    f"Taux unitaires : Parametres!B{sup_r} (support), B{ver_r} (vérification), B{lit_r} (litiges), plus MM / SMS (section 8).")
wb['P&L']['A14'] = 'Object Storage'

# ---------------------------------------------------------------- formatage
C_DARK   = '1F4E79'
C_SEC    = '4472C4'
C_HDRBG  = 'D9E1F2'
C_INPUT  = 'FFF6CC'
C_GRAY   = '595959'
F_TITLE  = Font(name='Calibri', size=14, bold=True, color='FFFFFF')
F_SEC    = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
F_HDR    = Font(name='Calibri', size=10, bold=True, color=C_DARK)
FILL_T   = PatternFill('solid', fgColor=C_DARK)
FILL_S   = PatternFill('solid', fgColor=C_SEC)
FILL_H   = PatternFill('solid', fgColor=C_HDRBG)
FILL_I   = PatternFill('solid', fgColor=C_INPUT)
B_THIN   = Border(bottom=Side(style='thin', color='B2B2B2'))
B_TOP    = Border(top=Side(style='thin', color='404040'))

def font_for(cell, bold):
    v = cell.value
    if isinstance(v, str) and v.startswith('='):
        color = '008000' if '!' in v else '000000'
        return Font(name='Calibri', size=10, bold=bold, color=color)
    return Font(name='Calibri', size=10, bold=bold, color='000000')

# --- Parametres
for new_row, item in placed:
    kind = item[0]
    lastc = 8
    if kind == 'title':
        for c in range(1, lastc+1):
            cl = P.cell(row=new_row, column=c); cl.font = F_TITLE; cl.fill = FILL_T
        P.row_dimensions[new_row].height = 22
    elif kind == 'section':
        for c in range(1, lastc+1):
            cl = P.cell(row=new_row, column=c); cl.font = F_SEC; cl.fill = FILL_S
        P.row_dimensions[new_row].height = 18
    elif kind == 'cols':
        for c in range(1, lastc+1):
            cl = P.cell(row=new_row, column=c); cl.font = F_HDR; cl.fill = FILL_H; cl.border = B_THIN
    elif kind == 'row':
        for c in range(1, lastc+1):
            cl = P.cell(row=new_row, column=c)
            v = cl.value
            if v is None:
                continue
            if c == 1:  # libellé
                cl.font = Font(name='Calibri', size=10, color='000000')
                cl.alignment = Alignment(wrap_text=True, vertical='top')
            elif isinstance(v, str) and v.startswith('='):
                cl.font = font_for(cl, False)
                cl.alignment = Alignment(vertical='top')
            elif isinstance(v, (int, float)):
                cl.font = Font(name='Calibri', size=10, color='0000FF')
                cl.fill = FILL_I
                cl.alignment = Alignment(vertical='top')
            else:  # texte (unités, notes)
                it = (c >= 5)
                cl.font = Font(name='Calibri', size=9 if c >= 5 else 10, italic=it, color=C_GRAY)
                cl.alignment = Alignment(wrap_text=(c >= 5), vertical='top')
# lignes de total / contrôle en gras
for lab_row in data_rows:
    a = P.cell(row=lab_row, column=1).value
    if isinstance(a, str) and (a.startswith('TOTAL') or 'calculé' in a or a.startswith('Contrôle')):
        for c in range(1, 9):
            cl = P.cell(row=lab_row, column=c)
            f = cl.font
            cl.font = Font(name='Calibri', size=f.size or 10, bold=True, italic=f.italic, color=f.color)
            cl.border = B_TOP
# scénario actif : B2 input
P['B2'].font = Font(name='Calibri', size=11, bold=True, color='0000FF'); P['B2'].fill = FILL_I
P['A2'].font = Font(name='Calibri', size=10, bold=True)
P['A3'].font = Font(name='Calibri', size=10)
P['B3'].font = Font(name='Calibri', size=11, bold=True, color='000000')
for col, w in {'A': 62, 'B': 14, 'C': 22, 'D': 15, 'E': 70, 'F': 12, 'G': 12, 'H': 12}.items():
    P.column_dimensions[col].width = w
P.freeze_panes = 'A4'
P.sheet_view.showGridLines = False

# --- autres onglets : uniformisation générique
MONTHLY = {'Plan ventes', 'Contribution', 'P&L', 'Bilan', 'Tresorerie', 'KPI', 'Base graphique', 'Financement'}
for ws in wb.worksheets:
    if ws.title == 'Parametres':
        continue
    lastc = min(ws.max_column, 40)
    # capture du gras existant
    boldmap = {}
    for row in ws.iter_rows():
        for c in row:
            if c.value is not None:
                boldmap[(c.row, c.column)] = bool(c.font.bold)
    # titre ligne 1
    for c in range(1, lastc+1):
        cl = ws.cell(row=1, column=c); cl.font = F_TITLE; cl.fill = FILL_T
    ws.row_dimensions[1].height = 22
    # style générique
    for row in ws.iter_rows(min_row=2):
        vals = [c for c in row if c.value is not None]
        if not vals:
            continue
        a = ws.cell(row=row[0].row, column=1).value
        # section = texte en col A seul, commençant par majuscule accentuée / bloc
        is_section = (len(vals) == 1 and vals[0].column == 1 and isinstance(a, str)
                      and not a.startswith('=') and a[:1].isalpha()
                      and a == a.upper() and len(a) > 3)
        if is_section:
            for c in range(1, lastc+1):
                cl = ws.cell(row=row[0].row, column=c); cl.font = F_SEC; cl.fill = FILL_S
            continue
        for c in vals:
            bold = boldmap.get((c.row, c.column), False)
            if ws.title == 'Scenarios' and c.column in (2, 3, 4) and isinstance(c.value, (int, float)) and c.row >= 4:
                c.font = Font(name='Calibri', size=10, color='0000FF'); c.fill = FILL_I
            else:
                c.font = font_for(c, bold)
                if c.fill.fill_type == 'solid':
                    c.fill = PatternFill()
        # ligne d'en-tête Année / Mois
        if isinstance(a, str) and a in ('Année', 'Mois', 'Segment', 'Multiplicateur', 'Immobilisation', 'Libellé', 'Équipement'):
            for c in range(1, lastc+1):
                cl = ws.cell(row=row[0].row, column=c); cl.font = F_HDR; cl.fill = FILL_H
    # formats monétaires : parenthèses pour les négatifs
    if ws.title in MONTHLY:
        for row in ws.iter_rows():
            for c in row:
                if c.number_format in ('#,##0', '#,##0;\\(#,##0\\);"-"'):
                    c.number_format = '#,##0;(#,##0)'
    ws.sheet_view.showGridLines = False

# volets figés cohérents
wb['Plan ventes'].freeze_panes = 'B4'
wb['Contribution'].freeze_panes = 'B4'
wb['P&L'].freeze_panes = 'B4'
wb['KPI'].freeze_panes = 'B4'
wb['Bilan'].freeze_panes = 'C4'
wb['Tresorerie'].freeze_panes = 'C4'
wb['Financement'].freeze_panes = 'C16'
wb['Base graphique'].freeze_panes = 'B3'
wb['Dashboard'].freeze_panes = 'A3'
wb['Scenarios'].freeze_panes = None
wb['Lisez-moi'].freeze_panes = None

# Dashboard : format des cellules numériques restées en General
DD = wb['Dashboard']
DD.column_dimensions['B'].width = 18
for r in range(2, DD.max_row+1):
    cl = DD[f'B{r}']
    if cl.value is not None and cl.number_format == 'General' and isinstance(cl.value, str) and cl.value.startswith('='):
        lab = str(DD[f'A{r}'].value or '')
        if any(k in lab.lower() for k in ('seuil', 'trésorerie', 'apport', 'emprunt', 'investissement', 'écart', 'contrôle')):
            cl.number_format = '#,##0" Ar"'

# Lisez-moi : largeur + retour à la ligne
LM.column_dimensions['A'].width = 120
for row in LM.iter_rows(min_col=1, max_col=1):
    c = row[0]
    if c.value is not None and c.row > 1:
        c.alignment = Alignment(wrap_text=True, vertical='top')

# ---------------------------------------------------------------- graphiques Dashboard
BG = wb['Base graphique']
def make_chart(title, rows, anchor):
    ch = LineChart()
    ch.title = title
    ch.style = 2
    ch.y_axis.title = 'MGA'
    ch.x_axis.title = 'Mois'
    ch.height = 7.9
    ch.width = 15.2
    cats = Reference(BG, min_col=2, max_col=37, min_row=2, max_row=2)
    for r in rows:
        ref = Reference(BG, min_col=2, max_col=37, min_row=r, max_row=r)
        s = Series(ref, title_from_data=False)
        s.tx = openpyxl.chart.series.SeriesLabel(strRef=openpyxl.chart.data_source.StrRef(f"'Base graphique'!$A${r}"))
        ch.series.append(s)
    ch.set_categories(cats)
    DD.add_chart(ch, anchor)
# NB : openpyxl 3.0.7 préserve les 4 graphiques existants du Dashboard — aucune recréation nécessaire.

# ---------------------------------------------------------------- contrôle final des références
bad = []
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if isinstance(c.value, str) and c.value.startswith('='):
                for m in ref_pat.finditer(c.value):
                    if int(m.group(1)) > LAST_ROW:
                        bad.append((ws.title, c.coordinate, c.value))
assert not bad, bad[:5]

wb.active = wb.sheetnames.index('Dashboard')
wb.save(OUT)
print('saved. LAST_ROW =', LAST_ROW)
print('rowmap sample:', {k: rowmap[k] for k in sorted(rowmap) if k in (52, 85, 87, 104, 111, 148, 150)})
