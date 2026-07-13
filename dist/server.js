"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// app/lib/database-url.ts
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL est manquant. Copiez .env.example vers .env et configurez la connexion PostgreSQL."
    );
  }
  return url;
}
function validateDatabaseUrl(url = getDatabaseUrl()) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "DATABASE_URL est invalide. Format attendu : postgresql://user:password@localhost:5432/nom_db"
    );
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`DATABASE_URL doit utiliser le protocole postgresql:// (re\xE7u : ${parsed.protocol})`);
  }
  const hostname2 = parsed.hostname;
  if (!hostname2 || PLACEHOLDER_HOSTS.has(hostname2)) {
    throw new Error(
      `DATABASE_URL utilise un h\xF4te placeholder (\xAB ${hostname2} \xBB). Remplacez-le par localhost en d\xE9veloppement ou l'h\xF4te r\xE9el de votre base (ex. Supabase).`
    );
  }
  if (!parsed.pathname || parsed.pathname === "/") {
    throw new Error("DATABASE_URL doit inclure le nom de la base (ex. /ankino_db).");
  }
}
var PLACEHOLDER_HOSTS;
var init_database_url = __esm({
  "app/lib/database-url.ts"() {
    "use strict";
    PLACEHOLDER_HOSTS = /* @__PURE__ */ new Set(["host", "your-db-host", "your-db-host.example.com"]);
  }
});

// app/lib/jwt-secret.ts
function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "JWT_SECRET est manquant. Copiez .env.example vers .env et d\xE9finissez un secret al\xE9atoire d'au moins 32 caract\xE8res."
    );
  }
  return secret;
}
function validateJwtSecret(secret = getJwtSecret()) {
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET est trop court (${secret.length} caract\xE8res). Utilisez au moins ${MIN_JWT_SECRET_LENGTH} caract\xE8res al\xE9atoires.`
    );
  }
  if (PLACEHOLDER_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "JWT_SECRET utilise une valeur placeholder. Remplacez-la par un secret al\xE9atoire d'au moins 32 caract\xE8res."
    );
  }
}
var PLACEHOLDER_SECRETS, MIN_JWT_SECRET_LENGTH;
var init_jwt_secret = __esm({
  "app/lib/jwt-secret.ts"() {
    "use strict";
    PLACEHOLDER_SECRETS = /* @__PURE__ */ new Set([
      "replace-with-a-long-random-secret-at-least-32-chars",
      "your-secret",
      "changeme",
      "secret"
    ]);
    MIN_JWT_SECRET_LENGTH = 32;
  }
});

// app/generated/prisma/internal/class.ts
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("node:buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}
var runtime, config;
var init_class = __esm({
  "app/generated/prisma/internal/class.ts"() {
    "use strict";
    runtime = __toESM(require("@prisma/client/runtime/client"));
    config = {
      "previewFeatures": [],
      "clientVersion": "7.8.0",
      "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
      "activeProvider": "postgresql",
      "inlineSchema": `generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
  url      = env("DATABASE_URL")
}

datasource db {
  provider = "postgresql"
}

model User {
  id                   String    @id @default(cuid())
  name                 String
  email                String    @unique
  password             String
  phone                String?
  role                 Role      @default(CLIENT)
  avatar               String?
  bio                  String?
  emailVerified        Boolean   @default(false)
  emailVerifiedAt      DateTime?
  notifyEmail          Boolean   @default(true)
  notifyPush           Boolean   @default(true)
  kycStatus            KycStatus @default(NOT_STARTED)
  kycSubmittedAt       DateTime?
  featuredOnHomepage   Boolean   @default(false)
  featuredOnHomepageAt DateTime?
  suspendedAt          DateTime?
  failedLoginAttempts  Int       @default(0)
  loginLockedAt        DateTime?
  tokenVersion         Int       @default(0)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  providerSubscription    ProviderSubscription?
  subscriptionPayments    ProviderSubscriptionPayment[]
  kycDocuments            ProviderKycDocument[]
  emailOtps               EmailOtp[]
  passwordResetTokens     PasswordResetToken[]
  notifications           Notification[]
  pushSubscriptions       PushSubscription[]
  services                Service[]
  serviceRequests         ServiceRequest[]
  requestResponses        RequestResponse[]             @relation("ProviderResponses")
  bookingsAsClient        Booking[]                     @relation("ClientBookings")
  bookingsAsProvider      Booking[]                     @relation("ProviderBookings")
  reviewsGiven            Review[]                      @relation("ReviewsGiven")
  reviewsReceived         Review[]                      @relation("ReviewsReceived")
  messagesSent            Message[]
  conversationsAsClient   Conversation[]                @relation("ClientConversations")
  conversationsAsProvider Conversation[]                @relation("ProviderConversations")
  portfolioItems          ProviderPortfolioItem[]
  portfolioComments       PortfolioItemComment[]        @relation("PortfolioComments")
  providerPayouts         ProviderPayout[]

  @@index([role])
  @@index([kycStatus])
  @@index([featuredOnHomepage])
}

enum Role {
  CLIENT
  PROVIDER
  ADMIN
}

enum KycStatus {
  NOT_STARTED
  PENDING
  APPROVED
}

enum KycDocumentType {
  CIN
}

model ProviderSubscription {
  id         String   @id @default(cuid())
  providerId String   @unique
  startsAt   DateTime @default(now())
  expiresAt  DateTime
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  provider User @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
}

enum SubscriptionPaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

model ProviderSubscriptionPayment {
  id            String                    @id @default(cuid())
  providerId    String
  months        Int
  amount        Float
  currency      String                    @default("MGA")
  paymentMethod PaymentMethod
  phone         String
  status        SubscriptionPaymentStatus @default(PENDING)
  referenceId   String                    @unique
  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt

  provider User @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@index([providerId, createdAt])
}

model ProviderKycDocument {
  id           String          @id @default(cuid())
  userId       String
  type         KycDocumentType
  /// 1 ou 2 pour la CIN (recto/verso)
  cinSlot      Int             @default(0)
  storedName   String
  originalName String
  mimeType     String
  sizeBytes    Int
  createdAt    DateTime        @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, type, cinSlot])
  @@index([userId])
}

