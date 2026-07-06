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
      "inlineSchema": 'generator client {\n  provider = "prisma-client"\n  output   = "../app/generated/prisma"\n  url      = env("DATABASE_URL")\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel User {\n  id                   String    @id @default(cuid())\n  name                 String\n  email                String    @unique\n  password             String\n  phone                String?\n  role                 Role      @default(CLIENT)\n  avatar               String?\n  bio                  String?\n  emailVerified        Boolean   @default(false)\n  emailVerifiedAt      DateTime?\n  notifyEmail          Boolean   @default(true)\n  notifyPush           Boolean   @default(true)\n  kycStatus            KycStatus @default(NOT_STARTED)\n  kycSubmittedAt       DateTime?\n  featuredOnHomepage   Boolean   @default(false)\n  featuredOnHomepageAt DateTime?\n  suspendedAt          DateTime?\n  failedLoginAttempts  Int       @default(0)\n  loginLockedAt        DateTime?\n  tokenVersion         Int       @default(0)\n  createdAt            DateTime  @default(now())\n  updatedAt            DateTime  @updatedAt\n\n  providerSubscription    ProviderSubscription?\n  subscriptionPayments    ProviderSubscriptionPayment[]\n  kycDocuments            ProviderKycDocument[]\n  emailOtps               EmailOtp[]\n  passwordResetTokens     PasswordResetToken[]\n  notifications           Notification[]\n  pushSubscriptions       PushSubscription[]\n  services                Service[]\n  serviceRequests         ServiceRequest[]\n  requestResponses        RequestResponse[]             @relation("ProviderResponses")\n  bookingsAsClient        Booking[]                     @relation("ClientBookings")\n  bookingsAsProvider      Booking[]                     @relation("ProviderBookings")\n  reviewsGiven            Review[]                      @relation("ReviewsGiven")\n  reviewsReceived         Review[]                      @relation("ReviewsReceived")\n  messagesSent            Message[]\n  conversationsAsClient   Conversation[]                @relation("ClientConversations")\n  conversationsAsProvider Conversation[]                @relation("ProviderConversations")\n  portfolioItems          ProviderPortfolioItem[]\n  portfolioComments       PortfolioItemComment[]        @relation("PortfolioComments")\n}\n\nenum Role {\n  CLIENT\n  PROVIDER\n  ADMIN\n}\n\nenum KycStatus {\n  NOT_STARTED\n  PENDING\n  APPROVED\n}\n\nenum KycDocumentType {\n  CIN\n}\n\nmodel ProviderSubscription {\n  id         String   @id @default(cuid())\n  providerId String   @unique\n  startsAt   DateTime @default(now())\n  expiresAt  DateTime\n  notes      String?\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  provider User @relation(fields: [providerId], references: [id], onDelete: Cascade)\n\n  @@index([expiresAt])\n}\n\nenum SubscriptionPaymentStatus {\n  PENDING\n  SUCCESS\n  FAILED\n}\n\nmodel ProviderSubscriptionPayment {\n  id            String                    @id @default(cuid())\n  providerId    String\n  months        Int\n  amount        Float\n  currency      String                    @default("MGA")\n  paymentMethod PaymentMethod\n  phone         String\n  status        SubscriptionPaymentStatus @default(PENDING)\n  referenceId   String                    @unique\n  createdAt     DateTime                  @default(now())\n  updatedAt     DateTime                  @updatedAt\n\n  provider User @relation(fields: [providerId], references: [id], onDelete: Cascade)\n\n  @@index([providerId, createdAt])\n}\n\nmodel ProviderKycDocument {\n  id           String          @id @default(cuid())\n  userId       String\n  type         KycDocumentType\n  /// 1 ou 2 pour la CIN (recto/verso)\n  cinSlot      Int             @default(0)\n  storedName   String\n  originalName String\n  mimeType     String\n  sizeBytes    Int\n  createdAt    DateTime        @default(now())\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, type, cinSlot])\n  @@index([userId])\n}\n\nmodel Notification {\n  id        String   @id @default(cuid())\n  type      String\n  title     String\n  body      String\n  link      String?\n  read      Boolean  @default(false)\n  createdAt DateTime @default(now())\n\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String\n\n  @@index([userId, read, createdAt])\n}\n\nmodel PushSubscription {\n  id        String   @id @default(cuid())\n  endpoint  String   @unique\n  p256dh    String\n  auth      String\n  createdAt DateTime @default(now())\n\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String\n\n  @@index([userId])\n}\n\nmodel EmailOtp {\n  id             String   @id @default(cuid())\n  codeHash       String\n  failedAttempts Int      @default(0)\n  expiresAt      DateTime\n  createdAt      DateTime @default(now())\n\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String\n\n  @@index([userId])\n}\n\nmodel PasswordResetToken {\n  id        String    @id @default(cuid())\n  tokenHash String\n  expiresAt DateTime\n  usedAt    DateTime?\n  createdAt DateTime  @default(now())\n\n  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)\n  userId String\n\n  @@index([userId])\n  @@index([tokenHash])\n}\n\nmodel Service {\n  id                   String    @id @default(cuid())\n  title                String\n  description          String\n  price                Float\n  category             String\n  location             String\n  coverImageMime       String?\n  available            Boolean   @default(true)\n  featuredOnHomepage   Boolean   @default(false)\n  featuredOnHomepageAt DateTime?\n  createdAt            DateTime  @default(now())\n  updatedAt            DateTime  @updatedAt\n\n  provider    User      @relation(fields: [providerId], references: [id])\n  providerId  String\n  bookings    Booking[]\n  priceOffers Message[]\n}\n\nmodel ServiceRequest {\n  id               String    @id @default(cuid())\n  title            String\n  description      String\n  budget           Float\n  category         String\n  location         String\n  coverImageMime   String?\n  desiredDate      DateTime?\n  desiredSlotStart String?\n  desiredSlotEnd   String?\n  open             Boolean   @default(true)\n  createdAt        DateTime  @default(now())\n  updatedAt        DateTime  @updatedAt\n\n  client    User              @relation(fields: [clientId], references: [id])\n  clientId  String\n  responses RequestResponse[]\n}\n\nenum RequestResponseStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  WITHDRAWN\n  COMPLETED\n}\n\nmodel RequestResponse {\n  id            String                @id @default(cuid())\n  message       String\n  proposedPrice Float?\n  status        RequestResponseStatus @default(PENDING)\n  createdAt     DateTime              @default(now())\n  updatedAt     DateTime              @updatedAt\n\n  request     ServiceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)\n  requestId   String\n  provider    User           @relation("ProviderResponses", fields: [providerId], references: [id])\n  providerId  String\n  booking     Booking?\n  priceOffers Message[]\n\n  @@unique([requestId, providerId])\n}\n\nmodel Booking {\n  id        String        @id @default(cuid())\n  status    BookingStatus @default(PENDING)\n  date      DateTime\n  slotStart String?\n  slotEnd   String?\n  createdAt DateTime      @default(now())\n  updatedAt DateTime      @updatedAt\n\n  /// Copie fig\xE9e pour l\u2019affichage si le service ou la demande est supprim\xE9\n  displayTitle    String?\n  displayPrice    Float?\n  displayCategory String?\n  displayLocation String?\n  displaySource   String?\n  displayTargetId String?\n\n  client            User             @relation("ClientBookings", fields: [clientId], references: [id])\n  clientId          String\n  provider          User             @relation("ProviderBookings", fields: [providerId], references: [id])\n  providerId        String\n  service           Service?         @relation(fields: [serviceId], references: [id])\n  serviceId         String?\n  requestResponse   RequestResponse? @relation(fields: [requestResponseId], references: [id])\n  requestResponseId String?          @unique\n  transaction       Transaction?\n  review            Review?\n}\n\nmodel Conversation {\n  id        String   @id @default(cuid())\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  client     User      @relation("ClientConversations", fields: [clientId], references: [id])\n  clientId   String\n  provider   User      @relation("ProviderConversations", fields: [providerId], references: [id])\n  providerId String\n  messages   Message[]\n\n  @@unique([clientId, providerId])\n  @@index([updatedAt])\n  @@index([clientId])\n  @@index([providerId])\n}\n\nenum MessageKind {\n  TEXT\n  PRICE_OFFER\n}\n\nenum PriceOfferStatus {\n  PENDING\n  ACCEPTED\n  SUPERSEDED\n}\n\nmodel Message {\n  id          String            @id @default(cuid())\n  body        String\n  kind        MessageKind       @default(TEXT)\n  offerPrice  Float?\n  offerStatus PriceOfferStatus?\n  readAt      DateTime?\n  createdAt   DateTime          @default(now())\n\n  conversation      Conversation     @relation(fields: [conversationId], references: [id], onDelete: Cascade)\n  conversationId    String\n  sender            User             @relation(fields: [senderId], references: [id])\n  senderId          String\n  requestResponse   RequestResponse? @relation(fields: [requestResponseId], references: [id], onDelete: SetNull)\n  requestResponseId String?\n  service           Service?         @relation(fields: [serviceId], references: [id], onDelete: SetNull)\n  serviceId         String?\n\n  @@index([conversationId, createdAt])\n  @@index([requestResponseId, offerStatus])\n  @@index([serviceId, offerStatus])\n}\n\nenum BookingStatus {\n  PENDING\n  CONFIRMED\n  COMPLETED\n  CANCELLED\n}\n\nmodel Transaction {\n  id            String            @id @default(cuid())\n  amount        Float\n  currency      String            @default("MGA")\n  status        TransactionStatus @default(PENDING)\n  paymentMethod PaymentMethod\n  referenceId   String?\n  createdAt     DateTime          @default(now())\n  updatedAt     DateTime          @updatedAt\n\n  booking   Booking @relation(fields: [bookingId], references: [id])\n  bookingId String  @unique\n}\n\nenum TransactionStatus {\n  PENDING\n  SUCCESS\n  FAILED\n}\n\nenum PaymentMethod {\n  ORANGE_MONEY\n  MVOLA\n  AIRTEL_MONEY\n}\n\nmodel ProviderPortfolioItem {\n  id          String   @id @default(cuid())\n  providerId  String\n  description String\n  storedName  String\n  mimeType    String\n  sizeBytes   Int\n  sortOrder   Int      @default(0)\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  provider User                   @relation(fields: [providerId], references: [id], onDelete: Cascade)\n  comments PortfolioItemComment[]\n\n  @@index([providerId, sortOrder])\n}\n\nmodel PortfolioItemComment {\n  id        String   @id @default(cuid())\n  itemId    String\n  authorId  String\n  body      String\n  createdAt DateTime @default(now())\n\n  item   ProviderPortfolioItem @relation(fields: [itemId], references: [id], onDelete: Cascade)\n  author User                  @relation("PortfolioComments", fields: [authorId], references: [id], onDelete: Cascade)\n\n  @@index([itemId, createdAt])\n}\n\nmodel Review {\n  id        String   @id @default(cuid())\n  rating    Int\n  comment   String?\n  createdAt DateTime @default(now())\n\n  author    User    @relation("ReviewsGiven", fields: [authorId], references: [id])\n  authorId  String\n  target    User    @relation("ReviewsReceived", fields: [targetId], references: [id])\n  targetId  String\n  booking   Booking @relation(fields: [bookingId], references: [id])\n  bookingId String  @unique\n}\n',
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
    config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"emailVerifiedAt","kind":"scalar","type":"DateTime"},{"name":"notifyEmail","kind":"scalar","type":"Boolean"},{"name":"notifyPush","kind":"scalar","type":"Boolean"},{"name":"kycStatus","kind":"enum","type":"KycStatus"},{"name":"kycSubmittedAt","kind":"scalar","type":"DateTime"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"suspendedAt","kind":"scalar","type":"DateTime"},{"name":"failedLoginAttempts","kind":"scalar","type":"Int"},{"name":"loginLockedAt","kind":"scalar","type":"DateTime"},{"name":"tokenVersion","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"providerSubscription","kind":"object","type":"ProviderSubscription","relationName":"ProviderSubscriptionToUser"},{"name":"subscriptionPayments","kind":"object","type":"ProviderSubscriptionPayment","relationName":"ProviderSubscriptionPaymentToUser"},{"name":"kycDocuments","kind":"object","type":"ProviderKycDocument","relationName":"ProviderKycDocumentToUser"},{"name":"emailOtps","kind":"object","type":"EmailOtp","relationName":"EmailOtpToUser"},{"name":"passwordResetTokens","kind":"object","type":"PasswordResetToken","relationName":"PasswordResetTokenToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"pushSubscriptions","kind":"object","type":"PushSubscription","relationName":"PushSubscriptionToUser"},{"name":"services","kind":"object","type":"Service","relationName":"ServiceToUser"},{"name":"serviceRequests","kind":"object","type":"ServiceRequest","relationName":"ServiceRequestToUser"},{"name":"requestResponses","kind":"object","type":"RequestResponse","relationName":"ProviderResponses"},{"name":"bookingsAsClient","kind":"object","type":"Booking","relationName":"ClientBookings"},{"name":"bookingsAsProvider","kind":"object","type":"Booking","relationName":"ProviderBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"ReviewsGiven"},{"name":"reviewsReceived","kind":"object","type":"Review","relationName":"ReviewsReceived"},{"name":"messagesSent","kind":"object","type":"Message","relationName":"MessageToUser"},{"name":"conversationsAsClient","kind":"object","type":"Conversation","relationName":"ClientConversations"},{"name":"conversationsAsProvider","kind":"object","type":"Conversation","relationName":"ProviderConversations"},{"name":"portfolioItems","kind":"object","type":"ProviderPortfolioItem","relationName":"ProviderPortfolioItemToUser"},{"name":"portfolioComments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioComments"}],"dbName":null},"ProviderSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"startsAt","kind":"scalar","type":"DateTime"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionToUser"}],"dbName":null},"ProviderSubscriptionPayment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"months","kind":"scalar","type":"Int"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubscriptionPaymentStatus"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionPaymentToUser"}],"dbName":null},"ProviderKycDocument":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"KycDocumentType"},{"name":"cinSlot","kind":"scalar","type":"Int"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"originalName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ProviderKycDocumentToUser"}],"dbName":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"link","kind":"scalar","type":"String"},{"name":"read","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"PushSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"endpoint","kind":"scalar","type":"String"},{"name":"p256dh","kind":"scalar","type":"String"},{"name":"auth","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PushSubscriptionToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"EmailOtp":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"codeHash","kind":"scalar","type":"String"},{"name":"failedAttempts","kind":"scalar","type":"Int"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"EmailOtpToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"PasswordResetToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"usedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PasswordResetTokenToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"available","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ServiceToUser"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToService"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToService"}],"dbName":null},"ServiceRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"budget","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"desiredDate","kind":"scalar","type":"DateTime"},{"name":"desiredSlotStart","kind":"scalar","type":"String"},{"name":"desiredSlotEnd","kind":"scalar","type":"String"},{"name":"open","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ServiceRequestToUser"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"responses","kind":"object","type":"RequestResponse","relationName":"RequestResponseToServiceRequest"}],"dbName":null},"RequestResponse":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"proposedPrice","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"RequestResponseStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"request","kind":"object","type":"ServiceRequest","relationName":"RequestResponseToServiceRequest"},{"name":"requestId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderResponses"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToRequestResponse"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToRequestResponse"}],"dbName":null},"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"slotStart","kind":"scalar","type":"String"},{"name":"slotEnd","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"displayTitle","kind":"scalar","type":"String"},{"name":"displayPrice","kind":"scalar","type":"Float"},{"name":"displayCategory","kind":"scalar","type":"String"},{"name":"displayLocation","kind":"scalar","type":"String"},{"name":"displaySource","kind":"scalar","type":"String"},{"name":"displayTargetId","kind":"scalar","type":"String"},{"name":"client","kind":"object","type":"User","relationName":"ClientBookings"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderBookings"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"BookingToService"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"BookingToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"Transaction","relationName":"BookingToTransaction"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":null},"Conversation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ClientConversations"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderConversations"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"messages","kind":"object","type":"Message","relationName":"ConversationToMessage"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"kind","kind":"enum","type":"MessageKind"},{"name":"offerPrice","kind":"scalar","type":"Float"},{"name":"offerStatus","kind":"enum","type":"PriceOfferStatus"},{"name":"readAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"conversation","kind":"object","type":"Conversation","relationName":"ConversationToMessage"},{"name":"conversationId","kind":"scalar","type":"String"},{"name":"sender","kind":"object","type":"User","relationName":"MessageToUser"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"MessageToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"MessageToService"},{"name":"serviceId","kind":"scalar","type":"String"}],"dbName":null},"Transaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TransactionStatus"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToTransaction"},{"name":"bookingId","kind":"scalar","type":"String"}],"dbName":null},"ProviderPortfolioItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"sortOrder","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderPortfolioItemToUser"},{"name":"comments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioItemCommentToProviderPortfolioItem"}],"dbName":null},"PortfolioItemComment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"item","kind":"object","type":"ProviderPortfolioItem","relationName":"PortfolioItemCommentToProviderPortfolioItem"},{"name":"author","kind":"object","type":"User","relationName":"PortfolioComments"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"author","kind":"object","type":"User","relationName":"ReviewsGiven"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"target","kind":"object","type":"User","relationName":"ReviewsReceived"},{"name":"targetId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"bookingId","kind":"scalar","type":"String"}],"dbName":null}},"enums":{},"types":{}}');
    config.parameterizationSchema = {
      strings: JSON.parse('["where","provider","providerSubscription","orderBy","cursor","subscriptionPayments","user","kycDocuments","emailOtps","passwordResetTokens","notifications","pushSubscriptions","client","service","responses","_count","request","booking","messages","conversation","sender","requestResponse","priceOffers","transaction","author","target","review","bookings","services","serviceRequests","requestResponses","bookingsAsClient","bookingsAsProvider","reviewsGiven","reviewsReceived","messagesSent","conversationsAsClient","conversationsAsProvider","item","comments","portfolioItems","portfolioComments","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","data","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","create","update","User.upsertOne","User.deleteOne","User.deleteMany","having","_avg","_sum","_min","_max","User.groupBy","User.aggregate","ProviderSubscription.findUnique","ProviderSubscription.findUniqueOrThrow","ProviderSubscription.findFirst","ProviderSubscription.findFirstOrThrow","ProviderSubscription.findMany","ProviderSubscription.createOne","ProviderSubscription.createMany","ProviderSubscription.createManyAndReturn","ProviderSubscription.updateOne","ProviderSubscription.updateMany","ProviderSubscription.updateManyAndReturn","ProviderSubscription.upsertOne","ProviderSubscription.deleteOne","ProviderSubscription.deleteMany","ProviderSubscription.groupBy","ProviderSubscription.aggregate","ProviderSubscriptionPayment.findUnique","ProviderSubscriptionPayment.findUniqueOrThrow","ProviderSubscriptionPayment.findFirst","ProviderSubscriptionPayment.findFirstOrThrow","ProviderSubscriptionPayment.findMany","ProviderSubscriptionPayment.createOne","ProviderSubscriptionPayment.createMany","ProviderSubscriptionPayment.createManyAndReturn","ProviderSubscriptionPayment.updateOne","ProviderSubscriptionPayment.updateMany","ProviderSubscriptionPayment.updateManyAndReturn","ProviderSubscriptionPayment.upsertOne","ProviderSubscriptionPayment.deleteOne","ProviderSubscriptionPayment.deleteMany","ProviderSubscriptionPayment.groupBy","ProviderSubscriptionPayment.aggregate","ProviderKycDocument.findUnique","ProviderKycDocument.findUniqueOrThrow","ProviderKycDocument.findFirst","ProviderKycDocument.findFirstOrThrow","ProviderKycDocument.findMany","ProviderKycDocument.createOne","ProviderKycDocument.createMany","ProviderKycDocument.createManyAndReturn","ProviderKycDocument.updateOne","ProviderKycDocument.updateMany","ProviderKycDocument.updateManyAndReturn","ProviderKycDocument.upsertOne","ProviderKycDocument.deleteOne","ProviderKycDocument.deleteMany","ProviderKycDocument.groupBy","ProviderKycDocument.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","PushSubscription.findUnique","PushSubscription.findUniqueOrThrow","PushSubscription.findFirst","PushSubscription.findFirstOrThrow","PushSubscription.findMany","PushSubscription.createOne","PushSubscription.createMany","PushSubscription.createManyAndReturn","PushSubscription.updateOne","PushSubscription.updateMany","PushSubscription.updateManyAndReturn","PushSubscription.upsertOne","PushSubscription.deleteOne","PushSubscription.deleteMany","PushSubscription.groupBy","PushSubscription.aggregate","EmailOtp.findUnique","EmailOtp.findUniqueOrThrow","EmailOtp.findFirst","EmailOtp.findFirstOrThrow","EmailOtp.findMany","EmailOtp.createOne","EmailOtp.createMany","EmailOtp.createManyAndReturn","EmailOtp.updateOne","EmailOtp.updateMany","EmailOtp.updateManyAndReturn","EmailOtp.upsertOne","EmailOtp.deleteOne","EmailOtp.deleteMany","EmailOtp.groupBy","EmailOtp.aggregate","PasswordResetToken.findUnique","PasswordResetToken.findUniqueOrThrow","PasswordResetToken.findFirst","PasswordResetToken.findFirstOrThrow","PasswordResetToken.findMany","PasswordResetToken.createOne","PasswordResetToken.createMany","PasswordResetToken.createManyAndReturn","PasswordResetToken.updateOne","PasswordResetToken.updateMany","PasswordResetToken.updateManyAndReturn","PasswordResetToken.upsertOne","PasswordResetToken.deleteOne","PasswordResetToken.deleteMany","PasswordResetToken.groupBy","PasswordResetToken.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","ServiceRequest.findUnique","ServiceRequest.findUniqueOrThrow","ServiceRequest.findFirst","ServiceRequest.findFirstOrThrow","ServiceRequest.findMany","ServiceRequest.createOne","ServiceRequest.createMany","ServiceRequest.createManyAndReturn","ServiceRequest.updateOne","ServiceRequest.updateMany","ServiceRequest.updateManyAndReturn","ServiceRequest.upsertOne","ServiceRequest.deleteOne","ServiceRequest.deleteMany","ServiceRequest.groupBy","ServiceRequest.aggregate","RequestResponse.findUnique","RequestResponse.findUniqueOrThrow","RequestResponse.findFirst","RequestResponse.findFirstOrThrow","RequestResponse.findMany","RequestResponse.createOne","RequestResponse.createMany","RequestResponse.createManyAndReturn","RequestResponse.updateOne","RequestResponse.updateMany","RequestResponse.updateManyAndReturn","RequestResponse.upsertOne","RequestResponse.deleteOne","RequestResponse.deleteMany","RequestResponse.groupBy","RequestResponse.aggregate","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","Booking.groupBy","Booking.aggregate","Conversation.findUnique","Conversation.findUniqueOrThrow","Conversation.findFirst","Conversation.findFirstOrThrow","Conversation.findMany","Conversation.createOne","Conversation.createMany","Conversation.createManyAndReturn","Conversation.updateOne","Conversation.updateMany","Conversation.updateManyAndReturn","Conversation.upsertOne","Conversation.deleteOne","Conversation.deleteMany","Conversation.groupBy","Conversation.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Transaction.findUnique","Transaction.findUniqueOrThrow","Transaction.findFirst","Transaction.findFirstOrThrow","Transaction.findMany","Transaction.createOne","Transaction.createMany","Transaction.createManyAndReturn","Transaction.updateOne","Transaction.updateMany","Transaction.updateManyAndReturn","Transaction.upsertOne","Transaction.deleteOne","Transaction.deleteMany","Transaction.groupBy","Transaction.aggregate","ProviderPortfolioItem.findUnique","ProviderPortfolioItem.findUniqueOrThrow","ProviderPortfolioItem.findFirst","ProviderPortfolioItem.findFirstOrThrow","ProviderPortfolioItem.findMany","ProviderPortfolioItem.createOne","ProviderPortfolioItem.createMany","ProviderPortfolioItem.createManyAndReturn","ProviderPortfolioItem.updateOne","ProviderPortfolioItem.updateMany","ProviderPortfolioItem.updateManyAndReturn","ProviderPortfolioItem.upsertOne","ProviderPortfolioItem.deleteOne","ProviderPortfolioItem.deleteMany","ProviderPortfolioItem.groupBy","ProviderPortfolioItem.aggregate","PortfolioItemComment.findUnique","PortfolioItemComment.findUniqueOrThrow","PortfolioItemComment.findFirst","PortfolioItemComment.findFirstOrThrow","PortfolioItemComment.findMany","PortfolioItemComment.createOne","PortfolioItemComment.createMany","PortfolioItemComment.createManyAndReturn","PortfolioItemComment.updateOne","PortfolioItemComment.updateMany","PortfolioItemComment.updateManyAndReturn","PortfolioItemComment.upsertOne","PortfolioItemComment.deleteOne","PortfolioItemComment.deleteMany","PortfolioItemComment.groupBy","PortfolioItemComment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","AND","OR","NOT","id","rating","comment","createdAt","authorId","targetId","bookingId","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","itemId","body","providerId","description","storedName","mimeType","sizeBytes","sortOrder","updatedAt","amount","currency","TransactionStatus","status","PaymentMethod","paymentMethod","referenceId","MessageKind","kind","offerPrice","PriceOfferStatus","offerStatus","readAt","conversationId","senderId","requestResponseId","serviceId","clientId","BookingStatus","date","slotStart","slotEnd","displayTitle","displayPrice","displayCategory","displayLocation","displaySource","displayTargetId","message","proposedPrice","RequestResponseStatus","requestId","title","budget","category","location","coverImageMime","desiredDate","desiredSlotStart","desiredSlotEnd","open","price","available","featuredOnHomepage","featuredOnHomepageAt","tokenHash","expiresAt","usedAt","userId","codeHash","failedAttempts","endpoint","p256dh","auth","type","link","read","KycDocumentType","cinSlot","originalName","months","phone","SubscriptionPaymentStatus","startsAt","notes","name","email","password","Role","role","avatar","bio","emailVerified","emailVerifiedAt","notifyEmail","notifyPush","KycStatus","kycStatus","kycSubmittedAt","suspendedAt","failedLoginAttempts","loginLockedAt","tokenVersion","every","some","none","clientId_providerId","requestId_providerId","userId_type_cinSlot","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","increment","decrement","multiply","divide"]'),
      graph: "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_wQAMNMCAAAhABDUAgAA_wQAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAIAFgwMi_wIBAKIEACGAAwEAogQAIYEDAQCfBAAhgwNAAKMEACGEAwEAogQAIYUDAQCiBAAhhgMBAKIEACGHAwgA9QQAIYgDAQCiBAAhiQMBAKIEACGKAwEAogQAIYsDAQCiBAAhEAEAAIMHACAMAACDBwAgDQAAjAkAIBUAAIsJACAXAACOCQAgGgAAjwkAIP8CAACNBQAggAMAAI0FACCEAwAAjQUAIIUDAACNBQAghgMAAI0FACCHAwAAjQUAIIgDAACNBQAgiQMAAI0FACCKAwAAjQUAIIsDAACNBQAgGgEAAM4EACAMAADOBAAgDQAA-QQAIBUAAPgEACAXAACBBQAgGgAAggUAINICAAD_BAAw0wIAACEAENQCAAD_BAAw1QIBAAAAAdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIfMCAACABYMDIv8CAQAAAAGAAwEAogQAIYEDAQCfBAAhgwNAAKMEACGEAwEAogQAIYUDAQCiBAAhhgMBAKIEACGHAwgA9QQAIYgDAQCiBAAhiQMBAKIEACGKAwEAogQAIYsDAQCiBAAhAwAAACEAIAMAACIAMAQAACMAIAEAAAAdACAPAQAAzgQAIBAAAP0EACARAAD-BAAgFgAA6AQAINICAAD7BAAw0wIAACYAENQCAAD7BAAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAA_ASPAyKMAwEAnwQAIY0DCAD1BAAhjwMBAJ8EACEBAAAAJgAgBQEAAIMHACAQAACNCQAgEQAAwwUAIBYAAIUJACCNAwAAjQUAIBABAADOBAAgEAAA_QQAIBEAAP4EACAWAADoBAAg0gIAAPsEADDTAgAAJgAQ1AIAAPsEADDVAgEAAAAB2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAPwEjwMijAMBAJ8EACGNAwgA9QQAIY8DAQCfBAAhxwMAAPoEACADAAAAJgAgAwAAKAAwBAAAKQAgAQAAACYAIAEAAAAhACASDQAA-QQAIBMAAPcEACAUAADOBAAgFQAA-AQAINICAADzBAAw0wIAAC0AENQCAADzBAAw1QIBAJ8EACHYAkAAowQAIegCAQCfBAAh-AIAAPQE-AIi-QIIAPUEACH7AgAA9gT7AiP8AkAA2QQAIf0CAQCfBAAh_gIBAJ8EACH_AgEAogQAIYADAQCiBAAhCQ0AAIwJACATAACKCQAgFAAAgwcAIBUAAIsJACD5AgAAjQUAIPsCAACNBQAg_AIAAI0FACD_AgAAjQUAIIADAACNBQAgEg0AAPkEACATAAD3BAAgFAAAzgQAIBUAAPgEACDSAgAA8wQAMNMCAAAtABDUAgAA8wQAMNUCAQAAAAHYAkAAowQAIegCAQCfBAAh-AIAAPQE-AIi-QIIAPUEACH7AgAA9gT7AiP8AkAA2QQAIf0CAQCfBAAh_gIBAJ8EACH_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-wgAIAgAAPwIACAJAAD9CAAgCgAA_ggAIAsAAP8IACAcAACACQAgHQAAgQkAIB4AAIIJACAfAACDCQAgIAAAgwkAICEAAIQJACAiAACECQAgIwAAhQkAICQAAIYJACAlAACGCQAgKAAAhwkAICkAAIgJACCcAwAAjQUAIK0DAACNBQAgtgMAAI0FACC3AwAAjQUAILkDAACNBQAgvgMAAI0FACC_AwAAjQUAIMEDAACNBQAgAwAAAGsAIAMAAGwAMAQAAAEAIAMAAABrACADAABsADAEAAABACADAAAAawAgAwAAbAAwBAAAAQAgKQIAAOYIACAFAADnCAAgBwAA6AgAIAgAAOkIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAlAAD2CAAgKAAA9wgAICkAAPgIACDVAgEAAAAB2AJAAAAAAe8CQAAAAAGbAyAAAAABnANAAAAAAa0DAQAAAAGxAwEAAAABsgMBAAAAAbMDAQAAAAG1AwAAALUDArYDAQAAAAG3AwEAAAABuAMgAAAAAbkDQAAAAAG6AyAAAAABuwMgAAAAAb0DAAAAvQMCvgNAAAAAAb8DQAAAAAHAAwIAAAABwQNAAAAAAcIDAgAAAAEBLwAAcAAgFtUCAQAAAAHYAkAAAAAB7wJAAAAAAZsDIAAAAAGcA0AAAAABrQMBAAAAAbEDAQAAAAGyAwEAAAABswMBAAAAAbUDAAAAtQMCtgMBAAAAAbcDAQAAAAG4AyAAAAABuQNAAAAAAboDIAAAAAG7AyAAAAABvQMAAAC9AwK-A0AAAAABvwNAAAAAAcADAgAAAAHBA0AAAAABwgMCAAAAAQEvAAByADABLwAAcgAwKQIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhAgAAAAEAIC8AAHUAIBbVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhAgAAAGsAIC8AAHcAIAIAAABrACAvAAB3ACADAAAAAQAgNgAAcAAgNwAAdQAgAQAAAAEAIAEAAABrACANDwAAhAcAIDwAAIUHACA9AACIBwAgPgAAhwcAID8AAIYHACCcAwAAjQUAIK0DAACNBQAgtgMAAI0FACC3AwAAjQUAILkDAACNBQAgvgMAAI0FACC_AwAAjQUAIMEDAACNBQAgGdICAADPBAAw0wIAAH4AENQCAADPBAAw1QIBAIQEACHYAkAAhwQAIe8CQACHBAAhmwMgALwEACGcA0AAqQQAIa0DAQCGBAAhsQMBAIQEACGyAwEAhAQAIbMDAQCEBAAhtQMAANAEtQMitgMBAIYEACG3AwEAhgQAIbgDIAC8BAAhuQNAAKkEACG6AyAAvAQAIbsDIAC8BAAhvQMAANEEvQMivgNAAKkEACG_A0AAqQQAIcADAgCFBAAhwQNAAKkEACHCAwIAhQQAIQMAAABrACADAAB9ADA7AAB-ACADAAAAawAgAwAAbAAwBAAAAQAgCwEAAM4EACDSAgAAzQQAMNMCAAADABDUAgAAzQQAMNUCAQAAAAHYAkAAowQAIekCAQAAAAHvAkAAowQAIZ4DQACjBAAhrwNAAKMEACGwAwEAogQAIQEAAACBAQAgAQAAAIEBACACAQAAgwcAILADAACNBQAgAwAAAAMAIAMAAIQBADAEAACBAQAgAwAAAAMAIAMAAIQBADAEAACBAQAgAwAAAAMAIAMAAIQBADAEAACBAQAgCAEAAIIHACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAABngNAAAAAAa8DQAAAAAGwAwEAAAABAS8AAIgBACAH1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAZ4DQAAAAAGvA0AAAAABsAMBAAAAAQEvAACKAQAwAS8AAIoBADAIAQAAgQcAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAhngNAAJYFACGvA0AAlgUAIbADAQCVBQAhAgAAAIEBACAvAACNAQAgB9UCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAhngNAAJYFACGvA0AAlgUAIbADAQCVBQAhAgAAAAMAIC8AAI8BACACAAAAAwAgLwAAjwEAIAMAAACBAQAgNgAAiAEAIDcAAI0BACABAAAAgQEAIAEAAAADACAEDwAA_gYAID4AAIAHACA_AAD_BgAgsAMAAI0FACAK0gIAAMwEADDTAgAAlgEAENQCAADMBAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh7wJAAIcEACGeA0AAhwQAIa8DQACHBAAhsAMBAIYEACEDAAAAAwAgAwAAlQEAMDsAAJYBACADAAAAAwAgAwAAhAEAMAQAAIEBACABAAAABwAgAQAAAAcAIAMAAAAFACADAAAGADAEAAAHACADAAAABQAgAwAABgAwBAAABwAgAwAAAAUAIAMAAAYAMAQAAAcAIAwBAAD9BgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfACCAAAAAHxAgEAAAAB8wIAAACvAwL1AgAAAPUCAvYCAQAAAAGsAwIAAAABrQMBAAAAAQEvAACeAQAgC9UCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHwAggAAAAB8QIBAAAAAfMCAAAArwMC9QIAAAD1AgL2AgEAAAABrAMCAAAAAa0DAQAAAAEBLwAAoAEAMAEvAACgAQAwDAEAAPwGACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfACCAC-BQAh8QIBAJMFACHzAgAA-wavAyL1AgAAwAX1AiL2AgEAkwUAIawDAgCUBQAhrQMBAJMFACECAAAABwAgLwAAowEAIAvVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfACCAC-BQAh8QIBAJMFACHzAgAA-wavAyL1AgAAwAX1AiL2AgEAkwUAIawDAgCUBQAhrQMBAJMFACECAAAABQAgLwAApQEAIAIAAAAFACAvAAClAQAgAwAAAAcAIDYAAJ4BACA3AACjAQAgAQAAAAcAIAEAAAAFACAFDwAA9gYAIDwAAPcGACA9AAD6BgAgPgAA-QYAID8AAPgGACAO0gIAAMgEADDTAgAArAEAENQCAADIBAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh7wJAAIcEACHwAggAlQQAIfECAQCEBAAh8wIAAMkErwMi9QIAAJcE9QIi9gIBAIQEACGsAwIAhQQAIa0DAQCEBAAhAwAAAAUAIAMAAKsBADA7AACsAQAgAwAAAAUAIAMAAAYAMAQAAAcAIAEAAAALACABAAAACwAgAwAAAAkAIAMAAAoAMAQAAAsAIAMAAAAJACADAAAKADAEAAALACADAAAACQAgAwAACgAwBAAACwAgCgYAAPUGACDVAgEAAAAB2AJAAAAAAesCAQAAAAHsAgEAAAAB7QICAAAAAaADAQAAAAGmAwAAAKoDAqoDAgAAAAGrAwEAAAABAS8AALQBACAJ1QIBAAAAAdgCQAAAAAHrAgEAAAAB7AIBAAAAAe0CAgAAAAGgAwEAAAABpgMAAACqAwKqAwIAAAABqwMBAAAAAQEvAAC2AQAwAS8AALYBADAKBgAA9AYAINUCAQCTBQAh2AJAAJYFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACGgAwEAkwUAIaYDAADzBqoDIqoDAgCUBQAhqwMBAJMFACECAAAACwAgLwAAuQEAIAnVAgEAkwUAIdgCQACWBQAh6wIBAJMFACHsAgEAkwUAIe0CAgCUBQAhoAMBAJMFACGmAwAA8waqAyKqAwIAlAUAIasDAQCTBQAhAgAAAAkAIC8AALsBACACAAAACQAgLwAAuwEAIAMAAAALACA2AAC0AQAgNwAAuQEAIAEAAAALACABAAAACQAgBQ8AAO4GACA8AADvBgAgPQAA8gYAID4AAPEGACA_AADwBgAgDNICAADEBAAw0wIAAMIBABDUAgAAxAQAMNUCAQCEBAAh2AJAAIcEACHrAgEAhAQAIewCAQCEBAAh7QICAIUEACGgAwEAhAQAIaYDAADFBKoDIqoDAgCFBAAhqwMBAIQEACEDAAAACQAgAwAAwQEAMDsAAMIBACADAAAACQAgAwAACgAwBAAACwAgAQAAABcAIAEAAAAXACADAAAAFQAgAwAAFgAwBAAAFwAgAwAAABUAIAMAABYAMAQAABcAIAMAAAAVACADAAAWADAEAAAXACAJBgAA7QYAINUCAQAAAAHYAkAAAAAB6AIBAAAAAZADAQAAAAGgAwEAAAABpgMBAAAAAacDAQAAAAGoAyAAAAABAS8AAMoBACAI1QIBAAAAAdgCQAAAAAHoAgEAAAABkAMBAAAAAaADAQAAAAGmAwEAAAABpwMBAAAAAagDIAAAAAEBLwAAzAEAMAEvAADMAQAwCQYAAOwGACDVAgEAkwUAIdgCQACWBQAh6AIBAJMFACGQAwEAkwUAIaADAQCTBQAhpgMBAJMFACGnAwEAlQUAIagDIACnBgAhAgAAABcAIC8AAM8BACAI1QIBAJMFACHYAkAAlgUAIegCAQCTBQAhkAMBAJMFACGgAwEAkwUAIaYDAQCTBQAhpwMBAJUFACGoAyAApwYAIQIAAAAVACAvAADRAQAgAgAAABUAIC8AANEBACADAAAAFwAgNgAAygEAIDcAAM8BACABAAAAFwAgAQAAABUAIAQPAADpBgAgPgAA6wYAID8AAOoGACCnAwAAjQUAIAvSAgAAwwQAMNMCAADYAQAQ1AIAAMMEADDVAgEAhAQAIdgCQACHBAAh6AIBAIQEACGQAwEAhAQAIaADAQCEBAAhpgMBAIQEACGnAwEAhgQAIagDIAC8BAAhAwAAABUAIAMAANcBADA7AADYAQAgAwAAABUAIAMAABYAMAQAABcAIAEAAAAbACABAAAAGwAgAwAAABkAIAMAABoAMAQAABsAIAMAAAAZACADAAAaADAEAAAbACADAAAAGQAgAwAAGgAwBAAAGwAgBwYAAOgGACDVAgEAAAAB2AJAAAAAAaADAQAAAAGjAwEAAAABpAMBAAAAAaUDAQAAAAEBLwAA4AEAIAbVAgEAAAAB2AJAAAAAAaADAQAAAAGjAwEAAAABpAMBAAAAAaUDAQAAAAEBLwAA4gEAMAEvAADiAQAwBwYAAOcGACDVAgEAkwUAIdgCQACWBQAhoAMBAJMFACGjAwEAkwUAIaQDAQCTBQAhpQMBAJMFACECAAAAGwAgLwAA5QEAIAbVAgEAkwUAIdgCQACWBQAhoAMBAJMFACGjAwEAkwUAIaQDAQCTBQAhpQMBAJMFACECAAAAGQAgLwAA5wEAIAIAAAAZACAvAADnAQAgAwAAABsAIDYAAOABACA3AADlAQAgAQAAABsAIAEAAAAZACADDwAA5AYAID4AAOYGACA_AADlBgAgCdICAADCBAAw0wIAAO4BABDUAgAAwgQAMNUCAQCEBAAh2AJAAIcEACGgAwEAhAQAIaMDAQCEBAAhpAMBAIQEACGlAwEAhAQAIQMAAAAZACADAADtAQAwOwAA7gEAIAMAAAAZACADAAAaADAEAAAbACABAAAADwAgAQAAAA8AIAMAAAANACADAAAOADAEAAAPACADAAAADQAgAwAADgAwBAAADwAgAwAAAA0AIAMAAA4AMAQAAA8AIAcGAADjBgAg1QIBAAAAAdgCQAAAAAGeA0AAAAABoAMBAAAAAaEDAQAAAAGiAwIAAAABAS8AAPYBACAG1QIBAAAAAdgCQAAAAAGeA0AAAAABoAMBAAAAAaEDAQAAAAGiAwIAAAABAS8AAPgBADABLwAA-AEAMAcGAADiBgAg1QIBAJMFACHYAkAAlgUAIZ4DQACWBQAhoAMBAJMFACGhAwEAkwUAIaIDAgCUBQAhAgAAAA8AIC8AAPsBACAG1QIBAJMFACHYAkAAlgUAIZ4DQACWBQAhoAMBAJMFACGhAwEAkwUAIaIDAgCUBQAhAgAAAA0AIC8AAP0BACACAAAADQAgLwAA_QEAIAMAAAAPACA2AAD2AQAgNwAA-wEAIAEAAAAPACABAAAADQAgBQ8AAN0GACA8AADeBgAgPQAA4QYAID4AAOAGACA_AADfBgAgCdICAADBBAAw0wIAAIQCABDUAgAAwQQAMNUCAQCEBAAh2AJAAIcEACGeA0AAhwQAIaADAQCEBAAhoQMBAIQEACGiAwIAhQQAIQMAAAANACADAACDAgAwOwAAhAIAIAMAAAANACADAAAOADAEAAAPACABAAAAEwAgAQAAABMAIAMAAAARACADAAASADAEAAATACADAAAAEQAgAwAAEgAwBAAAEwAgAwAAABEAIAMAABIAMAQAABMAIAcGAADcBgAg1QIBAAAAAdgCQAAAAAGdAwEAAAABngNAAAAAAZ8DQAAAAAGgAwEAAAABAS8AAIwCACAG1QIBAAAAAdgCQAAAAAGdAwEAAAABngNAAAAAAZ8DQAAAAAGgAwEAAAABAS8AAI4CADABLwAAjgIAMAcGAADbBgAg1QIBAJMFACHYAkAAlgUAIZ0DAQCTBQAhngNAAJYFACGfA0AAzAUAIaADAQCTBQAhAgAAABMAIC8AAJECACAG1QIBAJMFACHYAkAAlgUAIZ0DAQCTBQAhngNAAJYFACGfA0AAzAUAIaADAQCTBQAhAgAAABEAIC8AAJMCACACAAAAEQAgLwAAkwIAIAMAAAATACA2AACMAgAgNwAAkQIAIAEAAAATACABAAAAEQAgBA8AANgGACA-AADaBgAgPwAA2QYAIJ8DAACNBQAgCdICAADABAAw0wIAAJoCABDUAgAAwAQAMNUCAQCEBAAh2AJAAIcEACGdAwEAhAQAIZ4DQACHBAAhnwNAAKkEACGgAwEAhAQAIQMAAAARACADAACZAgAwOwAAmgIAIAMAAAARACADAAASADAEAAATACABAAAAHwAgAQAAAB8AIAMAAAAdACADAAAeADAEAAAfACADAAAAHQAgAwAAHgAwBAAAHwAgAwAAAB0AIAMAAB4AMAQAAB8AIBABAADVBgAgFgAA1wYAIBsAANYGACDVAgEAAAAB2AJAAAAAAekCAQAAAAHqAgEAAAAB7wJAAAAAAZADAQAAAAGSAwEAAAABkwMBAAAAAZQDAQAAAAGZAwgAAAABmgMgAAAAAZsDIAAAAAGcA0AAAAABAS8AAKICACAN1QIBAAAAAdgCQAAAAAHpAgEAAAAB6gIBAAAAAe8CQAAAAAGQAwEAAAABkgMBAAAAAZMDAQAAAAGUAwEAAAABmQMIAAAAAZoDIAAAAAGbAyAAAAABnANAAAAAAQEvAACkAgAwAS8AAKQCADAQAQAAvQYAIBYAAL8GACAbAAC-BgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHvAkAAlgUAIZADAQCTBQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhmQMIAL4FACGaAyAApwYAIZsDIACnBgAhnANAAMwFACECAAAAHwAgLwAApwIAIA3VAgEAkwUAIdgCQACWBQAh6QIBAJMFACHqAgEAkwUAIe8CQACWBQAhkAMBAJMFACGSAwEAkwUAIZMDAQCTBQAhlAMBAJUFACGZAwgAvgUAIZoDIACnBgAhmwMgAKcGACGcA0AAzAUAIQIAAAAdACAvAACpAgAgAgAAAB0AIC8AAKkCACADAAAAHwAgNgAAogIAIDcAAKcCACABAAAAHwAgAQAAAB0AIAcPAAC4BgAgPAAAuQYAID0AALwGACA-AAC7BgAgPwAAugYAIJQDAACNBQAgnAMAAI0FACAQ0gIAAL8EADDTAgAAsAIAENQCAAC_BAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh6gIBAIQEACHvAkAAhwQAIZADAQCEBAAhkgMBAIQEACGTAwEAhAQAIZQDAQCGBAAhmQMIAJUEACGaAyAAvAQAIZsDIAC8BAAhnANAAKkEACEDAAAAHQAgAwAArwIAMDsAALACACADAAAAHQAgAwAAHgAwBAAAHwAgAQAAAD8AIAEAAAA_ACADAAAAPQAgAwAAPgAwBAAAPwAgAwAAAD0AIAMAAD4AMAQAAD8AIAMAAAA9ACADAAA-ADAEAAA_ACAQDAAAtgYAIA4AALcGACDVAgEAAAAB2AJAAAAAAeoCAQAAAAHvAkAAAAABgQMBAAAAAZADAQAAAAGRAwgAAAABkgMBAAAAAZMDAQAAAAGUAwEAAAABlQNAAAAAAZYDAQAAAAGXAwEAAAABmAMgAAAAAQEvAAC4AgAgDtUCAQAAAAHYAkAAAAAB6gIBAAAAAe8CQAAAAAGBAwEAAAABkAMBAAAAAZEDCAAAAAGSAwEAAAABkwMBAAAAAZQDAQAAAAGVA0AAAAABlgMBAAAAAZcDAQAAAAGYAyAAAAABAS8AALoCADABLwAAugIAMBAMAACoBgAgDgAAqQYAINUCAQCTBQAh2AJAAJYFACHqAgEAkwUAIe8CQACWBQAhgQMBAJMFACGQAwEAkwUAIZEDCAC-BQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhlQNAAMwFACGWAwEAlQUAIZcDAQCVBQAhmAMgAKcGACECAAAAPwAgLwAAvQIAIA7VAgEAkwUAIdgCQACWBQAh6gIBAJMFACHvAkAAlgUAIYEDAQCTBQAhkAMBAJMFACGRAwgAvgUAIZIDAQCTBQAhkwMBAJMFACGUAwEAlQUAIZUDQADMBQAhlgMBAJUFACGXAwEAlQUAIZgDIACnBgAhAgAAAD0AIC8AAL8CACACAAAAPQAgLwAAvwIAIAMAAAA_ACA2AAC4AgAgNwAAvQIAIAEAAAA_ACABAAAAPQAgCQ8AAKIGACA8AACjBgAgPQAApgYAID4AAKUGACA_AACkBgAglAMAAI0FACCVAwAAjQUAIJYDAACNBQAglwMAAI0FACAR0gIAALsEADDTAgAAxgIAENQCAAC7BAAw1QIBAIQEACHYAkAAhwQAIeoCAQCEBAAh7wJAAIcEACGBAwEAhAQAIZADAQCEBAAhkQMIAJUEACGSAwEAhAQAIZMDAQCEBAAhlAMBAIYEACGVA0AAqQQAIZYDAQCGBAAhlwMBAIYEACGYAyAAvAQAIQMAAAA9ACADAADFAgAwOwAAxgIAIAMAAAA9ACADAAA-ADAEAAA_ACABAAAAKQAgAQAAACkAIAMAAAAmACADAAAoADAEAAApACADAAAAJgAgAwAAKAAwBAAAKQAgAwAAACYAIAMAACgAMAQAACkAIAwBAACfBgAgEAAAngYAIBEAAKAGACAWAAChBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABAS8AAM4CACAI1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABAS8AANACADABLwAA0AIAMAwBAACNBgAgEAAAjAYAIBEAAI4GACAWAACPBgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACHzAgAAiwaPAyKMAwEAkwUAIY0DCADKBQAhjwMBAJMFACECAAAAKQAgLwAA0wIAIAjVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfMCAACLBo8DIowDAQCTBQAhjQMIAMoFACGPAwEAkwUAIQIAAAAmACAvAADVAgAgAgAAACYAIC8AANUCACADAAAAKQAgNgAAzgIAIDcAANMCACABAAAAKQAgAQAAACYAIAYPAACGBgAgPAAAhwYAID0AAIoGACA-AACJBgAgPwAAiAYAII0DAACNBQAgC9ICAAC3BAAw0wIAANwCABDUAgAAtwQAMNUCAQCEBAAh2AJAAIcEACHpAgEAhAQAIe8CQACHBAAh8wIAALgEjwMijAMBAIQEACGNAwgApwQAIY8DAQCEBAAhAwAAACYAIAMAANsCADA7AADcAgAgAwAAACYAIAMAACgAMAQAACkAIAEAAAAjACABAAAAIwAgAwAAACEAIAMAACIAMAQAACMAIAMAAAAhACADAAAiADAEAAAjACADAAAAIQAgAwAAIgAwBAAAIwAgFwEAAIEGACAMAACABgAgDQAAggYAIBUAAIMGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgQMBAAAAAYMDQAAAAAGEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwgAAAABiAMBAAAAAYkDAQAAAAGKAwEAAAABiwMBAAAAAQEvAADkAgAgEdUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgQMBAAAAAYMDQAAAAAGEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwgAAAABiAMBAAAAAYkDAQAAAAGKAwEAAAABiwMBAAAAAQEvAADmAgAwAS8AAOYCADABAAAAHQAgAQAAACYAIBcBAADxBQAgDAAA8AUAIA0AAPIFACAVAADzBQAgFwAA9AUAIBoAAPUFACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfMCAADvBYMDIv8CAQCVBQAhgAMBAJUFACGBAwEAkwUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIQIAAAAjACAvAADrAgAgEdUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGAAwEAlQUAIYEDAQCTBQAhgwNAAJYFACGEAwEAlQUAIYUDAQCVBQAhhgMBAJUFACGHAwgAygUAIYgDAQCVBQAhiQMBAJUFACGKAwEAlQUAIYsDAQCVBQAhAgAAACEAIC8AAO0CACACAAAAIQAgLwAA7QIAIAEAAAAdACABAAAAJgAgAwAAACMAIDYAAOQCACA3AADrAgAgAQAAACMAIAEAAAAhACAPDwAA6gUAIDwAAOsFACA9AADuBQAgPgAA7QUAID8AAOwFACD_AgAAjQUAIIADAACNBQAghAMAAI0FACCFAwAAjQUAIIYDAACNBQAghwMAAI0FACCIAwAAjQUAIIkDAACNBQAgigMAAI0FACCLAwAAjQUAIBTSAgAAswQAMNMCAAD2AgAQ1AIAALMEADDVAgEAhAQAIdgCQACHBAAh6QIBAIQEACHvAkAAhwQAIfMCAAC0BIMDIv8CAQCGBAAhgAMBAIYEACGBAwEAhAQAIYMDQACHBAAhhAMBAIYEACGFAwEAhgQAIYYDAQCGBAAhhwMIAKcEACGIAwEAhgQAIYkDAQCGBAAhigMBAIYEACGLAwEAhgQAIQMAAAAhACADAAD1AgAwOwAA9gIAIAMAAAAhACADAAAiADAEAAAjACABAAAASwAgAQAAAEsAIAMAAABJACADAABKADAEAABLACADAAAASQAgAwAASgAwBAAASwAgAwAAAEkAIAMAAEoAMAQAAEsAIAgBAADoBQAgDAAA5wUAIBIAAOkFACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAABgQMBAAAAAQEvAAD-AgAgBdUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAGBAwEAAAABAS8AAIADADABLwAAgAMAMAgBAADZBQAgDAAA2AUAIBIAANoFACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIYEDAQCTBQAhAgAAAEsAIC8AAIMDACAF1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACGBAwEAkwUAIQIAAABJACAvAACFAwAgAgAAAEkAIC8AAIUDACADAAAASwAgNgAA_gIAIDcAAIMDACABAAAASwAgAQAAAEkAIAMPAADVBQAgPgAA1wUAID8AANYFACAI0gIAALIEADDTAgAAjAMAENQCAACyBAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh7wJAAIcEACGBAwEAhAQAIQMAAABJACADAACLAwAwOwAAjAMAIAMAAABJACADAABKADAEAABLACABAAAALwAgAQAAAC8AIAMAAAAtACADAAAuADAEAAAvACADAAAALQAgAwAALgAwBAAALwAgAwAAAC0AIAMAAC4AMAQAAC8AIA8NAADUBQAgEwAA0QUAIBQAANIFACAVAADTBQAg1QIBAAAAAdgCQAAAAAHoAgEAAAAB-AIAAAD4AgL5AggAAAAB-wIAAAD7AgP8AkAAAAAB_QIBAAAAAf4CAQAAAAH_AgEAAAABgAMBAAAAAQEvAACUAwAgC9UCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf0CAQAAAAH-AgEAAAAB_wIBAAAAAYADAQAAAAEBLwAAlgMAMAEvAACWAwAwAQAAACYAIAEAAAAdACAPDQAA0AUAIBMAAM0FACAUAADOBQAgFQAAzwUAINUCAQCTBQAh2AJAAJYFACHoAgEAkwUAIfgCAADJBfgCIvkCCADKBQAh-wIAAMsF-wIj_AJAAMwFACH9AgEAkwUAIf4CAQCTBQAh_wIBAJUFACGAAwEAlQUAIQIAAAAvACAvAACbAwAgC9UCAQCTBQAh2AJAAJYFACHoAgEAkwUAIfgCAADJBfgCIvkCCADKBQAh-wIAAMsF-wIj_AJAAMwFACH9AgEAkwUAIf4CAQCTBQAh_wIBAJUFACGAAwEAlQUAIQIAAAAtACAvAACdAwAgAgAAAC0AIC8AAJ0DACABAAAAJgAgAQAAAB0AIAMAAAAvACA2AACUAwAgNwAAmwMAIAEAAAAvACABAAAALQAgCg8AAMQFACA8AADFBQAgPQAAyAUAID4AAMcFACA_AADGBQAg-QIAAI0FACD7AgAAjQUAIPwCAACNBQAg_wIAAI0FACCAAwAAjQUAIA7SAgAApQQAMNMCAACmAwAQ1AIAAKUEADDVAgEAhAQAIdgCQACHBAAh6AIBAIQEACH4AgAApgT4AiL5AggApwQAIfsCAACoBPsCI_wCQACpBAAh_QIBAIQEACH-AgEAhAQAIf8CAQCGBAAhgAMBAIYEACEDAAAALQAgAwAApQMAMDsAAKYDACADAAAALQAgAwAALgAwBAAALwAgDREAAKQEACDSAgAAnQQAMNMCAAA2ABDUAgAAnQQAMNUCAQAAAAHYAkAAowQAIdsCAQAAAAHvAkAAowQAIfACCACeBAAh8QIBAJ8EACHzAgAAoATzAiL1AgAAoQT1AiL2AgEAogQAIQEAAACpAwAgAQAAAKkDACACEQAAwwUAIPYCAACNBQAgAwAAADYAIAMAAKwDADAEAACpAwAgAwAAADYAIAMAAKwDADAEAACpAwAgAwAAADYAIAMAAKwDADAEAACpAwAgChEAAMIFACDVAgEAAAAB2AJAAAAAAdsCAQAAAAHvAkAAAAAB8AIIAAAAAfECAQAAAAHzAgAAAPMCAvUCAAAA9QIC9gIBAAAAAQEvAACwAwAgCdUCAQAAAAHYAkAAAAAB2wIBAAAAAe8CQAAAAAHwAggAAAAB8QIBAAAAAfMCAAAA8wIC9QIAAAD1AgL2AgEAAAABAS8AALIDADABLwAAsgMAMAoRAADBBQAg1QIBAJMFACHYAkAAlgUAIdsCAQCTBQAh7wJAAJYFACHwAggAvgUAIfECAQCTBQAh8wIAAL8F8wIi9QIAAMAF9QIi9gIBAJUFACECAAAAqQMAIC8AALUDACAJ1QIBAJMFACHYAkAAlgUAIdsCAQCTBQAh7wJAAJYFACHwAggAvgUAIfECAQCTBQAh8wIAAL8F8wIi9QIAAMAF9QIi9gIBAJUFACECAAAANgAgLwAAtwMAIAIAAAA2ACAvAAC3AwAgAwAAAKkDACA2AACwAwAgNwAAtQMAIAEAAACpAwAgAQAAADYAIAYPAAC5BQAgPAAAugUAID0AAL0FACA-AAC8BQAgPwAAuwUAIPYCAACNBQAgDNICAACUBAAw0wIAAL4DABDUAgAAlAQAMNUCAQCEBAAh2AJAAIcEACHbAgEAhAQAIe8CQACHBAAh8AIIAJUEACHxAgEAhAQAIfMCAACWBPMCIvUCAACXBPUCIvYCAQCGBAAhAwAAADYAIAMAAL0DADA7AAC-AwAgAwAAADYAIAMAAKwDADAEAACpAwAgAQAAAFAAIAEAAABQACADAAAATgAgAwAATwAwBAAAUAAgAwAAAE4AIAMAAE8AMAQAAFAAIAMAAABOACADAABPADAEAABQACALAQAAtwUAICcAALgFACDVAgEAAAAB2AJAAAAAAekCAQAAAAHqAgEAAAAB6wIBAAAAAewCAQAAAAHtAgIAAAAB7gICAAAAAe8CQAAAAAEBLwAAxgMAIAnVAgEAAAAB2AJAAAAAAekCAQAAAAHqAgEAAAAB6wIBAAAAAewCAQAAAAHtAgIAAAAB7gICAAAAAe8CQAAAAAEBLwAAyAMAMAEvAADIAwAwCwEAAKkFACAnAACqBQAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACHuAgIAlAUAIe8CQACWBQAhAgAAAFAAIC8AAMsDACAJ1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACHuAgIAlAUAIe8CQACWBQAhAgAAAE4AIC8AAM0DACACAAAATgAgLwAAzQMAIAMAAABQACA2AADGAwAgNwAAywMAIAEAAABQACABAAAATgAgBQ8AAKQFACA8AAClBQAgPQAAqAUAID4AAKcFACA_AACmBQAgDNICAACTBAAw0wIAANQDABDUAgAAkwQAMNUCAQCEBAAh2AJAAIcEACHpAgEAhAQAIeoCAQCEBAAh6wIBAIQEACHsAgEAhAQAIe0CAgCFBAAh7gICAIUEACHvAkAAhwQAIQMAAABOACADAADTAwAwOwAA1AMAIAMAAABOACADAABPADAEAABQACABAAAAVAAgAQAAAFQAIAMAAABSACADAABTADAEAABUACADAAAAUgAgAwAAUwAwBAAAVAAgAwAAAFIAIAMAAFMAMAQAAFQAIAcYAACjBQAgJgAAogUAINUCAQAAAAHYAkAAAAAB2QIBAAAAAecCAQAAAAHoAgEAAAABAS8AANwDACAF1QIBAAAAAdgCQAAAAAHZAgEAAAAB5wIBAAAAAegCAQAAAAEBLwAA3gMAMAEvAADeAwAwBxgAAKEFACAmAACgBQAg1QIBAJMFACHYAkAAlgUAIdkCAQCTBQAh5wIBAJMFACHoAgEAkwUAIQIAAABUACAvAADhAwAgBdUCAQCTBQAh2AJAAJYFACHZAgEAkwUAIecCAQCTBQAh6AIBAJMFACECAAAAUgAgLwAA4wMAIAIAAABSACAvAADjAwAgAwAAAFQAIDYAANwDACA3AADhAwAgAQAAAFQAIAEAAABSACADDwAAnQUAID4AAJ8FACA_AACeBQAgCNICAACSBAAw0wIAAOoDABDUAgAAkgQAMNUCAQCEBAAh2AJAAIcEACHZAgEAhAQAIecCAQCEBAAh6AIBAIQEACEDAAAAUgAgAwAA6QMAMDsAAOoDACADAAAAUgAgAwAAUwAwBAAAVAAgAQAAAEUAIAEAAABFACADAAAAOAAgAwAARAAwBAAARQAgAwAAADgAIAMAAEQAMAQAAEUAIAMAAAA4ACADAABEADAEAABFACAKEQAAnAUAIBgAAJoFACAZAACbBQAg1QIBAAAAAdYCAgAAAAHXAgEAAAAB2AJAAAAAAdkCAQAAAAHaAgEAAAAB2wIBAAAAAQEvAADyAwAgB9UCAQAAAAHWAgIAAAAB1wIBAAAAAdgCQAAAAAHZAgEAAAAB2gIBAAAAAdsCAQAAAAEBLwAA9AMAMAEvAAD0AwAwChEAAJkFACAYAACXBQAgGQAAmAUAINUCAQCTBQAh1gICAJQFACHXAgEAlQUAIdgCQACWBQAh2QIBAJMFACHaAgEAkwUAIdsCAQCTBQAhAgAAAEUAIC8AAPcDACAH1QIBAJMFACHWAgIAlAUAIdcCAQCVBQAh2AJAAJYFACHZAgEAkwUAIdoCAQCTBQAh2wIBAJMFACECAAAAOAAgLwAA-QMAIAIAAAA4ACAvAAD5AwAgAwAAAEUAIDYAAPIDACA3AAD3AwAgAQAAAEUAIAEAAAA4ACAGDwAAjgUAIDwAAI8FACA9AACSBQAgPgAAkQUAID8AAJAFACDXAgAAjQUAIArSAgAAgwQAMNMCAACABAAQ1AIAAIMEADDVAgEAhAQAIdYCAgCFBAAh1wIBAIYEACHYAkAAhwQAIdkCAQCEBAAh2gIBAIQEACHbAgEAhAQAIQMAAAA4ACADAAD_AwAwOwAAgAQAIAMAAAA4ACADAABEADAEAABFACAK0gIAAIMEADDTAgAAgAQAENQCAACDBAAw1QIBAIQEACHWAgIAhQQAIdcCAQCGBAAh2AJAAIcEACHZAgEAhAQAIdoCAQCEBAAh2wIBAIQEACEODwAAiQQAID4AAJEEACA_AACRBAAg3AIBAAAAAd0CAQAAAATeAgEAAAAE3wIBAAAAAeACAQAAAAHhAgEAAAAB4gIBAAAAAeMCAQCQBAAh5AIBAAAAAeUCAQAAAAHmAgEAAAABDQ8AAIkEACA8AACPBAAgPQAAiQQAID4AAIkEACA_AACJBAAg3AICAAAAAd0CAgAAAATeAgIAAAAE3wICAAAAAeACAgAAAAHhAgIAAAAB4gICAAAAAeMCAgCOBAAhDg8AAIwEACA-AACNBAAgPwAAjQQAINwCAQAAAAHdAgEAAAAF3gIBAAAABd8CAQAAAAHgAgEAAAAB4QIBAAAAAeICAQAAAAHjAgEAiwQAIeQCAQAAAAHlAgEAAAAB5gIBAAAAAQsPAACJBAAgPgAAigQAID8AAIoEACDcAkAAAAAB3QJAAAAABN4CQAAAAATfAkAAAAAB4AJAAAAAAeECQAAAAAHiAkAAAAAB4wJAAIgEACELDwAAiQQAID4AAIoEACA_AACKBAAg3AJAAAAAAd0CQAAAAATeAkAAAAAE3wJAAAAAAeACQAAAAAHhAkAAAAAB4gJAAAAAAeMCQACIBAAhCNwCAgAAAAHdAgIAAAAE3gICAAAABN8CAgAAAAHgAgIAAAAB4QICAAAAAeICAgAAAAHjAgIAiQQAIQjcAkAAAAAB3QJAAAAABN4CQAAAAATfAkAAAAAB4AJAAAAAAeECQAAAAAHiAkAAAAAB4wJAAIoEACEODwAAjAQAID4AAI0EACA_AACNBAAg3AIBAAAAAd0CAQAAAAXeAgEAAAAF3wIBAAAAAeACAQAAAAHhAgEAAAAB4gIBAAAAAeMCAQCLBAAh5AIBAAAAAeUCAQAAAAHmAgEAAAABCNwCAgAAAAHdAgIAAAAF3gICAAAABd8CAgAAAAHgAgIAAAAB4QICAAAAAeICAgAAAAHjAgIAjAQAIQvcAgEAAAAB3QIBAAAABd4CAQAAAAXfAgEAAAAB4AIBAAAAAeECAQAAAAHiAgEAAAAB4wIBAI0EACHkAgEAAAAB5QIBAAAAAeYCAQAAAAENDwAAiQQAIDwAAI8EACA9AACJBAAgPgAAiQQAID8AAIkEACDcAgIAAAAB3QICAAAABN4CAgAAAATfAgIAAAAB4AICAAAAAeECAgAAAAHiAgIAAAAB4wICAI4EACEI3AIIAAAAAd0CCAAAAATeAggAAAAE3wIIAAAAAeACCAAAAAHhAggAAAAB4gIIAAAAAeMCCACPBAAhDg8AAIkEACA-AACRBAAgPwAAkQQAINwCAQAAAAHdAgEAAAAE3gIBAAAABN8CAQAAAAHgAgEAAAAB4QIBAAAAAeICAQAAAAHjAgEAkAQAIeQCAQAAAAHlAgEAAAAB5gIBAAAAAQvcAgEAAAAB3QIBAAAABN4CAQAAAATfAgEAAAAB4AIBAAAAAeECAQAAAAHiAgEAAAAB4wIBAJEEACHkAgEAAAAB5QIBAAAAAeYCAQAAAAEI0gIAAJIEADDTAgAA6gMAENQCAACSBAAw1QIBAIQEACHYAkAAhwQAIdkCAQCEBAAh5wIBAIQEACHoAgEAhAQAIQzSAgAAkwQAMNMCAADUAwAQ1AIAAJMEADDVAgEAhAQAIdgCQACHBAAh6QIBAIQEACHqAgEAhAQAIesCAQCEBAAh7AIBAIQEACHtAgIAhQQAIe4CAgCFBAAh7wJAAIcEACEM0gIAAJQEADDTAgAAvgMAENQCAACUBAAw1QIBAIQEACHYAkAAhwQAIdsCAQCEBAAh7wJAAIcEACHwAggAlQQAIfECAQCEBAAh8wIAAJYE8wIi9QIAAJcE9QIi9gIBAIYEACENDwAAiQQAIDwAAI8EACA9AACPBAAgPgAAjwQAID8AAI8EACDcAggAAAAB3QIIAAAABN4CCAAAAATfAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAAB4wIIAJwEACEHDwAAiQQAID4AAJsEACA_AACbBAAg3AIAAADzAgLdAgAAAPMCCN4CAAAA8wII4wIAAJoE8wIiBw8AAIkEACA-AACZBAAgPwAAmQQAINwCAAAA9QIC3QIAAAD1AgjeAgAAAPUCCOMCAACYBPUCIgcPAACJBAAgPgAAmQQAID8AAJkEACDcAgAAAPUCAt0CAAAA9QII3gIAAAD1AgjjAgAAmAT1AiIE3AIAAAD1AgLdAgAAAPUCCN4CAAAA9QII4wIAAJkE9QIiBw8AAIkEACA-AACbBAAgPwAAmwQAINwCAAAA8wIC3QIAAADzAgjeAgAAAPMCCOMCAACaBPMCIgTcAgAAAPMCAt0CAAAA8wII3gIAAADzAgjjAgAAmwTzAiINDwAAiQQAIDwAAI8EACA9AACPBAAgPgAAjwQAID8AAI8EACDcAggAAAAB3QIIAAAABN4CCAAAAATfAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAAB4wIIAJwEACENEQAApAQAINICAACdBAAw0wIAADYAENQCAACdBAAw1QIBAJ8EACHYAkAAowQAIdsCAQCfBAAh7wJAAKMEACHwAggAngQAIfECAQCfBAAh8wIAAKAE8wIi9QIAAKEE9QIi9gIBAKIEACEI3AIIAAAAAd0CCAAAAATeAggAAAAE3wIIAAAAAeACCAAAAAHhAggAAAAB4gIIAAAAAeMCCACPBAAhC9wCAQAAAAHdAgEAAAAE3gIBAAAABN8CAQAAAAHgAgEAAAAB4QIBAAAAAeICAQAAAAHjAgEAkQQAIeQCAQAAAAHlAgEAAAAB5gIBAAAAAQTcAgAAAPMCAt0CAAAA8wII3gIAAADzAgjjAgAAmwTzAiIE3AIAAAD1AgLdAgAAAPUCCN4CAAAA9QII4wIAAJkE9QIiC9wCAQAAAAHdAgEAAAAF3gIBAAAABd8CAQAAAAHgAgEAAAAB4QIBAAAAAeICAQAAAAHjAgEAjQQAIeQCAQAAAAHlAgEAAAAB5gIBAAAAAQjcAkAAAAAB3QJAAAAABN4CQAAAAATfAkAAAAAB4AJAAAAAAeECQAAAAAHiAkAAAAAB4wJAAIoEACEcAQAAzgQAIAwAAM4EACANAAD5BAAgFQAA-AQAIBcAAIEFACAaAACCBQAg0gIAAP8EADDTAgAAIQAQ1AIAAP8EADDVAgEAnwQAIdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIfMCAACABYMDIv8CAQCiBAAhgAMBAKIEACGBAwEAnwQAIYMDQACjBAAhhAMBAKIEACGFAwEAogQAIYYDAQCiBAAhhwMIAPUEACGIAwEAogQAIYkDAQCiBAAhigMBAKIEACGLAwEAogQAIckDAAAhACDKAwAAIQAgDtICAAClBAAw0wIAAKYDABDUAgAApQQAMNUCAQCEBAAh2AJAAIcEACHoAgEAhAQAIfgCAACmBPgCIvkCCACnBAAh-wIAAKgE-wIj_AJAAKkEACH9AgEAhAQAIf4CAQCEBAAh_wIBAIYEACGAAwEAhgQAIQcPAACJBAAgPgAAsQQAID8AALEEACDcAgAAAPgCAt0CAAAA-AII3gIAAAD4AgjjAgAAsAT4AiINDwAAjAQAIDwAAK8EACA9AACvBAAgPgAArwQAID8AAK8EACDcAggAAAAB3QIIAAAABd4CCAAAAAXfAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAAB4wIIAK4EACEHDwAAjAQAID4AAK0EACA_AACtBAAg3AIAAAD7AgPdAgAAAPsCCd4CAAAA-wIJ4wIAAKwE-wIjCw8AAIwEACA-AACrBAAgPwAAqwQAINwCQAAAAAHdAkAAAAAF3gJAAAAABd8CQAAAAAHgAkAAAAAB4QJAAAAAAeICQAAAAAHjAkAAqgQAIQsPAACMBAAgPgAAqwQAID8AAKsEACDcAkAAAAAB3QJAAAAABd4CQAAAAAXfAkAAAAAB4AJAAAAAAeECQAAAAAHiAkAAAAAB4wJAAKoEACEI3AJAAAAAAd0CQAAAAAXeAkAAAAAF3wJAAAAAAeACQAAAAAHhAkAAAAAB4gJAAAAAAeMCQACrBAAhBw8AAIwEACA-AACtBAAgPwAArQQAINwCAAAA-wID3QIAAAD7AgneAgAAAPsCCeMCAACsBPsCIwTcAgAAAPsCA90CAAAA-wIJ3gIAAAD7AgnjAgAArQT7AiMNDwAAjAQAIDwAAK8EACA9AACvBAAgPgAArwQAID8AAK8EACDcAggAAAAB3QIIAAAABd4CCAAAAAXfAggAAAAB4AIIAAAAAeECCAAAAAHiAggAAAAB4wIIAK4EACEI3AIIAAAAAd0CCAAAAAXeAggAAAAF3wIIAAAAAeACCAAAAAHhAggAAAAB4gIIAAAAAeMCCACvBAAhBw8AAIkEACA-AACxBAAgPwAAsQQAINwCAAAA-AIC3QIAAAD4AgjeAgAAAPgCCOMCAACwBPgCIgTcAgAAAPgCAt0CAAAA-AII3gIAAAD4AgjjAgAAsQT4AiII0gIAALIEADDTAgAAjAMAENQCAACyBAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh7wJAAIcEACGBAwEAhAQAIRTSAgAAswQAMNMCAAD2AgAQ1AIAALMEADDVAgEAhAQAIdgCQACHBAAh6QIBAIQEACHvAkAAhwQAIfMCAAC0BIMDIv8CAQCGBAAhgAMBAIYEACGBAwEAhAQAIYMDQACHBAAhhAMBAIYEACGFAwEAhgQAIYYDAQCGBAAhhwMIAKcEACGIAwEAhgQAIYkDAQCGBAAhigMBAIYEACGLAwEAhgQAIQcPAACJBAAgPgAAtgQAID8AALYEACDcAgAAAIMDAt0CAAAAgwMI3gIAAACDAwjjAgAAtQSDAyIHDwAAiQQAID4AALYEACA_AAC2BAAg3AIAAACDAwLdAgAAAIMDCN4CAAAAgwMI4wIAALUEgwMiBNwCAAAAgwMC3QIAAACDAwjeAgAAAIMDCOMCAAC2BIMDIgvSAgAAtwQAMNMCAADcAgAQ1AIAALcEADDVAgEAhAQAIdgCQACHBAAh6QIBAIQEACHvAkAAhwQAIfMCAAC4BI8DIowDAQCEBAAhjQMIAKcEACGPAwEAhAQAIQcPAACJBAAgPgAAugQAID8AALoEACDcAgAAAI8DAt0CAAAAjwMI3gIAAACPAwjjAgAAuQSPAyIHDwAAiQQAID4AALoEACA_AAC6BAAg3AIAAACPAwLdAgAAAI8DCN4CAAAAjwMI4wIAALkEjwMiBNwCAAAAjwMC3QIAAACPAwjeAgAAAI8DCOMCAAC6BI8DIhHSAgAAuwQAMNMCAADGAgAQ1AIAALsEADDVAgEAhAQAIdgCQACHBAAh6gIBAIQEACHvAkAAhwQAIYEDAQCEBAAhkAMBAIQEACGRAwgAlQQAIZIDAQCEBAAhkwMBAIQEACGUAwEAhgQAIZUDQACpBAAhlgMBAIYEACGXAwEAhgQAIZgDIAC8BAAhBQ8AAIkEACA-AAC-BAAgPwAAvgQAINwCIAAAAAHjAiAAvQQAIQUPAACJBAAgPgAAvgQAID8AAL4EACDcAiAAAAAB4wIgAL0EACEC3AIgAAAAAeMCIAC-BAAhENICAAC_BAAw0wIAALACABDUAgAAvwQAMNUCAQCEBAAh2AJAAIcEACHpAgEAhAQAIeoCAQCEBAAh7wJAAIcEACGQAwEAhAQAIZIDAQCEBAAhkwMBAIQEACGUAwEAhgQAIZkDCACVBAAhmgMgALwEACGbAyAAvAQAIZwDQACpBAAhCdICAADABAAw0wIAAJoCABDUAgAAwAQAMNUCAQCEBAAh2AJAAIcEACGdAwEAhAQAIZ4DQACHBAAhnwNAAKkEACGgAwEAhAQAIQnSAgAAwQQAMNMCAACEAgAQ1AIAAMEEADDVAgEAhAQAIdgCQACHBAAhngNAAIcEACGgAwEAhAQAIaEDAQCEBAAhogMCAIUEACEJ0gIAAMIEADDTAgAA7gEAENQCAADCBAAw1QIBAIQEACHYAkAAhwQAIaADAQCEBAAhowMBAIQEACGkAwEAhAQAIaUDAQCEBAAhC9ICAADDBAAw0wIAANgBABDUAgAAwwQAMNUCAQCEBAAh2AJAAIcEACHoAgEAhAQAIZADAQCEBAAhoAMBAIQEACGmAwEAhAQAIacDAQCGBAAhqAMgALwEACEM0gIAAMQEADDTAgAAwgEAENQCAADEBAAw1QIBAIQEACHYAkAAhwQAIesCAQCEBAAh7AIBAIQEACHtAgIAhQQAIaADAQCEBAAhpgMAAMUEqgMiqgMCAIUEACGrAwEAhAQAIQcPAACJBAAgPgAAxwQAID8AAMcEACDcAgAAAKoDAt0CAAAAqgMI3gIAAACqAwjjAgAAxgSqAyIHDwAAiQQAID4AAMcEACA_AADHBAAg3AIAAACqAwLdAgAAAKoDCN4CAAAAqgMI4wIAAMYEqgMiBNwCAAAAqgMC3QIAAACqAwjeAgAAAKoDCOMCAADHBKoDIg7SAgAAyAQAMNMCAACsAQAQ1AIAAMgEADDVAgEAhAQAIdgCQACHBAAh6QIBAIQEACHvAkAAhwQAIfACCACVBAAh8QIBAIQEACHzAgAAyQSvAyL1AgAAlwT1AiL2AgEAhAQAIawDAgCFBAAhrQMBAIQEACEHDwAAiQQAID4AAMsEACA_AADLBAAg3AIAAACvAwLdAgAAAK8DCN4CAAAArwMI4wIAAMoErwMiBw8AAIkEACA-AADLBAAgPwAAywQAINwCAAAArwMC3QIAAACvAwjeAgAAAK8DCOMCAADKBK8DIgTcAgAAAK8DAt0CAAAArwMI3gIAAACvAwjjAgAAywSvAyIK0gIAAMwEADDTAgAAlgEAENQCAADMBAAw1QIBAIQEACHYAkAAhwQAIekCAQCEBAAh7wJAAIcEACGeA0AAhwQAIa8DQACHBAAhsAMBAIYEACELAQAAzgQAINICAADNBAAw0wIAAAMAENQCAADNBAAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh7wJAAKMEACGeA0AAowQAIa8DQACjBAAhsAMBAKIEACEuAgAA3AQAIAUAAN0EACAHAADeBAAgCAAA3wQAIAkAAOAEACAKAADhBAAgCwAA4gQAIBwAAOMEACAdAADkBAAgHgAA5QQAIB8AAOYEACAgAADmBAAgIQAA5wQAICIAAOcEACAjAADoBAAgJAAA6QQAICUAAOkEACAoAADqBAAgKQAA6wQAINICAADWBAAw0wIAAGsAENQCAADWBAAw1QIBAJ8EACHYAkAAowQAIe8CQACjBAAhmwMgANgEACGcA0AA2QQAIa0DAQCiBAAhsQMBAJ8EACGyAwEAnwQAIbMDAQCfBAAhtQMAANcEtQMitgMBAKIEACG3AwEAogQAIbgDIADYBAAhuQNAANkEACG6AyAA2AQAIbsDIADYBAAhvQMAANoEvQMivgNAANkEACG_A0AA2QQAIcADAgDbBAAhwQNAANkEACHCAwIA2wQAIckDAABrACDKAwAAawAgGdICAADPBAAw0wIAAH4AENQCAADPBAAw1QIBAIQEACHYAkAAhwQAIe8CQACHBAAhmwMgALwEACGcA0AAqQQAIa0DAQCGBAAhsQMBAIQEACGyAwEAhAQAIbMDAQCEBAAhtQMAANAEtQMitgMBAIYEACG3AwEAhgQAIbgDIAC8BAAhuQNAAKkEACG6AyAAvAQAIbsDIAC8BAAhvQMAANEEvQMivgNAAKkEACG_A0AAqQQAIcADAgCFBAAhwQNAAKkEACHCAwIAhQQAIQcPAACJBAAgPgAA1QQAID8AANUEACDcAgAAALUDAt0CAAAAtQMI3gIAAAC1AwjjAgAA1AS1AyIHDwAAiQQAID4AANMEACA_AADTBAAg3AIAAAC9AwLdAgAAAL0DCN4CAAAAvQMI4wIAANIEvQMiBw8AAIkEACA-AADTBAAgPwAA0wQAINwCAAAAvQMC3QIAAAC9AwjeAgAAAL0DCOMCAADSBL0DIgTcAgAAAL0DAt0CAAAAvQMI3gIAAAC9AwjjAgAA0wS9AyIHDwAAiQQAID4AANUEACA_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_wCQADZBAAh_QIBAJ8EACH-AgEAnwQAIf8CAQCiBAAhgAMBAKIEACEE3AIAAAD4AgLdAgAAAPgCCN4CAAAA-AII4wIAALEE-AIiCNwCCAAAAAHdAggAAAAF3gIIAAAABd8CCAAAAAHgAggAAAAB4QIIAAAAAeICCAAAAAHjAggArwQAIQTcAgAAAPsCA90CAAAA-wIJ3gIAAAD7AgnjAgAArQT7AiMNAQAAzgQAIAwAAM4EACASAADoBAAg0gIAAPAEADDTAgAASQAQ1AIAAPAEADDVAgEAnwQAIdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIYEDAQCfBAAhyQMAAEkAIMoDAABJACARAQAAzgQAIBAAAP0EACARAAD-BAAgFgAA6AQAINICAAD7BAAw0wIAACYAENQCAAD7BAAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAA_ASPAyKMAwEAnwQAIY0DCAD1BAAhjwMBAJ8EACHJAwAAJgAgygMAACYAIBUBAADOBAAgFgAA6AQAIBsAAOYEACDSAgAAgwUAMNMCAAAdABDUAgAAgwUAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIeoCAQCfBAAh7wJAAKMEACGQAwEAnwQAIZIDAQCfBAAhkwMBAJ8EACGUAwEAogQAIZkDCACeBAAhmgMgANgEACGbAyAA2AQAIZwDQADZBAAhyQMAAB0AIMoDAAAdACAC6QIBAAAAAY8DAQAAAAEPAQAAzgQAIBAAAP0EACARAAD-BAAgFgAA6AQAINICAAD7BAAw0wIAACYAENQCAAD7BAAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAA_ASPAyKMAwEAnwQAIY0DCAD1BAAhjwMBAJ8EACEE3AIAAACPAwLdAgAAAI8DCN4CAAAAjwMI4wIAALoEjwMiFQwAAM4EACAOAADlBAAg0gIAAPIEADDTAgAAPQAQ1AIAAPIEADDVAgEAnwQAIdgCQACjBAAh6gIBAJ8EACHvAkAAowQAIYEDAQCfBAAhkAMBAJ8EACGRAwgAngQAIZIDAQCfBAAhkwMBAJ8EACGUAwEAogQAIZUDQADZBAAhlgMBAKIEACGXAwEAogQAIZgDIADYBAAhyQMAAD0AIMoDAAA9ACAcAQAAzgQAIAwAAM4EACANAAD5BAAgFQAA-AQAIBcAAIEFACAaAACCBQAg0gIAAP8EADDTAgAAIQAQ1AIAAP8EADDVAgEAnwQAIdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIfMCAACABYMDIv8CAQCiBAAhgAMBAKIEACGBAwEAnwQAIYMDQACjBAAhhAMBAKIEACGFAwEAogQAIYYDAQCiBAAhhwMIAPUEACGIAwEAogQAIYkDAQCiBAAhigMBAKIEACGLAwEAogQAIckDAAAhACDKAwAAIQAgGgEAAM4EACAMAADOBAAgDQAA-QQAIBUAAPgEACAXAACBBQAgGgAAggUAINICAAD_BAAw0wIAACEAENQCAAD_BAAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAAgAWDAyL_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_AgAAjQUAIIADAACNBQAghAMAAI0FACCFAwAAjQUAIIYDAACNBQAghwMAAI0FACCIAwAAjQUAIIkDAACNBQAgigMAAI0FACCLAwAAjQUAIAAAAAAAAc4DAAAA-AICBc4DCAAAAAHUAwgAAAAB1QMIAAAAAdYDCAAAAAHXAwgAAAABAc4DAAAA-wIDAc4DQAAAAAEFNgAAggoAIDcAAI4KACDLAwAAgwoAIMwDAACNCgAg0QMAAEsAIAU2AACACgAgNwAAiwoAIMsDAACBCgAgzAMAAIoKACDRAwAAAQAgBzYAAP4JACA3AACICgAgywMAAP8JACDMAwAAhwoAIM8DAAAmACDQAwAAJgAg0QMAACkAIAc2AAD8CQAgNwAAhQoAIMsDAAD9CQAgzAMAAIQKACDPAwAAHQAg0AMAAB0AINEDAAAfACADNgAAggoAIMsDAACDCgAg0QMAAEsAIAM2AACACgAgywMAAIEKACDRAwAAAQAgAzYAAP4JACDLAwAA_wkAINEDAAApACADNgAA_AkAIMsDAAD9CQAg0QMAAB8AIAAAAAU2AADzCQAgNwAA-gkAIMsDAAD0CQAgzAMAAPkJACDRAwAAAQAgBTYAAPEJACA3AAD3CQAgywMAAPIJACDMAwAA9gkAINEDAAABACALNgAA2wUAMDcAAOAFADDLAwAA3AUAMMwDAADdBQAwzQMAAN4FACDOAwAA3wUAMM8DAADfBQAw0AMAAN8FADDRAwAA3wUAMNIDAADhBQAw0wMAAOIFADANDQAA1AUAIBQAANIFACAVAADTBQAg1QIBAAAAAdgCQAAAAAHoAgEAAAAB-AIAAAD4AgL5AggAAAAB-wIAAAD7AgP8AkAAAAAB_gIBAAAAAf8CAQAAAAGAAwEAAAABAgAAAC8AIDYAAOYFACADAAAALwAgNgAA5gUAIDcAAOUFACABLwAA9QkAMBINAAD5BAAgEwAA9wQAIBQAAM4EACAVAAD4BAAg0gIAAPMEADDTAgAALQAQ1AIAAPMEADDVAgEAAAAB2AJAAKMEACHoAgEAnwQAIfgCAAD0BPgCIvkCCAD1BAAh-wIAAPYE-wIj_AJAANkEACH9AgEAnwQAIf4CAQCfBAAh_wIBAKIEACGAAwEAogQAIQIAAAAvACAvAADlBQAgAgAAAOMFACAvAADkBQAgDtICAADiBQAw0wIAAOMFABDUAgAA4gUAMNUCAQCfBAAh2AJAAKMEACHoAgEAnwQAIfgCAAD0BPgCIvkCCAD1BAAh-wIAAPYE-wIj_AJAANkEACH9AgEAnwQAIf4CAQCfBAAh_wIBAKIEACGAAwEAogQAIQ7SAgAA4gUAMNMCAADjBQAQ1AIAAOIFADDVAgEAnwQAIdgCQACjBAAh6AIBAJ8EACH4AgAA9AT4AiL5AggA9QQAIfsCAAD2BPsCI_wCQADZBAAh_QIBAJ8EACH-AgEAnwQAIf8CAQCiBAAhgAMBAKIEACEK1QIBAJMFACHYAkAAlgUAIegCAQCTBQAh-AIAAMkF-AIi-QIIAMoFACH7AgAAywX7AiP8AkAAzAUAIf4CAQCTBQAh_wIBAJUFACGAAwEAlQUAIQ0NAADQBQAgFAAAzgUAIBUAAM8FACDVAgEAkwUAIdgCQACWBQAh6AIBAJMFACH4AgAAyQX4AiL5AggAygUAIfsCAADLBfsCI_wCQADMBQAh_gIBAJMFACH_AgEAlQUAIYADAQCVBQAhDQ0AANQFACAUAADSBQAgFQAA0wUAINUCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf4CAQAAAAH_AgEAAAABgAMBAAAAAQM2AADzCQAgywMAAPQJACDRAwAAAQAgAzYAAPEJACDLAwAA8gkAINEDAAABACAENgAA2wUAMMsDAADcBQAwzQMAAN4FACDRAwAA3wUAMAAAAAAAAc4DAAAAgwMCBTYAAOMJACA3AADvCQAgywMAAOQJACDMAwAA7gkAINEDAAABACAFNgAA4QkAIDcAAOwJACDLAwAA4gkAIMwDAADrCQAg0QMAAAEAIAc2AADfCQAgNwAA6QkAIMsDAADgCQAgzAMAAOgJACDPAwAAHQAg0AMAAB0AINEDAAAfACAHNgAA3QkAIDcAAOYJACDLAwAA3gkAIMwDAADlCQAgzwMAACYAINADAAAmACDRAwAAKQAgBzYAAPsFACA3AAD-BQAgywMAAPwFACDMAwAA_QUAIM8DAAA2ACDQAwAANgAg0QMAAKkDACAHNgAA9gUAIDcAAPkFACDLAwAA9wUAIMwDAAD4BQAgzwMAADgAINADAAA4ACDRAwAARQAgCBgAAJoFACAZAACbBQAg1QIBAAAAAdYCAgAAAAHXAgEAAAAB2AJAAAAAAdkCAQAAAAHaAgEAAAABAgAAAEUAIDYAAPYFACADAAAAOAAgNgAA9gUAIDcAAPoFACAKAAAAOAAgGAAAlwUAIBkAAJgFACAvAAD6BQAg1QIBAJMFACHWAgIAlAUAIdcCAQCVBQAh2AJAAJYFACHZAgEAkwUAIdoCAQCTBQAhCBgAAJcFACAZAACYBQAg1QIBAJMFACHWAgIAlAUAIdcCAQCVBQAh2AJAAJYFACHZAgEAkwUAIdoCAQCTBQAhCNUCAQAAAAHYAkAAAAAB7wJAAAAAAfACCAAAAAHxAgEAAAAB8wIAAADzAgL1AgAAAPUCAvYCAQAAAAECAAAAqQMAIDYAAPsFACADAAAANgAgNgAA-wUAIDcAAP8FACAKAAAANgAgLwAA_wUAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIfACCAC-BQAh8QIBAJMFACHzAgAAvwXzAiL1AgAAwAX1AiL2AgEAlQUAIQjVAgEAkwUAIdgCQACWBQAh7wJAAJYFACHwAggAvgUAIfECAQCTBQAh8wIAAL8F8wIi9QIAAMAF9QIi9gIBAJUFACEDNgAA4wkAIMsDAADkCQAg0QMAAAEAIAM2AADhCQAgywMAAOIJACDRAwAAAQAgAzYAAN8JACDLAwAA4AkAINEDAAAfACADNgAA3QkAIMsDAADeCQAg0QMAACkAIAM2AAD7BQAgywMAAPwFACDRAwAAqQMAIAM2AAD2BQAgywMAAPcFACDRAwAARQAgAAAAAAABzgMAAACPAwIFNgAA1AkAIDcAANsJACDLAwAA1QkAIMwDAADaCQAg0QMAAD8AIAU2AADSCQAgNwAA2AkAIMsDAADTCQAgzAMAANcJACDRAwAAAQAgBzYAAJkGACA3AACcBgAgywMAAJoGACDMAwAAmwYAIM8DAAAhACDQAwAAIQAg0QMAACMAIAs2AACQBgAwNwAAlAYAMMsDAACRBgAwzAMAAJIGADDNAwAAkwYAIM4DAADfBQAwzwMAAN8FADDQAwAA3wUAMNEDAADfBQAw0gMAAJUGADDTAwAA4gUAMA0NAADUBQAgEwAA0QUAIBQAANIFACDVAgEAAAAB2AJAAAAAAegCAQAAAAH4AgAAAPgCAvkCCAAAAAH7AgAAAPsCA_wCQAAAAAH9AgEAAAAB_gIBAAAAAYADAQAAAAECAAAALwAgNgAAmAYAIAMAAAAvACA2AACYBgAgNwAAlwYAIAEvAADWCQAwAgAAAC8AIC8AAJcGACACAAAA4wUAIC8AAJYGACAK1QIBAJMFACHYAkAAlgUAIegCAQCTBQAh-AIAAMkF-AIi-QIIAMoFACH7AgAAywX7AiP8AkAAzAUAIf0CAQCTBQAh_gIBAJMFACGAAwEAlQUAIQ0NAADQBQAgEwAAzQUAIBQAAM4FACDVAgEAkwUAIdgCQACWBQAh6AIBAJMFACH4AgAAyQX4AiL5AggAygUAIfsCAADLBfsCI_wCQADMBQAh_QIBAJMFACH-AgEAkwUAIYADAQCVBQAhDQ0AANQFACATAADRBQAgFAAA0gUAINUCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf0CAQAAAAH-AgEAAAABgAMBAAAAARUBAACBBgAgDAAAgAYAIA0AAIIGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAoADAQAAAAGBAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABAgAAACMAIDYAAJkGACADAAAAIQAgNgAAmQYAIDcAAJ0GACAXAAAAIQAgAQAA8QUAIAwAAPAFACANAADyBQAgFwAA9AUAIBoAAPUFACAvAACdBgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACHzAgAA7wWDAyKAAwEAlQUAIYEDAQCTBQAhgwNAAJYFACGEAwEAlQUAIYUDAQCVBQAhhgMBAJUFACGHAwgAygUAIYgDAQCVBQAhiQMBAJUFACGKAwEAlQUAIYsDAQCVBQAhFQEAAPEFACAMAADwBQAgDQAA8gUAIBcAAPQFACAaAAD1BQAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACHzAgAA7wWDAyKAAwEAlQUAIYEDAQCTBQAhgwNAAJYFACGEAwEAlQUAIYUDAQCVBQAhhgMBAJUFACGHAwgAygUAIYgDAQCVBQAhiQMBAJUFACGKAwEAlQUAIYsDAQCVBQAhAzYAANQJACDLAwAA1QkAINEDAAA_ACADNgAA0gkAIMsDAADTCQAg0QMAAAEAIAM2AACZBgAgywMAAJoGACDRAwAAIwAgBDYAAJAGADDLAwAAkQYAMM0DAACTBgAg0QMAAN8FADAAAAAAAAHOAyAAAAABBTYAAMwJACA3AADQCQAgywMAAM0JACDMAwAAzwkAINEDAAABACALNgAAqgYAMDcAAK8GADDLAwAAqwYAMMwDAACsBgAwzQMAAK0GACDOAwAArgYAMM8DAACuBgAw0AMAAK4GADDRAwAArgYAMNIDAACwBgAw0wMAALEGADAKAQAAnwYAIBEAAKAGACAWAAChBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAECAAAAKQAgNgAAtQYAIAMAAAApACA2AAC1BgAgNwAAtAYAIAEvAADOCQAwEAEAAM4EACAQAAD9BAAgEQAA_gQAIBYAAOgEACDSAgAA-wQAMNMCAAAmABDUAgAA-wQAMNUCAQAAAAHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAA_ASPAyKMAwEAnwQAIY0DCAD1BAAhjwMBAJ8EACHHAwAA-gQAIAIAAAApACAvAAC0BgAgAgAAALIGACAvAACzBgAgC9ICAACxBgAw0wIAALIGABDUAgAAsQYAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAPwEjwMijAMBAJ8EACGNAwgA9QQAIY8DAQCfBAAhC9ICAACxBgAw0wIAALIGABDUAgAAsQYAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAPwEjwMijAMBAJ8EACGNAwgA9QQAIY8DAQCfBAAhB9UCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAIsGjwMijAMBAJMFACGNAwgAygUAIQoBAACNBgAgEQAAjgYAIBYAAI8GACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfMCAACLBo8DIowDAQCTBQAhjQMIAMoFACEKAQAAnwYAIBEAAKAGACAWAAChBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAEDNgAAzAkAIMsDAADNCQAg0QMAAAEAIAQ2AACqBgAwywMAAKsGADDNAwAArQYAINEDAACuBgAwAAAAAAAFNgAAxQkAIDcAAMoJACDLAwAAxgkAIMwDAADJCQAg0QMAAAEAIAs2AADJBgAwNwAAzgYAMMsDAADKBgAwzAMAAMsGADDNAwAAzAYAIM4DAADNBgAwzwMAAM0GADDQAwAAzQYAMNEDAADNBgAw0gMAAM8GADDTAwAA0AYAMAs2AADABgAwNwAAxAYAMMsDAADBBgAwzAMAAMIGADDNAwAAwwYAIM4DAADfBQAwzwMAAN8FADDQAwAA3wUAMNEDAADfBQAw0gMAAMUGADDTAwAA4gUAMA0TAADRBQAgFAAA0gUAIBUAANMFACDVAgEAAAAB2AJAAAAAAegCAQAAAAH4AgAAAPgCAvkCCAAAAAH7AgAAAPsCA_wCQAAAAAH9AgEAAAAB_gIBAAAAAf8CAQAAAAECAAAALwAgNgAAyAYAIAMAAAAvACA2AADIBgAgNwAAxwYAIAEvAADICQAwAgAAAC8AIC8AAMcGACACAAAA4wUAIC8AAMYGACAK1QIBAJMFACHYAkAAlgUAIegCAQCTBQAh-AIAAMkF-AIi-QIIAMoFACH7AgAAywX7AiP8AkAAzAUAIf0CAQCTBQAh_gIBAJMFACH_AgEAlQUAIQ0TAADNBQAgFAAAzgUAIBUAAM8FACDVAgEAkwUAIdgCQACWBQAh6AIBAJMFACH4AgAAyQX4AiL5AggAygUAIfsCAADLBfsCI_wCQADMBQAh_QIBAJMFACH-AgEAkwUAIf8CAQCVBQAhDRMAANEFACAUAADSBQAgFQAA0wUAINUCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf0CAQAAAAH-AgEAAAAB_wIBAAAAARUBAACBBgAgDAAAgAYAIBUAAIMGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGBAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABAgAAACMAIDYAANQGACADAAAAIwAgNgAA1AYAIDcAANMGACABLwAAxwkAMBoBAADOBAAgDAAAzgQAIA0AAPkEACAVAAD4BAAgFwAAgQUAIBoAAIIFACDSAgAA_wQAMNMCAAAhABDUAgAA_wQAMNUCAQAAAAHYAkAAowQAIekCAQCfBAAh7wJAAKMEACHzAgAAgAWDAyL_AgEAAAABgAMBAKIEACGBAwEAnwQAIYMDQACjBAAhhAMBAKIEACGFAwEAogQAIYYDAQCiBAAhhwMIAPUEACGIAwEAogQAIYkDAQCiBAAhigMBAKIEACGLAwEAogQAIQIAAAAjACAvAADTBgAgAgAAANEGACAvAADSBgAgFNICAADQBgAw0wIAANEGABDUAgAA0AYAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAIAFgwMi_wIBAKIEACGAAwEAogQAIYEDAQCfBAAhgwNAAKMEACGEAwEAogQAIYUDAQCiBAAhhgMBAKIEACGHAwgA9QQAIYgDAQCiBAAhiQMBAKIEACGKAwEAogQAIYsDAQCiBAAhFNICAADQBgAw0wIAANEGABDUAgAA0AYAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAh8wIAAIAFgwMi_wIBAKIEACGAAwEAogQAIYEDAQCfBAAhgwNAAKMEACGEAwEAogQAIYUDAQCiBAAhhgMBAKIEACGHAwgA9QQAIYgDAQCiBAAhiQMBAKIEACGKAwEAogQAIYsDAQCiBAAhENUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGBAwEAkwUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIRUBAADxBQAgDAAA8AUAIBUAAPMFACAXAAD0BQAgGgAA9QUAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGBAwEAkwUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIRUBAACBBgAgDAAAgAYAIBUAAIMGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGBAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABAzYAAMUJACDLAwAAxgkAINEDAAABACAENgAAyQYAMMsDAADKBgAwzQMAAMwGACDRAwAAzQYAMAQ2AADABgAwywMAAMEGADDNAwAAwwYAINEDAADfBQAwAAAABTYAAMAJACA3AADDCQAgywMAAMEJACDMAwAAwgkAINEDAAABACADNgAAwAkAIMsDAADBCQAg0QMAAAEAIAAAAAAABTYAALsJACA3AAC-CQAgywMAALwJACDMAwAAvQkAINEDAAABACADNgAAuwkAIMsDAAC8CQAg0QMAAAEAIAAAAAU2AAC2CQAgNwAAuQkAIMsDAAC3CQAgzAMAALgJACDRAwAAAQAgAzYAALYJACDLAwAAtwkAINEDAAABACAAAAAFNgAAsQkAIDcAALQJACDLAwAAsgkAIMwDAACzCQAg0QMAAAEAIAM2AACxCQAgywMAALIJACDRAwAAAQAgAAAAAAABzgMAAACqAwIFNgAArAkAIDcAAK8JACDLAwAArQkAIMwDAACuCQAg0QMAAAEAIAM2AACsCQAgywMAAK0JACDRAwAAAQAgAAAAAAABzgMAAACvAwIFNgAApwkAIDcAAKoJACDLAwAAqAkAIMwDAACpCQAg0QMAAAEAIAM2AACnCQAgywMAAKgJACDRAwAAAQAgAAAABTYAAKIJACA3AAClCQAgywMAAKMJACDMAwAApAkAINEDAAABACADNgAAogkAIMsDAACjCQAg0QMAAAEAIBsCAAD5CAAgBQAA-ggAIAcAAPsIACAIAAD8CAAgCQAA_QgAIAoAAP4IACALAAD_CAAgHAAAgAkAIB0AAIEJACAeAACCCQAgHwAAgwkAICAAAIMJACAhAACECQAgIgAAhAkAICMAAIUJACAkAACGCQAgJQAAhgkAICgAAIcJACApAACICQAgnAMAAI0FACCtAwAAjQUAILYDAACNBQAgtwMAAI0FACC5AwAAjQUAIL4DAACNBQAgvwMAAI0FACDBAwAAjQUAIAAAAAAAAc4DAAAAtQMCAc4DAAAAvQMCBzYAAOEIACA3AADkCAAgywMAAOIIACDMAwAA4wgAIM8DAAADACDQAwAAAwAg0QMAAIEBACALNgAA1QgAMDcAANoIADDLAwAA1ggAMMwDAADXCAAwzQMAANgIACDOAwAA2QgAMM8DAADZCAAw0AMAANkIADDRAwAA2QgAMNIDAADbCAAw0wMAANwIADALNgAAyQgAMDcAAM4IADDLAwAAyggAMMwDAADLCAAwzQMAAMwIACDOAwAAzQgAMM8DAADNCAAw0AMAAM0IADDRAwAAzQgAMNIDAADPCAAw0wMAANAIADALNgAAvQgAMDcAAMIIADDLAwAAvggAMMwDAAC_CAAwzQMAAMAIACDOAwAAwQgAMM8DAADBCAAw0AMAAMEIADDRAwAAwQgAMNIDAADDCAAw0wMAAMQIADALNgAAsQgAMDcAALYIADDLAwAAsggAMMwDAACzCAAwzQMAALQIACDOAwAAtQgAMM8DAAC1CAAw0AMAALUIADDRAwAAtQgAMNIDAAC3CAAw0wMAALgIADALNgAApQgAMDcAAKoIADDLAwAApggAMMwDAACnCAAwzQMAAKgIACDOAwAAqQgAMM8DAACpCAAw0AMAAKkIADDRAwAAqQgAMNIDAACrCAAw0wMAAKwIADALNgAAmQgAMDcAAJ4IADDLAwAAmggAMMwDAACbCAAwzQMAAJwIACDOAwAAnQgAMM8DAACdCAAw0AMAAJ0IADDRAwAAnQgAMNIDAACfCAAw0wMAAKAIADALNgAAjQgAMDcAAJIIADDLAwAAjggAMMwDAACPCAAwzQMAAJAIACDOAwAAkQgAMM8DAACRCAAw0AMAAJEIADDRAwAAkQgAMNIDAACTCAAw0wMAAJQIADALNgAAgQgAMDcAAIYIADDLAwAAgggAMMwDAACDCAAwzQMAAIQIACDOAwAAhQgAMM8DAACFCAAw0AMAAIUIADDRAwAAhQgAMNIDAACHCAAw0wMAAIgIADALNgAA-AcAMDcAAPwHADDLAwAA-QcAMMwDAAD6BwAwzQMAAPsHACDOAwAArgYAMM8DAACuBgAw0AMAAK4GADDRAwAArgYAMNIDAAD9BwAw0wMAALEGADALNgAA7wcAMDcAAPMHADDLAwAA8AcAMMwDAADxBwAwzQMAAPIHACDOAwAAzQYAMM8DAADNBgAw0AMAAM0GADDRAwAAzQYAMNIDAAD0BwAw0wMAANAGADALNgAA5gcAMDcAAOoHADDLAwAA5wcAMMwDAADoBwAwzQMAAOkHACDOAwAAzQYAMM8DAADNBgAw0AMAAM0GADDRAwAAzQYAMNIDAADrBwAw0wMAANAGADALNgAA3QcAMDcAAOEHADDLAwAA3gcAMMwDAADfBwAwzQMAAOAHACDOAwAA1QcAMM8DAADVBwAw0AMAANUHADDRAwAA1QcAMNIDAADiBwAw0wMAANgHADALNgAA0QcAMDcAANYHADDLAwAA0gcAMMwDAADTBwAwzQMAANQHACDOAwAA1QcAMM8DAADVBwAw0AMAANUHADDRAwAA1QcAMNIDAADXBwAw0wMAANgHADALNgAAyAcAMDcAAMwHADDLAwAAyQcAMMwDAADKBwAwzQMAAMsHACDOAwAA3wUAMM8DAADfBQAw0AMAAN8FADDRAwAA3wUAMNIDAADNBwAw0wMAAOIFADALNgAAvwcAMDcAAMMHADDLAwAAwAcAMMwDAADBBwAwzQMAAMIHACDOAwAAtwcAMM8DAAC3BwAw0AMAALcHADDRAwAAtwcAMNIDAADEBwAw0wMAALoHADALNgAAswcAMDcAALgHADDLAwAAtAcAMMwDAAC1BwAwzQMAALYHACDOAwAAtwcAMM8DAAC3BwAw0AMAALcHADDRAwAAtwcAMNIDAAC5BwAw0wMAALoHADALNgAApwcAMDcAAKwHADDLAwAAqAcAMMwDAACpBwAwzQMAAKoHACDOAwAAqwcAMM8DAACrBwAw0AMAAKsHADDRAwAAqwcAMNIDAACtBwAw0wMAAK4HADALNgAAngcAMDcAAKIHADDLAwAAnwcAMMwDAACgBwAwzQMAAKEHACDOAwAArwUAMM8DAACvBQAw0AMAAK8FADDRAwAArwUAMNIDAACjBwAw0wMAALIFADAFJgAAogUAINUCAQAAAAHYAkAAAAAB5wIBAAAAAegCAQAAAAECAAAAVAAgNgAApgcAIAMAAABUACA2AACmBwAgNwAApQcAIAEvAAChCQAwAgAAAFQAIC8AAKUHACACAAAAswUAIC8AAKQHACAE1QIBAJMFACHYAkAAlgUAIecCAQCTBQAh6AIBAJMFACEFJgAAoAUAINUCAQCTBQAh2AJAAJYFACHnAgEAkwUAIegCAQCTBQAhBSYAAKIFACDVAgEAAAAB2AJAAAAAAecCAQAAAAHoAgEAAAABCScAALgFACDVAgEAAAAB2AJAAAAAAeoCAQAAAAHrAgEAAAAB7AIBAAAAAe0CAgAAAAHuAgIAAAAB7wJAAAAAAQIAAABQACA2AACyBwAgAwAAAFAAIDYAALIHACA3AACxBwAgAS8AAKAJADAOAQAAzgQAICcAAOsEACDSAgAA7gQAMNMCAABOABDUAgAA7gQAMNUCAQAAAAHYAkAAowQAIekCAQCfBAAh6gIBAJ8EACHrAgEAnwQAIewCAQCfBAAh7QICANsEACHuAgIA2wQAIe8CQACjBAAhAgAAAFAAIC8AALEHACACAAAArwcAIC8AALAHACAM0gIAAK4HADDTAgAArwcAENQCAACuBwAw1QIBAJ8EACHYAkAAowQAIekCAQCfBAAh6gIBAJ8EACHrAgEAnwQAIewCAQCfBAAh7QICANsEACHuAgIA2wQAIe8CQACjBAAhDNICAACuBwAw0wIAAK8HABDUAgAArgcAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIeoCAQCfBAAh6wIBAJ8EACHsAgEAnwQAIe0CAgDbBAAh7gICANsEACHvAkAAowQAIQjVAgEAkwUAIdgCQACWBQAh6gIBAJMFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACHuAgIAlAUAIe8CQACWBQAhCScAAKoFACDVAgEAkwUAIdgCQACWBQAh6gIBAJMFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACHuAgIAlAUAIe8CQACWBQAhCScAALgFACDVAgEAAAAB2AJAAAAAAeoCAQAAAAHrAgEAAAAB7AIBAAAAAe0CAgAAAAHuAgIAAAAB7wJAAAAAAQYMAADnBQAgEgAA6QUAINUCAQAAAAHYAkAAAAAB7wJAAAAAAYEDAQAAAAECAAAASwAgNgAAvgcAIAMAAABLACA2AAC-BwAgNwAAvQcAIAEvAACfCQAwDAEAAM4EACAMAADOBAAgEgAA6AQAINICAADwBAAw0wIAAEkAENQCAADwBAAw1QIBAAAAAdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIYEDAQCfBAAhxgMAAO8EACACAAAASwAgLwAAvQcAIAIAAAC7BwAgLwAAvAcAIAjSAgAAugcAMNMCAAC7BwAQ1AIAALoHADDVAgEAnwQAIdgCQACjBAAh6QIBAJ8EACHvAkAAowQAIYEDAQCfBAAhCNICAAC6BwAw0wIAALsHABDUAgAAugcAMNUCAQCfBAAh2AJAAKMEACHpAgEAnwQAIe8CQACjBAAhgQMBAJ8EACEE1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhgQMBAJMFACEGDAAA2AUAIBIAANoFACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGBAwEAkwUAIQYMAADnBQAgEgAA6QUAINUCAQAAAAHYAkAAAAAB7wJAAAAAAYEDAQAAAAEGAQAA6AUAIBIAAOkFACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAABAgAAAEsAIDYAAMcHACADAAAASwAgNgAAxwcAIDcAAMYHACABLwAAngkAMAIAAABLACAvAADGBwAgAgAAALsHACAvAADFBwAgBNUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAhBgEAANkFACASAADaBQAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACEGAQAA6AUAIBIAAOkFACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAABDQ0AANQFACATAADRBQAgFQAA0wUAINUCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf0CAQAAAAH_AgEAAAABgAMBAAAAAQIAAAAvACA2AADQBwAgAwAAAC8AIDYAANAHACA3AADPBwAgAS8AAJ0JADACAAAALwAgLwAAzwcAIAIAAADjBQAgLwAAzgcAIArVAgEAkwUAIdgCQACWBQAh6AIBAJMFACH4AgAAyQX4AiL5AggAygUAIfsCAADLBfsCI_wCQADMBQAh_QIBAJMFACH_AgEAlQUAIYADAQCVBQAhDQ0AANAFACATAADNBQAgFQAAzwUAINUCAQCTBQAh2AJAAJYFACHoAgEAkwUAIfgCAADJBfgCIvkCCADKBQAh-wIAAMsF-wIj_AJAAMwFACH9AgEAkwUAIf8CAQCVBQAhgAMBAJUFACENDQAA1AUAIBMAANEFACAVAADTBQAg1QIBAAAAAdgCQAAAAAHoAgEAAAAB-AIAAAD4AgL5AggAAAAB-wIAAAD7AgP8AkAAAAAB_QIBAAAAAf8CAQAAAAGAAwEAAAABCBEAAJwFACAYAACaBQAg1QIBAAAAAdYCAgAAAAHXAgEAAAAB2AJAAAAAAdkCAQAAAAHbAgEAAAABAgAAAEUAIDYAANwHACADAAAARQAgNgAA3AcAIDcAANsHACABLwAAnAkAMA0RAACkBAAgGAAAzgQAIBkAAM4EACDSAgAA8QQAMNMCAAA4ABDUAgAA8QQAMNUCAQAAAAHWAgIA2wQAIdcCAQCiBAAh2AJAAKMEACHZAgEAnwQAIdoCAQCfBAAh2wIBAAAAAQIAAABFACAvAADbBwAgAgAAANkHACAvAADaBwAgCtICAADYBwAw0wIAANkHABDUAgAA2AcAMNUCAQCfBAAh1gICANsEACHXAgEAogQAIdgCQACjBAAh2QIBAJ8EACHaAgEAnwQAIdsCAQCfBAAhCtICAADYBwAw0wIAANkHABDUAgAA2AcAMNUCAQCfBAAh1gICANsEACHXAgEAogQAIdgCQACjBAAh2QIBAJ8EACHaAgEAnwQAIdsCAQCfBAAhBtUCAQCTBQAh1gICAJQFACHXAgEAlQUAIdgCQACWBQAh2QIBAJMFACHbAgEAkwUAIQgRAACZBQAgGAAAlwUAINUCAQCTBQAh1gICAJQFACHXAgEAlQUAIdgCQACWBQAh2QIBAJMFACHbAgEAkwUAIQgRAACcBQAgGAAAmgUAINUCAQAAAAHWAgIAAAAB1wIBAAAAAdgCQAAAAAHZAgEAAAAB2wIBAAAAAQgRAACcBQAgGQAAmwUAINUCAQAAAAHWAgIAAAAB1wIBAAAAAdgCQAAAAAHaAgEAAAAB2wIBAAAAAQIAAABFACA2AADlBwAgAwAAAEUAIDYAAOUHACA3AADkBwAgAS8AAJsJADACAAAARQAgLwAA5AcAIAIAAADZBwAgLwAA4wcAIAbVAgEAkwUAIdYCAgCUBQAh1wIBAJUFACHYAkAAlgUAIdoCAQCTBQAh2wIBAJMFACEIEQAAmQUAIBkAAJgFACDVAgEAkwUAIdYCAgCUBQAh1wIBAJUFACHYAkAAlgUAIdoCAQCTBQAh2wIBAJMFACEIEQAAnAUAIBkAAJsFACDVAgEAAAAB1gICAAAAAdcCAQAAAAHYAkAAAAAB2gIBAAAAAdsCAQAAAAEVDAAAgAYAIA0AAIIGACAVAACDBgAgFwAAhAYAIBoAAIUGACDVAgEAAAAB2AJAAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgQMBAAAAAYMDQAAAAAGEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwgAAAABiAMBAAAAAYkDAQAAAAGKAwEAAAABiwMBAAAAAQIAAAAjACA2AADuBwAgAwAAACMAIDYAAO4HACA3AADtBwAgAS8AAJoJADACAAAAIwAgLwAA7QcAIAIAAADRBgAgLwAA7AcAIBDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACHzAgAA7wWDAyL_AgEAlQUAIYADAQCVBQAhgQMBAJMFACGDA0AAlgUAIYQDAQCVBQAhhQMBAJUFACGGAwEAlQUAIYcDCADKBQAhiAMBAJUFACGJAwEAlQUAIYoDAQCVBQAhiwMBAJUFACEVDAAA8AUAIA0AAPIFACAVAADzBQAgFwAA9AUAIBoAAPUFACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACHzAgAA7wWDAyL_AgEAlQUAIYADAQCVBQAhgQMBAJMFACGDA0AAlgUAIYQDAQCVBQAhhQMBAJUFACGGAwEAlQUAIYcDCADKBQAhiAMBAJUFACGJAwEAlQUAIYoDAQCVBQAhiwMBAJUFACEVDAAAgAYAIA0AAIIGACAVAACDBgAgFwAAhAYAIBoAAIUGACDVAgEAAAAB2AJAAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgQMBAAAAAYMDQAAAAAGEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwgAAAABiAMBAAAAAYkDAQAAAAGKAwEAAAABiwMBAAAAARUBAACBBgAgDQAAggYAIBUAAIMGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABAgAAACMAIDYAAPcHACADAAAAIwAgNgAA9wcAIDcAAPYHACABLwAAmQkAMAIAAAAjACAvAAD2BwAgAgAAANEGACAvAAD1BwAgENUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGAAwEAlQUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIRUBAADxBQAgDQAA8gUAIBUAAPMFACAXAAD0BQAgGgAA9QUAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGAAwEAlQUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIRUBAACBBgAgDQAAggYAIBUAAIMGACAXAACEBgAgGgAAhQYAINUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABChAAAJ4GACARAACgBgAgFgAAoQYAINUCAQAAAAHYAkAAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABAgAAACkAIDYAAIAIACADAAAAKQAgNgAAgAgAIDcAAP8HACABLwAAmAkAMAIAAAApACAvAAD_BwAgAgAAALIGACAvAAD-BwAgB9UCAQCTBQAh2AJAAJYFACHvAkAAlgUAIfMCAACLBo8DIowDAQCTBQAhjQMIAMoFACGPAwEAkwUAIQoQAACMBgAgEQAAjgYAIBYAAI8GACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACHzAgAAiwaPAyKMAwEAkwUAIY0DCADKBQAhjwMBAJMFACEKEAAAngYAIBEAAKAGACAWAAChBgAg1QIBAAAAAdgCQAAAAAHvAkAAAAAB8wIAAACPAwKMAwEAAAABjQMIAAAAAY8DAQAAAAEODgAAtwYAINUCAQAAAAHYAkAAAAAB6gIBAAAAAe8CQAAAAAGQAwEAAAABkQMIAAAAAZIDAQAAAAGTAwEAAAABlAMBAAAAAZUDQAAAAAGWAwEAAAABlwMBAAAAAZgDIAAAAAECAAAAPwAgNgAAjAgAIAMAAAA_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-BQAh8QIBAJMFACHzAgAA-wavAyL1AgAAwAX1AiL2AgEAkwUAIawDAgCUBQAhrQMBAJMFACEK1QIBAJMFACHYAkAAlgUAIe8CQACWBQAh8AIIAL4FACHxAgEAkwUAIfMCAAD7Bq8DIvUCAADABfUCIvYCAQCTBQAhrAMCAJQFACGtAwEAkwUAIQrVAgEAAAAB2AJAAAAAAe8CQAAAAAHwAggAAAAB8QIBAAAAAfMCAAAArwMC9QIAAAD1AgL2AgEAAAABrAMCAAAAAa0DAQAAAAEG1QIBAAAAAdgCQAAAAAHvAkAAAAABngNAAAAAAa8DQAAAAAGwAwEAAAABAgAAAIEBACA2AADhCAAgAwAAAAMAIDYAAOEIACA3AADlCAAgCAAAAAMAIC8AAOUIACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGeA0AAlgUAIa8DQACWBQAhsAMBAJUFACEG1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhngNAAJYFACGvA0AAlgUAIbADAQCVBQAhAzYAAOEIACDLAwAA4ggAINEDAACBAQAgBDYAANUIADDLAwAA1ggAMM0DAADYCAAg0QMAANkIADAENgAAyQgAMMsDAADKCAAwzQMAAMwIACDRAwAAzQgAMAQ2AAC9CAAwywMAAL4IADDNAwAAwAgAINEDAADBCAAwBDYAALEIADDLAwAAsggAMM0DAAC0CAAg0QMAALUIADAENgAApQgAMMsDAACmCAAwzQMAAKgIACDRAwAAqQgAMAQ2AACZCAAwywMAAJoIADDNAwAAnAgAINEDAACdCAAwBDYAAI0IADDLAwAAjggAMM0DAACQCAAg0QMAAJEIADAENgAAgQgAMMsDAACCCAAwzQMAAIQIACDRAwAAhQgAMAQ2AAD4BwAwywMAAPkHADDNAwAA-wcAINEDAACuBgAwBDYAAO8HADDLAwAA8AcAMM0DAADyBwAg0QMAAM0GADAENgAA5gcAMMsDAADnBwAwzQMAAOkHACDRAwAAzQYAMAQ2AADdBwAwywMAAN4HADDNAwAA4AcAINEDAADVBwAwBDYAANEHADDLAwAA0gcAMM0DAADUBwAg0QMAANUHADAENgAAyAcAMMsDAADJBwAwzQMAAMsHACDRAwAA3wUAMAQ2AAC_BwAwywMAAMAHADDNAwAAwgcAINEDAAC3BwAwBDYAALMHADDLAwAAtAcAMM0DAAC2BwAg0QMAALcHADAENgAApwcAMMsDAACoBwAwzQMAAKoHACDRAwAAqwcAMAQ2AACeBwAwywMAAJ8HADDNAwAAoQcAINEDAACvBQAwAgEAAIMHACCwAwAAjQUAIAAAAAAAAAAAAAAAAAAAAAIBAACDBwAgJwAAiAkAIAMBAACDBwAgDAAAgwcAIBIAAIUJACAFAQAAgwcAIBAAAI0JACARAADDBQAgFgAAhQkAII0DAACNBQAgBQEAAIMHACAWAACFCQAgGwAAgwkAIJQDAACNBQAgnAMAAI0FACAGDAAAgwcAIA4AAIIJACCUAwAAjQUAIJUDAACNBQAglgMAAI0FACCXAwAAjQUAIAIRAADDBQAg9gIAAI0FACAEEQAAwwUAIBgAAIMHACAZAACDBwAg1wIAAI0FACAK1QIBAAAAAdgCQAAAAAHvAkAAAAAB8AIIAAAAAfECAQAAAAHzAgAAAK8DAvUCAAAA9QIC9gIBAAAAAawDAgAAAAGtAwEAAAABCNUCAQAAAAHYAkAAAAAB6wIBAAAAAewCAQAAAAHtAgIAAAABpgMAAACqAwKqAwIAAAABqwMBAAAAAQXVAgEAAAAB2AJAAAAAAZ4DQAAAAAGhAwEAAAABogMCAAAAAQXVAgEAAAAB2AJAAAAAAZ0DAQAAAAGeA0AAAAABnwNAAAAAAQfVAgEAAAAB2AJAAAAAAegCAQAAAAGQAwEAAAABpgMBAAAAAacDAQAAAAGoAyAAAAABBdUCAQAAAAHYAkAAAAABowMBAAAAAaQDAQAAAAGlAwEAAAABDNUCAQAAAAHYAkAAAAAB6gIBAAAAAe8CQAAAAAGQAwEAAAABkgMBAAAAAZMDAQAAAAGUAwEAAAABmQMIAAAAAZoDIAAAAAGbAyAAAAABnANAAAAAAQ3VAgEAAAAB2AJAAAAAAeoCAQAAAAHvAkAAAAABkAMBAAAAAZEDCAAAAAGSAwEAAAABkwMBAAAAAZQDAQAAAAGVA0AAAAABlgMBAAAAAZcDAQAAAAGYAyAAAAABB9UCAQAAAAHYAkAAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABENUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAHzAgAAAIMDAv8CAQAAAAGAAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABENUCAQAAAAHYAkAAAAAB7wJAAAAAAfMCAAAAgwMC_wIBAAAAAYADAQAAAAGBAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABBtUCAQAAAAHWAgIAAAAB1wIBAAAAAdgCQAAAAAHaAgEAAAAB2wIBAAAAAQbVAgEAAAAB1gICAAAAAdcCAQAAAAHYAkAAAAAB2QIBAAAAAdsCAQAAAAEK1QIBAAAAAdgCQAAAAAHoAgEAAAAB-AIAAAD4AgL5AggAAAAB-wIAAAD7AgP8AkAAAAAB_QIBAAAAAf8CAQAAAAGAAwEAAAABBNUCAQAAAAHYAkAAAAAB6QIBAAAAAe8CQAAAAAEE1QIBAAAAAdgCQAAAAAHvAkAAAAABgQMBAAAAAQjVAgEAAAAB2AJAAAAAAeoCAQAAAAHrAgEAAAAB7AIBAAAAAe0CAgAAAAHuAgIAAAAB7wJAAAAAAQTVAgEAAAAB2AJAAAAAAecCAQAAAAHoAgEAAAABKAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAIB8AAPAIACAgAADxCAAgIQAA8ggAICIAAPMIACAjAAD0CAAgJAAA9QgAICUAAPYIACAoAAD3CAAgKQAA-AgAINUCAQAAAAHYAkAAAAAB7wJAAAAAAZsDIAAAAAGcA0AAAAABrQMBAAAAAbEDAQAAAAGyAwEAAAABswMBAAAAAbUDAAAAtQMCtgMBAAAAAbcDAQAAAAG4AyAAAAABuQNAAAAAAboDIAAAAAG7AyAAAAABvQMAAAC9AwK-A0AAAAABvwNAAAAAAcADAgAAAAHBA0AAAAABwgMCAAAAAQIAAAABACA2AACiCQAgAwAAAGsAIDYAAKIJACA3AACmCQAgKgAAAGsAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAIC8AAKYJACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAA5ggAIAcAAOgIACAIAADpCAAgCQAA6ggAIAoAAOsIACALAADsCAAgHAAA7QgAIB0AAO4IACAeAADvCAAgHwAA8AgAICAAAPEIACAhAADyCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAKcJACADAAAAawAgNgAApwkAIDcAAKsJACAqAAAAawAgAgAAiwcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAgLwAAqwkAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAADmCAAgBQAA5wgAIAgAAOkIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAlAAD2CAAgKAAA9wgAICkAAPgIACDVAgEAAAAB2AJAAAAAAe8CQAAAAAGbAyAAAAABnANAAAAAAa0DAQAAAAGxAwEAAAABsgMBAAAAAbMDAQAAAAG1AwAAALUDArYDAQAAAAG3AwEAAAABuAMgAAAAAbkDQAAAAAG6AyAAAAABuwMgAAAAAb0DAAAAvQMCvgNAAAAAAb8DQAAAAAHAAwIAAAABwQNAAAAAAcIDAgAAAAECAAAAAQAgNgAArAkAIAMAAABrACA2AACsCQAgNwAAsAkAICoAAABrACACAACLBwAgBQAAjAcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACAvAACwCQAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_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_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAALYJACADAAAAawAgNgAAtgkAIDcAALoJACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAgLwAAugkAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAADmCAAgBQAA5wgAIAcAAOgIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAlAAD2CAAgKAAA9wgAICkAAPgIACDVAgEAAAAB2AJAAAAAAe8CQAAAAAGbAyAAAAABnANAAAAAAa0DAQAAAAGxAwEAAAABsgMBAAAAAbMDAQAAAAG1AwAAALUDArYDAQAAAAG3AwEAAAABuAMgAAAAAbkDQAAAAAG6AyAAAAABuwMgAAAAAb0DAAAAvQMCvgNAAAAAAb8DQAAAAAHAAwIAAAABwQNAAAAAAcIDAgAAAAECAAAAAQAgNgAAuwkAIAMAAABrACA2AAC7CQAgNwAAvwkAICoAAABrACACAACLBwAgBQAAjAcAIAcAAI0HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACAvAAC_CQAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_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_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAMUJACAQ1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAgwMC_wIBAAAAAYEDAQAAAAGDA0AAAAABhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMIAAAAAYgDAQAAAAGJAwEAAAABigMBAAAAAYsDAQAAAAEK1QIBAAAAAdgCQAAAAAHoAgEAAAAB-AIAAAD4AgL5AggAAAAB-wIAAAD7AgP8AkAAAAAB_QIBAAAAAf4CAQAAAAH_AgEAAAABAwAAAGsAIDYAAMUJACA3AADLCQAgKgAAAGsAIAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAIC8AAMsJACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAeAADvCAAgHwAA8AgAICAAAPEIACAhAADyCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAMwJACAH1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAEDAAAAawAgNgAAzAkAIDcAANEJACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAgLwAA0QkAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAADmCAAgBQAA5wgAIAcAAOgIACAIAADpCAAgCQAA6ggAIAoAAOsIACALAADsCAAgHAAA7QgAIB0AAO4IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAlAAD2CAAgKAAA9wgAICkAAPgIACDVAgEAAAAB2AJAAAAAAe8CQAAAAAGbAyAAAAABnANAAAAAAa0DAQAAAAGxAwEAAAABsgMBAAAAAbMDAQAAAAG1AwAAALUDArYDAQAAAAG3AwEAAAABuAMgAAAAAbkDQAAAAAG6AyAAAAABuwMgAAAAAb0DAAAAvQMCvgNAAAAAAb8DQAAAAAHAAwIAAAABwQNAAAAAAcIDAgAAAAECAAAAAQAgNgAA0gkAIA8MAAC2BgAg1QIBAAAAAdgCQAAAAAHqAgEAAAAB7wJAAAAAAYEDAQAAAAGQAwEAAAABkQMIAAAAAZIDAQAAAAGTAwEAAAABlAMBAAAAAZUDQAAAAAGWAwEAAAABlwMBAAAAAZgDIAAAAAECAAAAPwAgNgAA1AkAIArVAgEAAAAB2AJAAAAAAegCAQAAAAH4AgAAAPgCAvkCCAAAAAH7AgAAAPsCA_wCQAAAAAH9AgEAAAAB_gIBAAAAAYADAQAAAAEDAAAAawAgNgAA0gkAIDcAANkJACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAgLwAA2QkAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAIQMAAAA9ACA2AADUCQAgNwAA3AkAIBEAAAA9ACAMAACoBgAgLwAA3AkAINUCAQCTBQAh2AJAAJYFACHqAgEAkwUAIe8CQACWBQAhgQMBAJMFACGQAwEAkwUAIZEDCAC-BQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhlQNAAMwFACGWAwEAlQUAIZcDAQCVBQAhmAMgAKcGACEPDAAAqAYAINUCAQCTBQAh2AJAAJYFACHqAgEAkwUAIe8CQACWBQAhgQMBAJMFACGQAwEAkwUAIZEDCAC-BQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhlQNAAMwFACGWAwEAlQUAIZcDAQCVBQAhmAMgAKcGACELAQAAnwYAIBAAAJ4GACAWAAChBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABAgAAACkAIDYAAN0JACAPAQAA1QYAIBYAANcGACDVAgEAAAAB2AJAAAAAAekCAQAAAAHqAgEAAAAB7wJAAAAAAZADAQAAAAGSAwEAAAABkwMBAAAAAZQDAQAAAAGZAwgAAAABmgMgAAAAAZsDIAAAAAGcA0AAAAABAgAAAB8AIDYAAN8JACAoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAIB8AAPAIACAhAADyCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAOEJACAoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAICAAAPEIACAhAADyCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAOMJACADAAAAJgAgNgAA3QkAIDcAAOcJACANAAAAJgAgAQAAjQYAIBAAAIwGACAWAACPBgAgLwAA5wkAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAIsGjwMijAMBAJMFACGNAwgAygUAIY8DAQCTBQAhCwEAAI0GACAQAACMBgAgFgAAjwYAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAIsGjwMijAMBAJMFACGNAwgAygUAIY8DAQCTBQAhAwAAAB0AIDYAAN8JACA3AADqCQAgEQAAAB0AIAEAAL0GACAWAAC_BgAgLwAA6gkAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIeoCAQCTBQAh7wJAAJYFACGQAwEAkwUAIZIDAQCTBQAhkwMBAJMFACGUAwEAlQUAIZkDCAC-BQAhmgMgAKcGACGbAyAApwYAIZwDQADMBQAhDwEAAL0GACAWAAC_BgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHvAkAAlgUAIZADAQCTBQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhmQMIAL4FACGaAyAApwYAIZsDIACnBgAhnANAAMwFACEDAAAAawAgNgAA4QkAIDcAAO0JACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAgLwAA7QkAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgJQAAmwcAICgAAJwHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAIQMAAABrACA2AADjCQAgNwAA8AkAICoAAABrACACAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACAvAADwCQAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAIAAOYIACAFAADnCAAgBwAA6AgAIAgAAOkIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAoAAD3CAAgKQAA-AgAINUCAQAAAAHYAkAAAAAB7wJAAAAAAZsDIAAAAAGcA0AAAAABrQMBAAAAAbEDAQAAAAGyAwEAAAABswMBAAAAAbUDAAAAtQMCtgMBAAAAAbcDAQAAAAG4AyAAAAABuQNAAAAAAboDIAAAAAG7AyAAAAABvQMAAAC9AwK-A0AAAAABvwNAAAAAAcADAgAAAAHBA0AAAAABwgMCAAAAAQIAAAABACA2AADxCQAgKAIAAOYIACAFAADnCAAgBwAA6AgAIAgAAOkIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICUAAPYIACAoAAD3CAAgKQAA-AgAINUCAQAAAAHYAkAAAAAB7wJAAAAAAZsDIAAAAAGcA0AAAAABrQMBAAAAAbEDAQAAAAGyAwEAAAABswMBAAAAAbUDAAAAtQMCtgMBAAAAAbcDAQAAAAG4AyAAAAABuQNAAAAAAboDIAAAAAG7AyAAAAABvQMAAAC9AwK-A0AAAAABvwNAAAAAAcADAgAAAAHBA0AAAAABwgMCAAAAAQIAAAABACA2AADzCQAgCtUCAQAAAAHYAkAAAAAB6AIBAAAAAfgCAAAA-AIC-QIIAAAAAfsCAAAA-wID_AJAAAAAAf4CAQAAAAH_AgEAAAABgAMBAAAAAQMAAABrACA2AADxCQAgNwAA-AkAICoAAABrACACAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgKAAAnAcAICkAAJ0HACAvAAD4CQAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIgAAmAcAICMAAJkHACAkAACaBwAgKAAAnAcAICkAAJ0HACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhAwAAAGsAIDYAAPMJACA3AAD7CQAgKgAAAGsAIAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICUAAJsHACAoAACcBwAgKQAAnQcAIC8AAPsJACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgIwAAmQcAICUAAJsHACAoAACcBwAgKQAAnQcAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEPAQAA1QYAIBsAANYGACDVAgEAAAAB2AJAAAAAAekCAQAAAAHqAgEAAAAB7wJAAAAAAZADAQAAAAGSAwEAAAABkwMBAAAAAZQDAQAAAAGZAwgAAAABmgMgAAAAAZsDIAAAAAGcA0AAAAABAgAAAB8AIDYAAPwJACALAQAAnwYAIBAAAJ4GACARAACgBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAjwMCjAMBAAAAAY0DCAAAAAGPAwEAAAABAgAAACkAIDYAAP4JACAoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAIB8AAPAIACAgAADxCAAgIQAA8ggAICIAAPMIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAIAKACAHAQAA6AUAIAwAAOcFACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAABgQMBAAAAAQIAAABLACA2AACCCgAgAwAAAB0AIDYAAPwJACA3AACGCgAgEQAAAB0AIAEAAL0GACAbAAC-BgAgLwAAhgoAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIeoCAQCTBQAh7wJAAJYFACGQAwEAkwUAIZIDAQCTBQAhkwMBAJMFACGUAwEAlQUAIZkDCAC-BQAhmgMgAKcGACGbAyAApwYAIZwDQADMBQAhDwEAAL0GACAbAAC-BgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHvAkAAlgUAIZADAQCTBQAhkgMBAJMFACGTAwEAkwUAIZQDAQCVBQAhmQMIAL4FACGaAyAApwYAIZsDIACnBgAhnANAAMwFACEDAAAAJgAgNgAA_gkAIDcAAIkKACANAAAAJgAgAQAAjQYAIBAAAIwGACARAACOBgAgLwAAiQoAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAIsGjwMijAMBAJMFACGNAwgAygUAIY8DAQCTBQAhCwEAAI0GACAQAACMBgAgEQAAjgYAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAIsGjwMijAMBAJMFACGNAwgAygUAIY8DAQCTBQAhAwAAAGsAIDYAAIAKACA3AACMCgAgKgAAAGsAIAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAIC8AAIwKACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICEAAJcHACAiAACYBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEDAAAASQAgNgAAggoAIDcAAI8KACAJAAAASQAgAQAA2QUAIAwAANgFACAvAACPCgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACGBAwEAkwUAIQcBAADZBQAgDAAA2AUAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAhgQMBAJMFACEWAQAAgQYAIAwAAIAGACANAACCBgAgFQAAgwYAIBoAAIUGACDVAgEAAAAB2AJAAAAAAekCAQAAAAHvAkAAAAAB8wIAAACDAwL_AgEAAAABgAMBAAAAAYEDAQAAAAGDA0AAAAABhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMIAAAAAYgDAQAAAAGJAwEAAAABigMBAAAAAYsDAQAAAAECAAAAIwAgNgAAkAoAIAMAAAAhACA2AACQCgAgNwAAlAoAIBgAAAAhACABAADxBQAgDAAA8AUAIA0AAPIFACAVAADzBQAgGgAA9QUAIC8AAJQKACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfMCAADvBYMDIv8CAQCVBQAhgAMBAJUFACGBAwEAkwUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIRYBAADxBQAgDAAA8AUAIA0AAPIFACAVAADzBQAgGgAA9QUAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIe8CQACWBQAh8wIAAO8FgwMi_wIBAJUFACGAAwEAlQUAIYEDAQCTBQAhgwNAAJYFACGEAwEAlQUAIYUDAQCVBQAhhgMBAJUFACGHAwgAygUAIYgDAQCVBQAhiQMBAJUFACGKAwEAlQUAIYsDAQCVBQAhKAIAAOYIACAFAADnCAAgBwAA6AgAIAgAAOkIACAJAADqCAAgCgAA6wgAIAsAAOwIACAcAADtCAAgHQAA7ggAIB4AAO8IACAfAADwCAAgIAAA8QgAICEAAPIIACAiAADzCAAgIwAA9AgAICQAAPUIACAlAAD2CAAgKQAA-AgAINUCAQAAAAHYAkAAAAAB7wJAAAAAAZsDIAAAAAGcA0AAAAABrQMBAAAAAbEDAQAAAAGyAwEAAAABswMBAAAAAbUDAAAAtQMCtgMBAAAAAbcDAQAAAAG4AyAAAAABuQNAAAAAAboDIAAAAAG7AyAAAAABvQMAAAC9AwK-A0AAAAABvwNAAAAAAcADAgAAAAHBA0AAAAABwgMCAAAAAQIAAAABACA2AACVCgAgBNUCAQAAAAHYAkAAAAAB2QIBAAAAAegCAQAAAAEDAAAAawAgNgAAlQoAIDcAAJoKACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACApAACdBwAgLwAAmgoAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACApAACdBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAADmCAAgBQAA5wgAIAcAAOgIACAIAADpCAAgCQAA6ggAIAoAAOsIACALAADsCAAgHAAA7QgAIB0AAO4IACAeAADvCAAgHwAA8AgAICAAAPEIACAhAADyCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACDVAgEAAAAB2AJAAAAAAe8CQAAAAAGbAyAAAAABnANAAAAAAa0DAQAAAAGxAwEAAAABsgMBAAAAAbMDAQAAAAG1AwAAALUDArYDAQAAAAG3AwEAAAABuAMgAAAAAbkDQAAAAAG6AyAAAAABuwMgAAAAAb0DAAAAvQMCvgNAAAAAAb8DQAAAAAHAAwIAAAABwQNAAAAAAcIDAgAAAAECAAAAAQAgNgAAmwoAIAoBAAC3BQAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB6gIBAAAAAesCAQAAAAHsAgEAAAAB7QICAAAAAe4CAgAAAAHvAkAAAAABAgAAAFAAIDYAAJ0KACADAAAAawAgNgAAmwoAIDcAAKEKACAqAAAAawAgAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgLwAAoQoAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEoAgAAiwcAIAUAAIwHACAHAACNBwAgCAAAjgcAIAkAAI8HACAKAACQBwAgCwAAkQcAIBwAAJIHACAdAACTBwAgHgAAlAcAIB8AAJUHACAgAACWBwAgIQAAlwcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAIQMAAABOACA2AACdCgAgNwAApAoAIAwAAABOACABAACpBQAgLwAApAoAINUCAQCTBQAh2AJAAJYFACHpAgEAkwUAIeoCAQCTBQAh6wIBAJMFACHsAgEAkwUAIe0CAgCUBQAh7gICAJQFACHvAkAAlgUAIQoBAACpBQAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh6gIBAJMFACHrAgEAkwUAIewCAQCTBQAh7QICAJQFACHuAgIAlAUAIe8CQACWBQAhFgEAAIEGACAMAACABgAgDQAAggYAIBUAAIMGACAXAACEBgAg1QIBAAAAAdgCQAAAAAHpAgEAAAAB7wJAAAAAAfMCAAAAgwMC_wIBAAAAAYADAQAAAAGBAwEAAAABgwNAAAAAAYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDCAAAAAGIAwEAAAABiQMBAAAAAYoDAQAAAAGLAwEAAAABAgAAACMAIDYAAKUKACAoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAIB8AAPAIACAgAADxCAAgIQAA8ggAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAKcKACAoAgAA5ggAIAUAAOcIACAHAADoCAAgCAAA6QgAIAkAAOoIACAKAADrCAAgCwAA7AgAIBwAAO0IACAdAADuCAAgHgAA7wgAIB8AAPAIACAgAADxCAAgIgAA8wgAICMAAPQIACAkAAD1CAAgJQAA9ggAICgAAPcIACApAAD4CAAg1QIBAAAAAdgCQAAAAAHvAkAAAAABmwMgAAAAAZwDQAAAAAGtAwEAAAABsQMBAAAAAbIDAQAAAAGzAwEAAAABtQMAAAC1AwK2AwEAAAABtwMBAAAAAbgDIAAAAAG5A0AAAAABugMgAAAAAbsDIAAAAAG9AwAAAL0DAr4DQAAAAAG_A0AAAAABwAMCAAAAAcEDQAAAAAHCAwIAAAABAgAAAAEAIDYAAKkKACADAAAAIQAgNgAApQoAIDcAAK0KACAYAAAAIQAgAQAA8QUAIAwAAPAFACANAADyBQAgFQAA8wUAIBcAAPQFACAvAACtCgAg1QIBAJMFACHYAkAAlgUAIekCAQCTBQAh7wJAAJYFACHzAgAA7wWDAyL_AgEAlQUAIYADAQCVBQAhgQMBAJMFACGDA0AAlgUAIYQDAQCVBQAhhQMBAJUFACGGAwEAlQUAIYcDCADKBQAhiAMBAJUFACGJAwEAlQUAIYoDAQCVBQAhiwMBAJUFACEWAQAA8QUAIAwAAPAFACANAADyBQAgFQAA8wUAIBcAAPQFACDVAgEAkwUAIdgCQACWBQAh6QIBAJMFACHvAkAAlgUAIfMCAADvBYMDIv8CAQCVBQAhgAMBAJUFACGBAwEAkwUAIYMDQACWBQAhhAMBAJUFACGFAwEAlQUAIYYDAQCVBQAhhwMIAMoFACGIAwEAlQUAIYkDAQCVBQAhigMBAJUFACGLAwEAlQUAIQMAAABrACA2AACnCgAgNwAAsAoAICoAAABrACACAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACAvAACwCgAg1QIBAJMFACHYAkAAlgUAIe8CQACWBQAhmwMgAKcGACGcA0AAzAUAIa0DAQCVBQAhsQMBAJMFACGyAwEAkwUAIbMDAQCTBQAhtQMAAIkHtQMitgMBAJUFACG3AwEAlQUAIbgDIACnBgAhuQNAAMwFACG6AyAApwYAIbsDIACnBgAhvQMAAIoHvQMivgNAAMwFACG_A0AAzAUAIcADAgCUBQAhwQNAAMwFACHCAwIAlAUAISgCAACLBwAgBQAAjAcAIAcAAI0HACAIAACOBwAgCQAAjwcAIAoAAJAHACALAACRBwAgHAAAkgcAIB0AAJMHACAeAACUBwAgHwAAlQcAICAAAJYHACAhAACXBwAgIwAAmQcAICQAAJoHACAlAACbBwAgKAAAnAcAICkAAJ0HACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhAwAAAGsAIDYAAKkKACA3AACzCgAgKgAAAGsAIAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAIC8AALMKACDVAgEAkwUAIdgCQACWBQAh7wJAAJYFACGbAyAApwYAIZwDQADMBQAhrQMBAJUFACGxAwEAkwUAIbIDAQCTBQAhswMBAJMFACG1AwAAiQe1AyK2AwEAlQUAIbcDAQCVBQAhuAMgAKcGACG5A0AAzAUAIboDIACnBgAhuwMgAKcGACG9AwAAige9AyK-A0AAzAUAIb8DQADMBQAhwAMCAJQFACHBA0AAzAUAIcIDAgCUBQAhKAIAAIsHACAFAACMBwAgBwAAjQcAIAgAAI4HACAJAACPBwAgCgAAkAcAIAsAAJEHACAcAACSBwAgHQAAkwcAIB4AAJQHACAfAACVBwAgIAAAlgcAICIAAJgHACAjAACZBwAgJAAAmgcAICUAAJsHACAoAACcBwAgKQAAnQcAINUCAQCTBQAh2AJAAJYFACHvAkAAlgUAIZsDIACnBgAhnANAAMwFACGtAwEAlQUAIbEDAQCTBQAhsgMBAJMFACGzAwEAkwUAIbUDAACJB7UDIrYDAQCVBQAhtwMBAJUFACG4AyAApwYAIbkDQADMBQAhugMgAKcGACG7AyAApwYAIb0DAACKB70DIr4DQADMBQAhvwNAAMwFACHAAwIAlAUAIcEDQADMBQAhwgMCAJQFACEUAgQCBQgDBwwECBAFCRQGChgHCxwIDwAYHCAJHUAMHkELH0IKIEMKIUYTIkcTI0gOJEwPJU0PKFEVKVcWAQEAAQEBAAEBBgABAQYAAQEGAAEBBgABAQYAAQQBAAEPABQWOg4bJAoGAQABDAABDSUJFScLFzcSGjkTBQEAAQ8AERAADBEsChYwDgMMAAEOKgsPAA0BDisABA00CRMADxQAARUzCwQBAAEMAAEPABASMQ4BEjIAARY1AAERAAoDEQAKGAABGQABAhY8ABs7AAMBAAEPABcnVRYCGAABJgAVASdWABIFWAAHWQAIWgAJWwAKXAALXQAcXgAdXwAeYAAfYQAgYgAhYwAiZAAjZQAkZgAlZwAoaAApaQAAAAAFDwAdPAAePQAfPgAgPwAhAAAAAAAFDwAdPAAePQAfPgAgPwAhAQEAAQEBAAEDDwAmPgAnPwAoAAAAAw8AJj4AJz8AKAEBAAEBAQABBQ8ALTwALj0ALz4AMD8AMQAAAAAABQ8ALTwALj0ALz4AMD8AMQEGAAEBBgABBQ8ANjwANz0AOD4AOT8AOgAAAAAABQ8ANjwANz0AOD4AOT8AOgEGAAEBBgABAw8APz4AQD8AQQAAAAMPAD8-AEA_AEEBBgABAQYAAQMPAEY-AEc_AEgAAAADDwBGPgBHPwBIAQYAAQEGAAEFDwBNPABOPQBPPgBQPwBRAAAAAAAFDwBNPABOPQBPPgBQPwBRAQYAAQEGAAEDDwBWPgBXPwBYAAAAAw8AVj4AVz8AWAEBAAEBAQABBQ8AXTwAXj0AXz4AYD8AYQAAAAAABQ8AXTwAXj0AXz4AYD8AYQEMAAEBDAABBQ8AZjwAZz0AaD4AaT8AagAAAAAABQ8AZjwAZz0AaD4AaT8AagIBAAEQAAwCAQABEAAMBQ8AbzwAcD0AcT4Acj8AcwAAAAAABQ8AbzwAcD0AcT4Acj8AcwQBAAEMAAEN6QIJFeoCCwQBAAEMAAEN8AIJFfECCwUPAHg8AHk9AHo-AHs_AHwAAAAAAAUPAHg8AHk9AHo-AHs_AHwCAQABDAABAgEAAQwAAQMPAIEBPgCCAT8AgwEAAAADDwCBAT4AggE_AIMBBA2aAwkTAA8UAAEVmQMLBA2hAwkTAA8UAAEVoAMLBQ8AiAE8AIkBPQCKAT4AiwE_AIwBAAAAAAAFDwCIATwAiQE9AIoBPgCLAT8AjAEBEQAKAREACgUPAJEBPACSAT0AkwE-AJQBPwCVAQAAAAAABQ8AkQE8AJIBPQCTAT4AlAE_AJUBAQEAAQEBAAEFDwCaATwAmwE9AJwBPgCdAT8AngEAAAAAAAUPAJoBPACbAT0AnAE-AJ0BPwCeAQIYAAEmABUCGAABJgAVAw8AowE-AKQBPwClAQAAAAMPAKMBPgCkAT8ApQEDEQAKGAABGQABAxEAChgAARkAAQUPAKoBPACrAT0ArAE-AK0BPwCuAQAAAAAABQ8AqgE8AKsBPQCsAT4ArQE_AK4BKgIBK2oBLG0BLW4BLm8BMHEBMXMZMnQaM3YBNHgZNXkbOHoBOXsBOnwZQH8cQYABIkKCAQJDgwECRIUBAkWGAQJGhwECR4kBAkiLARlJjAEjSo4BAkuQARlMkQEkTZIBAk6TAQJPlAEZUJcBJVGYASlSmQEDU5oBA1SbAQNVnAEDVp0BA1efAQNYoQEZWaIBKlqkAQNbpgEZXKcBK12oAQNeqQEDX6oBGWCtASxhrgEyYq8BBGOwAQRksQEEZbIBBGazAQRntQEEaLcBGWm4ATNqugEEa7wBGWy9ATRtvgEEbr8BBG_AARlwwwE1ccQBO3LFAQdzxgEHdMcBB3XIAQd2yQEHd8sBB3jNARl5zgE8etABB3vSARl80wE9fdQBB37VAQd_1gEZgAHZAT6BAdoBQoIB2wEIgwHcAQiEAd0BCIUB3gEIhgHfAQiHAeEBCIgB4wEZiQHkAUOKAeYBCIsB6AEZjAHpAUSNAeoBCI4B6wEIjwHsARmQAe8BRZEB8AFJkgHxAQWTAfIBBZQB8wEFlQH0AQWWAfUBBZcB9wEFmAH5ARmZAfoBSpoB_AEFmwH-ARmcAf8BS50BgAIFngGBAgWfAYICGaABhQJMoQGGAlKiAYcCBqMBiAIGpAGJAgalAYoCBqYBiwIGpwGNAgaoAY8CGakBkAJTqgGSAgarAZQCGawBlQJUrQGWAgauAZcCBq8BmAIZsAGbAlWxAZwCWbIBnQIJswGeAgm0AZ8CCbUBoAIJtgGhAgm3AaMCCbgBpQIZuQGmAlq6AagCCbsBqgIZvAGrAlu9AawCCb4BrQIJvwGuAhnAAbECXMEBsgJiwgGzAgzDAbQCDMQBtQIMxQG2AgzGAbcCDMcBuQIMyAG7AhnJAbwCY8oBvgIMywHAAhnMAcECZM0BwgIMzgHDAgzPAcQCGdABxwJl0QHIAmvSAckCC9MBygIL1AHLAgvVAcwCC9YBzQIL1wHPAgvYAdECGdkB0gJs2gHUAgvbAdYCGdwB1wJt3QHYAgveAdkCC98B2gIZ4AHdAm7hAd4CdOIB3wIK4wHgAgrkAeECCuUB4gIK5gHjAgrnAeUCCugB5wIZ6QHoAnXqAewCCusB7gIZ7AHvAnbtAfICCu4B8wIK7wH0AhnwAfcCd_EB-AJ98gH5Ag_zAfoCD_QB-wIP9QH8Ag_2Af0CD_cB_wIP-AGBAxn5AYIDfvoBhAMP-wGGAxn8AYcDf_0BiAMP_gGJAw__AYoDGYACjQOAAYECjgOEAYICjwMOgwKQAw6EApEDDoUCkgMOhgKTAw6HApUDDogClwMZiQKYA4UBigKcAw6LAp4DGYwCnwOGAY0CogMOjgKjAw6PAqQDGZACpwOHAZECqAONAZICqgMSkwKrAxKUAq0DEpUCrgMSlgKvAxKXArEDEpgCswMZmQK0A44BmgK2AxKbArgDGZwCuQOPAZ0CugMSngK7AxKfArwDGaACvwOQAaECwAOWAaICwQMVowLCAxWkAsMDFaUCxAMVpgLFAxWnAscDFagCyQMZqQLKA5cBqgLMAxWrAs4DGawCzwOYAa0C0AMVrgLRAxWvAtIDGbAC1QOZAbEC1gOfAbIC1wMWswLYAxa0AtkDFrUC2gMWtgLbAxa3At0DFrgC3wMZuQLgA6ABugLiAxa7AuQDGbwC5QOhAb0C5gMWvgLnAxa_AugDGcAC6wOiAcEC7AOmAcIC7QMTwwLuAxPEAu8DE8UC8AMTxgLxAxPHAvMDE8gC9QMZyQL2A6cBygL4AxPLAvoDGcwC-wOoAc0C_AMTzgL9AxPPAv4DGdACgQSpAdECggSvAQ"
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
    PRISMA_CLIENT_GENERATION = 4;
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
var MAX_API_BODY_BYTES, PAYLOAD_TOO_LARGE_MESSAGE;
var init_request_limits = __esm({
  "app/lib/request-limits.ts"() {
    "use strict";
    MAX_API_BODY_BYTES = 1024 * 1024;
    PAYLOAD_TOO_LARGE_MESSAGE = "Payload trop volumineux";
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
  return contentLength > MAX_API_BODY_BYTES;
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
  VAPID_SUBJECT: import_zod.z.string().email().optional(),
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
