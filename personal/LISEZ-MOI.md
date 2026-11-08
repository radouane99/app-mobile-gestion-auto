# AutoCarnet Radouane — édition personnelle

APK privée : dist/AutoCarnet-Radouane.apk. Package indépendant : ma.autocarnet.radouane ; label AutoCarnet Radouane ; version 3.0-Radouane.2. Installation côte à côte avec la version publique, sans accès ni remplacement de son stockage. Le seed n’est appliqué que si le stockage de l’édition personnelle est vide ; une mise à jour ne réinitialise pas le carnet.

Profil : Dacia Logan Phase 2 Prestige, 2021, Diesel 1.5 dCi, manuelle 5 rapports + marche arrière, usage principalement ville. Puissance réelle non confirmée. Lecture photographiée et confirmée : 64 084 km, 29/10/2026. Compteur à l’achat déclaré : 62 500 km ; date d’achat confirmée : 30/09/2026.

12 interventions du précédent propriétaire sont conservées hors du tableau des paiements. Aucun prix n’est inventé ; elles ne participent ni aux budgets ni aux rappels ni à la consommation. Les trois photos fournies sont stockées comme preuves et incluses dans les sauvegardes ZIP. Les archives peuvent être corrigées sans créer de dépense.

Corrections apportées par le propriétaire : 28/04/2024 ; huile 5W30 selon son indication ; entretien supplémentaire du 28/09/2026, Total 5W30 + filtre à huile uniquement après immobilisation prolongée. Prix et compteur de cette dernière intervention inconnus. Le relevé raturé semblant indiquer 20 000 km reste marqué à confirmer ; aucune date n’est inventée pour les cinq premières lignes.

Build : build-personal.ps1 prépare un répertoire indépendant sous build/personal-radouane, modifie le namespace, le provider caméra, le label et applique uniquement les overlays personnels. Le build public et dist/AutoCarnet.apk ne sont pas modifiés. La copie dist/AutoCarnet-public-3.0.apk reste identique à la version générale, sans photos ni seed personnels.

Tests : personal/ui-personal-test.cjs vérifie profil, corrections, photos, assistant local, exclusions financières, édition des archives et nouveau paiement. PersonalStoreTest valide l’import, la sauvegarde et la restauration de toutes les archives et photos. Package et signature APK vérifiés. Installation physique sur téléphone non réalisée ici.

Correction Radouane.2 : date d’achat confirmée au 30/09/2026. Migration unique des installations personnelles existantes si la date manque, sans réinitialiser les opérations, photos ou archives. Aucun paiement ni relevé supplémentaire créé.