model Notification {
  id        String   @id @default(cuid())
  type      String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@index([userId, read, createdAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@index([userId])
}

model EmailOtp {
  id             String   @id @default(cuid())
  codeHash       String
  failedAttempts Int      @default(0)
  expiresAt      DateTime
  createdAt      DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@index([userId])
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  tokenHash String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@index([userId])
  @@index([tokenHash])
}

model Service {
  id                   String    @id @default(cuid())
  title                String
  description          String
  price                Float
  category             String
  location             String
  coverImageMime       String?
  available            Boolean   @default(true)
  featuredOnHomepage   Boolean   @default(false)
  featuredOnHomepageAt DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  provider    User      @relation(fields: [providerId], references: [id])
  providerId  String
  bookings    Booking[]
  priceOffers Message[]

  @@index([providerId])
  @@index([category])
  @@index([available])
  @@index([featuredOnHomepage])
  @@index([createdAt])
}

model ServiceRequest {
  id               String    @id @default(cuid())
  title            String
  description      String
  budget           Float
  category         String
  location         String
  coverImageMime   String?
  desiredDate      DateTime?
  desiredSlotStart String?
  desiredSlotEnd   String?
  open             Boolean   @default(true)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  client    User              @relation(fields: [clientId], references: [id])
  clientId  String
  responses RequestResponse[]

  @@index([clientId])
  @@index([category])
  @@index([open])
  @@index([createdAt])
}

enum RequestResponseStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
  COMPLETED
}

model RequestResponse {
  id            String                @id @default(cuid())
  message       String
  proposedPrice Float?
  status        RequestResponseStatus @default(PENDING)
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt

  request     ServiceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  requestId   String
  provider    User           @relation("ProviderResponses", fields: [providerId], references: [id])
  providerId  String
  booking     Booking?
  priceOffers Message[]

  @@unique([requestId, providerId])
  @@index([requestId])
  @@index([providerId])
  @@index([status])
}

model Booking {
  id        String        @id @default(cuid())
  status    BookingStatus @default(PENDING)
  /// Null si le client n'a pas encore fix\xE9 de date de prestation.
  date      DateTime?
  slotStart String?
  slotEnd   String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  /// Copie fig\xE9e pour l\u2019affichage si le service ou la demande est supprim\xE9
  displayTitle    String?
  displayPrice    Float?
  displayCategory String?
  displayLocation String?
  displaySource   String?
  displayTargetId String?

  client            User             @relation("ClientBookings", fields: [clientId], references: [id])
  clientId          String
  provider          User             @relation("ProviderBookings", fields: [providerId], references: [id])
  providerId        String
  service           Service?         @relation(fields: [serviceId], references: [id])
  serviceId         String?
  requestResponse   RequestResponse? @relation(fields: [requestResponseId], references: [id])
  requestResponseId String?          @unique
  transaction       Transaction?
  review            Review?

  @@index([clientId])
  @@index([providerId])
  @@index([serviceId])
  @@index([status])
  @@index([date])
  @@index([clientId, updatedAt])
  @@index([providerId, updatedAt])
}

model Conversation {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  client     User      @relation("ClientConversations", fields: [clientId], references: [id])
  clientId   String
  provider   User      @relation("ProviderConversations", fields: [providerId], references: [id])
  providerId String
  messages   Message[]

  @@unique([clientId, providerId])
  @@index([updatedAt])
  @@index([clientId])
  @@index([providerId])
}

enum MessageKind {
  TEXT
  PRICE_OFFER
}

enum PriceOfferStatus {
  PENDING
  ACCEPTED
  SUPERSEDED
}

model Message {
  id          String            @id @default(cuid())
  body        String
  kind        MessageKind       @default(TEXT)
  offerPrice  Float?
  offerStatus PriceOfferStatus?
  readAt      DateTime?
  createdAt   DateTime          @default(now())

  conversation      Conversation     @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId    String
  sender            User             @relation(fields: [senderId], references: [id])
  senderId          String
  requestResponse   RequestResponse? @relation(fields: [requestResponseId], references: [id], onDelete: SetNull)
  requestResponseId String?
  service           Service?         @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  serviceId         String?

  @@index([conversationId, createdAt])
  @@index([requestResponseId, offerStatus])
  @@index([serviceId, offerStatus])
}

enum BookingStatus {
  PENDING
  CONFIRMED
  PAID
  IN_PROGRESS
  DONE_PENDING_VALIDATION
  COMPLETED
  CANCELLED
}

model Transaction {
  id            String            @id @default(cuid())
  amount        Float
  currency      String            @default("MGA")
  status        TransactionStatus @default(PENDING)
  paymentMethod PaymentMethod
  referenceId   String?
  /// Date \xE0 laquelle le paiement client a \xE9t\xE9 captur\xE9 et mis sous s\xE9questre.
  escrowedAt    DateTime?
  /// Date \xE0 laquelle les fonds ont \xE9t\xE9 d\xE9bloqu\xE9s vers le prestataire.
  releasedAt    DateTime?
  /// Date \xE0 laquelle le paiement a \xE9t\xE9 rembours\xE9 au client (annulation).
  refundedAt    DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  booking   Booking         @relation(fields: [bookingId], references: [id])
  bookingId String          @unique
  payout    ProviderPayout?

  @@index([status])
}

enum TransactionStatus {
  PENDING
  ESCROWED
  RELEASED
  REFUNDED
  FAILED
}

/// Enregistre le versement des fonds s\xE9questr\xE9s vers le compte du prestataire.
/// Le prestataire de Mobile Money r\xE9el sera branch\xE9 plus tard ; ce mod\xE8le
/// trace pour l'instant le solde et l'historique des versements.
model ProviderPayout {
  id            String       @id @default(cuid())
  provider      User         @relation(fields: [providerId], references: [id])
  providerId    String
  transaction   Transaction  @relation(fields: [transactionId], references: [id])
  transactionId String       @unique
  amount        Float
  currency      String       @default("MGA")
  status        PayoutStatus @default(PENDING)
  reference     String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([providerId])
  @@index([status])
}

enum PayoutStatus {
  PENDING
  PAID
  FAILED
}

enum PaymentMethod {
  ORANGE_MONEY
  MVOLA
  AIRTEL_MONEY
}

model ProviderPortfolioItem {
  id          String   @id @default(cuid())
  providerId  String
  description String
  storedName  String
  mimeType    String
  sizeBytes   Int
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  provider User                   @relation(fields: [providerId], references: [id], onDelete: Cascade)
  comments PortfolioItemComment[]

  @@index([providerId, sortOrder])
}

model PortfolioItemComment {
  id        String   @id @default(cuid())
  itemId    String
  authorId  String
  body      String
  createdAt DateTime @default(now())

  item   ProviderPortfolioItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  author User                  @relation("PortfolioComments", fields: [authorId], references: [id], onDelete: Cascade)

  @@index([itemId, createdAt])
}

model Review {
  id        String   @id @default(cuid())
  rating    Int
  comment   String?
  createdAt DateTime @default(now())

  author    User    @relation("ReviewsGiven", fields: [authorId], references: [id])
  authorId  String
  target    User    @relation("ReviewsReceived", fields: [targetId], references: [id])
  targetId  String
  booking   Booking @relation(fields: [bookingId], references: [id])
  bookingId String  @unique

  @@index([targetId])
  @@index([authorId])
}
`,
      "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
      },
      "parameterizationSchema": {
        "strings": [],
        "graph": ""
      }
    };
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"emailVerifiedAt","kind":"scalar","type":"DateTime"},{"name":"notifyEmail","kind":"scalar","type":"Boolean"},{"name":"notifyPush","kind":"scalar","type":"Boolean"},{"name":"kycStatus","kind":"enum","type":"KycStatus"},{"name":"kycSubmittedAt","kind":"scalar","type":"DateTime"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"suspendedAt","kind":"scalar","type":"DateTime"},{"name":"failedLoginAttempts","kind":"scalar","type":"Int"},{"name":"loginLockedAt","kind":"scalar","type":"DateTime"},{"name":"tokenVersion","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"providerSubscription","kind":"object","type":"ProviderSubscription","relationName":"ProviderSubscriptionToUser"},{"name":"subscriptionPayments","kind":"object","type":"ProviderSubscriptionPayment","relationName":"ProviderSubscriptionPaymentToUser"},{"name":"kycDocuments","kind":"object","type":"ProviderKycDocument","relationName":"ProviderKycDocumentToUser"},{"name":"emailOtps","kind":"object","type":"EmailOtp","relationName":"EmailOtpToUser"},{"name":"passwordResetTokens","kind":"object","type":"PasswordResetToken","relationName":"PasswordResetTokenToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"pushSubscriptions","kind":"object","type":"PushSubscription","relationName":"PushSubscriptionToUser"},{"name":"services","kind":"object","type":"Service","relationName":"ServiceToUser"},{"name":"serviceRequests","kind":"object","type":"ServiceRequest","relationName":"ServiceRequestToUser"},{"name":"requestResponses","kind":"object","type":"RequestResponse","relationName":"ProviderResponses"},{"name":"bookingsAsClient","kind":"object","type":"Booking","relationName":"ClientBookings"},{"name":"bookingsAsProvider","kind":"object","type":"Booking","relationName":"ProviderBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"ReviewsGiven"},{"name":"reviewsReceived","kind":"object","type":"Review","relationName":"ReviewsReceived"},{"name":"messagesSent","kind":"object","type":"Message","relationName":"MessageToUser"},{"name":"conversationsAsClient","kind":"object","type":"Conversation","relationName":"ClientConversations"},{"name":"conversationsAsProvider","kind":"object","type":"Conversation","relationName":"ProviderConversations"},{"name":"portfolioItems","kind":"object","type":"ProviderPortfolioItem","relationName":"ProviderPortfolioItemToUser"},{"name":"portfolioComments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioComments"},{"name":"providerPayouts","kind":"object","type":"ProviderPayout","relationName":"ProviderPayoutToUser"}],"dbName":null},"ProviderSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"startsAt","kind":"scalar","type":"DateTime"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionToUser"}],"dbName":null},"ProviderSubscriptionPayment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"months","kind":"scalar","type":"Int"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubscriptionPaymentStatus"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionPaymentToUser"}],"dbName":null},"ProviderKycDocument":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"KycDocumentType"},{"name":"cinSlot","kind":"scalar","type":"Int"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"originalName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ProviderKycDocumentToUser"}],"dbName":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"link","kind":"scalar","type":"String"},{"name":"read","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"PushSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"endpoint","kind":"scalar","type":"String"},{"name":"p256dh","kind":"scalar","type":"String"},{"name":"auth","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PushSubscriptionToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"EmailOtp":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"codeHash","kind":"scalar","type":"String"},{"name":"failedAttempts","kind":"scalar","type":"Int"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"EmailOtpToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"PasswordResetToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"usedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PasswordResetTokenToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"available","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ServiceToUser"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToService"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToService"}],"dbName":null},"ServiceRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"budget","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"desiredDate","kind":"scalar","type":"DateTime"},{"name":"desiredSlotStart","kind":"scalar","type":"String"},{"name":"desiredSlotEnd","kind":"scalar","type":"String"},{"name":"open","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ServiceRequestToUser"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"responses","kind":"object","type":"RequestResponse","relationName":"RequestResponseToServiceRequest"}],"dbName":null},"RequestResponse":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"proposedPrice","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"RequestResponseStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"request","kind":"object","type":"ServiceRequest","relationName":"RequestResponseToServiceRequest"},{"name":"requestId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderResponses"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToRequestResponse"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToRequestResponse"}],"dbName":null},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"slotStart","kind":"scalar","type":"String"},{"name":"slotEnd","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"displayTitle","kind":"scalar","type":"String"},{"name":"displayPrice","kind":"scalar","type":"Float"},{"name":"displayCategory","kind":"scalar","type":"String"},{"name":"displayLocation","kind":"scalar","type":"String"},{"name":"displaySource","kind":"scalar","type":"String"},{"name":"displayTargetId","kind":"scalar","type":"String"},{"name":"client","kind":"object","type":"User","relationName":"ClientBookings"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderBookings"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"BookingToService"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"BookingToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"Transaction","relationName":"BookingToTransaction"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":null},"Conversation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ClientConversations"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderConversations"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"messages","kind":"object","type":"Message","relationName":"ConversationToMessage"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"kind","kind":"enum","type":"MessageKind"},{"name":"offerPrice","kind":"scalar","type":"Float"},{"name":"offerStatus","kind":"enum","type":"PriceOfferStatus"},{"name":"readAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"conversation","kind":"object","type":"Conversation","relationName":"ConversationToMessage"},{"name":"conversationId","kind":"scalar","type":"String"},{"name":"sender","kind":"object","type":"User","relationName":"MessageToUser"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"MessageToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"MessageToService"},{"name":"serviceId","kind":"scalar","type":"String"}],"dbName":null},"Transaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TransactionStatus"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"escrowedAt","kind":"scalar","type":"DateTime"},{"name":"releasedAt","kind":"scalar","type":"DateTime"},{"name":"refundedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToTransaction"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"payout","kind":"object","type":"ProviderPayout","relationName":"ProviderPayoutToTransaction"}],"dbName":null},"ProviderPayout":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderPayoutToUser"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"Transaction","relationName":"ProviderPayoutToTransaction"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PayoutStatus"},{"name":"reference","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"ProviderPortfolioItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"sortOrder","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderPortfolioItemToUser"},{"name":"comments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioItemCommentToProviderPortfolioItem"}],"dbName":null},"PortfolioItemComment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"item","kind":"object","type":"ProviderPortfolioItem","relationName":"PortfolioItemCommentToProviderPortfolioItem"},{"name":"author","kind":"object","type":"User","relationName":"PortfolioComments"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"author","kind":"object","type":"User","relationName":"ReviewsGiven"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"target","kind":"object","type":"User","relationName":"ReviewsReceived"},{"name":"targetId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"bookingId","kind":"scalar","type":"String"}],"dbName":null}},"enums":{},"types":{}}');
    config.parameterizationSchema = {
      strings: JSON.parse('["where","provider","providerSubscription","orderBy","cursor","subscriptionPayments","user","kycDocuments","emailOtps","passwordResetTokens","notifications","pushSubscriptions","client","service","responses","_count","request","booking","messages","conversation","sender","requestResponse","priceOffers","transaction","payout","author","target","review","bookings","services","serviceRequests","requestResponses","bookingsAsClient","bookingsAsProvider","reviewsGiven","reviewsReceived","messagesSent","conversationsAsClient","conversationsAsProvider","item","comments","portfolioItems","portfolioComments","providerPayouts","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_avg","_sum","_min","_max","User.groupBy","User.aggregate","ProviderSubscription.findUnique","ProviderSubscription.findUniqueOrThrow","ProviderSubscription.findFirst","ProviderSubscription.findFirstOrThrow","ProviderSubscription.findMany","ProviderSubscription.createOne","ProviderSubscription.createMany","ProviderSubscription.createManyAndReturn","ProviderSubscription.updateOne","ProviderSubscription.updateMany","ProviderSubscription.updateManyAndReturn","ProviderSubscription.upsertOne","ProviderSubscription.deleteOne","ProviderSubscription.deleteMany","ProviderSubscription.groupBy","ProviderSubscription.aggregate","ProviderSubscriptionPayment.findUnique","ProviderSubscriptionPayment.findUniqueOrThrow","ProviderSubscriptionPayment.findFirst","ProviderSubscriptionPayment.findFirstOrThrow","ProviderSubscriptionPayment.findMany","ProviderSubscriptionPayment.createOne","ProviderSubscriptionPayment.createMany","ProviderSubscriptionPayment.createManyAndReturn","ProviderSubscriptionPayment.updateOne","ProviderSubscriptionPayment.updateMany","ProviderSubscriptionPayment.updateManyAndReturn","ProviderSubscriptionPayment.upsertOne","ProviderSubscriptionPayment.deleteOne","ProviderSubscriptionPayment.deleteMany","ProviderSubscriptionPayment.groupBy","ProviderSubscriptionPayment.aggregate","ProviderKycDocument.findUnique","ProviderKycDocument.findUniqueOrThrow","ProviderKycDocument.findFirst","ProviderKycDocument.findFirstOrThrow","ProviderKycDocument.findMany","ProviderKycDocument.createOne","ProviderKycDocument.createMany","ProviderKycDocument.createManyAndReturn","ProviderKycDocument.updateOne","ProviderKycDocument.updateMany","ProviderKycDocument.updateManyAndReturn","ProviderKycDocument.upsertOne","ProviderKycDocument.deleteOne","ProviderKycDocument.deleteMany","ProviderKycDocument.groupBy","ProviderKycDocument.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","PushSubscription.findUnique","PushSubscription.findUniqueOrThrow","PushSubscription.findFirst","PushSubscription.findFirstOrThrow","PushSubscription.findMany","PushSubscription.createOne","PushSubscription.createMany","PushSubscription.createManyAndReturn","PushSubscription.updateOne","PushSubscription.updateMany","PushSubscription.updateManyAndReturn","PushSubscription.upsertOne","PushSubscription.deleteOne","PushSubscription.deleteMany","PushSubscription.groupBy","PushSubscription.aggregate","EmailOtp.findUnique","EmailOtp.findUniqueOrThrow","EmailOtp.findFirst","EmailOtp.findFirstOrThrow","EmailOtp.findMany","EmailOtp.createOne","EmailOtp.createMany","EmailOtp.createManyAndReturn","EmailOtp.updateOne","EmailOtp.updateMany","EmailOtp.updateManyAndReturn","EmailOtp.upsertOne","EmailOtp.deleteOne","EmailOtp.deleteMany","EmailOtp.groupBy","EmailOtp.aggregate","PasswordResetToken.findUnique","PasswordResetToken.findUniqueOrThrow","PasswordResetToken.findFirst","PasswordResetToken.findFirstOrThrow","PasswordResetToken.findMany","PasswordResetToken.createOne","PasswordResetToken.createMany","PasswordResetToken.createManyAndReturn","PasswordResetToken.updateOne","PasswordResetToken.updateMany","PasswordResetToken.updateManyAndReturn","PasswordResetToken.upsertOne","PasswordResetToken.deleteOne","PasswordResetToken.deleteMany","PasswordResetToken.groupBy","PasswordResetToken.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","ServiceRequest.findUnique","ServiceRequest.findUniqueOrThrow","ServiceRequest.findFirst","ServiceRequest.findFirstOrThrow","ServiceRequest.findMany","ServiceRequest.createOne","ServiceRequest.createMany","ServiceRequest.createManyAndReturn","ServiceRequest.updateOne","ServiceRequest.updateMany","ServiceRequest.updateManyAndReturn","ServiceRequest.upsertOne","ServiceRequest.deleteOne","ServiceRequest.deleteMany","ServiceRequest.groupBy","ServiceRequest.aggregate","RequestResponse.findUnique","RequestResponse.findUniqueOrThrow","RequestResponse.findFirst","RequestResponse.findFirstOrThrow","RequestResponse.findMany","RequestResponse.createOne","RequestResponse.createMany","RequestResponse.createManyAndReturn","RequestResponse.updateOne","RequestResponse.updateMany","RequestResponse.updateManyAndReturn","RequestResponse.upsertOne","RequestResponse.deleteOne","RequestResponse.deleteMany","RequestResponse.groupBy","RequestResponse.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","Booking.groupBy","Booking.aggregate","Conversation.findUnique","Conversation.findUniqueOrThrow","Conversation.findFirst","Conversation.findFirstOrThrow","Conversation.findMany","Conversation.createOne","Conversation.createMany","Conversation.createManyAndReturn","Conversation.updateOne","Conversation.updateMany","Conversation.updateManyAndReturn","Conversation.upsertOne","Conversation.deleteOne","Conversation.deleteMany","Conversation.groupBy","Conversation.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Transaction.findUnique","Transaction.findUniqueOrThrow","Transaction.findFirst","Transaction.findFirstOrThrow","Transaction.findMany","Transaction.createOne","Transaction.createMany","Transaction.createManyAndReturn","Transaction.updateOne","Transaction.updateMany","Transaction.updateManyAndReturn","Transaction.upsertOne","Transaction.deleteOne","Transaction.deleteMany","Transaction.groupBy","Transaction.aggregate","ProviderPayout.findUnique","ProviderPayout.findUniqueOrThrow","ProviderPayout.findFirst","ProviderPayout.findFirstOrThrow","ProviderPayout.findMany","ProviderPayout.createOne","ProviderPayout.createMany","ProviderPayout.createManyAndReturn","ProviderPayout.updateOne","ProviderPayout.updateMany","ProviderPayout.updateManyAndReturn","ProviderPayout.upsertOne","ProviderPayout.deleteOne","ProviderPayout.deleteMany","ProviderPayout.groupBy","ProviderPayout.aggregate","ProviderPortfolioItem.findUnique","ProviderPortfolioItem.findUniqueOrThrow","ProviderPortfolioItem.findFirst","ProviderPortfolioItem.findFirstOrThrow","ProviderPortfolioItem.findMany","ProviderPortfolioItem.createOne","ProviderPortfolioItem.createMany","ProviderPortfolioItem.createManyAndReturn","ProviderPortfolioItem.updateOne","ProviderPortfolioItem.updateMany","ProviderPortfolioItem.updateManyAndReturn","ProviderPortfolioItem.upsertOne","ProviderPortfolioItem.deleteOne","ProviderPortfolioItem.deleteMany","ProviderPortfolioItem.groupBy","ProviderPortfolioItem.aggregate","PortfolioItemComment.findUnique","PortfolioItemComment.findUniqueOrThrow","PortfolioItemComment.findFirst","PortfolioItemComment.findFirstOrThrow","PortfolioItemComment.findMany","PortfolioItemComment.createOne","PortfolioItemComment.createMany","PortfolioItemComment.createManyAndReturn","PortfolioItemComment.updateOne","PortfolioItemComment.updateMany","PortfolioItemComment.updateManyAndReturn","PortfolioItemComment.upsertOne","PortfolioItemComment.deleteOne","PortfolioItemComment.deleteMany","PortfolioItemComment.groupBy","PortfolioItemComment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","AND","OR","NOT","id","rating","comment","createdAt","authorId","targetId","bookingId","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","itemId","body","providerId","description","storedName","mimeType","sizeBytes","sortOrder","updatedAt","transactionId","amount","currency","PayoutStatus","status","reference","TransactionStatus","PaymentMethod","paymentMethod","referenceId","escrowedAt","releasedAt","refundedAt","MessageKind","kind","offerPrice","PriceOfferStatus","offerStatus","readAt","conversationId","senderId","requestResponseId","serviceId","clientId","BookingStatus","date","slotStart","slotEnd","displayTitle","displayPrice","displayCategory","displayLocation","displaySource","displayTargetId","message","proposedPrice","RequestResponseStatus","requestId","title","budget","category","location","coverImageMime","desiredDate","desiredSlotStart","desiredSlotEnd","open","price","available","featuredOnHomepage","featuredOnHomepageAt","tokenHash","expiresAt","usedAt","userId","codeHash","failedAttempts","endpoint","p256dh","auth","type","link","read","KycDocumentType","cinSlot","originalName","months","phone","SubscriptionPaymentStatus","startsAt","notes","name","email","password","Role","role","avatar","bio","emailVerified","emailVerifiedAt","notifyEmail","notifyPush","KycStatus","kycStatus","kycSubmittedAt","suspendedAt","failedLoginAttempts","loginLockedAt","tokenVersion","every","some","none","clientId_providerId","requestId_providerId","userId_type_cinSlot","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
      graph: "hAu5AbACLQIAAP0EACAFAAD-BAAgBwAA_wQAIAgAAIAFACAJAACBBQAgCgAAggUAIAsAAIMFACAdAACEBQAgHgAAhQUAIB8AAIYFACAgAACHBQAgIQAAhwUAICIAAIgFACAjAACIBQAgJAAAiQUAICUAAIoFACAmAACKBQAgKQAAiwUAICoAAIwFACArAACNBQAg5AIAAPgEADDlAgAAcQAQ5gIAAPgEADDnAgEAAAAB6gJAAMcEACGBA0AAxwQAIbMDIAD6BAAhtANAAMYEACHFAwEAxQQAIckDAQDCBAAhygMBAAAAAcsDAQDCBAAhzQMAAPkEzQMizgMBAMUEACHPAwEAxQQAIdADIAD6BAAh0QNAAMYEACHSAyAA-gQAIdMDIAD6BAAh1QMAAPsE1QMi1gNAAMYEACHXA0AAxgQAIdgDAgD8BAAh2QNAAMYEACHaAwIA_AQAIQEAAAABACALAQAA8AQAIOQCAADvBAAw5QIAAAMAEOYCAADvBAAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACG2A0AAxwQAIccDQADHBAAhyAMBAMUEACEBAAAAAwAgDwEAAPAEACDkAgAAsAUAMOUCAAAFABDmAgAAsAUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhgwMIAMEEACGEAwEAwgQAIYYDAACxBccDIooDAADEBIoDIosDAQDCBAAhxAMCAPwEACHFAwEAwgQAIQEBAAC6BwAgDwEAAPAEACDkAgAAsAUAMOUCAAAFABDmAgAAsAUAMOcCAQAAAAHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGDAwgAwQQAIYQDAQDCBAAhhgMAALEFxwMiigMAAMQEigMiiwMBAAAAAcQDAgD8BAAhxQMBAMIEACEDAAAABQAgAwAABgAwBAAABwAgDQYAAPAEACDkAgAArgUAMOUCAAAJABDmAgAArgUAMOcCAQDCBAAh6gJAAMcEACH9AgEAwgQAIf4CAQDCBAAh_wICAPwEACG4AwEAwgQAIb4DAACvBcIDIsIDAgD8BAAhwwMBAMIEACEBBgAAugcAIA4GAADwBAAg5AIAAK4FADDlAgAACQAQ5gIAAK4FADDnAgEAAAAB6gJAAMcEACH9AgEAwgQAIf4CAQDCBAAh_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_AQAIekCAQDFBAAh6gJAAMcEACHrAgEAwgQAIewCAQDCBAAh7QIBAMIEACEBAAAAOgAgAwAAAC0AIAMAAC4AMAQAAC8AIAEAAAAhACABAAAALQAgEwwAAPAEACAOAACGBQAg5AIAAJcFADDlAgAAPwAQ5gIAAJcFADDnAgEAwgQAIeoCQADHBAAh_AIBAMIEACGBA0AAxwQAIZkDAQDCBAAhqAMBAMIEACGpAwgAwQQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIa0DQADGBAAhrgMBAMUEACGvAwEAxQQAIbADIAD6BAAhBgwAALoHACAOAADHCQAgrAMAALIFACCtAwAAsgUAIK4DAACyBQAgrwMAALIFACATDAAA8AQAIA4AAIYFACDkAgAAlwUAMOUCAAA_ABDmAgAAlwUAMOcCAQAAAAHqAkAAxwQAIfwCAQDCBAAhgQNAAMcEACGZAwEAwgQAIagDAQDCBAAhqQMIAMEEACGqAwEAwgQAIasDAQDCBAAhrAMBAMUEACGtA0AAxgQAIa4DAQDFBAAhrwMBAMUEACGwAyAA-gQAIQMAAAA_ACADAABAADAEAABBACADAAAAJgAgAwAAKAAwBAAAKQAgAwAAACEAIAMAACIAMAQAACMAIAMAAAAhACADAAAiADAEAAAjACAEEQAA-gUAIBkAALoHACAaAAC6BwAg6QIAALIFACANEQAAyAQAIBkAAPAEACAaAADwBAAg5AIAAJYFADDlAgAAOgAQ5gIAAJYFADDnAgEAAAAB6AICAPwEACHpAgEAxQQAIeoCQADHBAAh6wIBAMIEACHsAgEAwgQAIe0CAQAAAAEDAAAAOgAgAwAARgAwBAAARwAgAwAAADoAIAMAAEYAMAQAAEcAIAMAAAAtACADAAAuADAEAAAvACALAQAA8AQAIAwAAPAEACASAACJBQAg5AIAAJUFADDlAgAASwAQ5gIAAJUFADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIZkDAQDCBAAhAwEAALoHACAMAAC6BwAgEgAAygkAIAwBAADwBAAgDAAA8AQAIBIAAIkFACDkAgAAlQUAMOUCAABLABDmAgAAlQUAMOcCAQAAAAHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGZAwEAwgQAId4DAACUBQAgAwAAAEsAIAMAAEwAMAQAAE0AIAMAAABLACADAABMADAEAABNACAOAQAA8AQAICgAAIwFACDkAgAAkwUAMOUCAABQABDmAgAAkwUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAh_QIBAMIEACH-AgEAwgQAIf8CAgD8BAAhgAMCAPwEACGBA0AAxwQAIQIBAAC6BwAgKAAAzQkAIA4BAADwBAAgKAAAjAUAIOQCAACTBQAw5QIAAFAAEOYCAACTBQAw5wIBAAAAAeoCQADHBAAh-wIBAMIEACH8AgEAwgQAIf0CAQDCBAAh_gIBAMIEACH_AgIA_AQAIYADAgD8BAAhgQNAAMcEACEDAAAAUAAgAwAAUQAwBAAAUgAgChkAAPAEACAnAACSBQAg5AIAAJEFADDlAgAAVAAQ5gIAAJEFADDnAgEAwgQAIeoCQADHBAAh6wIBAMIEACH5AgEAwgQAIfoCAQDCBAAhAhkAALoHACAnAADQCQAgChkAAPAEACAnAACSBQAg5AIAAJEFADDlAgAAVAAQ5gIAAJEFADDnAgEAAAAB6gJAAMcEACHrAgEAwgQAIfkCAQDCBAAh-gIBAMIEACEDAAAAVAAgAwAAVQAwBAAAVgAgAQAAAFQAIAMAAABUACADAABVADAEAABWACADAQAAugcAIBcAAM8JACCHAwAAsgUAIA4BAADwBAAgFwAAkAUAIOQCAACOBQAw5QIAADgAEOYCAACOBQAw5wIBAAAAAeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYIDAQAAAAGDAwgAwQQAIYQDAQDCBAAhhgMAAI8FhgMihwMBAMUEACEDAAAAOAAgAwAAWgAwBAAAWwAgAQAAAAUAIAEAAAAJACABAAAADQAgAQAAABEAIAEAAAAVACABAAAAGQAgAQAAAB0AIAEAAAA_ACABAAAAJgAgAQAAACEAIAEAAAAhACABAAAAOgAgAQAAADoAIAEAAAAtACABAAAASwAgAQAAAEsAIAEAAABQACABAAAAVAAgAQAAADgAIAEAAAABACAtAgAA_QQAIAUAAP4EACAHAAD_BAAgCAAAgAUAIAkAAIEFACAKAACCBQAgCwAAgwUAIB0AAIQFACAeAACFBQAgHwAAhgUAICAAAIcFACAhAACHBQAgIgAAiAUAICMAAIgFACAkAACJBQAgJQAAigUAICYAAIoFACApAACLBQAgKgAAjAUAICsAAI0FACDkAgAA-AQAMOUCAABxABDmAgAA-AQAMOcCAQDCBAAh6gJAAMcEACGBA0AAxwQAIbMDIAD6BAAhtANAAMYEACHFAwEAxQQAIckDAQDCBAAhygMBAMIEACHLAwEAwgQAIc0DAAD5BM0DIs4DAQDFBAAhzwMBAMUEACHQAyAA-gQAIdEDQADGBAAh0gMgAPoEACHTAyAA-gQAIdUDAAD7BNUDItYDQADGBAAh1wNAAMYEACHYAwIA_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_QIBAAAAAf4CAQAAAAH_AgIAAAABuAMBAAAAAb4DAAAAwgMCwgMCAAAAAcMDAQAAAAEBMQAAugEAIAnnAgEAAAAB6gJAAAAAAf0CAQAAAAH-AgEAAAAB_wICAAAAAbgDAQAAAAG-AwAAAMIDAsIDAgAAAAHDAwEAAAABATEAALwBADABMQAAvAEAMAoGAACrBwAg5wIBALgFACHqAkAAuwUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIbgDAQC4BQAhvgMAAKoHwgMiwgMCALkFACHDAwEAuAUAIQIAAAALACAxAAC_AQAgCecCAQC4BQAh6gJAALsFACH9AgEAuAUAIf4CAQC4BQAh_wICALkFACG4AwEAuAUAIb4DAACqB8IDIsIDAgC5BQAhwwMBALgFACECAAAACQAgMQAAwQEAIAIAAAAJACAxAADBAQAgAwAAAAsAIDgAALoBACA5AAC_AQAgAQAAAAsAIAEAAAAJACAFDwAApQcAID4AAKYHACA_AACpBwAgQAAAqAcAIEEAAKcHACAM5AIAAOYEADDlAgAAyAEAEOYCAADmBAAw5wIBAKAEACHqAkAAowQAIf0CAQCgBAAh_gIBAKAEACH_AgIAoQQAIbgDAQCgBAAhvgMAAOcEwgMiwgMCAKEEACHDAwEAoAQAIQMAAAAJACADAADHAQAwPQAAyAEAIAMAAAAJACADAAAKADAEAAALACABAAAAFwAgAQAAABcAIAMAAAAVACADAAAWADAEAAAXACADAAAAFQAgAwAAFgAwBAAAFwAgAwAAABUAIAMAABYAMAQAABcAIAkGAACkBwAg5wIBAAAAAeoCQAAAAAH6AgEAAAABqAMBAAAAAbgDAQAAAAG-AwEAAAABvwMBAAAAAcADIAAAAAEBMQAA0AEAIAjnAgEAAAAB6gJAAAAAAfoCAQAAAAGoAwEAAAABuAMBAAAAAb4DAQAAAAG_AwEAAAABwAMgAAAAAQExAADSAQAwATEAANIBADAJBgAAowcAIOcCAQC4BQAh6gJAALsFACH6AgEAuAUAIagDAQC4BQAhuAMBALgFACG-AwEAuAUAIb8DAQC6BQAhwAMgAN4GACECAAAAFwAgMQAA1QEAIAjnAgEAuAUAIeoCQAC7BQAh-gIBALgFACGoAwEAuAUAIbgDAQC4BQAhvgMBALgFACG_AwEAugUAIcADIADeBgAhAgAAABUAIDEAANcBACACAAAAFQAgMQAA1wEAIAMAAAAXACA4AADQAQAgOQAA1QEAIAEAAAAXACABAAAAFQAgBA8AAKAHACBAAACiBwAgQQAAoQcAIL8DAACyBQAgC-QCAADlBAAw5QIAAN4BABDmAgAA5QQAMOcCAQCgBAAh6gJAAKMEACH6AgEAoAQAIagDAQCgBAAhuAMBAKAEACG-AwEAoAQAIb8DAQCiBAAhwAMgAN4EACEDAAAAFQAgAwAA3QEAMD0AAN4BACADAAAAFQAgAwAAFgAwBAAAFwAgAQAAABsAIAEAAAAbACADAAAAGQAgAwAAGgAwBAAAGwAgAwAAABkAIAMAABoAMAQAABsAIAMAAAAZACADAAAaADAEAAAbACAHBgAAnwcAIOcCAQAAAAHqAkAAAAABuAMBAAAAAbsDAQAAAAG8AwEAAAABvQMBAAAAAQExAADmAQAgBucCAQAAAAHqAkAAAAABuAMBAAAAAbsDAQAAAAG8AwEAAAABvQMBAAAAAQExAADoAQAwATEAAOgBADAHBgAAngcAIOcCAQC4BQAh6gJAALsFACG4AwEAuAUAIbsDAQC4BQAhvAMBALgFACG9AwEAuAUAIQIAAAAbACAxAADrAQAgBucCAQC4BQAh6gJAALsFACG4AwEAuAUAIbsDAQC4BQAhvAMBALgFACG9AwEAuAUAIQIAAAAZACAxAADtAQAgAgAAABkAIDEAAO0BACADAAAAGwAgOAAA5gEAIDkAAOsBACABAAAAGwAgAQAAABkAIAMPAACbBwAgQAAAnQcAIEEAAJwHACAJ5AIAAOQEADDlAgAA9AEAEOYCAADkBAAw5wIBAKAEACHqAkAAowQAIbgDAQCgBAAhuwMBAKAEACG8AwEAoAQAIb0DAQCgBAAhAwAAABkAIAMAAPMBADA9AAD0AQAgAwAAABkAIAMAABoAMAQAABsAIAEAAAAPACABAAAADwAgAwAAAA0AIAMAAA4AMAQAAA8AIAMAAAANACADAAAOADAEAAAPACADAAAADQAgAwAADgAwBAAADwAgBwYAAJoHACDnAgEAAAAB6gJAAAAAAbYDQAAAAAG4AwEAAAABuQMBAAAAAboDAgAAAAEBMQAA_AEAIAbnAgEAAAAB6gJAAAAAAbYDQAAAAAG4AwEAAAABuQMBAAAAAboDAgAAAAEBMQAA_gEAMAExAAD-AQAwBwYAAJkHACDnAgEAuAUAIeoCQAC7BQAhtgNAALsFACG4AwEAuAUAIbkDAQC4BQAhugMCALkFACECAAAADwAgMQAAgQIAIAbnAgEAuAUAIeoCQAC7BQAhtgNAALsFACG4AwEAuAUAIbkDAQC4BQAhugMCALkFACECAAAADQAgMQAAgwIAIAIAAAANACAxAACDAgAgAwAAAA8AIDgAAPwBACA5AACBAgAgAQAAAA8AIAEAAAANACAFDwAAlAcAID4AAJUHACA_AACYBwAgQAAAlwcAIEEAAJYHACAJ5AIAAOMEADDlAgAAigIAEOYCAADjBAAw5wIBAKAEACHqAkAAowQAIbYDQACjBAAhuAMBAKAEACG5AwEAoAQAIboDAgChBAAhAwAAAA0AIAMAAIkCADA9AACKAgAgAwAAAA0AIAMAAA4AMAQAAA8AIAEAAAATACABAAAAEwAgAwAAABEAIAMAABIAMAQAABMAIAMAAAARACADAAASADAEAAATACADAAAAEQAgAwAAEgAwBAAAEwAgBwYAAJMHACDnAgEAAAAB6gJAAAAAAbUDAQAAAAG2A0AAAAABtwNAAAAAAbgDAQAAAAEBMQAAkgIAIAbnAgEAAAAB6gJAAAAAAbUDAQAAAAG2A0AAAAABtwNAAAAAAbgDAQAAAAEBMQAAlAIAMAExAACUAgAwBwYAAJIHACDnAgEAuAUAIeoCQAC7BQAhtQMBALgFACG2A0AAuwUAIbcDQADwBQAhuAMBALgFACECAAAAEwAgMQAAlwIAIAbnAgEAuAUAIeoCQAC7BQAhtQMBALgFACG2A0AAuwUAIbcDQADwBQAhuAMBALgFACECAAAAEQAgMQAAmQIAIAIAAAARACAxAACZAgAgAwAAABMAIDgAAJICACA5AACXAgAgAQAAABMAIAEAAAARACAEDwAAjwcAIEAAAJEHACBBAACQBwAgtwMAALIFACAJ5AIAAOIEADDlAgAAoAIAEOYCAADiBAAw5wIBAKAEACHqAkAAowQAIbUDAQCgBAAhtgNAAKMEACG3A0AAuQQAIbgDAQCgBAAhAwAAABEAIAMAAJ8CADA9AACgAgAgAwAAABEAIAMAABIAMAQAABMAIAEAAAAfACABAAAAHwAgAwAAAB0AIAMAAB4AMAQAAB8AIAMAAAAdACADAAAeADAEAAAfACADAAAAHQAgAwAAHgAwBAAAHwAgEAEAAIwHACAWAACOBwAgHAAAjQcAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAfwCAQAAAAGBA0AAAAABqAMBAAAAAaoDAQAAAAGrAwEAAAABrAMBAAAAAbEDCAAAAAGyAyAAAAABswMgAAAAAbQDQAAAAAEBMQAAqAIAIA3nAgEAAAAB6gJAAAAAAfsCAQAAAAH8AgEAAAABgQNAAAAAAagDAQAAAAGqAwEAAAABqwMBAAAAAawDAQAAAAGxAwgAAAABsgMgAAAAAbMDIAAAAAG0A0AAAAABATEAAKoCADABMQAAqgIAMBABAAD0BgAgFgAA9gYAIBwAAPUGACDnAgEAuAUAIeoCQAC7BQAh-wIBALgFACH8AgEAuAUAIYEDQAC7BQAhqAMBALgFACGqAwEAuAUAIasDAQC4BQAhrAMBALoFACGxAwgA4wUAIbIDIADeBgAhswMgAN4GACG0A0AA8AUAIQIAAAAfACAxAACtAgAgDecCAQC4BQAh6gJAALsFACH7AgEAuAUAIfwCAQC4BQAhgQNAALsFACGoAwEAuAUAIaoDAQC4BQAhqwMBALgFACGsAwEAugUAIbEDCADjBQAhsgMgAN4GACGzAyAA3gYAIbQDQADwBQAhAgAAAB0AIDEAAK8CACACAAAAHQAgMQAArwIAIAMAAAAfACA4AACoAgAgOQAArQIAIAEAAAAfACABAAAAHQAgBw8AAO8GACA-AADwBgAgPwAA8wYAIEAAAPIGACBBAADxBgAgrAMAALIFACC0AwAAsgUAIBDkAgAA4QQAMOUCAAC2AgAQ5gIAAOEEADDnAgEAoAQAIeoCQACjBAAh-wIBAKAEACH8AgEAoAQAIYEDQACjBAAhqAMBAKAEACGqAwEAoAQAIasDAQCgBAAhrAMBAKIEACGxAwgAsQQAIbIDIADeBAAhswMgAN4EACG0A0AAuQQAIQMAAAAdACADAAC1AgAwPQAAtgIAIAMAAAAdACADAAAeADAEAAAfACABAAAAQQAgAQAAAEEAIAMAAAA_ACADAABAADAEAABBACADAAAAPwAgAwAAQAAwBAAAQQAgAwAAAD8AIAMAAEAAMAQAAEEAIBAMAADtBgAgDgAA7gYAIOcCAQAAAAHqAkAAAAAB_AIBAAAAAYEDQAAAAAGZAwEAAAABqAMBAAAAAakDCAAAAAGqAwEAAAABqwMBAAAAAawDAQAAAAGtA0AAAAABrgMBAAAAAa8DAQAAAAGwAyAAAAABATEAAL4CACAO5wIBAAAAAeoCQAAAAAH8AgEAAAABgQNAAAAAAZkDAQAAAAGoAwEAAAABqQMIAAAAAaoDAQAAAAGrAwEAAAABrAMBAAAAAa0DQAAAAAGuAwEAAAABrwMBAAAAAbADIAAAAAEBMQAAwAIAMAExAADAAgAwEAwAAN8GACAOAADgBgAg5wIBALgFACHqAkAAuwUAIfwCAQC4BQAhgQNAALsFACGZAwEAuAUAIagDAQC4BQAhqQMIAOMFACGqAwEAuAUAIasDAQC4BQAhrAMBALoFACGtA0AA8AUAIa4DAQC6BQAhrwMBALoFACGwAyAA3gYAIQIAAABBACAxAADDAgAgDucCAQC4BQAh6gJAALsFACH8AgEAuAUAIYEDQAC7BQAhmQMBALgFACGoAwEAuAUAIakDCADjBQAhqgMBALgFACGrAwEAuAUAIawDAQC6BQAhrQNAAPAFACGuAwEAugUAIa8DAQC6BQAhsAMgAN4GACECAAAAPwAgMQAAxQIAIAIAAAA_ACAxAADFAgAgAwAAAEEAIDgAAL4CACA5AADDAgAgAQAAAEEAIAEAAAA_ACAJDwAA2QYAID4AANoGACA_AADdBgAgQAAA3AYAIEEAANsGACCsAwAAsgUAIK0DAACyBQAgrgMAALIFACCvAwAAsgUAIBHkAgAA3QQAMOUCAADMAgAQ5gIAAN0EADDnAgEAoAQAIeoCQACjBAAh_AIBAKAEACGBA0AAowQAIZkDAQCgBAAhqAMBAKAEACGpAwgAsQQAIaoDAQCgBAAhqwMBAKAEACGsAwEAogQAIa0DQAC5BAAhrgMBAKIEACGvAwEAogQAIbADIADeBAAhAwAAAD8AIAMAAMsCADA9AADMAgAgAwAAAD8AIAMAAEAAMAQAAEEAIAEAAAApACABAAAAKQAgAwAAACYAIAMAACgAMAQAACkAIAMAAAAmACADAAAoADAEAAApACADAAAAJgAgAwAAKAAwBAAAKQAgDAEAANYGACAQAADVBgAgEQAA1wYAIBYAANgGACDnAgEAAAAB6gJAAAAAAfsCAQAAAAGBA0AAAAABhgMAAACnAwKkAwEAAAABpQMIAAAAAacDAQAAAAEBMQAA1AIAIAjnAgEAAAAB6gJAAAAAAfsCAQAAAAGBA0AAAAABhgMAAACnAwKkAwEAAAABpQMIAAAAAacDAQAAAAEBMQAA1gIAMAExAADWAgAwDAEAAMQGACAQAADDBgAgEQAAxQYAIBYAAMYGACDnAgEAuAUAIeoCQAC7BQAh-wIBALgFACGBA0AAuwUAIYYDAADCBqcDIqQDAQC4BQAhpQMIAIIGACGnAwEAuAUAIQIAAAApACAxAADZAgAgCOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIYEDQAC7BQAhhgMAAMIGpwMipAMBALgFACGlAwgAggYAIacDAQC4BQAhAgAAACYAIDEAANsCACACAAAAJgAgMQAA2wIAIAMAAAApACA4AADUAgAgOQAA2QIAIAEAAAApACABAAAAJgAgBg8AAL0GACA-AAC-BgAgPwAAwQYAIEAAAMAGACBBAAC_BgAgpQMAALIFACAL5AIAANkEADDlAgAA4gIAEOYCAADZBAAw5wIBAKAEACHqAkAAowQAIfsCAQCgBAAhgQNAAKMEACGGAwAA2gSnAyKkAwEAoAQAIaUDCADMBAAhpwMBAKAEACEDAAAAJgAgAwAA4QIAMD0AAOICACADAAAAJgAgAwAAKAAwBAAAKQAgAQAAACMAIAEAAAAjACADAAAAIQAgAwAAIgAwBAAAIwAgAwAAACEAIAMAACIAMAQAACMAIAMAAAAhACADAAAiADAEAAAjACAXAQAAuAYAIAwAALcGACANAAC5BgAgFQAAugYAIBcAALsGACAbAAC8BgAg5wIBAAAAAeoCQAAAAAH7AgEAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGZAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABATEAAOoCACAR5wIBAAAAAeoCQAAAAAH7AgEAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGZAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABATEAAOwCADABMQAA7AIAMAEAAAAdACABAAAAJgAgFwEAAKgGACAMAACnBgAgDQAAqQYAIBUAAKoGACAXAACrBgAgGwAArAYAIOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIYEDQAC7BQAhhgMAAKYGmwMilwMBALoFACGYAwEAugUAIZkDAQC4BQAhmwNAAPAFACGcAwEAugUAIZ0DAQC6BQAhngMBALoFACGfAwgAggYAIaADAQC6BQAhoQMBALoFACGiAwEAugUAIaMDAQC6BQAhAgAAACMAIDEAAPECACAR5wIBALgFACHqAkAAuwUAIfsCAQC4BQAhgQNAALsFACGGAwAApgabAyKXAwEAugUAIZgDAQC6BQAhmQMBALgFACGbA0AA8AUAIZwDAQC6BQAhnQMBALoFACGeAwEAugUAIZ8DCACCBgAhoAMBALoFACGhAwEAugUAIaIDAQC6BQAhowMBALoFACECAAAAIQAgMQAA8wIAIAIAAAAhACAxAADzAgAgAQAAAB0AIAEAAAAmACADAAAAIwAgOAAA6gIAIDkAAPECACABAAAAIwAgAQAAACEAIBAPAAChBgAgPgAAogYAID8AAKUGACBAAACkBgAgQQAAowYAIJcDAACyBQAgmAMAALIFACCbAwAAsgUAIJwDAACyBQAgnQMAALIFACCeAwAAsgUAIJ8DAACyBQAgoAMAALIFACChAwAAsgUAIKIDAACyBQAgowMAALIFACAU5AIAANUEADDlAgAA_AIAEOYCAADVBAAw5wIBAKAEACHqAkAAowQAIfsCAQCgBAAhgQNAAKMEACGGAwAA1gSbAyKXAwEAogQAIZgDAQCiBAAhmQMBAKAEACGbA0AAuQQAIZwDAQCiBAAhnQMBAKIEACGeAwEAogQAIZ8DCADMBAAhoAMBAKIEACGhAwEAogQAIaIDAQCiBAAhowMBAKIEACEDAAAAIQAgAwAA-wIAMD0AAPwCACADAAAAIQAgAwAAIgAwBAAAIwAgAQAAAE0AIAEAAABNACADAAAASwAgAwAATAAwBAAATQAgAwAAAEsAIAMAAEwAMAQAAE0AIAMAAABLACADAABMADAEAABNACAIAQAAnwYAIAwAAJ4GACASAACgBgAg5wIBAAAAAeoCQAAAAAH7AgEAAAABgQNAAAAAAZkDAQAAAAEBMQAAhAMAIAXnAgEAAAAB6gJAAAAAAfsCAQAAAAGBA0AAAAABmQMBAAAAAQExAACGAwAwATEAAIYDADAIAQAAkAYAIAwAAI8GACASAACRBgAg5wIBALgFACHqAkAAuwUAIfsCAQC4BQAhgQNAALsFACGZAwEAuAUAIQIAAABNACAxAACJAwAgBecCAQC4BQAh6gJAALsFACH7AgEAuAUAIYEDQAC7BQAhmQMBALgFACECAAAASwAgMQAAiwMAIAIAAABLACAxAACLAwAgAwAAAE0AIDgAAIQDACA5AACJAwAgAQAAAE0AIAEAAABLACADDwAAjAYAIEAAAI4GACBBAACNBgAgCOQCAADUBAAw5QIAAJIDABDmAgAA1AQAMOcCAQCgBAAh6gJAAKMEACH7AgEAoAQAIYEDQACjBAAhmQMBAKAEACEDAAAASwAgAwAAkQMAMD0AAJIDACADAAAASwAgAwAATAAwBAAATQAgAQAAAC8AIAEAAAAvACADAAAALQAgAwAALgAwBAAALwAgAwAAAC0AIAMAAC4AMAQAAC8AIAMAAAAtACADAAAuADAEAAAvACAPDQAAiwYAIBMAAIgGACAUAACJBgAgFQAAigYAIOcCAQAAAAHqAkAAAAAB-gIBAAAAAZADAAAAkAMCkQMIAAAAAZMDAAAAkwMDlANAAAAAAZUDAQAAAAGWAwEAAAABlwMBAAAAAZgDAQAAAAEBMQAAmgMAIAvnAgEAAAAB6gJAAAAAAfoCAQAAAAGQAwAAAJADApEDCAAAAAGTAwAAAJMDA5QDQAAAAAGVAwEAAAABlgMBAAAAAZcDAQAAAAGYAwEAAAABATEAAJwDADABMQAAnAMAMAEAAAAmACABAAAAHQAgDw0AAIcGACATAACEBgAgFAAAhQYAIBUAAIYGACDnAgEAuAUAIeoCQAC7BQAh-gIBALgFACGQAwAAgQaQAyKRAwgAggYAIZMDAACDBpMDI5QDQADwBQAhlQMBALgFACGWAwEAuAUAIZcDAQC6BQAhmAMBALoFACECAAAALwAgMQAAoQMAIAvnAgEAuAUAIeoCQAC7BQAh-gIBALgFACGQAwAAgQaQAyKRAwgAggYAIZMDAACDBpMDI5QDQADwBQAhlQMBALgFACGWAwEAuAUAIZcDAQC6BQAhmAMBALoFACECAAAALQAgMQAAowMAIAIAAAAtACAxAACjAwAgAQAAACYAIAEAAAAdACADAAAALwAgOAAAmgMAIDkAAKEDACABAAAALwAgAQAAAC0AIAoPAAD8BQAgPgAA_QUAID8AAIAGACBAAAD_BQAgQQAA_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-wIBAAAAAfwCAQAAAAH9AgEAAAAB_gIBAAAAAf8CAgAAAAGAAwIAAAABgQNAAAAAAQExAADiAwAgCecCAQAAAAHqAkAAAAAB-wIBAAAAAfwCAQAAAAH9AgEAAAAB_gIBAAAAAf8CAgAAAAGAAwIAAAABgQNAAAAAAQExAADkAwAwATEAAOQDADALAQAAzgUAICgAAM8FACDnAgEAuAUAIeoCQAC7BQAh-wIBALgFACH8AgEAuAUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIYADAgC5BQAhgQNAALsFACECAAAAUgAgMQAA5wMAIAnnAgEAuAUAIeoCQAC7BQAh-wIBALgFACH8AgEAuAUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIYADAgC5BQAhgQNAALsFACECAAAAUAAgMQAA6QMAIAIAAABQACAxAADpAwAgAwAAAFIAIDgAAOIDACA5AADnAwAgAQAAAFIAIAEAAABQACAFDwAAyQUAID4AAMoFACA_AADNBQAgQAAAzAUAIEEAAMsFACAM5AIAAK8EADDlAgAA8AMAEOYCAACvBAAw5wIBAKAEACHqAkAAowQAIfsCAQCgBAAh_AIBAKAEACH9AgEAoAQAIf4CAQCgBAAh_wICAKEEACGAAwIAoQQAIYEDQACjBAAhAwAAAFAAIAMAAO8DADA9AADwAwAgAwAAAFAAIAMAAFEAMAQAAFIAIAEAAABWACABAAAAVgAgAwAAAFQAIAMAAFUAMAQAAFYAIAMAAABUACADAABVADAEAABWACADAAAAVAAgAwAAVQAwBAAAVgAgBxkAAMgFACAnAADHBQAg5wIBAAAAAeoCQAAAAAHrAgEAAAAB-QIBAAAAAfoCAQAAAAEBMQAA-AMAIAXnAgEAAAAB6gJAAAAAAesCAQAAAAH5AgEAAAAB-gIBAAAAAQExAAD6AwAwATEAAPoDADAHGQAAxgUAICcAAMUFACDnAgEAuAUAIeoCQAC7BQAh6wIBALgFACH5AgEAuAUAIfoCAQC4BQAhAgAAAFYAIDEAAP0DACAF5wIBALgFACHqAkAAuwUAIesCAQC4BQAh-QIBALgFACH6AgEAuAUAIQIAAABUACAxAAD_AwAgAgAAAFQAIDEAAP8DACADAAAAVgAgOAAA-AMAIDkAAP0DACABAAAAVgAgAQAAAFQAIAMPAADCBQAgQAAAxAUAIEEAAMMFACAI5AIAAK4EADDlAgAAhgQAEOYCAACuBAAw5wIBAKAEACHqAkAAowQAIesCAQCgBAAh-QIBAKAEACH6AgEAoAQAIQMAAABUACADAACFBAAwPQAAhgQAIAMAAABUACADAABVADAEAABWACABAAAARwAgAQAAAEcAIAMAAAA6ACADAABGADAEAABHACADAAAAOgAgAwAARgAwBAAARwAgAwAAADoAIAMAAEYAMAQAAEcAIAoRAADBBQAgGQAAvwUAIBoAAMAFACDnAgEAAAAB6AICAAAAAekCAQAAAAHqAkAAAAAB6wIBAAAAAewCAQAAAAHtAgEAAAABATEAAI4EACAH5wIBAAAAAegCAgAAAAHpAgEAAAAB6gJAAAAAAesCAQAAAAHsAgEAAAAB7QIBAAAAAQExAACQBAAwATEAAJAEADAKEQAAvgUAIBkAALwFACAaAAC9BQAg5wIBALgFACHoAgIAuQUAIekCAQC6BQAh6gJAALsFACHrAgEAuAUAIewCAQC4BQAh7QIBALgFACECAAAARwAgMQAAkwQAIAfnAgEAuAUAIegCAgC5BQAh6QIBALoFACHqAkAAuwUAIesCAQC4BQAh7AIBALgFACHtAgEAuAUAIQIAAAA6ACAxAACVBAAgAgAAADoAIDEAAJUEACADAAAARwAgOAAAjgQAIDkAAJMEACABAAAARwAgAQAAADoAIAYPAACzBQAgPgAAtAUAID8AALcFACBAAAC2BQAgQQAAtQUAIOkCAACyBQAgCuQCAACfBAAw5QIAAJwEABDmAgAAnwQAMOcCAQCgBAAh6AICAKEEACHpAgEAogQAIeoCQACjBAAh6wIBAKAEACHsAgEAoAQAIe0CAQCgBAAhAwAAADoAIAMAAJsEADA9AACcBAAgAwAAADoAIAMAAEYAMAQAAEcAIArkAgAAnwQAMOUCAACcBAAQ5gIAAJ8EADDnAgEAoAQAIegCAgChBAAh6QIBAKIEACHqAkAAowQAIesCAQCgBAAh7AIBAKAEACHtAgEAoAQAIQ4PAAClBAAgQAAArQQAIEEAAK0EACDuAgEAAAAB7wIBAAAABPACAQAAAATxAgEAAAAB8gIBAAAAAfMCAQAAAAH0AgEAAAAB9QIBAKwEACH2AgEAAAAB9wIBAAAAAfgCAQAAAAENDwAApQQAID4AAKsEACA_AAClBAAgQAAApQQAIEEAAKUEACDuAgIAAAAB7wICAAAABPACAgAAAATxAgIAAAAB8gICAAAAAfMCAgAAAAH0AgIAAAAB9QICAKoEACEODwAAqAQAIEAAAKkEACBBAACpBAAg7gIBAAAAAe8CAQAAAAXwAgEAAAAF8QIBAAAAAfICAQAAAAHzAgEAAAAB9AIBAAAAAfUCAQCnBAAh9gIBAAAAAfcCAQAAAAH4AgEAAAABCw8AAKUEACBAAACmBAAgQQAApgQAIO4CQAAAAAHvAkAAAAAE8AJAAAAABPECQAAAAAHyAkAAAAAB8wJAAAAAAfQCQAAAAAH1AkAApAQAIQsPAAClBAAgQAAApgQAIEEAAKYEACDuAkAAAAAB7wJAAAAABPACQAAAAATxAkAAAAAB8gJAAAAAAfMCQAAAAAH0AkAAAAAB9QJAAKQEACEI7gICAAAAAe8CAgAAAATwAgIAAAAE8QICAAAAAfICAgAAAAHzAgIAAAAB9AICAAAAAfUCAgClBAAhCO4CQAAAAAHvAkAAAAAE8AJAAAAABPECQAAAAAHyAkAAAAAB8wJAAAAAAfQCQAAAAAH1AkAApgQAIQ4PAACoBAAgQAAAqQQAIEEAAKkEACDuAgEAAAAB7wIBAAAABfACAQAAAAXxAgEAAAAB8gIBAAAAAfMCAQAAAAH0AgEAAAAB9QIBAKcEACH2AgEAAAAB9wIBAAAAAfgCAQAAAAEI7gICAAAAAe8CAgAAAAXwAgIAAAAF8QICAAAAAfICAgAAAAHzAgIAAAAB9AICAAAAAfUCAgCoBAAhC-4CAQAAAAHvAgEAAAAF8AIBAAAABfECAQAAAAHyAgEAAAAB8wIBAAAAAfQCAQAAAAH1AgEAqQQAIfYCAQAAAAH3AgEAAAAB-AIBAAAAAQ0PAAClBAAgPgAAqwQAID8AAKUEACBAAAClBAAgQQAApQQAIO4CAgAAAAHvAgIAAAAE8AICAAAABPECAgAAAAHyAgIAAAAB8wICAAAAAfQCAgAAAAH1AgIAqgQAIQjuAggAAAAB7wIIAAAABPACCAAAAATxAggAAAAB8gIIAAAAAfMCCAAAAAH0AggAAAAB9QIIAKsEACEODwAApQQAIEAAAK0EACBBAACtBAAg7gIBAAAAAe8CAQAAAATwAgEAAAAE8QIBAAAAAfICAQAAAAHzAgEAAAAB9AIBAAAAAfUCAQCsBAAh9gIBAAAAAfcCAQAAAAH4AgEAAAABC-4CAQAAAAHvAgEAAAAE8AIBAAAABPECAQAAAAHyAgEAAAAB8wIBAAAAAfQCAQAAAAH1AgEArQQAIfYCAQAAAAH3AgEAAAAB-AIBAAAAAQjkAgAArgQAMOUCAACGBAAQ5gIAAK4EADDnAgEAoAQAIeoCQACjBAAh6wIBAKAEACH5AgEAoAQAIfoCAQCgBAAhDOQCAACvBAAw5QIAAPADABDmAgAArwQAMOcCAQCgBAAh6gJAAKMEACH7AgEAoAQAIfwCAQCgBAAh_QIBAKAEACH-AgEAoAQAIf8CAgChBAAhgAMCAKEEACGBA0AAowQAIQzkAgAAsAQAMOUCAADaAwAQ5gIAALAEADDnAgEAoAQAIeoCQACjBAAh-wIBAKAEACGBA0AAowQAIYIDAQCgBAAhgwMIALEEACGEAwEAoAQAIYYDAACyBIYDIocDAQCiBAAhDQ8AAKUEACA-AACrBAAgPwAAqwQAIEAAAKsEACBBAACrBAAg7gIIAAAAAe8CCAAAAATwAggAAAAE8QIIAAAAAfICCAAAAAHzAggAAAAB9AIIAAAAAfUCCAC1BAAhBw8AAKUEACBAAAC0BAAgQQAAtAQAIO4CAAAAhgMC7wIAAACGAwjwAgAAAIYDCPUCAACzBIYDIgcPAAClBAAgQAAAtAQAIEEAALQEACDuAgAAAIYDAu8CAAAAhgMI8AIAAACGAwj1AgAAswSGAyIE7gIAAACGAwLvAgAAAIYDCPACAAAAhgMI9QIAALQEhgMiDQ8AAKUEACA-AACrBAAgPwAAqwQAIEAAAKsEACBBAACrBAAg7gIIAAAAAe8CCAAAAATwAggAAAAE8QIIAAAAAfICCAAAAAHzAggAAAAB9AIIAAAAAfUCCAC1BAAhD-QCAAC2BAAw5QIAAMQDABDmAgAAtgQAMOcCAQCgBAAh6gJAAKMEACHtAgEAoAQAIYEDQACjBAAhgwMIALEEACGEAwEAoAQAIYYDAAC3BIkDIooDAAC4BIoDIosDAQCiBAAhjANAALkEACGNA0AAuQQAIY4DQAC5BAAhBw8AAKUEACBAAAC_BAAgQQAAvwQAIO4CAAAAiQMC7wIAAACJAwjwAgAAAIkDCPUCAAC-BIkDIgcPAAClBAAgQAAAvQQAIEEAAL0EACDuAgAAAIoDAu8CAAAAigMI8AIAAACKAwj1AgAAvASKAyILDwAAqAQAIEAAALsEACBBAAC7BAAg7gJAAAAAAe8CQAAAAAXwAkAAAAAF8QJAAAAAAfICQAAAAAHzAkAAAAAB9AJAAAAAAfUCQAC6BAAhCw8AAKgEACBAAAC7BAAgQQAAuwQAIO4CQAAAAAHvAkAAAAAF8AJAAAAABfECQAAAAAHyAkAAAAAB8wJAAAAAAfQCQAAAAAH1AkAAugQAIQjuAkAAAAAB7wJAAAAABfACQAAAAAXxAkAAAAAB8gJAAAAAAfMCQAAAAAH0AkAAAAAB9QJAALsEACEHDwAApQQAIEAAAL0EACBBAAC9BAAg7gIAAACKAwLvAgAAAIoDCPACAAAAigMI9QIAALwEigMiBO4CAAAAigMC7wIAAACKAwjwAgAAAIoDCPUCAAC9BIoDIgcPAAClBAAgQAAAvwQAIEEAAL8EACDuAgAAAIkDAu8CAAAAiQMI8AIAAACJAwj1AgAAvgSJAyIE7gIAAACJAwLvAgAAAIkDCPACAAAAiQMI9QIAAL8EiQMiEREAAMgEACAYAADJBAAg5AIAAMAEADDlAgAANgAQ5gIAAMAEADDnAgEAwgQAIeoCQADHBAAh7QIBAMIEACGBA0AAxwQAIYMDCADBBAAhhAMBAMIEACGGAwAAwwSJAyKKAwAAxASKAyKLAwEAxQQAIYwDQADGBAAhjQNAAMYEACGOA0AAxgQAIQjuAggAAAAB7wIIAAAABPACCAAAAATxAggAAAAB8gIIAAAAAfMCCAAAAAH0AggAAAAB9QIIAKsEACEL7gIBAAAAAe8CAQAAAATwAgEAAAAE8QIBAAAAAfICAQAAAAHzAgEAAAAB9AIBAAAAAfUCAQCtBAAh9gIBAAAAAfcCAQAAAAH4AgEAAAABBO4CAAAAiQMC7wIAAACJAwjwAgAAAIkDCPUCAAC_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_AIBAKAEACGBA0AAowQAIagDAQCgBAAhqgMBAKAEACGrAwEAoAQAIawDAQCiBAAhsQMIALEEACGyAyAA3gQAIbMDIADeBAAhtANAALkEACEJ5AIAAOIEADDlAgAAoAIAEOYCAADiBAAw5wIBAKAEACHqAkAAowQAIbUDAQCgBAAhtgNAAKMEACG3A0AAuQQAIbgDAQCgBAAhCeQCAADjBAAw5QIAAIoCABDmAgAA4wQAMOcCAQCgBAAh6gJAAKMEACG2A0AAowQAIbgDAQCgBAAhuQMBAKAEACG6AwIAoQQAIQnkAgAA5AQAMOUCAAD0AQAQ5gIAAOQEADDnAgEAoAQAIeoCQACjBAAhuAMBAKAEACG7AwEAoAQAIbwDAQCgBAAhvQMBAKAEACEL5AIAAOUEADDlAgAA3gEAEOYCAADlBAAw5wIBAKAEACHqAkAAowQAIfoCAQCgBAAhqAMBAKAEACG4AwEAoAQAIb4DAQCgBAAhvwMBAKIEACHAAyAA3gQAIQzkAgAA5gQAMOUCAADIAQAQ5gIAAOYEADDnAgEAoAQAIeoCQACjBAAh_QIBAKAEACH-AgEAoAQAIf8CAgChBAAhuAMBAKAEACG-AwAA5wTCAyLCAwIAoQQAIcMDAQCgBAAhBw8AAKUEACBAAADpBAAgQQAA6QQAIO4CAAAAwgMC7wIAAADCAwjwAgAAAMIDCPUCAADoBMIDIgcPAAClBAAgQAAA6QQAIEEAAOkEACDuAgAAAMIDAu8CAAAAwgMI8AIAAADCAwj1AgAA6ATCAyIE7gIAAADCAwLvAgAAAMIDCPACAAAAwgMI9QIAAOkEwgMiDuQCAADqBAAw5QIAALIBABDmAgAA6gQAMOcCAQCgBAAh6gJAAKMEACH7AgEAoAQAIYEDQACjBAAhgwMIALEEACGEAwEAoAQAIYYDAADrBMcDIooDAAC4BIoDIosDAQCgBAAhxAMCAKEEACHFAwEAoAQAIQcPAAClBAAgQAAA7QQAIEEAAO0EACDuAgAAAMcDAu8CAAAAxwMI8AIAAADHAwj1AgAA7ATHAyIHDwAApQQAIEAAAO0EACBBAADtBAAg7gIAAADHAwLvAgAAAMcDCPACAAAAxwMI9QIAAOwExwMiBO4CAAAAxwMC7wIAAADHAwjwAgAAAMcDCPUCAADtBMcDIgrkAgAA7gQAMOUCAACcAQAQ5gIAAO4EADDnAgEAoAQAIeoCQACjBAAh-wIBAKAEACGBA0AAowQAIbYDQACjBAAhxwNAAKMEACHIAwEAogQAIQsBAADwBAAg5AIAAO8EADDlAgAAAwAQ5gIAAO8EADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIbYDQADHBAAhxwNAAMcEACHIAwEAxQQAIS8CAAD9BAAgBQAA_gQAIAcAAP8EACAIAACABQAgCQAAgQUAIAoAAIIFACALAACDBQAgHQAAhAUAIB4AAIUFACAfAACGBQAgIAAAhwUAICEAAIcFACAiAACIBQAgIwAAiAUAICQAAIkFACAlAACKBQAgJgAAigUAICkAAIsFACAqAACMBQAgKwAAjQUAIOQCAAD4BAAw5QIAAHEAEOYCAAD4BAAw5wIBAMIEACHqAkAAxwQAIYEDQADHBAAhswMgAPoEACG0A0AAxgQAIcUDAQDFBAAhyQMBAMIEACHKAwEAwgQAIcsDAQDCBAAhzQMAAPkEzQMizgMBAMUEACHPAwEAxQQAIdADIAD6BAAh0QNAAMYEACHSAyAA-gQAIdMDIAD6BAAh1QMAAPsE1QMi1gNAAMYEACHXA0AAxgQAIdgDAgD8BAAh2QNAAMYEACHaAwIA_AQAIeEDAABxACDiAwAAcQAgGeQCAADxBAAw5QIAAIQBABDmAgAA8QQAMOcCAQCgBAAh6gJAAKMEACGBA0AAowQAIbMDIADeBAAhtANAALkEACHFAwEAogQAIckDAQCgBAAhygMBAKAEACHLAwEAoAQAIc0DAADyBM0DIs4DAQCiBAAhzwMBAKIEACHQAyAA3gQAIdEDQAC5BAAh0gMgAN4EACHTAyAA3gQAIdUDAADzBNUDItYDQAC5BAAh1wNAALkEACHYAwIAoQQAIdkDQAC5BAAh2gMCAKEEACEHDwAApQQAIEAAAPcEACBBAAD3BAAg7gIAAADNAwLvAgAAAM0DCPACAAAAzQMI9QIAAPYEzQMiBw8AAKUEACBAAAD1BAAgQQAA9QQAIO4CAAAA1QMC7wIAAADVAwjwAgAAANUDCPUCAAD0BNUDIgcPAAClBAAgQAAA9QQAIEEAAPUEACDuAgAAANUDAu8CAAAA1QMI8AIAAADVAwj1AgAA9ATVAyIE7gIAAADVAwLvAgAAANUDCPACAAAA1QMI9QIAAPUE1QMiBw8AAKUEACBAAAD3BAAgQQAA9wQAIO4CAAAAzQMC7wIAAADNAwjwAgAAAM0DCPUCAAD2BM0DIgTuAgAAAM0DAu8CAAAAzQMI8AIAAADNAwj1AgAA9wTNAyItAgAA_QQAIAUAAP4EACAHAAD_BAAgCAAAgAUAIAkAAIEFACAKAACCBQAgCwAAgwUAIB0AAIQFACAeAACFBQAgHwAAhgUAICAAAIcFACAhAACHBQAgIgAAiAUAICMAAIgFACAkAACJBQAgJQAAigUAICYAAIoFACApAACLBQAgKgAAjAUAICsAAI0FACDkAgAA-AQAMOUCAABxABDmAgAA-AQAMOcCAQDCBAAh6gJAAMcEACGBA0AAxwQAIbMDIAD6BAAhtANAAMYEACHFAwEAxQQAIckDAQDCBAAhygMBAMIEACHLAwEAwgQAIc0DAAD5BM0DIs4DAQDFBAAhzwMBAMUEACHQAyAA-gQAIdEDQADGBAAh0gMgAPoEACHTAyAA-gQAIdUDAAD7BNUDItYDQADGBAAh1wNAAMYEACHYAwIA_AQAIdkDQADGBAAh2gMCAPwEACEE7gIAAADNAwLvAgAAAM0DCPACAAAAzQMI9QIAAPcEzQMiAu4CIAAAAAH1AiAA4AQAIQTuAgAAANUDAu8CAAAA1QMI8AIAAADVAwj1AgAA9QTVAyII7gICAAAAAe8CAgAAAATwAgIAAAAE8QICAAAAAfICAgAAAAHzAgIAAAAB9AICAAAAAfUCAgClBAAhDQEAAPAEACDkAgAA7wQAMOUCAAADABDmAgAA7wQAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhtgNAAMcEACHHA0AAxwQAIcgDAQDFBAAh4QMAAAMAIOIDAAADACAD2wMAAAUAINwDAAAFACDdAwAABQAgA9sDAAAJACDcAwAACQAg3QMAAAkAIAPbAwAADQAg3AMAAA0AIN0DAAANACAD2wMAABEAINwDAAARACDdAwAAEQAgA9sDAAAVACDcAwAAFQAg3QMAABUAIAPbAwAAGQAg3AMAABkAIN0DAAAZACAD2wMAAB0AINwDAAAdACDdAwAAHQAgA9sDAAA_ACDcAwAAPwAg3QMAAD8AIAPbAwAAJgAg3AMAACYAIN0DAAAmACAD2wMAACEAINwDAAAhACDdAwAAIQAgA9sDAAA6ACDcAwAAOgAg3QMAADoAIAPbAwAALQAg3AMAAC0AIN0DAAAtACAD2wMAAEsAINwDAABLACDdAwAASwAgA9sDAABQACDcAwAAUAAg3QMAAFAAIAPbAwAAVAAg3AMAAFQAIN0DAABUACAD2wMAADgAINwDAAA4ACDdAwAAOAAgDgEAAPAEACAXAACQBQAg5AIAAI4FADDlAgAAOAAQ5gIAAI4FADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYIDAQDCBAAhgwMIAMEEACGEAwEAwgQAIYYDAACPBYYDIocDAQDFBAAhBO4CAAAAhgMC7wIAAACGAwjwAgAAAIYDCPUCAAC0BIYDIhMRAADIBAAgGAAAyQQAIOQCAADABAAw5QIAADYAEOYCAADABAAw5wIBAMIEACHqAkAAxwQAIe0CAQDCBAAhgQNAAMcEACGDAwgAwQQAIYQDAQDCBAAhhgMAAMMEiQMiigMAAMQEigMiiwMBAMUEACGMA0AAxgQAIY0DQADGBAAhjgNAAMYEACHhAwAANgAg4gMAADYAIAoZAADwBAAgJwAAkgUAIOQCAACRBQAw5QIAAFQAEOYCAACRBQAw5wIBAMIEACHqAkAAxwQAIesCAQDCBAAh-QIBAMIEACH6AgEAwgQAIRABAADwBAAgKAAAjAUAIOQCAACTBQAw5QIAAFAAEOYCAACTBQAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAh_AIBAMIEACH9AgEAwgQAIf4CAQDCBAAh_wICAPwEACGAAwIA_AQAIYEDQADHBAAh4QMAAFAAIOIDAABQACAOAQAA8AQAICgAAIwFACDkAgAAkwUAMOUCAABQABDmAgAAkwUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAh_QIBAMIEACH-AgEAwgQAIf8CAgD8BAAhgAMCAPwEACGBA0AAxwQAIQL7AgEAAAABmQMBAAAAAQsBAADwBAAgDAAA8AQAIBIAAIkFACDkAgAAlQUAMOUCAABLABDmAgAAlQUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhmQMBAMIEACENEQAAyAQAIBkAAPAEACAaAADwBAAg5AIAAJYFADDlAgAAOgAQ5gIAAJYFADDnAgEAwgQAIegCAgD8BAAh6QIBAMUEACHqAkAAxwQAIesCAQDCBAAh7AIBAMIEACHtAgEAwgQAIRMMAADwBAAgDgAAhgUAIOQCAACXBQAw5QIAAD8AEOYCAACXBQAw5wIBAMIEACHqAkAAxwQAIfwCAQDCBAAhgQNAAMcEACGZAwEAwgQAIagDAQDCBAAhqQMIAMEEACGqAwEAwgQAIasDAQDCBAAhrAMBAMUEACGtA0AAxgQAIa4DAQDFBAAhrwMBAMUEACGwAyAA-gQAIRINAACeBQAgEwAAnAUAIBQAAPAEACAVAACdBQAg5AIAAJgFADDlAgAALQAQ5gIAAJgFADDnAgEAwgQAIeoCQADHBAAh-gIBAMIEACGQAwAAmQWQAyKRAwgAmgUAIZMDAACbBZMDI5QDQADGBAAhlQMBAMIEACGWAwEAwgQAIZcDAQDFBAAhmAMBAMUEACEE7gIAAACQAwLvAgAAAJADCPACAAAAkAMI9QIAANMEkAMiCO4CCAAAAAHvAggAAAAF8AIIAAAABfECCAAAAAHyAggAAAAB8wIIAAAAAfQCCAAAAAH1AggA0QQAIQTuAgAAAJMDA-8CAAAAkwMJ8AIAAACTAwn1AgAAzwSTAyMNAQAA8AQAIAwAAPAEACASAACJBQAg5AIAAJUFADDlAgAASwAQ5gIAAJUFADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIZkDAQDCBAAh4QMAAEsAIOIDAABLACARAQAA8AQAIBAAAKIFACARAACjBQAgFgAAiQUAIOQCAACgBQAw5QIAACYAEOYCAACgBQAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGGAwAAoQWnAyKkAwEAwgQAIaUDCACaBQAhpwMBAMIEACHhAwAAJgAg4gMAACYAIBUBAADwBAAgFgAAiQUAIBwAAIcFACDkAgAAqAUAMOUCAAAdABDmAgAAqAUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAhgQNAAMcEACGoAwEAwgQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIbEDCADBBAAhsgMgAPoEACGzAyAA-gQAIbQDQADGBAAh4QMAAB0AIOIDAAAdACAC-wIBAAAAAacDAQAAAAEPAQAA8AQAIBAAAKIFACARAACjBQAgFgAAiQUAIOQCAACgBQAw5QIAACYAEOYCAACgBQAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGGAwAAoQWnAyKkAwEAwgQAIaUDCACaBQAhpwMBAMIEACEE7gIAAACnAwLvAgAAAKcDCPACAAAApwMI9QIAANwEpwMiFQwAAPAEACAOAACGBQAg5AIAAJcFADDlAgAAPwAQ5gIAAJcFADDnAgEAwgQAIeoCQADHBAAh_AIBAMIEACGBA0AAxwQAIZkDAQDCBAAhqAMBAMIEACGpAwgAwQQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIa0DQADGBAAhrgMBAMUEACGvAwEAxQQAIbADIAD6BAAh4QMAAD8AIOIDAAA_ACAcAQAA8AQAIAwAAPAEACANAACeBQAgFQAAnQUAIBcAAKYFACAbAACnBQAg5AIAAKQFADDlAgAAIQAQ5gIAAKQFADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYYDAAClBZsDIpcDAQDFBAAhmAMBAMUEACGZAwEAwgQAIZsDQADGBAAhnAMBAMUEACGdAwEAxQQAIZ4DAQDFBAAhnwMIAJoFACGgAwEAxQQAIaEDAQDFBAAhogMBAMUEACGjAwEAxQQAIeEDAAAhACDiAwAAIQAgGgEAAPAEACAMAADwBAAgDQAAngUAIBUAAJ0FACAXAACmBQAgGwAApwUAIOQCAACkBQAw5QIAACEAEOYCAACkBQAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGGAwAApQWbAyKXAwEAxQQAIZgDAQDFBAAhmQMBAMIEACGbA0AAxgQAIZwDAQDFBAAhnQMBAMUEACGeAwEAxQQAIZ8DCACaBQAhoAMBAMUEACGhAwEAxQQAIaIDAQDFBAAhowMBAMUEACEE7gIAAACbAwLvAgAAAJsDCPACAAAAmwMI9QIAANgEmwMiExEAAMgEACAYAADJBAAg5AIAAMAEADDlAgAANgAQ5gIAAMAEADDnAgEAwgQAIeoCQADHBAAh7QIBAMIEACGBA0AAxwQAIYMDCADBBAAhhAMBAMIEACGGAwAAwwSJAyKKAwAAxASKAyKLAwEAxQQAIYwDQADGBAAhjQNAAMYEACGOA0AAxgQAIeEDAAA2ACDiAwAANgAgDxEAAMgEACAZAADwBAAgGgAA8AQAIOQCAACWBQAw5QIAADoAEOYCAACWBQAw5wIBAMIEACHoAgIA_AQAIekCAQDFBAAh6gJAAMcEACHrAgEAwgQAIewCAQDCBAAh7QIBAMIEACHhAwAAOgAg4gMAADoAIBMBAADwBAAgFgAAiQUAIBwAAIcFACDkAgAAqAUAMOUCAAAdABDmAgAAqAUAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAhgQNAAMcEACGoAwEAwgQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIbEDCADBBAAhsgMgAPoEACGzAyAA-gQAIbQDQADGBAAhCgYAAPAEACDkAgAAqQUAMOUCAAAZABDmAgAAqQUAMOcCAQDCBAAh6gJAAMcEACG4AwEAwgQAIbsDAQDCBAAhvAMBAMIEACG9AwEAwgQAIQwGAADwBAAg5AIAAKoFADDlAgAAFQAQ5gIAAKoFADDnAgEAwgQAIeoCQADHBAAh-gIBAMIEACGoAwEAwgQAIbgDAQDCBAAhvgMBAMIEACG_AwEAxQQAIcADIAD6BAAhCgYAAPAEACDkAgAAqwUAMOUCAAARABDmAgAAqwUAMOcCAQDCBAAh6gJAAMcEACG1AwEAwgQAIbYDQADHBAAhtwNAAMYEACG4AwEAwgQAIQoGAADwBAAg5AIAAKwFADDlAgAADQAQ5gIAAKwFADDnAgEAwgQAIeoCQADHBAAhtgNAAMcEACG4AwEAwgQAIbkDAQDCBAAhugMCAPwEACEDuAMBAAAAAb4DAAAAwgMCwgMCAAAAAQ0GAADwBAAg5AIAAK4FADDlAgAACQAQ5gIAAK4FADDnAgEAwgQAIeoCQADHBAAh_QIBAMIEACH-AgEAwgQAIf8CAgD8BAAhuAMBAMIEACG-AwAArwXCAyLCAwIA_AQAIcMDAQDCBAAhBO4CAAAAwgMC7wIAAADCAwjwAgAAAMIDCPUCAADpBMIDIg8BAADwBAAg5AIAALAFADDlAgAABQAQ5gIAALAFADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYMDCADBBAAhhAMBAMIEACGGAwAAsQXHAyKKAwAAxASKAyKLAwEAwgQAIcQDAgD8BAAhxQMBAMIEACEE7gIAAADHAwLvAgAAAMcDCPACAAAAxwMI9QIAAO0ExwMiAAAAAAAAAeYDAQAAAAEF5gMCAAAAAewDAgAAAAHtAwIAAAAB7gMCAAAAAe8DAgAAAAEB5gMBAAAAAQHmA0AAAAABBTgAAPoKACA5AACDCwAg4wMAAPsKACDkAwAAggsAIOkDAAABACAFOAAA-AoAIDkAAIALACDjAwAA-QoAIOQDAAD_CgAg6QMAAAEAIAU4AAD2CgAgOQAA_QoAIOMDAAD3CgAg5AMAAPwKACDpAwAAIwAgAzgAAPoKACDjAwAA-woAIOkDAAABACADOAAA-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-wYAMOMDAAD4BgAw5AMAAPkGADDlAwAA-gYAIOYDAACWBgAw5wMAAJYGADDoAwAAlgYAMOkDAACWBgAw6gMAAPwGADDrAwAAmQYAMA0TAACIBgAgFAAAiQYAIBUAAIoGACDnAgEAAAAB6gJAAAAAAfoCAQAAAAGQAwAAAJADApEDCAAAAAGTAwAAAJMDA5QDQAAAAAGVAwEAAAABlgMBAAAAAZcDAQAAAAECAAAALwAgOAAA_wYAIAMAAAAvACA4AAD_BgAgOQAA_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_gkAIOkDAAABACAAAAAFOAAA-AkAIDkAAPsJACDjAwAA-QkAIOQDAAD6CQAg6QMAAAEAIAM4AAD4CQAg4wMAAPkJACDpAwAAAQAgAAAAAAAB5gMAAADCAwIFOAAA8wkAIDkAAPYJACDjAwAA9AkAIOQDAAD1CQAg6QMAAAEAIAM4AADzCQAg4wMAAPQJACDpAwAAAQAgAAAAAAAB5gMAAADHAwIFOAAA7gkAIDkAAPEJACDjAwAA7wkAIOQDAADwCQAg6QMAAAEAIAM4AADuCQAg4wMAAO8JACDpAwAAAQAgAAAABTgAAOkJACA5AADsCQAg4wMAAOoJACDkAwAA6wkAIOkDAAABACADOAAA6QkAIOMDAADqCQAg6QMAAAEAIBwCAAC-CQAgBQAAvwkAIAcAAMAJACAIAADBCQAgCQAAwgkAIAoAAMMJACALAADECQAgHQAAxQkAIB4AAMYJACAfAADHCQAgIAAAyAkAICEAAMgJACAiAADJCQAgIwAAyQkAICQAAMoJACAlAADLCQAgJgAAywkAICkAAMwJACAqAADNCQAgKwAAzgkAILQDAACyBQAgxQMAALIFACDOAwAAsgUAIM8DAACyBQAg0QMAALIFACDWAwAAsgUAINcDAACyBQAg2QMAALIFACAAAAAAAAHmAwAAAM0DAgHmAwAAANUDAgc4AAClCQAgOQAAqAkAIOMDAACmCQAg5AMAAKcJACDnAwAAAwAg6AMAAAMAIOkDAACHAQAgCzgAAJkJADA5AACeCQAw4wMAAJoJADDkAwAAmwkAMOUDAACcCQAg5gMAAJ0JADDnAwAAnQkAMOgDAACdCQAw6QMAAJ0JADDqAwAAnwkAMOsDAACgCQAwCzgAAI0JADA5AACSCQAw4wMAAI4JADDkAwAAjwkAMOUDAACQCQAg5gMAAJEJADDnAwAAkQkAMOgDAACRCQAw6QMAAJEJADDqAwAAkwkAMOsDAACUCQAwCzgAAIEJADA5AACGCQAw4wMAAIIJADDkAwAAgwkAMOUDAACECQAg5gMAAIUJADDnAwAAhQkAMOgDAACFCQAw6QMAAIUJADDqAwAAhwkAMOsDAACICQAwCzgAAPUIADA5AAD6CAAw4wMAAPYIADDkAwAA9wgAMOUDAAD4CAAg5gMAAPkIADDnAwAA-QgAMOgDAAD5CAAw6QMAAPkIADDqAwAA-wgAMOsDAAD8CAAwCzgAAOkIADA5AADuCAAw4wMAAOoIADDkAwAA6wgAMOUDAADsCAAg5gMAAO0IADDnAwAA7QgAMOgDAADtCAAw6QMAAO0IADDqAwAA7wgAMOsDAADwCAAwCzgAAN0IADA5AADiCAAw4wMAAN4IADDkAwAA3wgAMOUDAADgCAAg5gMAAOEIADDnAwAA4QgAMOgDAADhCAAw6QMAAOEIADDqAwAA4wgAMOsDAADkCAAwCzgAANEIADA5AADWCAAw4wMAANIIADDkAwAA0wgAMOUDAADUCAAg5gMAANUIADDnAwAA1QgAMOgDAADVCAAw6QMAANUIADDqAwAA1wgAMOsDAADYCAAwCzgAAMUIADA5AADKCAAw4wMAAMYIADDkAwAAxwgAMOUDAADICAAg5gMAAMkIADDnAwAAyQgAMOgDAADJCAAw6QMAAMkIADDqAwAAywgAMOsDAADMCAAwCzgAALwIADA5AADACAAw4wMAAL0IADDkAwAAvggAMOUDAAC_CAAg5gMAAOUGADDnAwAA5QYAMOgDAADlBgAw6QMAAOUGADDqAwAAwQgAMOsDAADoBgAwCzgAALMIADA5AAC3CAAw4wMAALQIADDkAwAAtQgAMOUDAAC2CAAg5gMAAIQHADDnAwAAhAcAMOgDAACEBwAw6QMAAIQHADDqAwAAuAgAMOsDAACHBwAwCzgAAKoIADA5AACuCAAw4wMAAKsIADDkAwAArAgAMOUDAACtCAAg5gMAAIQHADDnAwAAhAcAMOgDAACEBwAw6QMAAIQHADDqAwAArwgAMOsDAACHBwAwCzgAAKEIADA5AAClCAAw4wMAAKIIADDkAwAAowgAMOUDAACkCAAg5gMAAJkIADDnAwAAmQgAMOgDAACZCAAw6QMAAJkIADDqAwAApggAMOsDAACcCAAwCzgAAJUIADA5AACaCAAw4wMAAJYIADDkAwAAlwgAMOUDAACYCAAg5gMAAJkIADDnAwAAmQgAMOgDAACZCAAw6QMAAJkIADDqAwAAmwgAMOsDAACcCAAwCzgAAIwIADA5AACQCAAw4wMAAI0IADDkAwAAjggAMOUDAACPCAAg5gMAAJYGADDnAwAAlgYAMOgDAACWBgAw6QMAAJYGADDqAwAAkQgAMOsDAACZBgAwCzgAAIMIADA5AACHCAAw4wMAAIQIADDkAwAAhQgAMOUDAACGCAAg5gMAAPsHADDnAwAA-wcAMOgDAAD7BwAw6QMAAPsHADDqAwAAiAgAMOsDAAD-BwAwCzgAAPcHADA5AAD8BwAw4wMAAPgHADDkAwAA-QcAMOUDAAD6BwAg5gMAAPsHADDnAwAA-wcAMOgDAAD7BwAw6QMAAPsHADDqAwAA_QcAMOsDAAD-BwAwCzgAAOsHADA5AADwBwAw4wMAAOwHADDkAwAA7QcAMOUDAADuBwAg5gMAAO8HADDnAwAA7wcAMOgDAADvBwAw6QMAAO8HADDqAwAA8QcAMOsDAADyBwAwCzgAAOIHADA5AADmBwAw4wMAAOMHADDkAwAA5AcAMOUDAADlBwAg5gMAANQFADDnAwAA1AUAMOgDAADUBQAw6QMAANQFADDqAwAA5wcAMOsDAADXBQAwCzgAANYHADA5AADbBwAw4wMAANcHADDkAwAA2AcAMOUDAADZBwAg5gMAANoHADDnAwAA2gcAMOgDAADaBwAw6QMAANoHADDqAwAA3AcAMOsDAADdBwAwCRcAAOgFACDnAgEAAAAB6gJAAAAAAYEDQAAAAAGCAwEAAAABgwMIAAAAAYQDAQAAAAGGAwAAAIYDAocDAQAAAAECAAAAWwAgOAAA4QcAIAMAAABbACA4AADhBwAgOQAA4AcAIAExAADoCQAwDgEAAPAEACAXAACQBQAg5AIAAI4FADDlAgAAOAAQ5gIAAI4FADDnAgEAAAAB6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhggMBAAAAAYMDCADBBAAhhAMBAMIEACGGAwAAjwWGAyKHAwEAxQQAIQIAAABbACAxAADgBwAgAgAAAN4HACAxAADfBwAgDOQCAADdBwAw5QIAAN4HABDmAgAA3QcAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhggMBAMIEACGDAwgAwQQAIYQDAQDCBAAhhgMAAI8FhgMihwMBAMUEACEM5AIAAN0HADDlAgAA3gcAEOYCAADdBwAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGCAwEAwgQAIYMDCADBBAAhhAMBAMIEACGGAwAAjwWGAyKHAwEAxQQAIQjnAgEAuAUAIeoCQAC7BQAhgQNAALsFACGCAwEAuAUAIYMDCADjBQAhhAMBALgFACGGAwAA5AWGAyKHAwEAugUAIQkXAADmBQAg5wIBALgFACHqAkAAuwUAIYEDQAC7BQAhggMBALgFACGDAwgA4wUAIYQDAQC4BQAhhgMAAOQFhgMihwMBALoFACEJFwAA6AUAIOcCAQAAAAHqAkAAAAABgQNAAAAAAYIDAQAAAAGDAwgAAAABhAMBAAAAAYYDAAAAhgMChwMBAAAAAQUnAADHBQAg5wIBAAAAAeoCQAAAAAH5AgEAAAAB-gIBAAAAAQIAAABWACA4AADqBwAgAwAAAFYAIDgAAOoHACA5AADpBwAgATEAAOcJADACAAAAVgAgMQAA6QcAIAIAAADYBQAgMQAA6AcAIATnAgEAuAUAIeoCQAC7BQAh-QIBALgFACH6AgEAuAUAIQUnAADFBQAg5wIBALgFACHqAkAAuwUAIfkCAQC4BQAh-gIBALgFACEFJwAAxwUAIOcCAQAAAAHqAkAAAAAB-QIBAAAAAfoCAQAAAAEJKAAA3QUAIOcCAQAAAAHqAkAAAAAB_AIBAAAAAf0CAQAAAAH-AgEAAAAB_wICAAAAAYADAgAAAAGBA0AAAAABAgAAAFIAIDgAAPYHACADAAAAUgAgOAAA9gcAIDkAAPUHACABMQAA5gkAMA4BAADwBAAgKAAAjAUAIOQCAACTBQAw5QIAAFAAEOYCAACTBQAw5wIBAAAAAeoCQADHBAAh-wIBAMIEACH8AgEAwgQAIf0CAQDCBAAh_gIBAMIEACH_AgIA_AQAIYADAgD8BAAhgQNAAMcEACECAAAAUgAgMQAA9QcAIAIAAADzBwAgMQAA9AcAIAzkAgAA8gcAMOUCAADzBwAQ5gIAAPIHADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACH8AgEAwgQAIf0CAQDCBAAh_gIBAMIEACH_AgIA_AQAIYADAgD8BAAhgQNAAMcEACEM5AIAAPIHADDlAgAA8wcAEOYCAADyBwAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAh_AIBAMIEACH9AgEAwgQAIf4CAQDCBAAh_wICAPwEACGAAwIA_AQAIYEDQADHBAAhCOcCAQC4BQAh6gJAALsFACH8AgEAuAUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIYADAgC5BQAhgQNAALsFACEJKAAAzwUAIOcCAQC4BQAh6gJAALsFACH8AgEAuAUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIYADAgC5BQAhgQNAALsFACEJKAAA3QUAIOcCAQAAAAHqAkAAAAAB_AIBAAAAAf0CAQAAAAH-AgEAAAAB_wICAAAAAYADAgAAAAGBA0AAAAABBgwAAJ4GACASAACgBgAg5wIBAAAAAeoCQAAAAAGBA0AAAAABmQMBAAAAAQIAAABNACA4AACCCAAgAwAAAE0AIDgAAIIIACA5AACBCAAgATEAAOUJADAMAQAA8AQAIAwAAPAEACASAACJBQAg5AIAAJUFADDlAgAASwAQ5gIAAJUFADDnAgEAAAAB6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhmQMBAMIEACHeAwAAlAUAIAIAAABNACAxAACBCAAgAgAAAP8HACAxAACACAAgCOQCAAD-BwAw5QIAAP8HABDmAgAA_gcAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhmQMBAMIEACEI5AIAAP4HADDlAgAA_wcAEOYCAAD-BwAw5wIBAMIEACHqAkAAxwQAIfsCAQDCBAAhgQNAAMcEACGZAwEAwgQAIQTnAgEAuAUAIeoCQAC7BQAhgQNAALsFACGZAwEAuAUAIQYMAACPBgAgEgAAkQYAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIZkDAQC4BQAhBgwAAJ4GACASAACgBgAg5wIBAAAAAeoCQAAAAAGBA0AAAAABmQMBAAAAAQYBAACfBgAgEgAAoAYAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAECAAAATQAgOAAAiwgAIAMAAABNACA4AACLCAAgOQAAiggAIAExAADkCQAwAgAAAE0AIDEAAIoIACACAAAA_wcAIDEAAIkIACAE5wIBALgFACHqAkAAuwUAIfsCAQC4BQAhgQNAALsFACEGAQAAkAYAIBIAAJEGACDnAgEAuAUAIeoCQAC7BQAh-wIBALgFACGBA0AAuwUAIQYBAACfBgAgEgAAoAYAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAENDQAAiwYAIBMAAIgGACAVAACKBgAg5wIBAAAAAeoCQAAAAAH6AgEAAAABkAMAAACQAwKRAwgAAAABkwMAAACTAwOUA0AAAAABlQMBAAAAAZcDAQAAAAGYAwEAAAABAgAAAC8AIDgAAJQIACADAAAALwAgOAAAlAgAIDkAAJMIACABMQAA4wkAMAIAAAAvACAxAACTCAAgAgAAAJoGACAxAACSCAAgCucCAQC4BQAh6gJAALsFACH6AgEAuAUAIZADAACBBpADIpEDCACCBgAhkwMAAIMGkwMjlANAAPAFACGVAwEAuAUAIZcDAQC6BQAhmAMBALoFACENDQAAhwYAIBMAAIQGACAVAACGBgAg5wIBALgFACHqAkAAuwUAIfoCAQC4BQAhkAMAAIEGkAMikQMIAIIGACGTAwAAgwaTAyOUA0AA8AUAIZUDAQC4BQAhlwMBALoFACGYAwEAugUAIQ0NAACLBgAgEwAAiAYAIBUAAIoGACDnAgEAAAAB6gJAAAAAAfoCAQAAAAGQAwAAAJADApEDCAAAAAGTAwAAAJMDA5QDQAAAAAGVAwEAAAABlwMBAAAAAZgDAQAAAAEIEQAAwQUAIBkAAL8FACDnAgEAAAAB6AICAAAAAekCAQAAAAHqAkAAAAAB6wIBAAAAAe0CAQAAAAECAAAARwAgOAAAoAgAIAMAAABHACA4AACgCAAgOQAAnwgAIAExAADiCQAwDREAAMgEACAZAADwBAAgGgAA8AQAIOQCAACWBQAw5QIAADoAEOYCAACWBQAw5wIBAAAAAegCAgD8BAAh6QIBAMUEACHqAkAAxwQAIesCAQDCBAAh7AIBAMIEACHtAgEAAAABAgAAAEcAIDEAAJ8IACACAAAAnQgAIDEAAJ4IACAK5AIAAJwIADDlAgAAnQgAEOYCAACcCAAw5wIBAMIEACHoAgIA_AQAIekCAQDFBAAh6gJAAMcEACHrAgEAwgQAIewCAQDCBAAh7QIBAMIEACEK5AIAAJwIADDlAgAAnQgAEOYCAACcCAAw5wIBAMIEACHoAgIA_AQAIekCAQDFBAAh6gJAAMcEACHrAgEAwgQAIewCAQDCBAAh7QIBAMIEACEG5wIBALgFACHoAgIAuQUAIekCAQC6BQAh6gJAALsFACHrAgEAuAUAIe0CAQC4BQAhCBEAAL4FACAZAAC8BQAg5wIBALgFACHoAgIAuQUAIekCAQC6BQAh6gJAALsFACHrAgEAuAUAIe0CAQC4BQAhCBEAAMEFACAZAAC_BQAg5wIBAAAAAegCAgAAAAHpAgEAAAAB6gJAAAAAAesCAQAAAAHtAgEAAAABCBEAAMEFACAaAADABQAg5wIBAAAAAegCAgAAAAHpAgEAAAAB6gJAAAAAAewCAQAAAAHtAgEAAAABAgAAAEcAIDgAAKkIACADAAAARwAgOAAAqQgAIDkAAKgIACABMQAA4QkAMAIAAABHACAxAACoCAAgAgAAAJ0IACAxAACnCAAgBucCAQC4BQAh6AICALkFACHpAgEAugUAIeoCQAC7BQAh7AIBALgFACHtAgEAuAUAIQgRAAC-BQAgGgAAvQUAIOcCAQC4BQAh6AICALkFACHpAgEAugUAIeoCQAC7BQAh7AIBALgFACHtAgEAuAUAIQgRAADBBQAgGgAAwAUAIOcCAQAAAAHoAgIAAAAB6QIBAAAAAeoCQAAAAAHsAgEAAAAB7QIBAAAAARUMAAC3BgAgDQAAuQYAIBUAALoGACAXAAC7BgAgGwAAvAYAIOcCAQAAAAHqAkAAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGZAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABAgAAACMAIDgAALIIACADAAAAIwAgOAAAsggAIDkAALEIACABMQAA4AkAMAIAAAAjACAxAACxCAAgAgAAAIgHACAxAACwCAAgEOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIYYDAACmBpsDIpcDAQC6BQAhmAMBALoFACGZAwEAuAUAIZsDQADwBQAhnAMBALoFACGdAwEAugUAIZ4DAQC6BQAhnwMIAIIGACGgAwEAugUAIaEDAQC6BQAhogMBALoFACGjAwEAugUAIRUMAACnBgAgDQAAqQYAIBUAAKoGACAXAACrBgAgGwAArAYAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIYYDAACmBpsDIpcDAQC6BQAhmAMBALoFACGZAwEAuAUAIZsDQADwBQAhnAMBALoFACGdAwEAugUAIZ4DAQC6BQAhnwMIAIIGACGgAwEAugUAIaEDAQC6BQAhogMBALoFACGjAwEAugUAIRUMAAC3BgAgDQAAuQYAIBUAALoGACAXAAC7BgAgGwAAvAYAIOcCAQAAAAHqAkAAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGZAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABFQEAALgGACANAAC5BgAgFQAAugYAIBcAALsGACAbAAC8BgAg5wIBAAAAAeoCQAAAAAH7AgEAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGbA0AAAAABnAMBAAAAAZ0DAQAAAAGeAwEAAAABnwMIAAAAAaADAQAAAAGhAwEAAAABogMBAAAAAaMDAQAAAAECAAAAIwAgOAAAuwgAIAMAAAAjACA4AAC7CAAgOQAAuggAIAExAADfCQAwAgAAACMAIDEAALoIACACAAAAiAcAIDEAALkIACAQ5wIBALgFACHqAkAAuwUAIfsCAQC4BQAhgQNAALsFACGGAwAApgabAyKXAwEAugUAIZgDAQC6BQAhmwNAAPAFACGcAwEAugUAIZ0DAQC6BQAhngMBALoFACGfAwgAggYAIaADAQC6BQAhoQMBALoFACGiAwEAugUAIaMDAQC6BQAhFQEAAKgGACANAACpBgAgFQAAqgYAIBcAAKsGACAbAACsBgAg5wIBALgFACHqAkAAuwUAIfsCAQC4BQAhgQNAALsFACGGAwAApgabAyKXAwEAugUAIZgDAQC6BQAhmwNAAPAFACGcAwEAugUAIZ0DAQC6BQAhngMBALoFACGfAwgAggYAIaADAQC6BQAhoQMBALoFACGiAwEAugUAIaMDAQC6BQAhFQEAALgGACANAAC5BgAgFQAAugYAIBcAALsGACAbAAC8BgAg5wIBAAAAAeoCQAAAAAH7AgEAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGbA0AAAAABnAMBAAAAAZ0DAQAAAAGeAwEAAAABnwMIAAAAAaADAQAAAAGhAwEAAAABogMBAAAAAaMDAQAAAAEKEAAA1QYAIBEAANcGACAWAADYBgAg5wIBAAAAAeoCQAAAAAGBA0AAAAABhgMAAACnAwKkAwEAAAABpQMIAAAAAacDAQAAAAECAAAAKQAgOAAAxAgAIAMAAAApACA4AADECAAgOQAAwwgAIAExAADeCQAwAgAAACkAIDEAAMMIACACAAAA6QYAIDEAAMIIACAH5wIBALgFACHqAkAAuwUAIYEDQAC7BQAhhgMAAMIGpwMipAMBALgFACGlAwgAggYAIacDAQC4BQAhChAAAMMGACARAADFBgAgFgAAxgYAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIYYDAADCBqcDIqQDAQC4BQAhpQMIAIIGACGnAwEAuAUAIQoQAADVBgAgEQAA1wYAIBYAANgGACDnAgEAAAAB6gJAAAAAAYEDQAAAAAGGAwAAAKcDAqQDAQAAAAGlAwgAAAABpwMBAAAAAQ4OAADuBgAg5wIBAAAAAeoCQAAAAAH8AgEAAAABgQNAAAAAAagDAQAAAAGpAwgAAAABqgMBAAAAAasDAQAAAAGsAwEAAAABrQNAAAAAAa4DAQAAAAGvAwEAAAABsAMgAAAAAQIAAABBACA4AADQCAAgAwAAAEEAIDgAANAIACA5AADPCAAgATEAAN0JADATDAAA8AQAIA4AAIYFACDkAgAAlwUAMOUCAAA_ABDmAgAAlwUAMOcCAQAAAAHqAkAAxwQAIfwCAQDCBAAhgQNAAMcEACGZAwEAwgQAIagDAQDCBAAhqQMIAMEEACGqAwEAwgQAIasDAQDCBAAhrAMBAMUEACGtA0AAxgQAIa4DAQDFBAAhrwMBAMUEACGwAyAA-gQAIQIAAABBACAxAADPCAAgAgAAAM0IACAxAADOCAAgEeQCAADMCAAw5QIAAM0IABDmAgAAzAgAMOcCAQDCBAAh6gJAAMcEACH8AgEAwgQAIYEDQADHBAAhmQMBAMIEACGoAwEAwgQAIakDCADBBAAhqgMBAMIEACGrAwEAwgQAIawDAQDFBAAhrQNAAMYEACGuAwEAxQQAIa8DAQDFBAAhsAMgAPoEACER5AIAAMwIADDlAgAAzQgAEOYCAADMCAAw5wIBAMIEACHqAkAAxwQAIfwCAQDCBAAhgQNAAMcEACGZAwEAwgQAIagDAQDCBAAhqQMIAMEEACGqAwEAwgQAIasDAQDCBAAhrAMBAMUEACGtA0AAxgQAIa4DAQDFBAAhrwMBAMUEACGwAyAA-gQAIQ3nAgEAuAUAIeoCQAC7BQAh_AIBALgFACGBA0AAuwUAIagDAQC4BQAhqQMIAOMFACGqAwEAuAUAIasDAQC4BQAhrAMBALoFACGtA0AA8AUAIa4DAQC6BQAhrwMBALoFACGwAyAA3gYAIQ4OAADgBgAg5wIBALgFACHqAkAAuwUAIfwCAQC4BQAhgQNAALsFACGoAwEAuAUAIakDCADjBQAhqgMBALgFACGrAwEAuAUAIawDAQC6BQAhrQNAAPAFACGuAwEAugUAIa8DAQC6BQAhsAMgAN4GACEODgAA7gYAIOcCAQAAAAHqAkAAAAAB_AIBAAAAAYEDQAAAAAGoAwEAAAABqQMIAAAAAaoDAQAAAAGrAwEAAAABrAMBAAAAAa0DQAAAAAGuAwEAAAABrwMBAAAAAbADIAAAAAEOFgAAjgcAIBwAAI0HACDnAgEAAAAB6gJAAAAAAfwCAQAAAAGBA0AAAAABqAMBAAAAAaoDAQAAAAGrAwEAAAABrAMBAAAAAbEDCAAAAAGyAyAAAAABswMgAAAAAbQDQAAAAAECAAAAHwAgOAAA3AgAIAMAAAAfACA4AADcCAAgOQAA2wgAIAExAADcCQAwEwEAAPAEACAWAACJBQAgHAAAhwUAIOQCAACoBQAw5QIAAB0AEOYCAACoBQAw5wIBAAAAAeoCQADHBAAh-wIBAMIEACH8AgEAwgQAIYEDQADHBAAhqAMBAMIEACGqAwEAwgQAIasDAQDCBAAhrAMBAMUEACGxAwgAwQQAIbIDIAD6BAAhswMgAPoEACG0A0AAxgQAIQIAAAAfACAxAADbCAAgAgAAANkIACAxAADaCAAgEOQCAADYCAAw5QIAANkIABDmAgAA2AgAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAhgQNAAMcEACGoAwEAwgQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIbEDCADBBAAhsgMgAPoEACGzAyAA-gQAIbQDQADGBAAhEOQCAADYCAAw5QIAANkIABDmAgAA2AgAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIfwCAQDCBAAhgQNAAMcEACGoAwEAwgQAIaoDAQDCBAAhqwMBAMIEACGsAwEAxQQAIbEDCADBBAAhsgMgAPoEACGzAyAA-gQAIbQDQADGBAAhDOcCAQC4BQAh6gJAALsFACH8AgEAuAUAIYEDQAC7BQAhqAMBALgFACGqAwEAuAUAIasDAQC4BQAhrAMBALoFACGxAwgA4wUAIbIDIADeBgAhswMgAN4GACG0A0AA8AUAIQ4WAAD2BgAgHAAA9QYAIOcCAQC4BQAh6gJAALsFACH8AgEAuAUAIYEDQAC7BQAhqAMBALgFACGqAwEAuAUAIasDAQC4BQAhrAMBALoFACGxAwgA4wUAIbIDIADeBgAhswMgAN4GACG0A0AA8AUAIQ4WAACOBwAgHAAAjQcAIOcCAQAAAAHqAkAAAAAB_AIBAAAAAYEDQAAAAAGoAwEAAAABqgMBAAAAAasDAQAAAAGsAwEAAAABsQMIAAAAAbIDIAAAAAGzAyAAAAABtANAAAAAAQXnAgEAAAAB6gJAAAAAAbsDAQAAAAG8AwEAAAABvQMBAAAAAQIAAAAbACA4AADoCAAgAwAAABsAIDgAAOgIACA5AADnCAAgATEAANsJADAKBgAA8AQAIOQCAACpBQAw5QIAABkAEOYCAACpBQAw5wIBAAAAAeoCQADHBAAhuAMBAMIEACG7AwEAAAABvAMBAMIEACG9AwEAwgQAIQIAAAAbACAxAADnCAAgAgAAAOUIACAxAADmCAAgCeQCAADkCAAw5QIAAOUIABDmAgAA5AgAMOcCAQDCBAAh6gJAAMcEACG4AwEAwgQAIbsDAQDCBAAhvAMBAMIEACG9AwEAwgQAIQnkAgAA5AgAMOUCAADlCAAQ5gIAAOQIADDnAgEAwgQAIeoCQADHBAAhuAMBAMIEACG7AwEAwgQAIbwDAQDCBAAhvQMBAMIEACEF5wIBALgFACHqAkAAuwUAIbsDAQC4BQAhvAMBALgFACG9AwEAuAUAIQXnAgEAuAUAIeoCQAC7BQAhuwMBALgFACG8AwEAuAUAIb0DAQC4BQAhBecCAQAAAAHqAkAAAAABuwMBAAAAAbwDAQAAAAG9AwEAAAABB-cCAQAAAAHqAkAAAAAB-gIBAAAAAagDAQAAAAG-AwEAAAABvwMBAAAAAcADIAAAAAECAAAAFwAgOAAA9AgAIAMAAAAXACA4AAD0CAAgOQAA8wgAIAExAADaCQAwDAYAAPAEACDkAgAAqgUAMOUCAAAVABDmAgAAqgUAMOcCAQAAAAHqAkAAxwQAIfoCAQDCBAAhqAMBAMIEACG4AwEAwgQAIb4DAQDCBAAhvwMBAMUEACHAAyAA-gQAIQIAAAAXACAxAADzCAAgAgAAAPEIACAxAADyCAAgC-QCAADwCAAw5QIAAPEIABDmAgAA8AgAMOcCAQDCBAAh6gJAAMcEACH6AgEAwgQAIagDAQDCBAAhuAMBAMIEACG-AwEAwgQAIb8DAQDFBAAhwAMgAPoEACEL5AIAAPAIADDlAgAA8QgAEOYCAADwCAAw5wIBAMIEACHqAkAAxwQAIfoCAQDCBAAhqAMBAMIEACG4AwEAwgQAIb4DAQDCBAAhvwMBAMUEACHAAyAA-gQAIQfnAgEAuAUAIeoCQAC7BQAh-gIBALgFACGoAwEAuAUAIb4DAQC4BQAhvwMBALoFACHAAyAA3gYAIQfnAgEAuAUAIeoCQAC7BQAh-gIBALgFACGoAwEAuAUAIb4DAQC4BQAhvwMBALoFACHAAyAA3gYAIQfnAgEAAAAB6gJAAAAAAfoCAQAAAAGoAwEAAAABvgMBAAAAAb8DAQAAAAHAAyAAAAABBecCAQAAAAHqAkAAAAABtQMBAAAAAbYDQAAAAAG3A0AAAAABAgAAABMAIDgAAIAJACADAAAAEwAgOAAAgAkAIDkAAP8IACABMQAA2QkAMAoGAADwBAAg5AIAAKsFADDlAgAAEQAQ5gIAAKsFADDnAgEAAAAB6gJAAMcEACG1AwEAwgQAIbYDQADHBAAhtwNAAMYEACG4AwEAwgQAIQIAAAATACAxAAD_CAAgAgAAAP0IACAxAAD-CAAgCeQCAAD8CAAw5QIAAP0IABDmAgAA_AgAMOcCAQDCBAAh6gJAAMcEACG1AwEAwgQAIbYDQADHBAAhtwNAAMYEACG4AwEAwgQAIQnkAgAA_AgAMOUCAAD9CAAQ5gIAAPwIADDnAgEAwgQAIeoCQADHBAAhtQMBAMIEACG2A0AAxwQAIbcDQADGBAAhuAMBAMIEACEF5wIBALgFACHqAkAAuwUAIbUDAQC4BQAhtgNAALsFACG3A0AA8AUAIQXnAgEAuAUAIeoCQAC7BQAhtQMBALgFACG2A0AAuwUAIbcDQADwBQAhBecCAQAAAAHqAkAAAAABtQMBAAAAAbYDQAAAAAG3A0AAAAABBecCAQAAAAHqAkAAAAABtgNAAAAAAbkDAQAAAAG6AwIAAAABAgAAAA8AIDgAAIwJACADAAAADwAgOAAAjAkAIDkAAIsJACABMQAA2AkAMAoGAADwBAAg5AIAAKwFADDlAgAADQAQ5gIAAKwFADDnAgEAAAAB6gJAAMcEACG2A0AAxwQAIbgDAQDCBAAhuQMBAMIEACG6AwIA_AQAIQIAAAAPACAxAACLCQAgAgAAAIkJACAxAACKCQAgCeQCAACICQAw5QIAAIkJABDmAgAAiAkAMOcCAQDCBAAh6gJAAMcEACG2A0AAxwQAIbgDAQDCBAAhuQMBAMIEACG6AwIA_AQAIQnkAgAAiAkAMOUCAACJCQAQ5gIAAIgJADDnAgEAwgQAIeoCQADHBAAhtgNAAMcEACG4AwEAwgQAIbkDAQDCBAAhugMCAPwEACEF5wIBALgFACHqAkAAuwUAIbYDQAC7BQAhuQMBALgFACG6AwIAuQUAIQXnAgEAuAUAIeoCQAC7BQAhtgNAALsFACG5AwEAuAUAIboDAgC5BQAhBecCAQAAAAHqAkAAAAABtgNAAAAAAbkDAQAAAAG6AwIAAAABCOcCAQAAAAHqAkAAAAAB_QIBAAAAAf4CAQAAAAH_AgIAAAABvgMAAADCAwLCAwIAAAABwwMBAAAAAQIAAAALACA4AACYCQAgAwAAAAsAIDgAAJgJACA5AACXCQAgATEAANcJADAOBgAA8AQAIOQCAACuBQAw5QIAAAkAEOYCAACuBQAw5wIBAAAAAeoCQADHBAAh_QIBAMIEACH-AgEAwgQAIf8CAgD8BAAhuAMBAMIEACG-AwAArwXCAyLCAwIA_AQAIcMDAQDCBAAh4AMAAK0FACACAAAACwAgMQAAlwkAIAIAAACVCQAgMQAAlgkAIAzkAgAAlAkAMOUCAACVCQAQ5gIAAJQJADDnAgEAwgQAIeoCQADHBAAh_QIBAMIEACH-AgEAwgQAIf8CAgD8BAAhuAMBAMIEACG-AwAArwXCAyLCAwIA_AQAIcMDAQDCBAAhDOQCAACUCQAw5QIAAJUJABDmAgAAlAkAMOcCAQDCBAAh6gJAAMcEACH9AgEAwgQAIf4CAQDCBAAh_wICAPwEACG4AwEAwgQAIb4DAACvBcIDIsIDAgD8BAAhwwMBAMIEACEI5wIBALgFACHqAkAAuwUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIb4DAACqB8IDIsIDAgC5BQAhwwMBALgFACEI5wIBALgFACHqAkAAuwUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIb4DAACqB8IDIsIDAgC5BQAhwwMBALgFACEI5wIBAAAAAeoCQAAAAAH9AgEAAAAB_gIBAAAAAf8CAgAAAAG-AwAAAMIDAsIDAgAAAAHDAwEAAAABCucCAQAAAAHqAkAAAAABgQNAAAAAAYMDCAAAAAGEAwEAAAABhgMAAADHAwKKAwAAAIoDAosDAQAAAAHEAwIAAAABxQMBAAAAAQIAAAAHACA4AACkCQAgAwAAAAcAIDgAAKQJACA5AACjCQAgATEAANYJADAPAQAA8AQAIOQCAACwBQAw5QIAAAUAEOYCAACwBQAw5wIBAAAAAeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYMDCADBBAAhhAMBAMIEACGGAwAAsQXHAyKKAwAAxASKAyKLAwEAAAABxAMCAPwEACHFAwEAwgQAIQIAAAAHACAxAACjCQAgAgAAAKEJACAxAACiCQAgDuQCAACgCQAw5QIAAKEJABDmAgAAoAkAMOcCAQDCBAAh6gJAAMcEACH7AgEAwgQAIYEDQADHBAAhgwMIAMEEACGEAwEAwgQAIYYDAACxBccDIooDAADEBIoDIosDAQDCBAAhxAMCAPwEACHFAwEAwgQAIQ7kAgAAoAkAMOUCAAChCQAQ5gIAAKAJADDnAgEAwgQAIeoCQADHBAAh-wIBAMIEACGBA0AAxwQAIYMDCADBBAAhhAMBAMIEACGGAwAAsQXHAyKKAwAAxASKAyKLAwEAwgQAIcQDAgD8BAAhxQMBAMIEACEK5wIBALgFACHqAkAAuwUAIYEDQAC7BQAhgwMIAOMFACGEAwEAuAUAIYYDAACyB8cDIooDAADvBYoDIosDAQC4BQAhxAMCALkFACHFAwEAuAUAIQrnAgEAuAUAIeoCQAC7BQAhgQNAALsFACGDAwgA4wUAIYQDAQC4BQAhhgMAALIHxwMiigMAAO8FigMiiwMBALgFACHEAwIAuQUAIcUDAQC4BQAhCucCAQAAAAHqAkAAAAABgQNAAAAAAYMDCAAAAAGEAwEAAAABhgMAAADHAwKKAwAAAIoDAosDAQAAAAHEAwIAAAABxQMBAAAAAQbnAgEAAAAB6gJAAAAAAYEDQAAAAAG2A0AAAAABxwNAAAAAAcgDAQAAAAECAAAAhwEAIDgAAKUJACADAAAAAwAgOAAApQkAIDkAAKkJACAIAAAAAwAgMQAAqQkAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIbYDQAC7BQAhxwNAALsFACHIAwEAugUAIQbnAgEAuAUAIeoCQAC7BQAhgQNAALsFACG2A0AAuwUAIccDQAC7BQAhyAMBALoFACEDOAAApQkAIOMDAACmCQAg6QMAAIcBACAEOAAAmQkAMOMDAACaCQAw5QMAAJwJACDpAwAAnQkAMAQ4AACNCQAw4wMAAI4JADDlAwAAkAkAIOkDAACRCQAwBDgAAIEJADDjAwAAggkAMOUDAACECQAg6QMAAIUJADAEOAAA9QgAMOMDAAD2CAAw5QMAAPgIACDpAwAA-QgAMAQ4AADpCAAw4wMAAOoIADDlAwAA7AgAIOkDAADtCAAwBDgAAN0IADDjAwAA3ggAMOUDAADgCAAg6QMAAOEIADAEOAAA0QgAMOMDAADSCAAw5QMAANQIACDpAwAA1QgAMAQ4AADFCAAw4wMAAMYIADDlAwAAyAgAIOkDAADJCAAwBDgAALwIADDjAwAAvQgAMOUDAAC_CAAg6QMAAOUGADAEOAAAswgAMOMDAAC0CAAw5QMAALYIACDpAwAAhAcAMAQ4AACqCAAw4wMAAKsIADDlAwAArQgAIOkDAACEBwAwBDgAAKEIADDjAwAAoggAMOUDAACkCAAg6QMAAJkIADAEOAAAlQgAMOMDAACWCAAw5QMAAJgIACDpAwAAmQgAMAQ4AACMCAAw4wMAAI0IADDlAwAAjwgAIOkDAACWBgAwBDgAAIMIADDjAwAAhAgAMOUDAACGCAAg6QMAAPsHADAEOAAA9wcAMOMDAAD4BwAw5QMAAPoHACDpAwAA-wcAMAQ4AADrBwAw4wMAAOwHADDlAwAA7gcAIOkDAADvBwAwBDgAAOIHADDjAwAA4wcAMOUDAADlBwAg6QMAANQFADAEOAAA1gcAMOMDAADXBwAw5QMAANkHACDpAwAA2gcAMAIBAAC6BwAgyAMAALIFACAAAAAAAAAAAAAAAAAAAAAABhEAAPoFACAYAAD7BQAgiwMAALIFACCMAwAAsgUAII0DAACyBQAgjgMAALIFACACAQAAugcAICgAAM0JACADAQAAugcAIAwAALoHACASAADKCQAgBQEAALoHACAQAADUCQAgEQAA-gUAIBYAAMoJACClAwAAsgUAIAUBAAC6BwAgFgAAygkAIBwAAMgJACCsAwAAsgUAILQDAACyBQAgBgwAALoHACAOAADHCQAgrAMAALIFACCtAwAAsgUAIK4DAACyBQAgrwMAALIFACAEEQAA-gUAIBkAALoHACAaAAC6BwAg6QIAALIFACAK5wIBAAAAAeoCQAAAAAGBA0AAAAABgwMIAAAAAYQDAQAAAAGGAwAAAMcDAooDAAAAigMCiwMBAAAAAcQDAgAAAAHFAwEAAAABCOcCAQAAAAHqAkAAAAAB_QIBAAAAAf4CAQAAAAH_AgIAAAABvgMAAADCAwLCAwIAAAABwwMBAAAAAQXnAgEAAAAB6gJAAAAAAbYDQAAAAAG5AwEAAAABugMCAAAAAQXnAgEAAAAB6gJAAAAAAbUDAQAAAAG2A0AAAAABtwNAAAAAAQfnAgEAAAAB6gJAAAAAAfoCAQAAAAGoAwEAAAABvgMBAAAAAb8DAQAAAAHAAyAAAAABBecCAQAAAAHqAkAAAAABuwMBAAAAAbwDAQAAAAG9AwEAAAABDOcCAQAAAAHqAkAAAAAB_AIBAAAAAYEDQAAAAAGoAwEAAAABqgMBAAAAAasDAQAAAAGsAwEAAAABsQMIAAAAAbIDIAAAAAGzAyAAAAABtANAAAAAAQ3nAgEAAAAB6gJAAAAAAfwCAQAAAAGBA0AAAAABqAMBAAAAAakDCAAAAAGqAwEAAAABqwMBAAAAAawDAQAAAAGtA0AAAAABrgMBAAAAAa8DAQAAAAGwAyAAAAABB-cCAQAAAAHqAkAAAAABgQNAAAAAAYYDAAAApwMCpAMBAAAAAaUDCAAAAAGnAwEAAAABEOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAGGAwAAAJsDApcDAQAAAAGYAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABEOcCAQAAAAHqAkAAAAABgQNAAAAAAYYDAAAAmwMClwMBAAAAAZgDAQAAAAGZAwEAAAABmwNAAAAAAZwDAQAAAAGdAwEAAAABngMBAAAAAZ8DCAAAAAGgAwEAAAABoQMBAAAAAaIDAQAAAAGjAwEAAAABBucCAQAAAAHoAgIAAAAB6QIBAAAAAeoCQAAAAAHsAgEAAAAB7QIBAAAAAQbnAgEAAAAB6AICAAAAAekCAQAAAAHqAkAAAAAB6wIBAAAAAe0CAQAAAAEK5wIBAAAAAeoCQAAAAAH6AgEAAAABkAMAAACQAwKRAwgAAAABkwMAAACTAwOUA0AAAAABlQMBAAAAAZcDAQAAAAGYAwEAAAABBOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAEE5wIBAAAAAeoCQAAAAAGBA0AAAAABmQMBAAAAAQjnAgEAAAAB6gJAAAAAAfwCAQAAAAH9AgEAAAAB_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_QkAIAMAAABxACA4AAD9CQAgOQAAgQoAICsAAABxACACAADCBwAgBQAAwwcAIAcAAMQHACAIAADFBwAgCQAAxgcAIAoAAMcHACAdAADJBwAgHgAAygcAIB8AAMsHACAgAADMBwAgIQAAzQcAICIAAM4HACAjAADPBwAgJAAA0AcAICUAANEHACAmAADSBwAgKQAA0wcAICoAANQHACArAADVBwAgMQAAgQoAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIbMDIADeBgAhtANAAPAFACHFAwEAugUAIckDAQC4BQAhygMBALgFACHLAwEAuAUAIc0DAADAB80DIs4DAQC6BQAhzwMBALoFACHQAyAA3gYAIdEDQADwBQAh0gMgAN4GACHTAyAA3gYAIdUDAADBB9UDItYDQADwBQAh1wNAAPAFACHYAwIAuQUAIdkDQADwBQAh2gMCALkFACEpAgAAwgcAIAUAAMMHACAHAADEBwAgCAAAxQcAIAkAAMYHACAKAADHBwAgHQAAyQcAIB4AAMoHACAfAADLBwAgIAAAzAcAICEAAM0HACAiAADOBwAgIwAAzwcAICQAANAHACAlAADRBwAgJgAA0gcAICkAANMHACAqAADUBwAgKwAA1QcAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIbMDIADeBgAhtANAAPAFACHFAwEAugUAIckDAQC4BQAhygMBALgFACHLAwEAuAUAIc0DAADAB80DIs4DAQC6BQAhzwMBALoFACHQAyAA3gYAIdEDQADwBQAh0gMgAN4GACHTAyAA3gYAIdUDAADBB9UDItYDQADwBQAh1wNAAPAFACHYAwIAuQUAIdkDQADwBQAh2gMCALkFACEpAgAAqgkAIAUAAKsJACAHAACsCQAgCQAArgkAIAoAAK8JACALAACwCQAgHQAAsQkAIB4AALIJACAfAACzCQAgIAAAtAkAICEAALUJACAiAAC2CQAgIwAAtwkAICQAALgJACAlAAC5CQAgJgAAugkAICkAALsJACAqAAC8CQAgKwAAvQkAIOcCAQAAAAHqAkAAAAABgQNAAAAAAbMDIAAAAAG0A0AAAAABxQMBAAAAAckDAQAAAAHKAwEAAAABywMBAAAAAc0DAAAAzQMCzgMBAAAAAc8DAQAAAAHQAyAAAAAB0QNAAAAAAdIDIAAAA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_AIBALgFACGBA0AAuwUAIZkDAQC4BQAhqAMBALgFACGpAwgA4wUAIaoDAQC4BQAhqwMBALgFACGsAwEAugUAIa0DQADwBQAhrgMBALoFACGvAwEAugUAIbADIADeBgAhDwwAAN8GACDnAgEAuAUAIeoCQAC7BQAh_AIBALgFACGBA0AAuwUAIZkDAQC4BQAhqAMBALgFACGpAwgA4wUAIaoDAQC4BQAhqwMBALgFACGsAwEAugUAIa0DQADwBQAhrgMBALoFACGvAwEAugUAIbADIADeBgAhCwEAANYGACAQAADVBgAgFgAA2AYAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAGGAwAAAKcDAqQDAQAAAAGlAwgAAAABpwMBAAAAAQIAAAApACA4AACkCgAgDwEAAIwHACAWAACOBwAg5wIBAAAAAeoCQAAAAAH7AgEAAAAB_AIBAAAAAYEDQAAAAAGoAwEAAAABqgMBAAAAAasDAQAAAAGsAwEAAAABsQMIAAAAAbIDIAAAAAGzAyAAAAABtANAAAAAAQIAAAAfACA4AACmCgAgKQIAAKoJACAFAACrCQAgBwAArAkAIAgAAK0JACAJAACuCQAgCgAArwkAIAsAALAJACAdAACxCQAgHgAAsgkAIB8AALMJACAgAAC0CQAgIgAAtgkAICMAALcJACAkAAC4CQAgJQAAuQkAICYAALoJACApAAC7CQAgKgAAvAkAICsAAL0JACDnAgEAAAAB6gJAAAAAAYEDQAAAAAGzAyAAAAABtANAAAAAAcUDAQAAAAHJAwEAAAABygMBAAAAAcsDAQAAAAHNAwAAAM0DAs4DAQAAAAHPAwEAAAAB0AMgAAAAAdEDQAAAAAHSAyAAAAAB0wMgAAAAAdUDAAAA1QMC1gNAAAAAAdcDQAAAAAHYAwIAAAAB2QNAAAAAAdoDAgAAAAECAAAAAQAgOAAAqAoAICkCAACqCQAgBQAAqwkAIAcAAKwJACAIAACtCQAgCQAArgkAIAoAAK8JACALAACwCQAgHQAAsQkAIB4AALIJACAfAACzCQAgIQAAtQkAICIAALYJACAjAAC3CQAgJAAAuAkAICUAALkJACAmAAC6CQAgKQAAuwkAICoAALwJACArAAC9CQAg5wIBAAAAAeoCQAAAAAGBA0AAAAABswMgAAAAAbQDQAAAAAHFAwEAAAAByQMBAAAAAcoDAQAAAAHLAwEAAAABzQMAAADNAwLOAwEAAAABzwMBAAAAAdADIAAAAAHRA0AAAAAB0gMgAAAAAdMDIAAAAAHVAwAAANUDAtYDQAAAAAHXA0AAAAAB2AMCAAAAAdkDQAAAAAHaAwIAAAABAgAAAAEAIDgAAKoKACADAAAAJgAgOAAApAoAIDkAAK4KACANAAAAJgAgAQAAxAYAIBAAAMMGACAWAADGBgAgMQAArgoAIOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIYEDQAC7BQAhhgMAAMIGpwMipAMBALgFACGlAwgAggYAIacDAQC4BQAhCwEAAMQGACAQAADDBgAgFgAAxgYAIOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIYEDQAC7BQAhhgMAAMIGpwMipAMBALgFACGlAwgAggYAIacDAQC4BQAhAwAAAB0AIDgAAKYKACA5AACxCgAgEQAAAB0AIAEAAPQGACAWAAD2BgAgMQAAsQoAIOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIfwCAQC4BQAhgQNAALsFACGoAwEAuAUAIaoDAQC4BQAhqwMBALgFACGsAwEAugUAIbEDCADjBQAhsgMgAN4GACGzAyAA3gYAIbQDQADwBQAhDwEAAPQGACAWAAD2BgAg5wIBALgFACHqAkAAuwUAIfsCAQC4BQAh_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_AIBAAAAAYEDQAAAAAGoAwEAAAABqgMBAAAAAasDAQAAAAGsAwEAAAABsQMIAAAAAbIDIAAAAAGzAyAAAAABtANAAAAAAQIAAAAfACA4AADDCgAgCwEAANYGACAQAADVBgAgEQAA1wYAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAGGAwAAAKcDAqQDAQAAAAGlAwgAAAABpwMBAAAAAQIAAAApACA4AADFCgAgKQIAAKoJACAFAACrCQAgBwAArAkAIAgAAK0JACAJAACuCQAgCgAArwkAIAsAALAJACAdAACxCQAgHgAAsgkAIB8AALMJACAgAAC0CQAgIQAAtQkAICIAALYJACAjAAC3CQAgJQAAuQkAICYAALoJACApAAC7CQAgKgAAvAkAICsAAL0JACDnAgEAAAAB6gJAAAAAAYEDQAAAAAGzAyAAAAABtANAAAAAAcUDAQAAAAHJAwEAAAABygMBAAAAAcsDAQAAAAHNAwAAAM0DAs4DAQAAAAHPAwEAAAAB0AMgAAAAAdEDQAAAAAHSAyAAAAAB0wMgAAAAAdUDAAAA1QMC1gNAAAAAAdcDQAAAAAHYAwIAAAAB2QNAAAAAAdoDAgAAAAECAAAAAQAgOAAAxwoAIAcBAACfBgAgDAAAngYAIOcCAQAAAAHqAkAAAAAB-wIBAAAAAYEDQAAAAAGZAwEAAAABAgAAAE0AIDgAAMkKACADAAAAHQAgOAAAwwoAIDkAAM0KACARAAAAHQAgAQAA9AYAIBwAAPUGACAxAADNCgAg5wIBALgFACHqAkAAuwUAIfsCAQC4BQAh_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_QIBAAAAAf4CAQAAAAH_AgIAAAABgAMCAAAAAYEDQAAAAAECAAAAUgAgOAAA7goAIAMAAABxACA4AADsCgAgOQAA8goAICsAAABxACACAADCBwAgBQAAwwcAIAcAAMQHACAIAADFBwAgCQAAxgcAIAoAAMcHACALAADIBwAgHQAAyQcAIB4AAMoHACAfAADLBwAgIAAAzAcAICEAAM0HACAiAADOBwAgIwAAzwcAICQAANAHACAlAADRBwAgJgAA0gcAICkAANMHACArAADVBwAgMQAA8goAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIbMDIADeBgAhtANAAPAFACHFAwEAugUAIckDAQC4BQAhygMBALgFACHLAwEAuAUAIc0DAADAB80DIs4DAQC6BQAhzwMBALoFACHQAyAA3gYAIdEDQADwBQAh0gMgAN4GACHTAyAA3gYAIdUDAADBB9UDItYDQADwBQAh1wNAAPAFACHYAwIAuQUAIdkDQADwBQAh2gMCALkFACEpAgAAwgcAIAUAAMMHACAHAADEBwAgCAAAxQcAIAkAAMYHACAKAADHBwAgCwAAyAcAIB0AAMkHACAeAADKBwAgHwAAywcAICAAAMwHACAhAADNBwAgIgAAzgcAICMAAM8HACAkAADQBwAgJQAA0QcAICYAANIHACApAADTBwAgKwAA1QcAIOcCAQC4BQAh6gJAALsFACGBA0AAuwUAIbMDIADeBgAhtANAAPAFACHFAwEAugUAIckDAQC4BQAhygMBALgFACHLAwEAuAUAIc0DAADAB80DIs4DAQC6BQAhzwMBALoFACHQAyAA3gYAIdEDQADwBQAh0gMgAN4GACHTAyAA3gYAIdUDAADBB9UDItYDQADwBQAh1wNAAPAFACHYAwIAuQUAIdkDQADwBQAh2gMCALkFACEDAAAAUAAgOAAA7goAIDkAAPUKACAMAAAAUAAgAQAAzgUAIDEAAPUKACDnAgEAuAUAIeoCQAC7BQAh-wIBALgFACH8AgEAuAUAIf0CAQC4BQAh_gIBALgFACH_AgIAuQUAIYADAgC5BQAhgQNAALsFACEKAQAAzgUAIOcCAQC4BQAh6gJAALsFACH7AgEAuAUAIfwCAQC4BQAh_QIBALgFACH-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-AB8_ACBAACFBACIAAAAAAAUPAB4-AB8_ACBAACFBACIBAQABAQEAAQMPACdAAChBACkAAAADDwAnQAAoQQApAQEAAQEBAAEFDwAuPgAvPwAwQAAxQQAyAAAAAAAFDwAuPgAvPwAwQAAxQQAyAQYAAQEGAAEFDwA3PgA4PwA5QAA6QQA7AAAAAAAFDwA3PgA4PwA5QAA6QQA7AQYAAQEGAAEDDwBAQABBQQBCAAAAAw8AQEAAQUEAQgEGAAEBBgABAw8AR0AASEEASQAAAAMPAEdAAEhBAEkBBgABAQYAAQUPAE4-AE8_AFBAAFFBAFIAAAAAAAUPAE4-AE8_AFBAAFFBAFIBBgABAQYAAQMPAFdAAFhBAFkAAAADDwBXQABYQQBZAQEAAQEBAAEFDwBePgBfPwBgQABhQQBiAAAAAAAFDwBePgBfPwBgQABhQQBiAQwAAQEMAAEFDwBnPgBoPwBpQABqQQBrAAAAAAAFDwBnPgBoPwBpQABqQQBrAgEAARAADAIBAAEQAAwFDwBwPgBxPwByQABzQQB0AAAAAAAFDwBwPgBxPwByQABzQQB0BAEAAQwAAQ3vAgkV8AILBAEAAQwAAQ32AgkV9wILBQ8AeT4Aej8Ae0AAfEEAfQAAAAAABQ8AeT4Aej8Ae0AAfEEAfQIBAAEMAAECAQABDAABAw8AggFAAIMBQQCEAQAAAAMPAIIBQACDAUEAhAEEDaADCRMADxQAARWfAwsEDacDCRMADxQAARWmAwsFDwCJAT4AigE_AIsBQACMAUEAjQEAAAAAAAUPAIkBPgCKAT8AiwFAAIwBQQCNAQERAAoBEQAKBQ8AkgE-AJMBPwCUAUAAlQFBAJYBAAAAAAAFDwCSAT4AkwE_AJQBQACVAUEAlgECAQABFwASAgEAARcAEgUPAJsBPgCcAT8AnQFAAJ4BQQCfAQAAAAAABQ8AmwE-AJwBPwCdAUAAngFBAJ8BAQEAAQEBAAEFDwCkAT4ApQE_AKYBQACnAUEAqAEAAAAAAAUPAKQBPgClAT8ApgFAAKcBQQCoAQIZAAEnABYCGQABJwAWAw8ArQFAAK4BQQCvAQAAAAMPAK0BQACuAUEArwEDEQAKGQABGgABAxEAChkAARoAAQUPALQBPgC1AT8AtgFAALcBQQC4AQAAAAAABQ8AtAE-ALUBPwC2AUAAtwFBALgBLAIBLXABLnMBL3QBMHUBMncBM3kaNHobNXwBNn4aN38cOoABATuBAQE8ggEaQoUBHUOGASNEiAECRYkBAkaLAQJHjAECSI0BAkmPAQJKkQEaS5IBJEyUAQJNlgEaTpcBJU-YAQJQmQECUZoBGlKdASZTngEqVJ8BA1WgAQNWoQEDV6IBA1ijAQNZpQEDWqcBGluoAStcqgEDXawBGl6tASxfrgEDYK8BA2GwARpiswEtY7QBM2S1AQRltgEEZrcBBGe4AQRouQEEabsBBGq9ARprvgE0bMABBG3CARpuwwE1b8QBBHDFAQRxxgEacskBNnPKATx0ywEHdcwBB3bNAQd3zgEHeM8BB3nRAQd60wEae9QBPXzWAQd92AEaftkBPn_aAQeAAdsBB4EB3AEaggHfAT-DAeABQ4QB4QEIhQHiAQiGAeMBCIcB5AEIiAHlAQiJAecBCIoB6QEaiwHqAUSMAewBCI0B7gEajgHvAUWPAfABCJAB8QEIkQHyARqSAfUBRpMB9gFKlAH3AQWVAfgBBZYB-QEFlwH6AQWYAfsBBZkB_QEFmgH_ARqbAYACS5wBggIFnQGEAhqeAYUCTJ8BhgIFoAGHAgWhAYgCGqIBiwJNowGMAlOkAY0CBqUBjgIGpgGPAganAZACBqgBkQIGqQGTAgaqAZUCGqsBlgJUrAGYAgatAZoCGq4BmwJVrwGcAgawAZ0CBrEBngIasgGhAlazAaICWrQBowIJtQGkAgm2AaUCCbcBpgIJuAGnAgm5AakCCboBqwIauwGsAlu8Aa4CCb0BsAIavgGxAly_AbICCcABswIJwQG0AhrCAbcCXcMBuAJjxAG5AgzFAboCDMYBuwIMxwG8AgzIAb0CDMkBvwIMygHBAhrLAcICZMwBxAIMzQHGAhrOAccCZc8ByAIM0AHJAgzRAcoCGtIBzQJm0wHOAmzUAc8CC9UB0AIL1gHRAgvXAdICC9gB0wIL2QHVAgvaAdcCGtsB2AJt3AHaAgvdAdwCGt4B3QJu3wHeAgvgAd8CC-EB4AIa4gHjAm_jAeQCdeQB5QIK5QHmAgrmAecCCucB6AIK6AHpAgrpAesCCuoB7QIa6wHuAnbsAfICCu0B9AIa7gH1AnfvAfgCCvAB-QIK8QH6AhryAf0CePMB_gJ-9AH_Ag_1AYADD_YBgQMP9wGCAw_4AYMDD_kBhQMP-gGHAxr7AYgDf_wBigMP_QGMAxr-AY0DgAH_AY4DD4ACjwMPgQKQAxqCApMDgQGDApQDhQGEApUDDoUClgMOhgKXAw6HApgDDogCmQMOiQKbAw6KAp0DGosCngOGAYwCogMOjQKkAxqOAqUDhwGPAqgDDpACqQMOkQKqAxqSAq0DiAGTAq4DjgGUArADEpUCsQMSlgKzAxKXArQDEpgCtQMSmQK3AxKaArkDGpsCugOPAZwCvAMSnQK-AxqeAr8DkAGfAsADEqACwQMSoQLCAxqiAsUDkQGjAsYDlwGkAscDE6UCyAMTpgLJAxOnAsoDE6gCywMTqQLNAxOqAs8DGqsC0AOYAawC0gMTrQLUAxquAtUDmQGvAtYDE7AC1wMTsQLYAxqyAtsDmgGzAtwDoAG0At0DFrUC3gMWtgLfAxa3AuADFrgC4QMWuQLjAxa6AuUDGrsC5gOhAbwC6AMWvQLqAxq-AusDogG_AuwDFsAC7QMWwQLuAxrCAvEDowHDAvIDqQHEAvMDF8UC9AMXxgL1AxfHAvYDF8gC9wMXyQL5AxfKAvsDGssC_AOqAcwC_gMXzQKABBrOAoEEqwHPAoIEF9ACgwQX0QKEBBrSAocErAHTAogEsAHUAokEFNUCigQU1gKLBBTXAowEFNgCjQQU2QKPBBTaApEEGtsCkgSxAdwClAQU3QKWBBreApcEsgHfApgEFOACmQQU4QKaBBriAp0EswHjAp4EuQE"
    };
    config.compilerWasm = {
      getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
      getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
      },
      importName: "./query_compiler_fast_bg.js"
    };
  }
});

// app/generated/prisma/internal/prismaNamespace.ts
var runtime2, getExtensionContext, NullTypes2, TransactionIsolationLevel, defineExtension;
var init_prismaNamespace = __esm({
  "app/generated/prisma/internal/prismaNamespace.ts"() {
    "use strict";
    runtime2 = __toESM(require("@prisma/client/runtime/client"));
    getExtensionContext = runtime2.Extensions.getExtensionContext;
    NullTypes2 = {
      DbNull: runtime2.NullTypes.DbNull,
      JsonNull: runtime2.NullTypes.JsonNull,
      AnyNull: runtime2.NullTypes.AnyNull
    };
    TransactionIsolationLevel = runtime2.makeStrictEnum({
      ReadUncommitted: "ReadUncommitted",
      ReadCommitted: "ReadCommitted",
      RepeatableRead: "RepeatableRead",
      Serializable: "Serializable"
    });
    defineExtension = runtime2.Extensions.defineExtension;
  }
});

// app/generated/prisma/enums.ts
var init_enums = __esm({
  "app/generated/prisma/enums.ts"() {
    "use strict";
  }
});

// app/generated/prisma/client.ts
var path, import_node_url, import_meta, PrismaClient;
var init_client = __esm({
  "app/generated/prisma/client.ts"() {
    "use strict";
    path = __toESM(require("node:path"));
    import_node_url = require("node:url");
    init_class();
    init_prismaNamespace();
    init_enums();
    init_enums();
    import_meta = {};
    globalThis["__dirname"] = path.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
    PrismaClient = getPrismaClientClass();
  }
});

// app/lib/jwt.ts
function getSecretKey() {
  return new TextEncoder().encode(getJwtSecret());
}
async function verifyToken(token) {
  try {
    const { payload } = await (0, import_jose.jwtVerify)(token, getSecretKey());
    const { userId, email, role, tokenVersion } = payload;
    if (typeof userId !== "string" || typeof email !== "string" || typeof role !== "string") {
      return null;
    }
    return {
      userId,
      email,
      role,
      tokenVersion: typeof tokenVersion === "number" ? tokenVersion : 0
    };
  } catch {
    return null;
  }
}
var import_jose;
var init_jwt = __esm({
  "app/lib/jwt.ts"() {
    "use strict";
    import_jose = require("jose");
    init_jwt_secret();
  }
});

// app/lib/rls.ts
var rls_exports = {};
__export(rls_exports, {
  ANONYMOUS_RLS: () => ANONYMOUS_RLS,
  BYPASS_RLS: () => BYPASS_RLS,
  applyRlsToPgClient: () => applyRlsToPgClient,
  getRlsContext: () => getRlsContext,
  resolveRlsContextFromRequest: () => resolveRlsContextFromRequest,
  rlsContextFromAuth: () => rlsContextFromAuth,
  runWithRls: () => runWithRls,
  withAnonymousRls: () => withAnonymousRls,
  withBypassRls: () => withBypassRls,
  withRequestRls: () => withRequestRls
});
function getRlsContext() {
  return rlsStorage.getStore() ?? ANONYMOUS_RLS;
}
function rlsContextFromAuth(auth) {
  if (!auth) return ANONYMOUS_RLS;
  return { mode: "user", userId: auth.userId, role: auth.role };
}
function runWithRls(ctx, fn) {
  return rlsStorage.run(ctx, fn);
}
async function withRequestRls(req, fn) {
  const token = req.cookies.get("token")?.value;
  const auth = token ? await verifyToken(token) : null;
  return runWithRls(rlsContextFromAuth(auth), fn);
}
function withBypassRls(fn) {
  return runWithRls(BYPASS_RLS, fn);
}
function withAnonymousRls(fn) {
  return runWithRls(ANONYMOUS_RLS, fn);
}
function parseCookieHeader(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) return [trimmed, ""];
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      try {
        return [key, decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    })
  );
}
async function resolveRlsContextFromRequest(url, cookieHeader) {
  const pathname = (() => {
    try {
      return new URL(url ?? "/", "http://localhost").pathname;
    } catch {
      return url ?? "/";
    }
  })();
  if (pathname.startsWith("/api/cron/")) {
    return BYPASS_RLS;
  }
  if (AUTH_BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return BYPASS_RLS;
  }
  const token = parseCookieHeader(cookieHeader).token;
  if (!token) return ANONYMOUS_RLS;
  const auth = await verifyToken(token);
  return rlsContextFromAuth(auth);
}
async function applyRlsToPgClient(client2) {
  try {
    const ctx = getRlsContext();
    if (ctx.mode === "bypass") {
      await client2.query(
        `SELECT set_config('app.bypass_rls', 'true', false),
                set_config('app.user_id', '', false),
                set_config('app.user_role', '', false)`
      );
      return;
    }
    if (ctx.mode === "anonymous") {
      await client2.query(
        `SELECT set_config('app.bypass_rls', 'false', false),
                set_config('app.user_id', '', false),
                set_config('app.user_role', '', false)`
      );
      return;
    }
    await client2.query(
      `SELECT set_config('app.bypass_rls', 'false', false),
              set_config('app.user_id', $1, false),
              set_config('app.user_role', $2, false)`,
      [ctx.userId, ctx.role]
    );
  } catch (error) {
    console.error("[RLS] Impossible d'appliquer le contexte sur la connexion pg:", error);
    throw error;
  }
}
var import_node_async_hooks, rlsStorage, ANONYMOUS_RLS, BYPASS_RLS, AUTH_BYPASS_PATHS;
var init_rls = __esm({
  "app/lib/rls.ts"() {
    "use strict";
    import_node_async_hooks = require("node:async_hooks");
    init_jwt();
    rlsStorage = new import_node_async_hooks.AsyncLocalStorage();
    ANONYMOUS_RLS = { mode: "anonymous" };
    BYPASS_RLS = { mode: "bypass" };
    AUTH_BYPASS_PATHS = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/email/send-otp",
      "/api/auth/email/verify-otp"
    ];
  }
});

// app/lib/prisma.ts
function createRlsPool() {
  const pool = new import_pg.default.Pool({
    connectionString: getDatabaseUrl(),
    max: parseInt(process.env.PG_POOL_MAX ?? "20", 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS ?? "30000", 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECT_TIMEOUT_MS ?? "10000", 10)
  });
  const originalConnect = pool.connect.bind(pool);
  pool.connect = ((...args) => {
    const callback = args[0];
    if (typeof callback === "function") {
      return originalConnect(
        (err, client2, release) => {
          if (err || !client2) {
            callback(err, client2, release);
            return;
          }
          void applyRlsToPgClient(client2).then(() => callback(null, client2, release)).catch((applyErr) => callback(applyErr, client2, release));
        }
      );
    }
    return originalConnect().then(async (client2) => {
      await applyRlsToPgClient(client2);
      return client2;
    });
  });
  return pool;
}
function createPrismaClient() {
  const client2 = new PrismaClient({ adapter });
  client2.__generation = PRISMA_CLIENT_GENERATION;
  return client2;
}
function isStalePrismaClient(client2) {
  const tagged = client2;
  if (tagged.__generation !== PRISMA_CLIENT_GENERATION) return true;
  return !("providerKycDocument" in client2) || !("providerPortfolioItem" in client2) || !("providerSubscription" in client2);
}
function getPrismaClient2() {
  const cached2 = globalForPrisma.prisma;
  if (cached2 && (process.env.NODE_ENV === "production" || !isStalePrismaClient(cached2))) {
    return cached2;
  }
  const client2 = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client2;
  }
  return client2;
}
async function disconnectPrisma() {
  await prisma.$disconnect();
  await rlsPool.end();
}
var import_adapter_pg, import_pg, rlsPool, adapter, globalForPrisma, PRISMA_CLIENT_GENERATION, prisma, prisma_default;
var init_prisma = __esm({
  "app/lib/prisma.ts"() {
    "use strict";
    init_client();
    import_adapter_pg = require("@prisma/adapter-pg");
    import_pg = __toESM(require("pg"));
    init_rls();
    init_database_url();
    validateDatabaseUrl();
    rlsPool = createRlsPool();
    adapter = new import_adapter_pg.PrismaPg(rlsPool);
    globalForPrisma = globalThis;
    PRISMA_CLIENT_GENERATION = 6;
    prisma = getPrismaClient2();
    prisma_default = prisma;
  }
});

// app/lib/redis.ts
function getRedisClient() {
  if (client) return client;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  client = new import_ioredis.default(url, {
    maxRetriesPerRequest: 2,
    lazyConnect: true
  });
  return client;
}
async function disconnectRedis() {
  if (!client) return;
  await client.quit();
  client = null;
}
var import_ioredis, client, REALTIME_REDIS_CHANNEL;
var init_redis = __esm({
  "app/lib/redis.ts"() {
    "use strict";
    import_ioredis = __toESM(require("ioredis"));
    client = null;
    REALTIME_REDIS_CHANNEL = "tairo:realtime";
  }
});

// app/lib/realtime/hub.ts
function getMessagingHub() {
  if (!globalForHub.messagingHub) {
    globalForHub.messagingHub = new MessagingHub();
    globalForHub.messagingHub.startHeartbeat();
  }
  return globalForHub.messagingHub;
}
var MessagingHub, globalForHub;
var init_hub = __esm({
  "app/lib/realtime/hub.ts"() {
    "use strict";
    init_redis();
    MessagingHub = class {
      constructor() {
        this.socketsByUser = /* @__PURE__ */ new Map();
        this.heartbeatInterval = null;
        this.redisSubscribed = false;
      }
      addSocket(userId, socket) {
        const set = this.socketsByUser.get(userId) ?? /* @__PURE__ */ new Set();
        set.add(socket);
        this.socketsByUser.set(userId, set);
      }
      removeSocket(userId, socket) {
        const set = this.socketsByUser.get(userId);
        if (!set) return;
        set.delete(socket);
        if (set.size === 0) {
          this.socketsByUser.delete(userId);
        }
      }
      deliverLocal(userIds, event) {
        const payload = JSON.stringify(event);
        const delivered = /* @__PURE__ */ new Set();
        for (const userId of userIds) {
          const sockets = this.socketsByUser.get(userId);
          if (!sockets) continue;
          for (const socket of sockets) {
            if (delivered.has(socket)) continue;
            if (socket.readyState !== socket.OPEN) continue;
            socket.send(payload);
            delivered.add(socket);
          }
        }
      }
      publishToUsers(userIds, event) {
        this.deliverLocal(userIds, event);
        const redis = getRedisClient();
        if (!redis) return;
        void redis.publish(
          REALTIME_REDIS_CHANNEL,
          JSON.stringify({ userIds, event })
        ).catch(() => {
        });
      }
      startHeartbeat() {
        if (this.heartbeatInterval) return;
        this.heartbeatInterval = setInterval(() => {
          for (const sockets of this.socketsByUser.values()) {
            for (const socket of sockets) {
              if (socket.isAlive === false) {
                socket.terminate();
                continue;
              }
              socket.isAlive = false;
              socket.ping();
            }
          }
        }, 3e4);
        this.heartbeatInterval.unref?.();
        void this.subscribeRedis();
      }
      async subscribeRedis() {
        if (this.redisSubscribed) return;
        const redis = getRedisClient();
        if (!redis) return;
        try {
          const subscriber = redis.duplicate();
          await subscriber.subscribe(REALTIME_REDIS_CHANNEL);
          subscriber.on("message", (_channel, message) => {
            try {
              const parsed = JSON.parse(message);
              if (parsed?.userIds && parsed.event) {
                this.deliverLocal(parsed.userIds, parsed.event);
              }
            } catch {
            }
          });
          this.redisSubscribed = true;
        } catch {
        }
      }
      shutdown() {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        for (const sockets of this.socketsByUser.values()) {
          for (const socket of sockets) {
            socket.terminate();
          }
        }
        this.socketsByUser.clear();
      }
    };
    globalForHub = globalThis;
  }
});

// app/lib/realtime/ws-server.ts
var ws_server_exports = {};
__export(ws_server_exports, {
  MESSAGING_WS_PATH: () => MESSAGING_WS_PATH,
  attachMessagingWebSocket: () => attachMessagingWebSocket
});
function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((part) => {
      const trimmed = part.trim();
      const eq = trimmed.indexOf("=");
      if (eq === -1) return [trimmed, ""];
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      try {
        return [key, decodeURIComponent(value)];
      } catch {
        return [key, value];
      }
    })
  );
}
function getTokenFromRequest(request) {
  const cookies = parseCookies(request.headers.cookie);
  return cookies.token ?? null;
}
async function verifyWsAuth(token) {
  const auth = await verifyToken(token);
  if (!auth) return null;
  const user = await runWithRls(
    { mode: "user", userId: auth.userId, role: auth.role },
    () => prisma_default.user.findUnique({
      where: { id: auth.userId },
      select: { suspendedAt: true, tokenVersion: true }
    })
  );
  if (!user || user.suspendedAt || user.tokenVersion !== auth.tokenVersion) {
    return null;
  }
  return auth;
}
function safeParseClientEvent(raw2) {
  try {
    const data = JSON.parse(raw2);
    if (!data || typeof data !== "object" || !("type" in data)) return null;
    return data;
  } catch {
    return null;
  }
}
function attachMessagingWebSocket(server, nextUpgradeHandler) {
  const wss = new import_ws.WebSocketServer({ noServer: true });
  const hub = getMessagingHub();
  server.on("upgrade", (request, socket, head) => {
    const pathname = (() => {
      try {
        return new URL(request.url ?? "", `http://${request.headers.host}`).pathname;
      } catch {
        return "";
      }
    })();
    if (pathname !== WS_PATH) {
      if (nextUpgradeHandler) {
        void nextUpgradeHandler(request, socket, head);
        return;
      }
      socket.destroy();
      return;
    }
    const token = getTokenFromRequest(request);
    if (!token) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    void verifyWsAuth(token).then((auth) => {
      if (!auth) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        const client2 = ws;
        client2.userId = auth.userId;
        client2.isAlive = true;
        wss.emit("connection", client2, request);
      });
    }).catch(() => {
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      socket.destroy();
    });
  });
  wss.on("connection", (ws) => {
    const userId = ws.userId;
    if (!userId) {
      ws.close(1008, "Non autoris\xE9");
      return;
    }
    hub.addSocket(userId, ws);
    ws.send(JSON.stringify({ type: "connected" }));
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    ws.on("message", (raw2) => {
      const text = typeof raw2 === "string" ? raw2 : raw2.toString("utf8");
      const event = safeParseClientEvent(text);
      if (!event) return;
      if (event.type === "ping") {
        ws.send(JSON.stringify({ type: "connected" }));
      }
    });
    ws.on("close", () => {
      hub.removeSocket(userId, ws);
    });
    ws.on("error", () => {
      hub.removeSocket(userId, ws);
    });
  });
  return {
    wss,
    async close() {
      hub.shutdown();
      await new Promise((resolve, reject) => {
        wss.close((err) => err ? reject(err) : resolve());
      });
    }
  };
}
var import_ws, WS_PATH, MESSAGING_WS_PATH;
var init_ws_server = __esm({
  "app/lib/realtime/ws-server.ts"() {
    "use strict";
    import_ws = require("ws");
    init_jwt();
    init_prisma();
    init_rls();
    init_hub();
    WS_PATH = "/ws/messaging";
    MESSAGING_WS_PATH = WS_PATH;
  }
});

