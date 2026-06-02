-- Vide l'historique réservations, demandes et données liées (conserve User, Service, auth, push)

DELETE FROM "Message";
DELETE FROM "Conversation";
DELETE FROM "Review";
DELETE FROM "Transaction";
DELETE FROM "Booking";
DELETE FROM "RequestResponse";
DELETE FROM "ServiceRequest";
DELETE FROM "Notification";
