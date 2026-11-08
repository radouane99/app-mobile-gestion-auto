# Service IA optionnel AutoCarnet

Le carnet, la lecture OCR et la recherche locale restent utilisables sans serveur. Ce serveur n’est pas encore hébergé : l’APK ne présente pas le chat connecté comme activé.

Prérequis d’exploitation : hébergement HTTPS, compte API avec facturation et modèle autorisé, plafond de dépense côté fournisseur. Définir `OPENAI_API_KEY`, `OPENAI_MODEL` (identifiant accessible au compte) et `AUTOCARNET_ACCESS_TOKEN` (secret aléatoire d’au moins 32 caractères) dans l’environnement du serveur, jamais dans le code ni dans l’APK. Démarrer `python assistant_server.py`. Il écoute uniquement sur `127.0.0.1:8080` ; un reverse proxy HTTPS doit exposer `/assistant`, limiter les tailles/délais et désactiver la journalisation du contenu et des en-têtes Authorization.

Dans l’APK → Assistant → Chat IA → Connexion : adresse `https://votre-domaine/assistant` et code personnel du service. Ne jamais y saisir la clé OpenAI. Les réglages restent privés au téléphone et hors ZIP. Envoyer une question est une action explicite ; joindre le résumé du carnet reste facultatif et son contenu est prévisualisable. Pas de photos, VIN, plaque, contacts, notes ou factures transmis automatiquement.

Le serveur filtre de nouveau le résumé, appelle Responses avec `store:false`, limite les réponses à 800 tokens et les appels à 10/minute, avec 4 appels simultanés au maximum. `store:false` désactive le stockage des réponses pour récupération ; il ne promet pas une absence de toute rétention fournisseur. Documentation : https://developers.openai.com/api/docs/guides/migrate-to-responses

Cette passerelle avec code d’accès convient à une instance privée / pilote. Pour une distribution publique : remplacer le code partagé par des comptes et jetons révocables par utilisateur, ajouter quotas persistants par compte, supervision, rotation des secrets et politique de confidentialité. Ne pas distribuer un même secret dans une version publique de l’APK. Aucun déploiement ni appel facturé n’a été effectué dans cette tâche.