// app/lib/csrf.ts
function isCsrfExemptPath(pathname) {
  return CSRF_EXEMPT_PATHS.some((prefix) => pathname.startsWith(prefix));
}
function shouldEnforceCsrf(method, pathname) {
  if (!MUTATING_METHODS.has(method.toUpperCase())) {
    return false;
  }
  if (!pathname.startsWith("/api")) {
    return false;
  }
  return !isCsrfExemptPath(pathname);
}
function csrfTokensMatch(cookieToken, headerToken) {
  if (!cookieToken || !headerToken) {
    return false;
  }
  if (cookieToken.length !== headerToken.length) {
    return false;
  }
  return import_crypto.default.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}
var import_crypto, CSRF_MAX_AGE_SECONDS, MUTATING_METHODS, CSRF_EXEMPT_PATHS;
var init_csrf = __esm({
  "app/lib/csrf.ts"() {
    "use strict";
    import_crypto = __toESM(require("crypto"));
    CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
    MUTATING_METHODS = /* @__PURE__ */ new Set(["POST", "PUT", "PATCH", "DELETE"]);
    CSRF_EXEMPT_PATHS = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/csrf",
      "/api/cron/"
    ];
  }
});

// app/lib/request-limits.ts
function isUploadApiPath(pathname) {
  return UPLOAD_PATH_PATTERNS.some((re) => re.test(pathname));
}
function maxBodyBytesForPath(pathname) {
  return isUploadApiPath(pathname) ? MAX_UPLOAD_BODY_BYTES : MAX_API_BODY_BYTES;
}
var MAX_API_BODY_BYTES, MAX_UPLOAD_BODY_BYTES, PAYLOAD_TOO_LARGE_MESSAGE, UPLOAD_PATH_PATTERNS;
var init_request_limits = __esm({
  "app/lib/request-limits.ts"() {
    "use strict";
    MAX_API_BODY_BYTES = 1024 * 1024;
    MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024;
    PAYLOAD_TOO_LARGE_MESSAGE = "Payload trop volumineux";
    UPLOAD_PATH_PATTERNS = [
      /^\/api\/services\/[^/]+\/cover\/?$/,
      /^\/api\/requests\/[^/]+\/cover\/?$/,
      /^\/api\/users\/me\/avatar\/?$/,
      /^\/api\/provider\/portfolio\/?$/,
      /^\/api\/provider\/portfolio\/[^/]+\/?$/,
      /^\/api\/provider\/kyc\/upload\/?$/
    ];
  }
});

