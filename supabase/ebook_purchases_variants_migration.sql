-- Ajout des colonnes nécessaires pour les ebooks à variantes (VMA + séances/semaine).
-- Utilisé pour le moment par l'ebook "10km-8sem" : permet de savoir quel PDF
-- (parmi les 116 générés dans public/ebooks/10km-8sem/) attacher à l'email d'achat.
ALTER TABLE ebook_purchases ADD COLUMN IF NOT EXISTS vma NUMERIC;
ALTER TABLE ebook_purchases ADD COLUMN IF NOT EXISTS seances_semaine SMALLINT;
