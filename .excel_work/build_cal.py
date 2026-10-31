# -*- coding: utf-8 -*-
import openpyxl
from openpyxl.styles import Font, Alignment
from openpyxl.utils import get_column_letter

PATH = '/Users/macbookair/Desktop/Etude Tairo/Excel base/Modele_Tairo_3_etats.xlsx'
OUT = '/Users/macbookair/Desktop/tairotairo/.excel_work/Modele_Tairo_3_etats_CAL.xlsx'
MONEY = '#,##0;(#,##0)'
C_GRAY = '595959'

wb = openpyxl.load_workbook(PATH)
P, F, LM = wb['Parametres'], wb['Financement'], wb['Lisez-moi']

# --- hypothèses
assert P['A113'].value == 'Apport en fonds propres' and P['A69'].value == 'Salaire fondateur'
assert P['A114'].value.startswith('Besoin de démarrage') and P['A118'].value.startswith("Durée de l'emprunt")
P['B113'] = 9000000
P['B69'] = 800000
P['B114'] = 12
P['B118'] = 60
P['E118'] = ("60 mois : l'emprunt court au-delà de l'horizon du modèle (36 mois). Le capital restant dû au mois 36 "
             "est affiché dans Financement (bloc Validation 3 ans) et au Bilan.")
P['E118'].font = Font(name='Calibri', size=9, italic=True, color=C_GRAY)
P['E118'].alignment = Alignment(wrap_text=True, vertical='top')
P['E114'] = ("N mois × (OPEX fixes mensuels du scénario + coûts variables du mois 1). 12 mois retenus pour que la trésorerie "
             "ne passe jamais sous 3 mois d'OPEX (validation Financement). Calcul basé sur les hypothèses, pas sur les flux M2–M12, "
             "pour éviter une référence circulaire avec le déclencheur d'embauche.")

# --- bloc Validation 3 ans : cible = trésorerie de sécurité (3 mois d'OPEX)
def setline(r, lab, formula, fmt=MONEY, bold=False, note=None):
    a = F.cell(row=r, column=1, value=lab); a.font = Font(name='Calibri', size=10, bold=bold)
    b = F.cell(row=r, column=2, value=formula); b.number_format = fmt
    b.font = Font(name='Calibri', size=10, bold=bold, color=('008000' if '!' in formula else '000000'))
    c = F.cell(row=r, column=3, value=note)
    c.font = Font(name='Calibri', size=9, italic=True, color=C_GRAY); c.alignment = Alignment(vertical='top')

assert F['A33'].value.startswith('VALIDATION 3 ANS')
F['A33'] = "VALIDATION 3 ANS — la trésorerie reste-t-elle au-dessus du matelas de sécurité (3 mois d'OPEX) sur M0–M36 ?"
setline(34, 'Pic de besoin cumulé de trésorerie AVANT financement (flux op. hors intérêts + CAPEX)', "=-MIN(B44:AL44)", bold=True,
        note="Point bas du cumul des flux (ligne 44) : montant à financer pour ne jamais être à zéro, hors coût de la dette.")
setline(35, "Financement minimal pour conserver le matelas de sécurité (pic + sécurité, hors service de la dette)", "=B34+B10")
setline(36, 'Trésorerie minimale sur 36 mois APRÈS financement et service de la dette', "=MIN(Tresorerie!D25:AM25)", bold=True)
setline(37, "Couverture du matelas de sécurité (cible = ligne 10)",
        '=IF(B36>=B10,"OK — trésorerie ≥ 3 mois d\'OPEX sur toute la période","INSUFFISANT — augmenter apport, mois financés ou durée")',
        fmt='General', bold=True)
setline(38, "Emprunt minimum indicatif pour atteindre la cible (itération suivante, hors intérêts additionnels)", "=B15+MAX(0,B10-B36)")
setline(39, 'Référence V2.3 — apport 36,7 M Ar calé à la main pour un plancher de 1 M', "=Parametres!$D$119")
setline(40, 'Écart référence 36,7 M vs financement minimal (positif = référence surdimensionnée)', "=B39-B35")
setline(41, 'Capital restant dû à la fin du mois 36 (emprunt plus long que l\'horizon du modèle)', "=AL31", bold=True,
        note="Nul si la durée ≤ 36 mois. Sinon, dette à rembourser après l'horizon : à lire avec la trésorerie M36.")
setline(42, 'Trésorerie fin M36 nette de la dette restante', "=Tresorerie!AM25-B41", bold=True)
# déplacer la ligne de cumul 42 -> 44
F.cell(row=44, column=1, value='Cumul flux opérationnels (hors intérêts) + CAPEX, avant financement — M0 (col. B) → M36 (col. AL)').font = \
    Font(name='Calibri', size=9, italic=True, color=C_GRAY)
for i in range(0, 37):
    L = get_column_letter(2 + i); T = get_column_letter(3 + i)
    flux = f"(SUM(Tresorerie!{T}6:{T}8)+Tresorerie!{T}10+Tresorerie!{T}15)"
    F[f'{L}44'] = f'={flux}' if i == 0 else f'={get_column_letter(1 + i)}44+{flux}'
    F[f'{L}44'].number_format = MONEY; F[f'{L}44'].font = Font(name='Calibri', size=9, color='008000')
F.cell(row=43, column=1).value = None

# --- Lisez-moi
LM['A37'] = ("— Financement : apport 9 M Ar (Parametres!B113) ; emprunt calculé automatiquement = besoin − apport, où besoin = CAPEX + 12 mois de charges "
             "(OPEX fixes + coûts variables M1) + 3 mois d'OPEX fixes en sécurité ; emprunt à 9 % sur 60 mois. Réglage calé pour que la trésorerie ne passe "
             "jamais sous 3 mois d'OPEX (Financement, bloc Validation 3 ans). L'ancien apport 36,7 M (V2.3) reste en référence (Parametres!B119).")
LM['A38'] = "— Salaire fondateur 800 k Ar/mois, collab 1 1 M Ar/mois. Collab 2 (400 k) : plus d'embauche automatique en M13, déclencheur trésorerie + EBITDA."
wb.save(OUT)
print('saved')