// app/lib/rate-limit.ts
var import_server, CLEANUP_INTERVAL_MS, lastCleanup, AUTH_RATE_LIMITS;
var init_rate_limit = __esm({
  "app/lib/rate-limit.ts"() {
    "use strict";
    import_server = require("next/server");
    init_redis();
    init_security_audit();
    CLEANUP_INTERVAL_MS = 5 * 60 * 1e3;
    lastCleanup = Date.now();
    AUTH_RATE_LIMITS = {
      login: { maxAttempts: 10, windowMs: 15 * 60 * 1e3 },
      register: { maxAttempts: 5, windowMs: 60 * 60 * 1e3 },
      forgotPassword: { maxAttempts: 5, windowMs: 15 * 60 * 1e3 },
      verifyOtp: { maxAttempts: 20, windowMs: 15 * 60 * 1e3 }
    };
  }
});

// app/lib/security-audit.ts
function logSecurityEvent(payload) {
  const entry = {
    type: "security_audit",
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...payload
  };
  console.info(JSON.stringify(entry));
}
var init_security_audit = __esm({
  "app/lib/security-audit.ts"() {
    "use strict";
    init_rate_limit();
  }
});

// app/lib/http-security.ts
var http_security_exports = {};
__export(http_security_exports, {
  csrfRejectedResponse: () => csrfRejectedResponse,
  payloadTooLargeResponse: () => payloadTooLargeResponse,
  rejectInvalidCsrf: () => rejectInvalidCsrf,
  rejectOversizedApiBody: () => rejectOversizedApiBody,
  writeJsonError: () => writeJsonError
});
function parseCookieHeader2(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}
function getHeader(headers, name) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
function rejectOversizedApiBody(method, url, headers) {
  if (!url || !method || method === "GET" || method === "HEAD") {
    return false;
  }
  const pathname = (0, import_url.parse)(url, true).pathname ?? "";
  if (!pathname.startsWith("/api")) {
    return false;
  }
  const contentLength = parseInt(getHeader(headers, "content-length") ?? "0", 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return false;
  }
  return contentLength > maxBodyBytesForPath(pathname);
}
function rejectInvalidCsrf(method, url, headers) {
  if (!url || !method) return false;
  const pathname = (0, import_url.parse)(url, true).pathname ?? "";
  if (!shouldEnforceCsrf(method, pathname)) {
    return false;
  }
  const cookies = parseCookieHeader2(getHeader(headers, "cookie"));
  const cookieToken = cookies["csrf-token"];
  const headerToken = getHeader(headers, "x-csrf-token");
  if (csrfTokensMatch(cookieToken, headerToken)) {
    return false;
  }
  logSecurityEvent({
    event: "auth.csrf_rejected",
    path: pathname,
    detail: "CSRF token mismatch or missing"
  });
  return true;
}
function writeJsonError(res, status, error) {
  const body = JSON.stringify({ error });
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}
function payloadTooLargeResponse(res) {
  logSecurityEvent({ event: "request.body_too_large" });
  writeJsonError(res, 413, PAYLOAD_TOO_LARGE_MESSAGE);
}
function csrfRejectedResponse(res) {
  writeJsonError(res, 403, "Requ\xEAte invalide");
}
var import_url;
var init_http_security = __esm({
  "app/lib/http-security.ts"() {
    "use strict";
    import_url = require("url");
    init_csrf();
    init_request_limits();
    init_security_audit();
  }
});

