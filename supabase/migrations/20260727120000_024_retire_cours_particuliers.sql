/*
# Retrait catégorie marketplace « Cours Particuliers »

Ampianaro couvre l’apprentissage ; la catégorie tutoring est retirée des
listes UI / Zod. Reclassement des lignes existantes vers « Informatique »
pour que édition et validation restent valides (colonne category = text).

Idempotent.
*/

UPDATE "Service"
SET category = 'Informatique'
WHERE category IN ('Cours Particuliers', 'Cours');

UPDATE "ServiceRequest"
SET category = 'Informatique'
WHERE category IN ('Cours Particuliers', 'Cours');