// app/lib/cors.ts
var cors_exports = {};
__export(cors_exports, {
  attachCorsHeadersOnResponse: () => attachCorsHeadersOnResponse,
  buildCorsResponseHeaders: () => buildCorsResponseHeaders,
  getAllowedCorsOrigins: () => getAllowedCorsOrigins,
  isAllowedCorsOrigin: () => isAllowedCorsOrigin,
  resetAllowedCorsOriginsCache: () => resetAllowedCorsOriginsCache,
  resolveCorsForNodeRequest: () => resolveCorsForNodeRequest,
  writeCorsOnlyResponse: () => writeCorsOnlyResponse
});
function normalizeOrigin(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return url.origin;
  } catch {
    return null;
  }
}
function getAllowedCorsOrigins() {
  return [...getAllowedCorsOriginSet()];
}
function getAllowedCorsOriginSet() {
  if (cachedAllowedOrigins) {
    return cachedAllowedOrigins;
  }
  const origins = /* @__PURE__ */ new Set();
  const appOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (appOrigin) {
    origins.add(appOrigin);
  }
  const extra = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(",")) {
      const origin = normalizeOrigin(part);
      if (origin) origins.add(origin);
    }
  }
  cachedAllowedOrigins = origins;
  return origins;
}
function resetAllowedCorsOriginsCache() {
  cachedAllowedOrigins = null;
}
function isAllowedCorsOrigin(origin) {
  return getAllowedCorsOriginSet().has(origin);
}
function getRequestHeader(headers, name) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
function buildAllowHeaders(requested) {
  if (!requested?.trim()) {
    return ALLOWED_REQUEST_HEADERS.join(", ");
  }
  const requestedNames = new Set(
    requested.split(",").map((header) => header.trim().toLowerCase()).filter(Boolean)
  );
  const allowed = ALLOWED_REQUEST_HEADERS.filter(
    (header) => requestedNames.has(header.toLowerCase())
  );
  return allowed.length > 0 ? allowed.join(", ") : ALLOWED_REQUEST_HEADERS.join(", ");
}
function isAllowedPreflightMethod(method) {
  if (!method) return false;
  return ALLOWED_METHODS.includes(
    method.toUpperCase()
  );
}
function buildCorsResponseHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin"
  };
}
function buildPreflightHeaders(origin, accessControlRequestHeaders) {
  return {
    ...buildCorsResponseHeaders(origin),
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": buildAllowHeaders(
      accessControlRequestHeaders
    ),
    "Access-Control-Max-Age": String(PREFLIGHT_MAX_AGE_SECONDS)
  };
}
function resolveCorsForNodeRequest(req) {
  const origin = getRequestHeader(req.headers, "origin");
  if (!origin) {
    return { action: "none" };
  }
  if (!isAllowedCorsOrigin(origin)) {
    if (req.method?.toUpperCase() === "OPTIONS") {
      return { action: "forbidden", status: 403 };
    }
    return { action: "none" };
  }
  if (req.method?.toUpperCase() === "OPTIONS") {
    const requestMethod = getRequestHeader(
      req.headers,
      "access-control-request-method"
    );
    if (!isAllowedPreflightMethod(requestMethod)) {
      return { action: "forbidden", status: 403 };
    }
    return {
      action: "preflight",
      status: 204,
      headers: buildPreflightHeaders(
        origin,
        getRequestHeader(req.headers, "access-control-request-headers")
      )
    };
  }
  return {
    action: "continue",
    headers: buildCorsResponseHeaders(origin)
  };
}
function writeCorsOnlyResponse(res, status, headers) {
  res.writeHead(status, headers);
  res.end();
}
function attachCorsHeadersOnResponse(res, corsHeaders) {
  if (Object.keys(corsHeaders).length === 0) return;
  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function writeHeadWithCors(statusCode, ...args) {
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }
    return originalWriteHead(
      statusCode,
      ...args
    );
  };
  const originalEnd = res.end.bind(res);
  res.end = function endWithCors(...args) {
    for (const [key, value] of Object.entries(corsHeaders)) {
      if (!res.hasHeader(key)) {
        res.setHeader(key, value);
      }
    }
    return originalEnd(...args);
  };
}
var ALLOWED_METHODS, ALLOWED_REQUEST_HEADERS, PREFLIGHT_MAX_AGE_SECONDS, cachedAllowedOrigins;
var init_cors = __esm({
  "app/lib/cors.ts"() {
    "use strict";
    ALLOWED_METHODS = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS"
    ];
    ALLOWED_REQUEST_HEADERS = [
      "Accept",
      "Accept-Language",
      "Authorization",
      "Content-Type",
      "X-CSRF-Token"
    ];
    PREFLIGHT_MAX_AGE_SECONDS = 86400;
    cachedAllowedOrigins = null;
  }
});

// server.ts
var import_http = require("http");
var import_url2 = require("url");
var import_next = __toESM(require("next"));
var import_config = require("dotenv/config");
init_database_url();
init_jwt_secret();
init_prisma();

// app/lib/env.ts
var import_zod = require("zod");
function vapidSubjectSchema() {
  return import_zod.z.string().optional().transform((v) => v?.trim() === "" ? void 0 : v).refine(
    (v) => {
      if (!v) return true;
      if (v.startsWith("mailto:")) {
        return import_zod.z.string().email().safeParse(v.slice("mailto:".length)).success;
      }
      if (v.startsWith("https://")) {
        return import_zod.z.string().url().safeParse(v).success;
      }
      return import_zod.z.string().email().safeParse(v).success;
    },
    {
      message: "VAPID_SUBJECT doit \xEAtre un email, mailto:email ou une URL https://"
    }
  );
}
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: import_zod.z.string().min(1),
  JWT_SECRET: import_zod.z.string().min(32),
  NEXT_PUBLIC_APP_URL: import_zod.z.string().url().optional(),
  CRON_SECRET: import_zod.z.string().min(16).optional(),
  REDIS_URL: import_zod.z.string().url().optional(),
  HOSTNAME: import_zod.z.string().optional(),
  PORT: import_zod.z.string().optional(),
  LOG_LEVEL: import_zod.z.string().optional(),
  BCRYPT_ROUNDS: import_zod.z.coerce.number().int().min(10).max(15).optional(),
  VAPID_SUBJECT: vapidSubjectSchema(),
  PLAYWRIGHT_BASE_URL: import_zod.z.string().url().optional()
});
var cached = null;
function getEnv() {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}
function validateEnvAtBoot() {
  const env = getEnv();
  if (env.NODE_ENV === "production" && !env.CRON_SECRET) {
    throw new Error("CRON_SECRET est obligatoire en production");
  }
}

// server.ts
init_redis();
try {
  validateDatabaseUrl();
  validateJwtSecret();
  validateEnvAtBoot();
} catch (error) {
  console.error("[Tairo ampio] Configuration invalide :");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
var dev = process.env.NODE_ENV !== "production";
var hostname = process.env.HOSTNAME ?? "localhost";
var port = parseInt(process.env.PORT ?? "3000", 10);
var app = (0, import_next.default)({ dev, hostname, port });
var handle = app.getRequestHandler();
var httpServer = null;
var closeMessagingWs = null;
var shuttingDown = false;
async function gracefulShutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.error(`[Tairo ampio] Arr\xEAt (${signal})\u2026`);
  const forceExit = setTimeout(() => {
    console.error("[Tairo ampio] Arr\xEAt forc\xE9 apr\xE8s d\xE9lai");
    process.exit(1);
  }, 1e4);
  forceExit.unref?.();
  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((err) => err ? reject(err) : resolve());
      });
    }
    if (closeMessagingWs) {
      await closeMessagingWs();
    }
    await disconnectPrisma();
    await disconnectRedis();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    console.error("[Tairo ampio] Erreur pendant l'arr\xEAt :", error);
    process.exit(1);
  }
}
process.on("uncaughtException", (error) => {
  console.error("[Tairo ampio] uncaughtException:", error);
  void gracefulShutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Tairo ampio] unhandledRejection:", reason);
  void gracefulShutdown("unhandledRejection", 1);
});
process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});
app.prepare().then(async () => {
  const { attachMessagingWebSocket: attachMessagingWebSocket2 } = await Promise.resolve().then(() => (init_ws_server(), ws_server_exports));
  const { resolveRlsContextFromRequest: resolveRlsContextFromRequest2, runWithRls: runWithRls2 } = await Promise.resolve().then(() => (init_rls(), rls_exports));
  const {
    csrfRejectedResponse: csrfRejectedResponse2,
    payloadTooLargeResponse: payloadTooLargeResponse2,
    rejectInvalidCsrf: rejectInvalidCsrf2,
    rejectOversizedApiBody: rejectOversizedApiBody2
  } = await Promise.resolve().then(() => (init_http_security(), http_security_exports));
  const {
    attachCorsHeadersOnResponse: attachCorsHeadersOnResponse2,
    resolveCorsForNodeRequest: resolveCorsForNodeRequest2,
    writeCorsOnlyResponse: writeCorsOnlyResponse2
  } = await Promise.resolve().then(() => (init_cors(), cors_exports));
  const server = (0, import_http.createServer)(async (req, res) => {
    const parsedUrl = (0, import_url2.parse)(req.url, true);
    const pathname = parsedUrl.pathname ?? "";
    if (pathname.startsWith("/api")) {
      const cors = resolveCorsForNodeRequest2(req);
      if (cors.action === "preflight") {
        writeCorsOnlyResponse2(res, cors.status, cors.headers);
        return;
      }
      if (cors.action === "forbidden") {
        writeCorsOnlyResponse2(res, cors.status, {});
        return;
      }
      if (cors.action === "continue") {
        attachCorsHeadersOnResponse2(res, cors.headers);
      }
    }
    if (rejectOversizedApiBody2(req.method, req.url, req.headers)) {
      payloadTooLargeResponse2(res);
      return;
    }
    if (rejectInvalidCsrf2(req.method, req.url, req.headers)) {
      csrfRejectedResponse2(res);
      return;
    }
    const rlsContext = await resolveRlsContextFromRequest2(
      req.url ?? void 0,
      req.headers.cookie
    );
    void runWithRls2(rlsContext, async () => {
      await handle(req, res, parsedUrl);
    }).catch((error) => {
      console.error("[Tairo ampio] Erreur requ\xEAte HTTP :", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  });
  httpServer = server;
  const messagingWs = attachMessagingWebSocket2(server, app.getUpgradeHandler());
  closeMessagingWs = messagingWs.close;
  server.on("error", (error) => {
    console.error("[Tairo ampio] Erreur serveur HTTP :", error);
    if (error.code === "EADDRINUSE") {
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log(`> Tairo ampio pr\xEAt sur http://${hostname}:${port}`);
    console.log(`> WebSocket messagerie : ws://${hostname}:${port}/ws/messaging`);
  });
}).catch((error) => {
  console.error("[Tairo ampio] \xC9chec du d\xE9marrage :", error);
  process.exit(1);
});
