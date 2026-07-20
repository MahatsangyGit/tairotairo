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
  if (process.env.NODE_ENV === "production" && (parsed.port === "6543" || /pooler\.supabase\.com/i.test(parsed.hostname))) {
    console.warn(
      "[Tairo ampio] DATABASE_URL semble pointer vers un pooler transactionnel. Utilisez une connexion directe ou un pooler session pour pr\xE9server le RLS (voir docs/OPS_PERFORMANCE.md)."
    );
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
      "inlineSchema": `model Booking {
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

enum CourseCategory {
  DIY
  HANDYWORK
  ELECTRICAL
  PLUMBING
  PAINTING
  SAFETY
  OTHER
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Course {
  id          String         @id @default(cuid())
  title       String
  slug        String         @unique
  description String
  category    CourseCategory
  coverKey    String?
  status      CourseStatus   @default(DRAFT)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  createdBy   User               @relation("CourseAuthor", fields: [createdById], references: [id])
  createdById String
  lessons     CourseLesson[]
  enrollments CourseEnrollment[]

  @@index([status])
  @@index([category])
  @@index([status, updatedAt])
}

model CourseLesson {
  id          String   @id @default(cuid())
  title       String
  description String?
  position    Int
  /// Cl\xE9 StorageBackend \u2014 jamais expos\xE9e au client
  videoKey    String?
  videoMime   String?
  durationSec Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  course   Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId String
  progress LessonProgress[]

  @@unique([courseId, position])
  @@index([courseId])
}

model CourseEnrollment {
  id           String   @id @default(cuid())
  lastLessonId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   String
  course   Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  courseId String

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LessonProgress {
  id          String    @id @default(cuid())
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user     User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId   String
  lesson   CourseLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  lessonId String

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
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

model Notification {
  id        String   @id @default(cuid())
  type      String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user   User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String
  outbox NotificationOutbox[]

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

enum NotificationOutboxChannel {
  EMAIL
  PUSH
}

enum NotificationOutboxStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
  DEAD
}

model NotificationOutbox {
  id             String                    @id @default(cuid())
  notificationId String
  userId         String
  channel        NotificationOutboxChannel
  status         NotificationOutboxStatus  @default(PENDING)
  attempts       Int                       @default(0)
  nextAttemptAt  DateTime                  @default(now())
  lastError      String?
  createdAt      DateTime                  @default(now())
  updatedAt      DateTime                  @updatedAt

  notification Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status, nextAttemptAt])
  @@index([notificationId])
  @@index([userId])
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

enum EquipmentCategory {
  POWER_TOOLS
  HAND_TOOLS
  ELECTRICAL
  PLUMBING
  PAINTING
  GARDENING
  CONSTRUCTION
  OTHER
}

enum EquipmentStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  SUSPENDED
  ARCHIVED
}

enum RentalStatus {
  REQUESTED
  ACCEPTED
  PAID
  ONGOING
  RETURN_PENDING
  COMPLETED
  CANCELLED
  DISPUTED
}

enum RentalTransactionStatus {
  PENDING
  ESCROWED
  RELEASED
  REFUNDED
  FAILED
}

model EquipmentItem {
  id              String            @id @default(cuid())
  title           String
  description     String
  category        EquipmentCategory
  location        String
  dailyPrice      Float
  depositAmount   Float
  status          EquipmentStatus   @default(DRAFT)
  isPlatformOwned Boolean           @default(false)
  rejectionReason String?
  photoKeys       String[]          @default([])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  owner   User            @relation("EquipmentOwner", fields: [ownerId], references: [id])
  ownerId String
  rentals RentalBooking[]

  @@index([status])
  @@index([category])
  @@index([ownerId])
  @@index([status, updatedAt])
  @@index([isPlatformOwned])
}

model RentalBooking {
  id                String       @id @default(cuid())
  status            RentalStatus @default(REQUESTED)
  startDate         DateTime
  endDate           DateTime
  totalAmount       Float
  depositAmount     Float
  /// Snapshots fig\xE9s pour l\u2019affichage si le mat\xE9riel est archiv\xE9
  displayTitle      String?
  displayCategory   String?
  displayLocation   String?
  displayDailyPrice Float?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  equipment   EquipmentItem      @relation(fields: [equipmentId], references: [id])
  equipmentId String
  renter      User               @relation("RentalRenter", fields: [renterId], references: [id])
  renterId    String
  owner       User               @relation("RentalOwner", fields: [ownerId], references: [id])
  ownerId     String
  transaction RentalTransaction?

  @@index([equipmentId])
  @@index([renterId])
  @@index([ownerId])
  @@index([status])
  @@index([startDate, endDate])
  @@index([renterId, updatedAt])
  @@index([ownerId, updatedAt])
}

model RentalTransaction {
  id                String                  @id @default(cuid())
  amount            Float
  depositAmount     Float
  currency          String                  @default("MGA")
  status            RentalTransactionStatus @default(PENDING)
  paymentMethod     PaymentMethod
  referenceId       String?
  escrowedAt        DateTime?
  releasedAt        DateTime?
  refundedAt        DateTime?
  depositRefundedAt DateTime?
  /// Portion de caution retenue en litige (0 = caution int\xE9gralement rembours\xE9e)
  depositRetained   Float                   @default(0)
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt

  rentalBooking   RentalBooking @relation(fields: [rentalBookingId], references: [id])
  rentalBookingId String        @unique
  payout          RentalPayout?

  @@index([status])
}

model RentalPayout {
  id            String            @id @default(cuid())
  owner         User              @relation("RentalPayoutOwner", fields: [ownerId], references: [id])
  ownerId       String
  transaction   RentalTransaction @relation(fields: [transactionId], references: [id])
  transactionId String            @unique
  amount        Float
  currency      String            @default("MGA")
  status        PayoutStatus      @default(PENDING)
  reference     String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([ownerId])
  @@index([status])
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
  notificationOutbox      NotificationOutbox[]
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

  /// \xC9cosyst\xE8me ampindramo
  equipmentOwned  EquipmentItem[] @relation("EquipmentOwner")
  rentalsAsRenter RentalBooking[] @relation("RentalRenter")
  rentalsAsOwner  RentalBooking[] @relation("RentalOwner")
  rentalPayouts   RentalPayout[]  @relation("RentalPayoutOwner")

  /// \xC9cosyst\xE8me ampianaro
  coursesCreated    Course[]           @relation("CourseAuthor")
  courseEnrollments CourseEnrollment[]
  lessonProgress    LessonProgress[]

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

model EmailOtp {
  id             String   @id @default(cuid())
  codeHash       String
  failedAttempts Int      @default(0)
  expiresAt      DateTime
  createdAt      DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@index([userId])
  @@index([expiresAt])
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
  @@index([expiresAt])
}

generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
  url      = env("DATABASE_URL")
}

datasource db {
  provider = "postgresql"
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
    config.runtimeDataModel = JSON.parse('{"models":{"Booking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"BookingStatus"},{"name":"date","kind":"scalar","type":"DateTime"},{"name":"slotStart","kind":"scalar","type":"String"},{"name":"slotEnd","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"displayTitle","kind":"scalar","type":"String"},{"name":"displayPrice","kind":"scalar","type":"Float"},{"name":"displayCategory","kind":"scalar","type":"String"},{"name":"displayLocation","kind":"scalar","type":"String"},{"name":"displaySource","kind":"scalar","type":"String"},{"name":"displayTargetId","kind":"scalar","type":"String"},{"name":"client","kind":"object","type":"User","relationName":"ClientBookings"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderBookings"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"BookingToService"},{"name":"serviceId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"BookingToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"Transaction","relationName":"BookingToTransaction"},{"name":"review","kind":"object","type":"Review","relationName":"BookingToReview"}],"dbName":null},"Transaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"TransactionStatus"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"escrowedAt","kind":"scalar","type":"DateTime"},{"name":"releasedAt","kind":"scalar","type":"DateTime"},{"name":"refundedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToTransaction"},{"name":"bookingId","kind":"scalar","type":"String"},{"name":"payout","kind":"object","type":"ProviderPayout","relationName":"ProviderPayoutToTransaction"}],"dbName":null},"ProviderPayout":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderPayoutToUser"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"Transaction","relationName":"ProviderPayoutToTransaction"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PayoutStatus"},{"name":"reference","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"Course":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"category","kind":"enum","type":"CourseCategory"},{"name":"coverKey","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"CourseStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"createdBy","kind":"object","type":"User","relationName":"CourseAuthor"},{"name":"createdById","kind":"scalar","type":"String"},{"name":"lessons","kind":"object","type":"CourseLesson","relationName":"CourseToCourseLesson"},{"name":"enrollments","kind":"object","type":"CourseEnrollment","relationName":"CourseToCourseEnrollment"}],"dbName":null},"CourseLesson":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"position","kind":"scalar","type":"Int"},{"name":"videoKey","kind":"scalar","type":"String"},{"name":"videoMime","kind":"scalar","type":"String"},{"name":"durationSec","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"course","kind":"object","type":"Course","relationName":"CourseToCourseLesson"},{"name":"courseId","kind":"scalar","type":"String"},{"name":"progress","kind":"object","type":"LessonProgress","relationName":"CourseLessonToLessonProgress"}],"dbName":null},"CourseEnrollment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"lastLessonId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"CourseEnrollmentToUser"},{"name":"userId","kind":"scalar","type":"String"},{"name":"course","kind":"object","type":"Course","relationName":"CourseToCourseEnrollment"},{"name":"courseId","kind":"scalar","type":"String"}],"dbName":null},"LessonProgress":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"completedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"LessonProgressToUser"},{"name":"userId","kind":"scalar","type":"String"},{"name":"lesson","kind":"object","type":"CourseLesson","relationName":"CourseLessonToLessonProgress"},{"name":"lessonId","kind":"scalar","type":"String"}],"dbName":null},"Service":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"available","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ServiceToUser"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"bookings","kind":"object","type":"Booking","relationName":"BookingToService"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToService"}],"dbName":null},"ServiceRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"budget","kind":"scalar","type":"Float"},{"name":"category","kind":"scalar","type":"String"},{"name":"location","kind":"scalar","type":"String"},{"name":"coverImageMime","kind":"scalar","type":"String"},{"name":"desiredDate","kind":"scalar","type":"DateTime"},{"name":"desiredSlotStart","kind":"scalar","type":"String"},{"name":"desiredSlotEnd","kind":"scalar","type":"String"},{"name":"open","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ServiceRequestToUser"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"responses","kind":"object","type":"RequestResponse","relationName":"RequestResponseToServiceRequest"}],"dbName":null},"RequestResponse":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"message","kind":"scalar","type":"String"},{"name":"proposedPrice","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"RequestResponseStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"request","kind":"object","type":"ServiceRequest","relationName":"RequestResponseToServiceRequest"},{"name":"requestId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderResponses"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToRequestResponse"},{"name":"priceOffers","kind":"object","type":"Message","relationName":"MessageToRequestResponse"}],"dbName":null},"Conversation":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"client","kind":"object","type":"User","relationName":"ClientConversations"},{"name":"clientId","kind":"scalar","type":"String"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderConversations"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"messages","kind":"object","type":"Message","relationName":"ConversationToMessage"}],"dbName":null},"Message":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"kind","kind":"enum","type":"MessageKind"},{"name":"offerPrice","kind":"scalar","type":"Float"},{"name":"offerStatus","kind":"enum","type":"PriceOfferStatus"},{"name":"readAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"conversation","kind":"object","type":"Conversation","relationName":"ConversationToMessage"},{"name":"conversationId","kind":"scalar","type":"String"},{"name":"sender","kind":"object","type":"User","relationName":"MessageToUser"},{"name":"senderId","kind":"scalar","type":"String"},{"name":"requestResponse","kind":"object","type":"RequestResponse","relationName":"MessageToRequestResponse"},{"name":"requestResponseId","kind":"scalar","type":"String"},{"name":"service","kind":"object","type":"Service","relationName":"MessageToService"},{"name":"serviceId","kind":"scalar","type":"String"}],"dbName":null},"Notification":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"link","kind":"scalar","type":"String"},{"name":"read","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"NotificationToUser"},{"name":"userId","kind":"scalar","type":"String"},{"name":"outbox","kind":"object","type":"NotificationOutbox","relationName":"NotificationToNotificationOutbox"}],"dbName":null},"PushSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"endpoint","kind":"scalar","type":"String"},{"name":"p256dh","kind":"scalar","type":"String"},{"name":"auth","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PushSubscriptionToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"NotificationOutbox":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"notificationId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"channel","kind":"enum","type":"NotificationOutboxChannel"},{"name":"status","kind":"enum","type":"NotificationOutboxStatus"},{"name":"attempts","kind":"scalar","type":"Int"},{"name":"nextAttemptAt","kind":"scalar","type":"DateTime"},{"name":"lastError","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"notification","kind":"object","type":"Notification","relationName":"NotificationToNotificationOutbox"},{"name":"user","kind":"object","type":"User","relationName":"NotificationOutboxToUser"}],"dbName":null},"ProviderPortfolioItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"sortOrder","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderPortfolioItemToUser"},{"name":"comments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioItemCommentToProviderPortfolioItem"}],"dbName":null},"PortfolioItemComment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"itemId","kind":"scalar","type":"String"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"body","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"item","kind":"object","type":"ProviderPortfolioItem","relationName":"PortfolioItemCommentToProviderPortfolioItem"},{"name":"author","kind":"object","type":"User","relationName":"PortfolioComments"}],"dbName":null},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"author","kind":"object","type":"User","relationName":"ReviewsGiven"},{"name":"authorId","kind":"scalar","type":"String"},{"name":"target","kind":"object","type":"User","relationName":"ReviewsReceived"},{"name":"targetId","kind":"scalar","type":"String"},{"name":"booking","kind":"object","type":"Booking","relationName":"BookingToReview"},{"name":"bookingId","kind":"scalar","type":"String"}],"dbName":null},"EquipmentItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"category","kind":"enum","type":"EquipmentCategory"},{"name":"location","kind":"scalar","type":"String"},{"name":"dailyPrice","kind":"scalar","type":"Float"},{"name":"depositAmount","kind":"scalar","type":"Float"},{"name":"status","kind":"enum","type":"EquipmentStatus"},{"name":"isPlatformOwned","kind":"scalar","type":"Boolean"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"photoKeys","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"owner","kind":"object","type":"User","relationName":"EquipmentOwner"},{"name":"ownerId","kind":"scalar","type":"String"},{"name":"rentals","kind":"object","type":"RentalBooking","relationName":"EquipmentItemToRentalBooking"}],"dbName":null},"RentalBooking":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"RentalStatus"},{"name":"startDate","kind":"scalar","type":"DateTime"},{"name":"endDate","kind":"scalar","type":"DateTime"},{"name":"totalAmount","kind":"scalar","type":"Float"},{"name":"depositAmount","kind":"scalar","type":"Float"},{"name":"displayTitle","kind":"scalar","type":"String"},{"name":"displayCategory","kind":"scalar","type":"String"},{"name":"displayLocation","kind":"scalar","type":"String"},{"name":"displayDailyPrice","kind":"scalar","type":"Float"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"equipment","kind":"object","type":"EquipmentItem","relationName":"EquipmentItemToRentalBooking"},{"name":"equipmentId","kind":"scalar","type":"String"},{"name":"renter","kind":"object","type":"User","relationName":"RentalRenter"},{"name":"renterId","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"RentalOwner"},{"name":"ownerId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"RentalTransaction","relationName":"RentalBookingToRentalTransaction"}],"dbName":null},"RentalTransaction":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"depositAmount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"RentalTransactionStatus"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"escrowedAt","kind":"scalar","type":"DateTime"},{"name":"releasedAt","kind":"scalar","type":"DateTime"},{"name":"refundedAt","kind":"scalar","type":"DateTime"},{"name":"depositRefundedAt","kind":"scalar","type":"DateTime"},{"name":"depositRetained","kind":"scalar","type":"Float"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"rentalBooking","kind":"object","type":"RentalBooking","relationName":"RentalBookingToRentalTransaction"},{"name":"rentalBookingId","kind":"scalar","type":"String"},{"name":"payout","kind":"object","type":"RentalPayout","relationName":"RentalPayoutToRentalTransaction"}],"dbName":null},"RentalPayout":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"owner","kind":"object","type":"User","relationName":"RentalPayoutOwner"},{"name":"ownerId","kind":"scalar","type":"String"},{"name":"transaction","kind":"object","type":"RentalTransaction","relationName":"RentalPayoutToRentalTransaction"},{"name":"transactionId","kind":"scalar","type":"String"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"PayoutStatus"},{"name":"reference","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"password","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"role","kind":"enum","type":"Role"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"bio","kind":"scalar","type":"String"},{"name":"emailVerified","kind":"scalar","type":"Boolean"},{"name":"emailVerifiedAt","kind":"scalar","type":"DateTime"},{"name":"notifyEmail","kind":"scalar","type":"Boolean"},{"name":"notifyPush","kind":"scalar","type":"Boolean"},{"name":"kycStatus","kind":"enum","type":"KycStatus"},{"name":"kycSubmittedAt","kind":"scalar","type":"DateTime"},{"name":"featuredOnHomepage","kind":"scalar","type":"Boolean"},{"name":"featuredOnHomepageAt","kind":"scalar","type":"DateTime"},{"name":"suspendedAt","kind":"scalar","type":"DateTime"},{"name":"failedLoginAttempts","kind":"scalar","type":"Int"},{"name":"loginLockedAt","kind":"scalar","type":"DateTime"},{"name":"tokenVersion","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"providerSubscription","kind":"object","type":"ProviderSubscription","relationName":"ProviderSubscriptionToUser"},{"name":"subscriptionPayments","kind":"object","type":"ProviderSubscriptionPayment","relationName":"ProviderSubscriptionPaymentToUser"},{"name":"kycDocuments","kind":"object","type":"ProviderKycDocument","relationName":"ProviderKycDocumentToUser"},{"name":"emailOtps","kind":"object","type":"EmailOtp","relationName":"EmailOtpToUser"},{"name":"passwordResetTokens","kind":"object","type":"PasswordResetToken","relationName":"PasswordResetTokenToUser"},{"name":"notifications","kind":"object","type":"Notification","relationName":"NotificationToUser"},{"name":"notificationOutbox","kind":"object","type":"NotificationOutbox","relationName":"NotificationOutboxToUser"},{"name":"pushSubscriptions","kind":"object","type":"PushSubscription","relationName":"PushSubscriptionToUser"},{"name":"services","kind":"object","type":"Service","relationName":"ServiceToUser"},{"name":"serviceRequests","kind":"object","type":"ServiceRequest","relationName":"ServiceRequestToUser"},{"name":"requestResponses","kind":"object","type":"RequestResponse","relationName":"ProviderResponses"},{"name":"bookingsAsClient","kind":"object","type":"Booking","relationName":"ClientBookings"},{"name":"bookingsAsProvider","kind":"object","type":"Booking","relationName":"ProviderBookings"},{"name":"reviewsGiven","kind":"object","type":"Review","relationName":"ReviewsGiven"},{"name":"reviewsReceived","kind":"object","type":"Review","relationName":"ReviewsReceived"},{"name":"messagesSent","kind":"object","type":"Message","relationName":"MessageToUser"},{"name":"conversationsAsClient","kind":"object","type":"Conversation","relationName":"ClientConversations"},{"name":"conversationsAsProvider","kind":"object","type":"Conversation","relationName":"ProviderConversations"},{"name":"portfolioItems","kind":"object","type":"ProviderPortfolioItem","relationName":"ProviderPortfolioItemToUser"},{"name":"portfolioComments","kind":"object","type":"PortfolioItemComment","relationName":"PortfolioComments"},{"name":"providerPayouts","kind":"object","type":"ProviderPayout","relationName":"ProviderPayoutToUser"},{"name":"equipmentOwned","kind":"object","type":"EquipmentItem","relationName":"EquipmentOwner"},{"name":"rentalsAsRenter","kind":"object","type":"RentalBooking","relationName":"RentalRenter"},{"name":"rentalsAsOwner","kind":"object","type":"RentalBooking","relationName":"RentalOwner"},{"name":"rentalPayouts","kind":"object","type":"RentalPayout","relationName":"RentalPayoutOwner"},{"name":"coursesCreated","kind":"object","type":"Course","relationName":"CourseAuthor"},{"name":"courseEnrollments","kind":"object","type":"CourseEnrollment","relationName":"CourseEnrollmentToUser"},{"name":"lessonProgress","kind":"object","type":"LessonProgress","relationName":"LessonProgressToUser"}],"dbName":null},"ProviderSubscription":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"startsAt","kind":"scalar","type":"DateTime"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"notes","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionToUser"}],"dbName":null},"ProviderSubscriptionPayment":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"providerId","kind":"scalar","type":"String"},{"name":"months","kind":"scalar","type":"Int"},{"name":"amount","kind":"scalar","type":"Float"},{"name":"currency","kind":"scalar","type":"String"},{"name":"paymentMethod","kind":"enum","type":"PaymentMethod"},{"name":"phone","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubscriptionPaymentStatus"},{"name":"referenceId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"provider","kind":"object","type":"User","relationName":"ProviderSubscriptionPaymentToUser"}],"dbName":null},"ProviderKycDocument":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"type","kind":"enum","type":"KycDocumentType"},{"name":"cinSlot","kind":"scalar","type":"Int"},{"name":"storedName","kind":"scalar","type":"String"},{"name":"originalName","kind":"scalar","type":"String"},{"name":"mimeType","kind":"scalar","type":"String"},{"name":"sizeBytes","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ProviderKycDocumentToUser"}],"dbName":null},"EmailOtp":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"codeHash","kind":"scalar","type":"String"},{"name":"failedAttempts","kind":"scalar","type":"Int"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"EmailOtpToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null},"PasswordResetToken":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"tokenHash","kind":"scalar","type":"String"},{"name":"expiresAt","kind":"scalar","type":"DateTime"},{"name":"usedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"PasswordResetTokenToUser"},{"name":"userId","kind":"scalar","type":"String"}],"dbName":null}},"enums":{},"types":{}}');
    config.parameterizationSchema = {
      strings: JSON.parse('["where","provider","providerSubscription","orderBy","cursor","subscriptionPayments","user","kycDocuments","emailOtps","passwordResetTokens","notification","outbox","_count","notifications","notificationOutbox","pushSubscriptions","bookings","client","messages","conversation","sender","responses","request","booking","priceOffers","requestResponse","service","services","serviceRequests","requestResponses","bookingsAsClient","bookingsAsProvider","author","target","reviewsGiven","reviewsReceived","messagesSent","conversationsAsClient","conversationsAsProvider","item","comments","portfolioItems","portfolioComments","payout","transaction","providerPayouts","owner","equipment","renter","rentalBooking","rentals","equipmentOwned","rentalsAsRenter","rentalsAsOwner","rentalPayouts","createdBy","course","lesson","progress","lessons","enrollments","coursesCreated","courseEnrollments","lessonProgress","review","Booking.findUnique","Booking.findUniqueOrThrow","Booking.findFirst","Booking.findFirstOrThrow","Booking.findMany","data","Booking.createOne","Booking.createMany","Booking.createManyAndReturn","Booking.updateOne","Booking.updateMany","Booking.updateManyAndReturn","create","update","Booking.upsertOne","Booking.deleteOne","Booking.deleteMany","having","_avg","_sum","_min","_max","Booking.groupBy","Booking.aggregate","Transaction.findUnique","Transaction.findUniqueOrThrow","Transaction.findFirst","Transaction.findFirstOrThrow","Transaction.findMany","Transaction.createOne","Transaction.createMany","Transaction.createManyAndReturn","Transaction.updateOne","Transaction.updateMany","Transaction.updateManyAndReturn","Transaction.upsertOne","Transaction.deleteOne","Transaction.deleteMany","Transaction.groupBy","Transaction.aggregate","ProviderPayout.findUnique","ProviderPayout.findUniqueOrThrow","ProviderPayout.findFirst","ProviderPayout.findFirstOrThrow","ProviderPayout.findMany","ProviderPayout.createOne","ProviderPayout.createMany","ProviderPayout.createManyAndReturn","ProviderPayout.updateOne","ProviderPayout.updateMany","ProviderPayout.updateManyAndReturn","ProviderPayout.upsertOne","ProviderPayout.deleteOne","ProviderPayout.deleteMany","ProviderPayout.groupBy","ProviderPayout.aggregate","Course.findUnique","Course.findUniqueOrThrow","Course.findFirst","Course.findFirstOrThrow","Course.findMany","Course.createOne","Course.createMany","Course.createManyAndReturn","Course.updateOne","Course.updateMany","Course.updateManyAndReturn","Course.upsertOne","Course.deleteOne","Course.deleteMany","Course.groupBy","Course.aggregate","CourseLesson.findUnique","CourseLesson.findUniqueOrThrow","CourseLesson.findFirst","CourseLesson.findFirstOrThrow","CourseLesson.findMany","CourseLesson.createOne","CourseLesson.createMany","CourseLesson.createManyAndReturn","CourseLesson.updateOne","CourseLesson.updateMany","CourseLesson.updateManyAndReturn","CourseLesson.upsertOne","CourseLesson.deleteOne","CourseLesson.deleteMany","CourseLesson.groupBy","CourseLesson.aggregate","CourseEnrollment.findUnique","CourseEnrollment.findUniqueOrThrow","CourseEnrollment.findFirst","CourseEnrollment.findFirstOrThrow","CourseEnrollment.findMany","CourseEnrollment.createOne","CourseEnrollment.createMany","CourseEnrollment.createManyAndReturn","CourseEnrollment.updateOne","CourseEnrollment.updateMany","CourseEnrollment.updateManyAndReturn","CourseEnrollment.upsertOne","CourseEnrollment.deleteOne","CourseEnrollment.deleteMany","CourseEnrollment.groupBy","CourseEnrollment.aggregate","LessonProgress.findUnique","LessonProgress.findUniqueOrThrow","LessonProgress.findFirst","LessonProgress.findFirstOrThrow","LessonProgress.findMany","LessonProgress.createOne","LessonProgress.createMany","LessonProgress.createManyAndReturn","LessonProgress.updateOne","LessonProgress.updateMany","LessonProgress.updateManyAndReturn","LessonProgress.upsertOne","LessonProgress.deleteOne","LessonProgress.deleteMany","LessonProgress.groupBy","LessonProgress.aggregate","Service.findUnique","Service.findUniqueOrThrow","Service.findFirst","Service.findFirstOrThrow","Service.findMany","Service.createOne","Service.createMany","Service.createManyAndReturn","Service.updateOne","Service.updateMany","Service.updateManyAndReturn","Service.upsertOne","Service.deleteOne","Service.deleteMany","Service.groupBy","Service.aggregate","ServiceRequest.findUnique","ServiceRequest.findUniqueOrThrow","ServiceRequest.findFirst","ServiceRequest.findFirstOrThrow","ServiceRequest.findMany","ServiceRequest.createOne","ServiceRequest.createMany","ServiceRequest.createManyAndReturn","ServiceRequest.updateOne","ServiceRequest.updateMany","ServiceRequest.updateManyAndReturn","ServiceRequest.upsertOne","ServiceRequest.deleteOne","ServiceRequest.deleteMany","ServiceRequest.groupBy","ServiceRequest.aggregate","RequestResponse.findUnique","RequestResponse.findUniqueOrThrow","RequestResponse.findFirst","RequestResponse.findFirstOrThrow","RequestResponse.findMany","RequestResponse.createOne","RequestResponse.createMany","RequestResponse.createManyAndReturn","RequestResponse.updateOne","RequestResponse.updateMany","RequestResponse.updateManyAndReturn","RequestResponse.upsertOne","RequestResponse.deleteOne","RequestResponse.deleteMany","RequestResponse.groupBy","RequestResponse.aggregate","Conversation.findUnique","Conversation.findUniqueOrThrow","Conversation.findFirst","Conversation.findFirstOrThrow","Conversation.findMany","Conversation.createOne","Conversation.createMany","Conversation.createManyAndReturn","Conversation.updateOne","Conversation.updateMany","Conversation.updateManyAndReturn","Conversation.upsertOne","Conversation.deleteOne","Conversation.deleteMany","Conversation.groupBy","Conversation.aggregate","Message.findUnique","Message.findUniqueOrThrow","Message.findFirst","Message.findFirstOrThrow","Message.findMany","Message.createOne","Message.createMany","Message.createManyAndReturn","Message.updateOne","Message.updateMany","Message.updateManyAndReturn","Message.upsertOne","Message.deleteOne","Message.deleteMany","Message.groupBy","Message.aggregate","Notification.findUnique","Notification.findUniqueOrThrow","Notification.findFirst","Notification.findFirstOrThrow","Notification.findMany","Notification.createOne","Notification.createMany","Notification.createManyAndReturn","Notification.updateOne","Notification.updateMany","Notification.updateManyAndReturn","Notification.upsertOne","Notification.deleteOne","Notification.deleteMany","Notification.groupBy","Notification.aggregate","PushSubscription.findUnique","PushSubscription.findUniqueOrThrow","PushSubscription.findFirst","PushSubscription.findFirstOrThrow","PushSubscription.findMany","PushSubscription.createOne","PushSubscription.createMany","PushSubscription.createManyAndReturn","PushSubscription.updateOne","PushSubscription.updateMany","PushSubscription.updateManyAndReturn","PushSubscription.upsertOne","PushSubscription.deleteOne","PushSubscription.deleteMany","PushSubscription.groupBy","PushSubscription.aggregate","NotificationOutbox.findUnique","NotificationOutbox.findUniqueOrThrow","NotificationOutbox.findFirst","NotificationOutbox.findFirstOrThrow","NotificationOutbox.findMany","NotificationOutbox.createOne","NotificationOutbox.createMany","NotificationOutbox.createManyAndReturn","NotificationOutbox.updateOne","NotificationOutbox.updateMany","NotificationOutbox.updateManyAndReturn","NotificationOutbox.upsertOne","NotificationOutbox.deleteOne","NotificationOutbox.deleteMany","NotificationOutbox.groupBy","NotificationOutbox.aggregate","ProviderPortfolioItem.findUnique","ProviderPortfolioItem.findUniqueOrThrow","ProviderPortfolioItem.findFirst","ProviderPortfolioItem.findFirstOrThrow","ProviderPortfolioItem.findMany","ProviderPortfolioItem.createOne","ProviderPortfolioItem.createMany","ProviderPortfolioItem.createManyAndReturn","ProviderPortfolioItem.updateOne","ProviderPortfolioItem.updateMany","ProviderPortfolioItem.updateManyAndReturn","ProviderPortfolioItem.upsertOne","ProviderPortfolioItem.deleteOne","ProviderPortfolioItem.deleteMany","ProviderPortfolioItem.groupBy","ProviderPortfolioItem.aggregate","PortfolioItemComment.findUnique","PortfolioItemComment.findUniqueOrThrow","PortfolioItemComment.findFirst","PortfolioItemComment.findFirstOrThrow","PortfolioItemComment.findMany","PortfolioItemComment.createOne","PortfolioItemComment.createMany","PortfolioItemComment.createManyAndReturn","PortfolioItemComment.updateOne","PortfolioItemComment.updateMany","PortfolioItemComment.updateManyAndReturn","PortfolioItemComment.upsertOne","PortfolioItemComment.deleteOne","PortfolioItemComment.deleteMany","PortfolioItemComment.groupBy","PortfolioItemComment.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","EquipmentItem.findUnique","EquipmentItem.findUniqueOrThrow","EquipmentItem.findFirst","EquipmentItem.findFirstOrThrow","EquipmentItem.findMany","EquipmentItem.createOne","EquipmentItem.createMany","EquipmentItem.createManyAndReturn","EquipmentItem.updateOne","EquipmentItem.updateMany","EquipmentItem.updateManyAndReturn","EquipmentItem.upsertOne","EquipmentItem.deleteOne","EquipmentItem.deleteMany","EquipmentItem.groupBy","EquipmentItem.aggregate","RentalBooking.findUnique","RentalBooking.findUniqueOrThrow","RentalBooking.findFirst","RentalBooking.findFirstOrThrow","RentalBooking.findMany","RentalBooking.createOne","RentalBooking.createMany","RentalBooking.createManyAndReturn","RentalBooking.updateOne","RentalBooking.updateMany","RentalBooking.updateManyAndReturn","RentalBooking.upsertOne","RentalBooking.deleteOne","RentalBooking.deleteMany","RentalBooking.groupBy","RentalBooking.aggregate","RentalTransaction.findUnique","RentalTransaction.findUniqueOrThrow","RentalTransaction.findFirst","RentalTransaction.findFirstOrThrow","RentalTransaction.findMany","RentalTransaction.createOne","RentalTransaction.createMany","RentalTransaction.createManyAndReturn","RentalTransaction.updateOne","RentalTransaction.updateMany","RentalTransaction.updateManyAndReturn","RentalTransaction.upsertOne","RentalTransaction.deleteOne","RentalTransaction.deleteMany","RentalTransaction.groupBy","RentalTransaction.aggregate","RentalPayout.findUnique","RentalPayout.findUniqueOrThrow","RentalPayout.findFirst","RentalPayout.findFirstOrThrow","RentalPayout.findMany","RentalPayout.createOne","RentalPayout.createMany","RentalPayout.createManyAndReturn","RentalPayout.updateOne","RentalPayout.updateMany","RentalPayout.updateManyAndReturn","RentalPayout.upsertOne","RentalPayout.deleteOne","RentalPayout.deleteMany","RentalPayout.groupBy","RentalPayout.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","ProviderSubscription.findUnique","ProviderSubscription.findUniqueOrThrow","ProviderSubscription.findFirst","ProviderSubscription.findFirstOrThrow","ProviderSubscription.findMany","ProviderSubscription.createOne","ProviderSubscription.createMany","ProviderSubscription.createManyAndReturn","ProviderSubscription.updateOne","ProviderSubscription.updateMany","ProviderSubscription.updateManyAndReturn","ProviderSubscription.upsertOne","ProviderSubscription.deleteOne","ProviderSubscription.deleteMany","ProviderSubscription.groupBy","ProviderSubscription.aggregate","ProviderSubscriptionPayment.findUnique","ProviderSubscriptionPayment.findUniqueOrThrow","ProviderSubscriptionPayment.findFirst","ProviderSubscriptionPayment.findFirstOrThrow","ProviderSubscriptionPayment.findMany","ProviderSubscriptionPayment.createOne","ProviderSubscriptionPayment.createMany","ProviderSubscriptionPayment.createManyAndReturn","ProviderSubscriptionPayment.updateOne","ProviderSubscriptionPayment.updateMany","ProviderSubscriptionPayment.updateManyAndReturn","ProviderSubscriptionPayment.upsertOne","ProviderSubscriptionPayment.deleteOne","ProviderSubscriptionPayment.deleteMany","ProviderSubscriptionPayment.groupBy","ProviderSubscriptionPayment.aggregate","ProviderKycDocument.findUnique","ProviderKycDocument.findUniqueOrThrow","ProviderKycDocument.findFirst","ProviderKycDocument.findFirstOrThrow","ProviderKycDocument.findMany","ProviderKycDocument.createOne","ProviderKycDocument.createMany","ProviderKycDocument.createManyAndReturn","ProviderKycDocument.updateOne","ProviderKycDocument.updateMany","ProviderKycDocument.updateManyAndReturn","ProviderKycDocument.upsertOne","ProviderKycDocument.deleteOne","ProviderKycDocument.deleteMany","ProviderKycDocument.groupBy","ProviderKycDocument.aggregate","EmailOtp.findUnique","EmailOtp.findUniqueOrThrow","EmailOtp.findFirst","EmailOtp.findFirstOrThrow","EmailOtp.findMany","EmailOtp.createOne","EmailOtp.createMany","EmailOtp.createManyAndReturn","EmailOtp.updateOne","EmailOtp.updateMany","EmailOtp.updateManyAndReturn","EmailOtp.upsertOne","EmailOtp.deleteOne","EmailOtp.deleteMany","EmailOtp.groupBy","EmailOtp.aggregate","PasswordResetToken.findUnique","PasswordResetToken.findUniqueOrThrow","PasswordResetToken.findFirst","PasswordResetToken.findFirstOrThrow","PasswordResetToken.findMany","PasswordResetToken.createOne","PasswordResetToken.createMany","PasswordResetToken.createManyAndReturn","PasswordResetToken.updateOne","PasswordResetToken.updateMany","PasswordResetToken.updateManyAndReturn","PasswordResetToken.upsertOne","PasswordResetToken.deleteOne","PasswordResetToken.deleteMany","PasswordResetToken.groupBy","PasswordResetToken.aggregate","AND","OR","NOT","id","tokenHash","expiresAt","usedAt","createdAt","userId","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","codeHash","failedAttempts","KycDocumentType","type","cinSlot","storedName","originalName","mimeType","sizeBytes","providerId","months","amount","currency","PaymentMethod","paymentMethod","phone","SubscriptionPaymentStatus","status","referenceId","updatedAt","startsAt","notes","name","email","password","Role","role","avatar","bio","emailVerified","emailVerifiedAt","notifyEmail","notifyPush","KycStatus","kycStatus","kycSubmittedAt","featuredOnHomepage","featuredOnHomepageAt","suspendedAt","failedLoginAttempts","loginLockedAt","tokenVersion","every","some","none","ownerId","transactionId","PayoutStatus","reference","depositAmount","RentalTransactionStatus","escrowedAt","releasedAt","refundedAt","depositRefundedAt","depositRetained","rentalBookingId","RentalStatus","startDate","endDate","totalAmount","displayTitle","displayCategory","displayLocation","displayDailyPrice","equipmentId","renterId","title","description","EquipmentCategory","category","location","dailyPrice","EquipmentStatus","isPlatformOwned","rejectionReason","photoKeys","has","hasEvery","hasSome","rating","comment","authorId","targetId","bookingId","itemId","body","sortOrder","notificationId","NotificationOutboxChannel","channel","NotificationOutboxStatus","attempts","nextAttemptAt","lastError","endpoint","p256dh","auth","link","read","MessageKind","kind","offerPrice","PriceOfferStatus","offerStatus","readAt","conversationId","senderId","requestResponseId","serviceId","clientId","message","proposedPrice","RequestResponseStatus","requestId","budget","coverImageMime","desiredDate","desiredSlotStart","desiredSlotEnd","open","price","available","completedAt","lessonId","lastLessonId","courseId","position","videoKey","videoMime","durationSec","slug","CourseCategory","coverKey","CourseStatus","createdById","TransactionStatus","BookingStatus","date","slotStart","slotEnd","displayPrice","displaySource","displayTargetId","userId_courseId","userId_lessonId","courseId_position","clientId_providerId","requestId_providerId","userId_type_cinSlot","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
      graph: "thCRAsADGgEAAMAGACARAADABgAgGQAA5AcAIBoAAOUHACAsAADoBwAgQAAA6QcAIIkEAADmBwAwigQAACcAEIsEAADmBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGuBAAA5wenBSKwBEAAvgYAIdoEAQC_BgAh2wQBAL8GACHcBAEAvwYAIYkFAQAAAAGKBQEAvwYAIYsFAQDMBgAhpwVAAM8GACGoBQEAvwYAIakFAQC_BgAhqgUIAMwHACGrBQEAvwYAIawFAQC_BgAhAQAAAAEAIAsBAADABgAgiQQAAL0GADCKBAAAAwAQiwQAAL0GADCMBAEAzAYAIY4EQAC-BgAhkARAAL4GACGmBAEAzAYAIbAEQAC-BgAhsQRAAL4GACGyBAEAvwYAIQEAAAADACAPAQAAwAYAIIkEAAD2BwAwigQAAAUAEIsEAAD2BwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhpwQCANEGACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirAQBAMwGACGuBAAA9weuBCKvBAEAzAYAIbAEQAC-BgAhAQEAAKEIACAPAQAAwAYAIIkEAAD2BwAwigQAAAUAEIsEAAD2BwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGnBAIA0QYAIagECADzBgAhqQQBAMwGACGrBAAA9QarBCKsBAEAzAYAIa4EAAD3B64EIq8EAQAAAAGwBEAAvgYAIQMAAAAFACADAAAGADAEAAAHACANBgAAwAYAIIkEAAD0BwAwigQAAAkAEIsEAAD0BwAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhoAQAAPUHoAQioQQCANEGACGiBAEAzAYAIaMEAQDMBgAhpAQBAMwGACGlBAIA0QYAIQEGAAChCAAgDgYAAMAGACCJBAAA9AcAMIoEAAAJABCLBAAA9AcAMIwEAQAAAAGQBEAAvgYAIZEEAQDMBgAhoAQAAPUHoAQioQQCANEGACGiBAEAzAYAIaMEAQDMBgAhpAQBAMwGACGlBAIA0QYAIbIFAADzBwAgAwAAAAkAIAMAAAoAMAQAAAsAIAoGAADABgAgiQQAAPIHADCKBAAADQAQiwQAAPIHADCMBAEAzAYAIY4EQAC-BgAhkARAAL4GACGRBAEAzAYAIZ0EAQDMBgAhngQCANEGACEBBgAAoQgAIAoGAADABgAgiQQAAPIHADCKBAAADQAQiwQAAPIHADCMBAEAAAABjgRAAL4GACGQBEAAvgYAIZEEAQDMBgAhnQQBAMwGACGeBAIA0QYAIQMAAAANACADAAAOADAEAAAPACAKBgAAwAYAIIkEAADxBwAwigQAABEAEIsEAADxBwAwjAQBAMwGACGNBAEAzAYAIY4EQAC-BgAhjwRAAM8GACGQBEAAvgYAIZEEAQDMBgAhAgYAAKEIACCPBAAA-AcAIAoGAADABgAgiQQAAPEHADCKBAAAEQAQiwQAAPEHADCMBAEAAAABjQQBAMwGACGOBEAAvgYAIY8EQADPBgAhkARAAL4GACGRBAEAzAYAIQMAAAARACADAAASADAEAAATACANBgAAwAYAIAsAANgGACCJBAAA8AcAMIoEAAAVABCLBAAA8AcAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIaAEAQDMBgAh4AQBAMwGACHzBAEAzAYAIf8EAQC_BgAhgAUgAM4GACEDBgAAoQgAIAsAAJkNACD_BAAA-AcAIA0GAADABgAgCwAA2AYAIIkEAADwBwAwigQAABUAEIsEAADwBwAwjAQBAAAAAZAEQAC-BgAhkQQBAMwGACGgBAEAzAYAIeAEAQDMBgAh8wQBAMwGACH_BAEAvwYAIYAFIADOBgAhAwAAABUAIAMAABYAMAQAABcAIA8GAADABgAgCgAA7wcAIIkEAADsBwAwigQAABkAEIsEAADsBwAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhrgQAAO4H-QQisARAAL4GACH1BAEAzAYAIfcEAADtB_cEIvkEAgDRBgAh-gRAAL4GACH7BAEAvwYAIQMGAAChCAAgCgAArw4AIPsEAAD4BwAgDwYAAMAGACAKAADvBwAgiQQAAOwHADCKBAAAGQAQiwQAAOwHADCMBAEAAAABkARAAL4GACGRBAEAzAYAIa4EAADuB_kEIrAEQAC-BgAh9QQBAMwGACH3BAAA7Qf3BCL5BAIA0QYAIfoEQAC-BgAh-wQBAL8GACEDAAAAGQAgAwAAGgAwBAAAGwAgAQAAABkAIAMAAAAZACADAAAaADAEAAAbACAKBgAAwAYAIIkEAADrBwAwigQAAB8AEIsEAADrBwAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAh_AQBAMwGACH9BAEAzAYAIf4EAQDMBgAhAQYAAKEIACAKBgAAwAYAIIkEAADrBwAwigQAAB8AEIsEAADrBwAwjAQBAAAAAZAEQAC-BgAhkQQBAMwGACH8BAEAAAAB_QQBAMwGACH-BAEAzAYAIQMAAAAfACADAAAgADAEAAAhACATAQAAwAYAIBAAAN0GACAYAADfBgAgiQQAAOoHADCKBAAAIwAQiwQAAOoHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIcEEIADOBgAhwgRAAM8GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIZEFAQC_BgAhlgUIAPMGACGXBSAAzgYAIQUBAAChCAAgEAAAng0AIBgAAKANACDCBAAA-AcAIJEFAAD4BwAgEwEAAMAGACAQAADdBgAgGAAA3wYAIIkEAADqBwAwigQAACMAEIsEAADqBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIcEEIADOBgAhwgRAAM8GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIZEFAQC_BgAhlgUIAPMGACGXBSAAzgYAIQMAAAAjACADAAAkADAEAAAlACAaAQAAwAYAIBEAAMAGACAZAADkBwAgGgAA5QcAICwAAOgHACBAAADpBwAgiQQAAOYHADCKBAAAJwAQiwQAAOYHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGuBAAA5wenBSKwBEAAvgYAIdoEAQC_BgAh2wQBAL8GACHcBAEAvwYAIYkFAQC_BgAhigUBAL8GACGLBQEAzAYAIacFQADPBgAhqAUBAL8GACGpBQEAvwYAIaoFCADMBwAhqwUBAL8GACGsBQEAvwYAIREBAAChCAAgEQAAoQgAIBkAAKwOACAaAACtDgAgLAAAqA4AIEAAAK4OACDaBAAA-AcAINsEAAD4BwAg3AQAAPgHACCJBQAA-AcAIIoFAAD4BwAgpwUAAPgHACCoBQAA-AcAIKkFAAD4BwAgqgUAAPgHACCrBQAA-AcAIKwFAAD4BwAgAwAAACcAIAMAACgAMAQAAAEAIBITAADjBwAgFAAAwAYAIBkAAOQHACAaAADlBwAgiQQAAOAHADCKBAAAKgAQiwQAAOAHADCMBAEAzAYAIZAEQAC-BgAh8wQBAMwGACGCBQAA4QeCBSKDBQgAzAcAIYUFAADiB4UFI4YFQADPBgAhhwUBAMwGACGIBQEAzAYAIYkFAQC_BgAhigUBAL8GACEJEwAAqw4AIBQAAKEIACAZAACsDgAgGgAArQ4AIIMFAAD4BwAghQUAAPgHACCGBQAA-AcAIIkFAAD4BwAgigUAAPgHACASEwAA4wcAIBQAAMAGACAZAADkBwAgGgAA5QcAIIkEAADgBwAwigQAACoAEIsEAADgBwAwjAQBAAAAAZAEQAC-BgAh8wQBAMwGACGCBQAA4QeCBSKDBQgAzAcAIYUFAADiB4UFI4YFQADPBgAhhwUBAMwGACGIBQEAzAYAIYkFAQC_BgAhigUBAL8GACEDAAAAKgAgAwAAKwAwBAAALAAgAwAAACoAIAMAACsAMAQAACwAIAEAAAAqACAPAQAAwAYAIBYAAN4HACAXAADfBwAgGAAA3wYAIIkEAADcBwAwigQAADAAEIsEAADcBwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAN0HjwUisARAAL4GACGMBQEAzAYAIY0FCADMBwAhjwUBAMwGACEBAAAAMAAgBQEAAKEIACAWAACqDgAgFwAAnA4AIBgAAKANACCNBQAA-AcAIBABAADABgAgFgAA3gcAIBcAAN8HACAYAADfBgAgiQQAANwHADCKBAAAMAAQiwQAANwHADCMBAEAAAABkARAAL4GACGmBAEAzAYAIa4EAADdB48FIrAEQAC-BgAhjAUBAMwGACGNBQgAzAcAIY8FAQDMBgAhsQUAANsHACADAAAAMAAgAwAAMgAwBAAAMwAgAQAAADAAIAEAAAAnACADAAAAKgAgAwAAKwAwBAAALAAgAQAAACoAIAEAAAAjACABAAAAJwAgAQAAACoAIBMRAADABgAgFQAA3AYAIIkEAADaBwAwigQAADwAEIsEAADaBwAwjAQBAMwGACGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAzAYAIeMEAQDMBgAh5AQBAMwGACGLBQEAzAYAIZAFCADzBgAhkQUBAL8GACGSBUAAzwYAIZMFAQC_BgAhlAUBAL8GACGVBSAAzgYAIQYRAAChCAAgFQAAnQ0AIJEFAAD4BwAgkgUAAPgHACCTBQAA-AcAIJQFAAD4BwAgExEAAMAGACAVAADcBgAgiQQAANoHADCKBAAAPAAQiwQAANoHADCMBAEAAAABkARAAL4GACGwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAEAzAYAIeQEAQDMBgAhiwUBAMwGACGQBQgA8wYAIZEFAQC_BgAhkgVAAM8GACGTBQEAvwYAIZQFAQC_BgAhlQUgAM4GACEDAAAAPAAgAwAAPQAwBAAAPgAgAwAAADAAIAMAADIAMAQAADMAIAMAAAAnACADAAAoADAEAAABACADAAAAJwAgAwAAKAAwBAAAAQAgDRcAALQHACAgAADABgAgIQAAwAYAIIkEAADZBwAwigQAAEMAEIsEAADZBwAwjAQBAMwGACGQBEAAvgYAIe0EAgDRBgAh7gQBAL8GACHvBAEAzAYAIfAEAQDMBgAh8QQBAMwGACEEFwAAnA4AICAAAKEIACAhAAChCAAg7gQAAPgHACANFwAAtAcAICAAAMAGACAhAADABgAgiQQAANkHADCKBAAAQwAQiwQAANkHADCMBAEAAAABkARAAL4GACHtBAIA0QYAIe4EAQC_BgAh7wQBAMwGACHwBAEAzAYAIfEEAQAAAAEDAAAAQwAgAwAARAAwBAAARQAgAwAAAEMAIAMAAEQAMAQAAEUAIAMAAAAqACADAAArADAEAAAsACALAQAAwAYAIBEAAMAGACASAADfBgAgiQQAANgHADCKBAAASQAQiwQAANgHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIYsFAQDMBgAhAwEAAKEIACARAAChCAAgEgAAoA0AIAwBAADABgAgEQAAwAYAIBIAAN8GACCJBAAA2AcAMIoEAABJABCLBAAA2AcAMIwEAQAAAAGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACGLBQEAzAYAIbAFAADXBwAgAwAAAEkAIAMAAEoAMAQAAEsAIAMAAABJACADAABKADAEAABLACAOAQAAwAYAICgAAOIGACCJBAAA1gcAMIoEAABOABCLBAAA1gcAMIwEAQDMBgAhkARAAL4GACGiBAEAzAYAIaQEAQDMBgAhpQQCANEGACGmBAEAzAYAIbAEQAC-BgAh4QQBAMwGACH0BAIA0QYAIQIBAAChCAAgKAAAow0AIA4BAADABgAgKAAA4gYAIIkEAADWBwAwigQAAE4AEIsEAADWBwAwjAQBAAAAAZAEQAC-BgAhogQBAMwGACGkBAEAzAYAIaUEAgDRBgAhpgQBAMwGACGwBEAAvgYAIeEEAQDMBgAh9AQCANEGACEDAAAATgAgAwAATwAwBAAAUAAgCiAAAMAGACAnAADVBwAgiQQAANQHADCKBAAAUgAQiwQAANQHADCMBAEAzAYAIZAEQAC-BgAh7wQBAMwGACHyBAEAzAYAIfMEAQDMBgAhAiAAAKEIACAnAACpDgAgCiAAAMAGACAnAADVBwAgiQQAANQHADCKBAAAUgAQiwQAANQHADCMBAEAAAABkARAAL4GACHvBAEAzAYAIfIEAQDMBgAh8wQBAMwGACEDAAAAUgAgAwAAUwAwBAAAVAAgAQAAAFIAIAMAAABSACADAABTADAEAABUACAOAQAAwAYAICwAANMHACCJBAAA0gcAMIoEAABYABCLBAAA0gcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIagECADzBgAhqQQBAMwGACGuBAAAyAfNBCKwBEAAvgYAIcsEAQDMBgAhzQQBAL8GACEDAQAAoQgAICwAAKgOACDNBAAA-AcAIA4BAADABgAgLAAA0wcAIIkEAADSBwAwigQAAFgAEIsEAADSBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHLBAEAAAABzQQBAL8GACEDAAAAWAAgAwAAWQAwBAAAWgAgAQAAAFgAIBMuAADABgAgMgAA5QYAIIkEAADPBwAwigQAAF0AEIsEAADPBwAwjAQBAMwGACGQBEAAvgYAIa4EAADRB-cEIrAEQAC-BgAhygQBAMwGACHOBAgA8wYAIeAEAQDMBgAh4QQBAMwGACHjBAAA0AfjBCLkBAEAzAYAIeUECADzBgAh5wQgAM4GACHoBAEAvwYAIekEAACCBwAgAy4AAKEIACAyAACmDQAg6AQAAPgHACATLgAAwAYAIDIAAOUGACCJBAAAzwcAMIoEAABdABCLBAAAzwcAMIwEAQAAAAGQBEAAvgYAIa4EAADRB-cEIrAEQAC-BgAhygQBAMwGACHOBAgA8wYAIeAEAQDMBgAh4QQBAMwGACHjBAAA0AfjBCLkBAEAzAYAIeUECADzBgAh5wQgAM4GACHoBAEAvwYAIekEAACCBwAgAwAAAF0AIAMAAF4AMAQAAF8AIBYsAADOBwAgLgAAwAYAIC8AAM0HACAwAADABgAgiQQAAMoHADCKBAAAYQAQiwQAAMoHADCMBAEAzAYAIZAEQAC-BgAhrgQAAMsH1wQisARAAL4GACHKBAEAzAYAIc4ECADzBgAh1wRAAL4GACHYBEAAvgYAIdkECADzBgAh2gQBAL8GACHbBAEAvwYAIdwEAQC_BgAh3QQIAMwHACHeBAEAzAYAId8EAQDMBgAhCCwAAKYOACAuAAChCAAgLwAApw4AIDAAAKEIACDaBAAA-AcAINsEAAD4BwAg3AQAAPgHACDdBAAA-AcAIBYsAADOBwAgLgAAwAYAIC8AAM0HACAwAADABgAgiQQAAMoHADCKBAAAYQAQiwQAAMoHADCMBAEAAAABkARAAL4GACGuBAAAywfXBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHXBEAAvgYAIdgEQAC-BgAh2QQIAPMGACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACHdBAgAzAcAId4EAQDMBgAh3wQBAMwGACEDAAAAYQAgAwAAYgAwBAAAYwAgFCsAAPcGACAxAAD2BgAgiQQAAPIGADCKBAAAZQAQiwQAAPIGADCMBAEAzAYAIZAEQAC-BgAhqAQIAPMGACGpBAEAzAYAIasEAAD1BqsEIq4EAAD0BtAEIq8EAQC_BgAhsARAAL4GACHOBAgA8wYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIdMEQADPBgAh1AQIAPMGACHVBAEAzAYAIQEAAABlACAOLAAAyQcAIC4AAMAGACCJBAAAxwcAMIoEAABnABCLBAAAxwcAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHKBAEAzAYAIcsEAQDMBgAhzQQBAL8GACEBAAAAZwAgAQAAAGEAIAMAAABhACADAABiADAEAABjACADAAAAYQAgAwAAYgAwBAAAYwAgAywAAKYOACAuAAChCAAgzQQAAPgHACAOLAAAyQcAIC4AAMAGACCJBAAAxwcAMIoEAABnABCLBAAAxwcAMIwEAQAAAAGQBEAAvgYAIagECADzBgAhqQQBAMwGACGuBAAAyAfNBCKwBEAAvgYAIcoEAQDMBgAhywQBAAAAAc0EAQC_BgAhAwAAAGcAIAMAAGwAMAQAAG0AIBA3AADABgAgOwAAxgcAIDwAAOgGACCJBAAAwwcAMIoEAABvABCLBAAAwwcAMIwEAQDMBgAhkARAAL4GACGuBAAAxQekBSKwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAAAxAeiBSKgBQEAzAYAIaIFAQC_BgAhpAUBAMwGACEENwAAoQgAIDsAAKUOACA8AACpDQAgogUAAPgHACAQNwAAwAYAIDsAAMYHACA8AADoBgAgiQQAAMMHADCKBAAAbwAQiwQAAMMHADCMBAEAAAABkARAAL4GACGuBAAAxQekBSKwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAAAxAeiBSKgBQEAAAABogUBAL8GACGkBQEAzAYAIQMAAABvACADAABwADAEAABxACAPOAAAvAcAIDoAAOkGACCJBAAAwQcAMIoEAABzABCLBAAAwQcAMIwEAQDMBgAhkARAAL4GACGwBEAAvgYAIeAEAQDMBgAh4QQBAL8GACGbBQEAzAYAIZwFAgDRBgAhnQUBAL8GACGeBQEAvwYAIZ8FAgDCBwAhBjgAAKMOACA6AACqDQAg4QQAAPgHACCdBQAA-AcAIJ4FAAD4BwAgnwUAAPgHACAQOAAAvAcAIDoAAOkGACCJBAAAwQcAMIoEAABzABCLBAAAwQcAMIwEAQAAAAGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAvwYAIZsFAQDMBgAhnAUCANEGACGdBQEAvwYAIZ4FAQC_BgAhnwUCAMIHACGvBQAAwAcAIAMAAABzACADAAB0ADAEAAB1ACALBgAAwAYAIDkAAL8HACCJBAAAvgcAMIoEAAB3ABCLBAAAvgcAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmAVAAM8GACGZBQEAzAYAIQMGAAChCAAgOQAApA4AIJgFAAD4BwAgDAYAAMAGACA5AAC_BwAgiQQAAL4HADCKBAAAdwAQiwQAAL4HADCMBAEAAAABkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmAVAAM8GACGZBQEAzAYAIa4FAAC9BwAgAwAAAHcAIAMAAHgAMAQAAHkAIAEAAAB3ACALBgAAwAYAIDgAALwHACCJBAAAuwcAMIoEAAB8ABCLBAAAuwcAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmgUBAL8GACGbBQEAzAYAIQMGAAChCAAgOAAAow4AIJoFAAD4BwAgDAYAAMAGACA4AAC8BwAgiQQAALsHADCKBAAAfAAQiwQAALsHADCMBAEAAAABkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmgUBAL8GACGbBQEAzAYAIa0FAAC6BwAgAwAAAHwAIAMAAH0AMAQAAH4AIAEAAABzACABAAAAfAAgAwAAAHwAIAMAAH0AMAQAAH4AIAMAAAB3ACADAAB4ADAEAAB5ACABAAAABQAgAQAAAAkAIAEAAAANACABAAAAEQAgAQAAABUAIAEAAAAZACABAAAAHwAgAQAAACMAIAEAAAA8ACABAAAAMAAgAQAAACcAIAEAAAAnACABAAAAQwAgAQAAAEMAIAEAAAAqACABAAAASQAgAQAAAEkAIAEAAABOACABAAAAUgAgAQAAAFgAIAEAAABdACABAAAAYQAgAQAAAGEAIAEAAABnACABAAAAbwAgAQAAAHwAIAEAAAB3ACABAAAAIwAgAQAAADAAIBEXAAC0BwAgKwAAtQcAIIkEAACyBwAwigQAAKEBABCLBAAAsgcAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAALMHpgUirwQBAL8GACGwBEAAvgYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIfEEAQDMBgAhAQAAAKEBACABAAAAQwAgAQAAAAEAIAMAAAAnACADAAAoADAEAAABACADAAAAJwAgAwAAKAAwBAAAAQAgAwAAACcAIAMAACgAMAQAAAEAIBcBAACwCwAgEQAAoQsAIBkAAKMLACAaAACiCwAgLAAApAsAIEAAAKULACCMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAEBRgAAqAEAIBGMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAEBRgAAqgEAMAFGAACqAQAwAQAAACMAIAEAAAAwACAXAQAArgsAIBEAAIcLACAZAACJCwAgGgAAiAsAICwAAIoLACBAAACLCwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhrgQAAIULpwUisARAAP0HACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACGJBQEAnggAIYoFAQCeCAAhiwUBAPwHACGnBUAA_gcAIagFAQCeCAAhqQUBAJ4IACGqBQgAswkAIasFAQCeCAAhrAUBAJ4IACECAAAAAQAgRgAArwEAIBGMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAhQunBSKwBEAA_QcAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAIYkFAQCeCAAhigUBAJ4IACGLBQEA_AcAIacFQAD-BwAhqAUBAJ4IACGpBQEAnggAIaoFCACzCQAhqwUBAJ4IACGsBQEAnggAIQIAAAAnACBGAACxAQAgAgAAACcAIEYAALEBACABAAAAIwAgAQAAADAAIAMAAAABACBNAACoAQAgTgAArwEAIAEAAAABACABAAAAJwAgEAwAAJ4OACBTAACfDgAgVAAAog4AIFUAAKEOACBWAACgDgAg2gQAAPgHACDbBAAA-AcAINwEAAD4BwAgiQUAAPgHACCKBQAA-AcAIKcFAAD4BwAgqAUAAPgHACCpBQAA-AcAIKoFAAD4BwAgqwUAAPgHACCsBQAA-AcAIBSJBAAAtgcAMIoEAAC6AQAQiwQAALYHADCMBAEAnQYAIZAEQACeBgAhpgQBAJ0GACGuBAAAtwenBSKwBEAAngYAIdoEAQC6BgAh2wQBALoGACHcBAEAugYAIYkFAQC6BgAhigUBALoGACGLBQEAnQYAIacFQACfBgAhqAUBALoGACGpBQEAugYAIaoFCAD6BgAhqwUBALoGACGsBQEAugYAIQMAAAAnACADAAC5AQAwUgAAugEAIAMAAAAnACADAAAoADAEAAABACARFwAAtAcAICsAALUHACCJBAAAsgcAMIoEAAChAQAQiwQAALIHADCMBAEAAAABkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAALMHpgUirwQBAL8GACGwBEAAvgYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIfEEAQAAAAEBAAAAvQEAIAEAAAC9AQAgBhcAAJwOACArAACdDgAgrwQAAPgHACDQBAAA-AcAINEEAAD4BwAg0gQAAPgHACADAAAAoQEAIAMAAMABADAEAAC9AQAgAwAAAKEBACADAADAAQAwBAAAvQEAIAMAAAChAQAgAwAAwAEAMAQAAL0BACAOFwAAmw4AICsAAJ8LACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABqwQAAACrBAKuBAAAAKYFAq8EAQAAAAGwBEAAAAAB0ARAAAAAAdEEQAAAAAHSBEAAAAAB8QQBAAAAAQFGAADEAQAgDIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGrBAAAAKsEAq4EAAAApgUCrwQBAAAAAbAEQAAAAAHQBEAAAAAB0QRAAAAAAdIEQAAAAAHxBAEAAAABAUYAAMYBADABRgAAxgEAMA4XAACaDgAgKwAAlwsAIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirgQAAJYLpgUirwQBAJ4IACGwBEAA_QcAIdAEQAD-BwAh0QRAAP4HACHSBEAA_gcAIfEEAQD8BwAhAgAAAL0BACBGAADJAQAgDIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirgQAAJYLpgUirwQBAJ4IACGwBEAA_QcAIdAEQAD-BwAh0QRAAP4HACHSBEAA_gcAIfEEAQD8BwAhAgAAAKEBACBGAADLAQAgAgAAAKEBACBGAADLAQAgAwAAAL0BACBNAADEAQAgTgAAyQEAIAEAAAC9AQAgAQAAAKEBACAJDAAAlQ4AIFMAAJYOACBUAACZDgAgVQAAmA4AIFYAAJcOACCvBAAA-AcAINAEAAD4BwAg0QQAAPgHACDSBAAA-AcAIA-JBAAArgcAMIoEAADSAQAQiwQAAK4HADCMBAEAnQYAIZAEQACeBgAhqAQIALEGACGpBAEAnQYAIasEAACyBqsEIq4EAACvB6YFIq8EAQC6BgAhsARAAJ4GACHQBEAAnwYAIdEEQACfBgAh0gRAAJ8GACHxBAEAnQYAIQMAAAChAQAgAwAA0QEAMFIAANIBACADAAAAoQEAIAMAAMABADAEAAC9AQAgAQAAAFoAIAEAAABaACADAAAAWAAgAwAAWQAwBAAAWgAgAwAAAFgAIAMAAFkAMAQAAFoAIAMAAABYACADAABZADAEAABaACALAQAAngsAICwAAP4JACCMBAEAAAABkARAAAAAAaYEAQAAAAGoBAgAAAABqQQBAAAAAa4EAAAAzQQCsARAAAAAAcsEAQAAAAHNBAEAAAABAUYAANoBACAJjAQBAAAAAZAEQAAAAAGmBAEAAAABqAQIAAAAAakEAQAAAAGuBAAAAM0EArAEQAAAAAHLBAEAAAABzQQBAAAAAQFGAADcAQAwAUYAANwBADALAQAAnQsAICwAAPwJACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHLBAEA_AcAIc0EAQCeCAAhAgAAAFoAIEYAAN8BACAJjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhqAQIAJYIACGpBAEA_AcAIa4EAACjCc0EIrAEQAD9BwAhywQBAPwHACHNBAEAnggAIQIAAABYACBGAADhAQAgAgAAAFgAIEYAAOEBACADAAAAWgAgTQAA2gEAIE4AAN8BACABAAAAWgAgAQAAAFgAIAYMAACQDgAgUwAAkQ4AIFQAAJQOACBVAACTDgAgVgAAkg4AIM0EAAD4BwAgDIkEAACtBwAwigQAAOgBABCLBAAArQcAMIwEAQCdBgAhkARAAJ4GACGmBAEAnQYAIagECACxBgAhqQQBAJ0GACGuBAAA6wbNBCKwBEAAngYAIcsEAQCdBgAhzQQBALoGACEDAAAAWAAgAwAA5wEAMFIAAOgBACADAAAAWAAgAwAAWQAwBAAAWgAgAQAAAHEAIAEAAABxACADAAAAbwAgAwAAcAAwBAAAcQAgAwAAAG8AIAMAAHAAMAQAAHEAIAMAAABvACADAABwADAEAABxACANNwAAjw4AIDsAAJcJACA8AACYCQAgjAQBAAAAAZAEQAAAAAGuBAAAAKQFArAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAAogUCoAUBAAAAAaIFAQAAAAGkBQEAAAABAUYAAPABACAKjAQBAAAAAZAEQAAAAAGuBAAAAKQFArAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAAogUCoAUBAAAAAaIFAQAAAAGkBQEAAAABAUYAAPIBADABRgAA8gEAMA03AACODgAgOwAA7wgAIDwAAPAIACCMBAEA_AcAIZAEQAD9BwAhrgQAAO0IpAUisARAAP0HACHgBAEA_AcAIeEEAQD8BwAh4wQAAOwIogUioAUBAPwHACGiBQEAnggAIaQFAQD8BwAhAgAAAHEAIEYAAPUBACAKjAQBAPwHACGQBEAA_QcAIa4EAADtCKQFIrAEQAD9BwAh4AQBAPwHACHhBAEA_AcAIeMEAADsCKIFIqAFAQD8BwAhogUBAJ4IACGkBQEA_AcAIQIAAABvACBGAAD3AQAgAgAAAG8AIEYAAPcBACADAAAAcQAgTQAA8AEAIE4AAPUBACABAAAAcQAgAQAAAG8AIAQMAACLDgAgVQAAjQ4AIFYAAIwOACCiBQAA-AcAIA2JBAAApgcAMIoEAAD-AQAQiwQAAKYHADCMBAEAnQYAIZAEQACeBgAhrgQAAKgHpAUisARAAJ4GACHgBAEAnQYAIeEEAQCdBgAh4wQAAKcHogUioAUBAJ0GACGiBQEAugYAIaQFAQCdBgAhAwAAAG8AIAMAAP0BADBSAAD-AQAgAwAAAG8AIAMAAHAAMAQAAHEAIAEAAAB1ACABAAAAdQAgAwAAAHMAIAMAAHQAMAQAAHUAIAMAAABzACADAAB0ADAEAAB1ACADAAAAcwAgAwAAdAAwBAAAdQAgDDgAAIoOACA6AACVCQAgjAQBAAAAAZAEQAAAAAGwBEAAAAAB4AQBAAAAAeEEAQAAAAGbBQEAAAABnAUCAAAAAZ0FAQAAAAGeBQEAAAABnwUCAAAAAQFGAACGAgAgCowEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAABmwUBAAAAAZwFAgAAAAGdBQEAAAABngUBAAAAAZ8FAgAAAAEBRgAAiAIAMAFGAACIAgAwDDgAAIkOACA6AACICQAgjAQBAPwHACGQBEAA_QcAIbAEQAD9BwAh4AQBAPwHACHhBAEAnggAIZsFAQD8BwAhnAUCAIYIACGdBQEAnggAIZ4FAQCeCAAhnwUCAIYJACECAAAAdQAgRgAAiwIAIAqMBAEA_AcAIZAEQAD9BwAhsARAAP0HACHgBAEA_AcAIeEEAQCeCAAhmwUBAPwHACGcBQIAhggAIZ0FAQCeCAAhngUBAJ4IACGfBQIAhgkAIQIAAABzACBGAACNAgAgAgAAAHMAIEYAAI0CACADAAAAdQAgTQAAhgIAIE4AAIsCACABAAAAdQAgAQAAAHMAIAkMAACEDgAgUwAAhQ4AIFQAAIgOACBVAACHDgAgVgAAhg4AIOEEAAD4BwAgnQUAAPgHACCeBQAA-AcAIJ8FAAD4BwAgDYkEAACjBwAwigQAAJQCABCLBAAAowcAMIwEAQCdBgAhkARAAJ4GACGwBEAAngYAIeAEAQCdBgAh4QQBALoGACGbBQEAnQYAIZwFAgCpBgAhnQUBALoGACGeBQEAugYAIZ8FAgCkBwAhAwAAAHMAIAMAAJMCADBSAACUAgAgAwAAAHMAIAMAAHQAMAQAAHUAIAEAAAB-ACABAAAAfgAgAwAAAHwAIAMAAH0AMAQAAH4AIAMAAAB8ACADAAB9ADAEAAB-ACADAAAAfAAgAwAAfQAwBAAAfgAgCAYAAPsIACA4AADhCAAgjAQBAAAAAZAEQAAAAAGRBAEAAAABsARAAAAAAZoFAQAAAAGbBQEAAAABAUYAAJwCACAGjAQBAAAAAZAEQAAAAAGRBAEAAAABsARAAAAAAZoFAQAAAAGbBQEAAAABAUYAAJ4CADABRgAAngIAMAgGAAD5CAAgOAAA3wgAIIwEAQD8BwAhkARAAP0HACGRBAEA_AcAIbAEQAD9BwAhmgUBAJ4IACGbBQEA_AcAIQIAAAB-ACBGAAChAgAgBowEAQD8BwAhkARAAP0HACGRBAEA_AcAIbAEQAD9BwAhmgUBAJ4IACGbBQEA_AcAIQIAAAB8ACBGAACjAgAgAgAAAHwAIEYAAKMCACADAAAAfgAgTQAAnAIAIE4AAKECACABAAAAfgAgAQAAAHwAIAQMAACBDgAgVQAAgw4AIFYAAIIOACCaBQAA-AcAIAmJBAAAogcAMIoEAACqAgAQiwQAAKIHADCMBAEAnQYAIZAEQACeBgAhkQQBAJ0GACGwBEAAngYAIZoFAQC6BgAhmwUBAJ0GACEDAAAAfAAgAwAAqQIAMFIAAKoCACADAAAAfAAgAwAAfQAwBAAAfgAgAQAAAHkAIAEAAAB5ACADAAAAdwAgAwAAeAAwBAAAeQAgAwAAAHcAIAMAAHgAMAQAAHkAIAMAAAB3ACADAAB4ADAEAAB5ACAIBgAAkwkAIDkAANMIACCMBAEAAAABkARAAAAAAZEEAQAAAAGwBEAAAAABmAVAAAAAAZkFAQAAAAEBRgAAsgIAIAaMBAEAAAABkARAAAAAAZEEAQAAAAGwBEAAAAABmAVAAAAAAZkFAQAAAAEBRgAAtAIAMAFGAAC0AgAwCAYAAJEJACA5AADRCAAgjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAhsARAAP0HACGYBUAA_gcAIZkFAQD8BwAhAgAAAHkAIEYAALcCACAGjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAhsARAAP0HACGYBUAA_gcAIZkFAQD8BwAhAgAAAHcAIEYAALkCACACAAAAdwAgRgAAuQIAIAMAAAB5ACBNAACyAgAgTgAAtwIAIAEAAAB5ACABAAAAdwAgBAwAAP4NACBVAACADgAgVgAA_w0AIJgFAAD4BwAgCYkEAAChBwAwigQAAMACABCLBAAAoQcAMIwEAQCdBgAhkARAAJ4GACGRBAEAnQYAIbAEQACeBgAhmAVAAJ8GACGZBQEAnQYAIQMAAAB3ACADAAC_AgAwUgAAwAIAIAMAAAB3ACADAAB4ADAEAAB5ACABAAAAJQAgAQAAACUAIAMAAAAjACADAAAkADAEAAAlACADAAAAIwAgAwAAJAAwBAAAJQAgAwAAACMAIAMAACQAMAQAACUAIBABAAD9DQAgEAAAiwwAIBgAAIwMACCMBAEAAAABkARAAAAAAaYEAQAAAAGwBEAAAAABwQQgAAAAAcIEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAQAAAAHkBAEAAAABkQUBAAAAAZYFCAAAAAGXBSAAAAABAUYAAMgCACANjAQBAAAAAZAEQAAAAAGmBAEAAAABsARAAAAAAcEEIAAAAAHCBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAEAAAAB5AQBAAAAAZEFAQAAAAGWBQgAAAABlwUgAAAAAQFGAADKAgAwAUYAAMoCADAQAQAA_A0AIBAAAPYLACAYAAD3CwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhsARAAP0HACHBBCAAqAgAIcIEQAD-BwAh4AQBAPwHACHhBAEA_AcAIeMEAQD8BwAh5AQBAPwHACGRBQEAnggAIZYFCACWCAAhlwUgAKgIACECAAAAJQAgRgAAzQIAIA2MBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIcEEIACoCAAhwgRAAP4HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZEFAQCeCAAhlgUIAJYIACGXBSAAqAgAIQIAAAAjACBGAADPAgAgAgAAACMAIEYAAM8CACADAAAAJQAgTQAAyAIAIE4AAM0CACABAAAAJQAgAQAAACMAIAcMAAD3DQAgUwAA-A0AIFQAAPsNACBVAAD6DQAgVgAA-Q0AIMIEAAD4BwAgkQUAAPgHACAQiQQAAKAHADCKBAAA1gIAEIsEAACgBwAwjAQBAJ0GACGQBEAAngYAIaYEAQCdBgAhsARAAJ4GACHBBCAAwwYAIcIEQACfBgAh4AQBAJ0GACHhBAEAnQYAIeMEAQCdBgAh5AQBAJ0GACGRBQEAugYAIZYFCACxBgAhlwUgAMMGACEDAAAAIwAgAwAA1QIAMFIAANYCACADAAAAIwAgAwAAJAAwBAAAJQAgAQAAAD4AIAEAAAA-ACADAAAAPAAgAwAAPQAwBAAAPgAgAwAAADwAIAMAAD0AMAQAAD4AIAMAAAA8ACADAAA9ADAEAAA-ACAQEQAA9g0AIBUAAOoLACCMBAEAAAABkARAAAAAAbAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAQAAAAHkBAEAAAABiwUBAAAAAZAFCAAAAAGRBQEAAAABkgVAAAAAAZMFAQAAAAGUBQEAAAABlQUgAAAAAQFGAADeAgAgDowEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAAB4wQBAAAAAeQEAQAAAAGLBQEAAAABkAUIAAAAAZEFAQAAAAGSBUAAAAABkwUBAAAAAZQFAQAAAAGVBSAAAAABAUYAAOACADABRgAA4AIAMBARAAD1DQAgFQAA3QsAIIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIeAEAQD8BwAh4QQBAPwHACHjBAEA_AcAIeQEAQD8BwAhiwUBAPwHACGQBQgAlggAIZEFAQCeCAAhkgVAAP4HACGTBQEAnggAIZQFAQCeCAAhlQUgAKgIACECAAAAPgAgRgAA4wIAIA6MBAEA_AcAIZAEQAD9BwAhsARAAP0HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIYsFAQD8BwAhkAUIAJYIACGRBQEAnggAIZIFQAD-BwAhkwUBAJ4IACGUBQEAnggAIZUFIACoCAAhAgAAADwAIEYAAOUCACACAAAAPAAgRgAA5QIAIAMAAAA-ACBNAADeAgAgTgAA4wIAIAEAAAA-ACABAAAAPAAgCQwAAPANACBTAADxDQAgVAAA9A0AIFUAAPMNACBWAADyDQAgkQUAAPgHACCSBQAA-AcAIJMFAAD4BwAglAUAAPgHACARiQQAAJ8HADCKBAAA7AIAEIsEAACfBwAwjAQBAJ0GACGQBEAAngYAIbAEQACeBgAh4AQBAJ0GACHhBAEAnQYAIeMEAQCdBgAh5AQBAJ0GACGLBQEAnQYAIZAFCACxBgAhkQUBALoGACGSBUAAnwYAIZMFAQC6BgAhlAUBALoGACGVBSAAwwYAIQMAAAA8ACADAADrAgAwUgAA7AIAIAMAAAA8ACADAAA9ADAEAAA-ACABAAAAMwAgAQAAADMAIAMAAAAwACADAAAyADAEAAAzACADAAAAMAAgAwAAMgAwBAAAMwAgAwAAADAAIAMAADIAMAQAADMAIAwBAADoCwAgFgAAzwsAIBcAANALACAYAADRCwAgjAQBAAAAAZAEQAAAAAGmBAEAAAABrgQAAACPBQKwBEAAAAABjAUBAAAAAY0FCAAAAAGPBQEAAAABAUYAAPQCACAIjAQBAAAAAZAEQAAAAAGmBAEAAAABrgQAAACPBQKwBEAAAAABjAUBAAAAAY0FCAAAAAGPBQEAAAABAUYAAPYCADABRgAA9gIAMAwBAADmCwAgFgAAvQsAIBcAAL4LACAYAAC_CwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhrgQAALsLjwUisARAAP0HACGMBQEA_AcAIY0FCACzCQAhjwUBAPwHACECAAAAMwAgRgAA-QIAIAiMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQIAAAAwACBGAAD7AgAgAgAAADAAIEYAAPsCACADAAAAMwAgTQAA9AIAIE4AAPkCACABAAAAMwAgAQAAADAAIAYMAADrDQAgUwAA7A0AIFQAAO8NACBVAADuDQAgVgAA7Q0AII0FAAD4BwAgC4kEAACbBwAwigQAAIIDABCLBAAAmwcAMIwEAQCdBgAhkARAAJ4GACGmBAEAnQYAIa4EAACcB48FIrAEQACeBgAhjAUBAJ0GACGNBQgA-gYAIY8FAQCdBgAhAwAAADAAIAMAAIEDADBSAACCAwAgAwAAADAAIAMAADIAMAQAADMAIAEAAABLACABAAAASwAgAwAAAEkAIAMAAEoAMAQAAEsAIAMAAABJACADAABKADAEAABLACADAAAASQAgAwAASgAwBAAASwAgCAEAANQKACARAADICgAgEgAAyQoAIIwEAQAAAAGQBEAAAAABpgQBAAAAAbAEQAAAAAGLBQEAAAABAUYAAIoDACAFjAQBAAAAAZAEQAAAAAGmBAEAAAABsARAAAAAAYsFAQAAAAEBRgAAjAMAMAFGAACMAwAwCAEAANIKACARAACxCgAgEgAAsgoAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhiwUBAPwHACECAAAASwAgRgAAjwMAIAWMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIYsFAQD8BwAhAgAAAEkAIEYAAJEDACACAAAASQAgRgAAkQMAIAMAAABLACBNAACKAwAgTgAAjwMAIAEAAABLACABAAAASQAgAwwAAOgNACBVAADqDQAgVgAA6Q0AIAiJBAAAmgcAMIoEAACYAwAQiwQAAJoHADCMBAEAnQYAIZAEQACeBgAhpgQBAJ0GACGwBEAAngYAIYsFAQCdBgAhAwAAAEkAIAMAAJcDADBSAACYAwAgAwAAAEkAIAMAAEoAMAQAAEsAIAEAAAAsACABAAAALAAgAwAAACoAIAMAACsAMAQAACwAIAMAAAAqACADAAArADAEAAAsACADAAAAKgAgAwAAKwAwBAAALAAgDxMAAN8KACAUAADECgAgGQAAxQoAIBoAAMYKACCMBAEAAAABkARAAAAAAfMEAQAAAAGCBQAAAIIFAoMFCAAAAAGFBQAAAIUFA4YFQAAAAAGHBQEAAAABiAUBAAAAAYkFAQAAAAGKBQEAAAABAUYAAKADACALjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABhwUBAAAAAYgFAQAAAAGJBQEAAAABigUBAAAAAQFGAACiAwAwAUYAAKIDADABAAAAMAAgAQAAACMAIA8TAADdCgAgFAAAwAoAIBkAAMEKACAaAADCCgAgjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYcFAQD8BwAhiAUBAPwHACGJBQEAnggAIYoFAQCeCAAhAgAAACwAIEYAAKcDACALjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYcFAQD8BwAhiAUBAPwHACGJBQEAnggAIYoFAQCeCAAhAgAAACoAIEYAAKkDACACAAAAKgAgRgAAqQMAIAEAAAAwACABAAAAIwAgAwAAACwAIE0AAKADACBOAACnAwAgAQAAACwAIAEAAAAqACAKDAAA4w0AIFMAAOQNACBUAADnDQAgVQAA5g0AIFYAAOUNACCDBQAA-AcAIIUFAAD4BwAghgUAAPgHACCJBQAA-AcAIIoFAAD4BwAgDokEAACTBwAwigQAALIDABCLBAAAkwcAMIwEAQCdBgAhkARAAJ4GACHzBAEAnQYAIYIFAACUB4IFIoMFCAD6BgAhhQUAAJUHhQUjhgVAAJ8GACGHBQEAnQYAIYgFAQCdBgAhiQUBALoGACGKBQEAugYAIQMAAAAqACADAACxAwAwUgAAsgMAIAMAAAAqACADAAArADAEAAAsACABAAAAFwAgAQAAABcAIAMAAAAVACADAAAWADAEAAAXACADAAAAFQAgAwAAFgAwBAAAFwAgAwAAABUAIAMAABYAMAQAABcAIAoGAADiDQAgCwAAwQwAIIwEAQAAAAGQBEAAAAABkQQBAAAAAaAEAQAAAAHgBAEAAAAB8wQBAAAAAf8EAQAAAAGABSAAAAABAUYAALoDACAIjAQBAAAAAZAEQAAAAAGRBAEAAAABoAQBAAAAAeAEAQAAAAHzBAEAAAAB_wQBAAAAAYAFIAAAAAEBRgAAvAMAMAFGAAC8AwAwCgYAAOENACALAAC0DAAgjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAhoAQBAPwHACHgBAEA_AcAIfMEAQD8BwAh_wQBAJ4IACGABSAAqAgAIQIAAAAXACBGAAC_AwAgCIwEAQD8BwAhkARAAP0HACGRBAEA_AcAIaAEAQD8BwAh4AQBAPwHACHzBAEA_AcAIf8EAQCeCAAhgAUgAKgIACECAAAAFQAgRgAAwQMAIAIAAAAVACBGAADBAwAgAwAAABcAIE0AALoDACBOAAC_AwAgAQAAABcAIAEAAAAVACAEDAAA3g0AIFUAAOANACBWAADfDQAg_wQAAPgHACALiQQAAJIHADCKBAAAyAMAEIsEAACSBwAwjAQBAJ0GACGQBEAAngYAIZEEAQCdBgAhoAQBAJ0GACHgBAEAnQYAIfMEAQCdBgAh_wQBALoGACGABSAAwwYAIQMAAAAVACADAADHAwAwUgAAyAMAIAMAAAAVACADAAAWADAEAAAXACABAAAAIQAgAQAAACEAIAMAAAAfACADAAAgADAEAAAhACADAAAAHwAgAwAAIAAwBAAAIQAgAwAAAB8AIAMAACAAMAQAACEAIAcGAADdDQAgjAQBAAAAAZAEQAAAAAGRBAEAAAAB_AQBAAAAAf0EAQAAAAH-BAEAAAABAUYAANADACAGjAQBAAAAAZAEQAAAAAGRBAEAAAAB_AQBAAAAAf0EAQAAAAH-BAEAAAABAUYAANIDADABRgAA0gMAMAcGAADcDQAgjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAh_AQBAPwHACH9BAEA_AcAIf4EAQD8BwAhAgAAACEAIEYAANUDACAGjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAh_AQBAPwHACH9BAEA_AcAIf4EAQD8BwAhAgAAAB8AIEYAANcDACACAAAAHwAgRgAA1wMAIAMAAAAhACBNAADQAwAgTgAA1QMAIAEAAAAhACABAAAAHwAgAwwAANkNACBVAADbDQAgVgAA2g0AIAmJBAAAkQcAMIoEAADeAwAQiwQAAJEHADCMBAEAnQYAIZAEQACeBgAhkQQBAJ0GACH8BAEAnQYAIf0EAQCdBgAh_gQBAJ0GACEDAAAAHwAgAwAA3QMAMFIAAN4DACADAAAAHwAgAwAAIAAwBAAAIQAgAQAAABsAIAEAAAAbACADAAAAGQAgAwAAGgAwBAAAGwAgAwAAABkAIAMAABoAMAQAABsAIAMAAAAZACADAAAaADAEAAAbACAMBgAAvwwAIAoAAKgMACCMBAEAAAABkARAAAAAAZEEAQAAAAGuBAAAAPkEArAEQAAAAAH1BAEAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEBRgAA5gMAIAqMBAEAAAABkARAAAAAAZEEAQAAAAGuBAAAAPkEArAEQAAAAAH1BAEAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEBRgAA6AMAMAFGAADoAwAwDAYAAL0MACAKAACmDAAgjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAhrgQAAKQM-QQisARAAP0HACH1BAEA_AcAIfcEAACjDPcEIvkEAgCGCAAh-gRAAP0HACH7BAEAnggAIQIAAAAbACBGAADrAwAgCowEAQD8BwAhkARAAP0HACGRBAEA_AcAIa4EAACkDPkEIrAEQAD9BwAh9QQBAPwHACH3BAAAowz3BCL5BAIAhggAIfoEQAD9BwAh-wQBAJ4IACECAAAAGQAgRgAA7QMAIAIAAAAZACBGAADtAwAgAwAAABsAIE0AAOYDACBOAADrAwAgAQAAABsAIAEAAAAZACAGDAAA1A0AIFMAANUNACBUAADYDQAgVQAA1w0AIFYAANYNACD7BAAA-AcAIA2JBAAAigcAMIoEAAD0AwAQiwQAAIoHADCMBAEAnQYAIZAEQACeBgAhkQQBAJ0GACGuBAAAjAf5BCKwBEAAngYAIfUEAQCdBgAh9wQAAIsH9wQi-QQCAKkGACH6BEAAngYAIfsEAQC6BgAhAwAAABkAIAMAAPMDADBSAAD0AwAgAwAAABkAIAMAABoAMAQAABsAIAEAAABQACABAAAAUAAgAwAAAE4AIAMAAE8AMAQAAFAAIAMAAABOACADAABPADAEAABQACADAAAATgAgAwAATwAwBAAAUAAgCwEAANMNACAoAAClCgAgjAQBAAAAAZAEQAAAAAGiBAEAAAABpAQBAAAAAaUEAgAAAAGmBAEAAAABsARAAAAAAeEEAQAAAAH0BAIAAAABAUYAAPwDACAJjAQBAAAAAZAEQAAAAAGiBAEAAAABpAQBAAAAAaUEAgAAAAGmBAEAAAABsARAAAAAAeEEAQAAAAH0BAIAAAABAUYAAP4DADABRgAA_gMAMAsBAADSDQAgKAAAmAoAIIwEAQD8BwAhkARAAP0HACGiBAEA_AcAIaQEAQD8BwAhpQQCAIYIACGmBAEA_AcAIbAEQAD9BwAh4QQBAPwHACH0BAIAhggAIQIAAABQACBGAACBBAAgCYwEAQD8BwAhkARAAP0HACGiBAEA_AcAIaQEAQD8BwAhpQQCAIYIACGmBAEA_AcAIbAEQAD9BwAh4QQBAPwHACH0BAIAhggAIQIAAABOACBGAACDBAAgAgAAAE4AIEYAAIMEACADAAAAUAAgTQAA_AMAIE4AAIEEACABAAAAUAAgAQAAAE4AIAUMAADNDQAgUwAAzg0AIFQAANENACBVAADQDQAgVgAAzw0AIAyJBAAAiQcAMIoEAACKBAAQiwQAAIkHADCMBAEAnQYAIZAEQACeBgAhogQBAJ0GACGkBAEAnQYAIaUEAgCpBgAhpgQBAJ0GACGwBEAAngYAIeEEAQCdBgAh9AQCAKkGACEDAAAATgAgAwAAiQQAMFIAAIoEACADAAAATgAgAwAATwAwBAAAUAAgAQAAAFQAIAEAAABUACADAAAAUgAgAwAAUwAwBAAAVAAgAwAAAFIAIAMAAFMAMAQAAFQAIAMAAABSACADAABTADAEAABUACAHIAAAowoAICcAAIwKACCMBAEAAAABkARAAAAAAe8EAQAAAAHyBAEAAAAB8wQBAAAAAQFGAACSBAAgBYwEAQAAAAGQBEAAAAAB7wQBAAAAAfIEAQAAAAHzBAEAAAABAUYAAJQEADABRgAAlAQAMAcgAAChCgAgJwAAigoAIIwEAQD8BwAhkARAAP0HACHvBAEA_AcAIfIEAQD8BwAh8wQBAPwHACECAAAAVAAgRgAAlwQAIAWMBAEA_AcAIZAEQAD9BwAh7wQBAPwHACHyBAEA_AcAIfMEAQD8BwAhAgAAAFIAIEYAAJkEACACAAAAUgAgRgAAmQQAIAMAAABUACBNAACSBAAgTgAAlwQAIAEAAABUACABAAAAUgAgAwwAAMoNACBVAADMDQAgVgAAyw0AIAiJBAAAiAcAMIoEAACgBAAQiwQAAIgHADCMBAEAnQYAIZAEQACeBgAh7wQBAJ0GACHyBAEAnQYAIfMEAQCdBgAhAwAAAFIAIAMAAJ8EADBSAACgBAAgAwAAAFIAIAMAAFMAMAQAAFQAIAEAAABFACABAAAARQAgAwAAAEMAIAMAAEQAMAQAAEUAIAMAAABDACADAABEADAEAABFACADAAAAQwAgAwAARAAwBAAARQAgChcAAO8KACAgAADuCgAgIQAA-goAIIwEAQAAAAGQBEAAAAAB7QQCAAAAAe4EAQAAAAHvBAEAAAAB8AQBAAAAAfEEAQAAAAEBRgAAqAQAIAeMBAEAAAABkARAAAAAAe0EAgAAAAHuBAEAAAAB7wQBAAAAAfAEAQAAAAHxBAEAAAABAUYAAKoEADABRgAAqgQAMAoXAADsCgAgIAAA6woAICEAAPgKACCMBAEA_AcAIZAEQAD9BwAh7QQCAIYIACHuBAEAnggAIe8EAQD8BwAh8AQBAPwHACHxBAEA_AcAIQIAAABFACBGAACtBAAgB4wEAQD8BwAhkARAAP0HACHtBAIAhggAIe4EAQCeCAAh7wQBAPwHACHwBAEA_AcAIfEEAQD8BwAhAgAAAEMAIEYAAK8EACACAAAAQwAgRgAArwQAIAMAAABFACBNAACoBAAgTgAArQQAIAEAAABFACABAAAAQwAgBgwAAMUNACBTAADGDQAgVAAAyQ0AIFUAAMgNACBWAADHDQAg7gQAAPgHACAKiQQAAIcHADCKBAAAtgQAEIsEAACHBwAwjAQBAJ0GACGQBEAAngYAIe0EAgCpBgAh7gQBALoGACHvBAEAnQYAIfAEAQCdBgAh8QQBAJ0GACEDAAAAQwAgAwAAtQQAMFIAALYEACADAAAAQwAgAwAARAAwBAAARQAgAQAAAF8AIAEAAABfACADAAAAXQAgAwAAXgAwBAAAXwAgAwAAAF0AIAMAAF4AMAQAAF8AIAMAAABdACADAABeADAEAABfACAQLgAAxA0AIDIAAPAJACCMBAEAAAABkARAAAAAAa4EAAAA5wQCsARAAAAAAcoEAQAAAAHOBAgAAAAB4AQBAAAAAeEEAQAAAAHjBAAAAOMEAuQEAQAAAAHlBAgAAAAB5wQgAAAAAegEAQAAAAHpBAAA7wkAIAFGAAC-BAAgDowEAQAAAAGQBEAAAAABrgQAAADnBAKwBEAAAAABygQBAAAAAc4ECAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAA4wQC5AQBAAAAAeUECAAAAAHnBCAAAAAB6AQBAAAAAekEAADvCQAgAUYAAMAEADABRgAAwAQAMBAuAADDDQAgMgAA5AkAIIwEAQD8BwAhkARAAP0HACGuBAAA4QnnBCKwBEAA_QcAIcoEAQD8BwAhzgQIAJYIACHgBAEA_AcAIeEEAQD8BwAh4wQAAOAJ4wQi5AQBAPwHACHlBAgAlggAIecEIACoCAAh6AQBAJ4IACHpBAAA4gkAIAIAAABfACBGAADDBAAgDowEAQD8BwAhkARAAP0HACGuBAAA4QnnBCKwBEAA_QcAIcoEAQD8BwAhzgQIAJYIACHgBAEA_AcAIeEEAQD8BwAh4wQAAOAJ4wQi5AQBAPwHACHlBAgAlggAIecEIACoCAAh6AQBAJ4IACHpBAAA4gkAIAIAAABdACBGAADFBAAgAgAAAF0AIEYAAMUEACADAAAAXwAgTQAAvgQAIE4AAMMEACABAAAAXwAgAQAAAF0AIAYMAAC-DQAgUwAAvw0AIFQAAMINACBVAADBDQAgVgAAwA0AIOgEAAD4BwAgEYkEAAD_BgAwigQAAMwEABCLBAAA_wYAMIwEAQCdBgAhkARAAJ4GACGuBAAAgQfnBCKwBEAAngYAIcoEAQCdBgAhzgQIALEGACHgBAEAnQYAIeEEAQCdBgAh4wQAAIAH4wQi5AQBAJ0GACHlBAgAsQYAIecEIADDBgAh6AQBALoGACHpBAAAggcAIAMAAABdACADAADLBAAwUgAAzAQAIAMAAABdACADAABeADAEAABfACABAAAAYwAgAQAAAGMAIAMAAABhACADAABiADAEAABjACADAAAAYQAgAwAAYgAwBAAAYwAgAwAAAGEAIAMAAGIAMAQAAGMAIBMsAADKCQAgLgAA1QkAIC8AAMgJACAwAADJCQAgjAQBAAAAAZAEQAAAAAGuBAAAANcEArAEQAAAAAHKBAEAAAABzgQIAAAAAdcEQAAAAAHYBEAAAAAB2QQIAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAd0ECAAAAAHeBAEAAAAB3wQBAAAAAQFGAADUBAAgD4wEAQAAAAGQBEAAAAABrgQAAADXBAKwBEAAAAABygQBAAAAAc4ECAAAAAHXBEAAAAAB2ARAAAAAAdkECAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAHdBAgAAAAB3gQBAAAAAd8EAQAAAAEBRgAA1gQAMAFGAADWBAAwEywAALcJACAuAADTCQAgLwAAtQkAIDAAALYJACCMBAEA_AcAIZAEQAD9BwAhrgQAALIJ1wQisARAAP0HACHKBAEA_AcAIc4ECACWCAAh1wRAAP0HACHYBEAA_QcAIdkECACWCAAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAh3QQIALMJACHeBAEA_AcAId8EAQD8BwAhAgAAAGMAIEYAANkEACAPjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhygQBAPwHACHOBAgAlggAIdcEQAD9BwAh2ARAAP0HACHZBAgAlggAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAId0ECACzCQAh3gQBAPwHACHfBAEA_AcAIQIAAABhACBGAADbBAAgAgAAAGEAIEYAANsEACADAAAAYwAgTQAA1AQAIE4AANkEACABAAAAYwAgAQAAAGEAIAkMAAC5DQAgUwAAug0AIFQAAL0NACBVAAC8DQAgVgAAuw0AINoEAAD4BwAg2wQAAPgHACDcBAAA-AcAIN0EAAD4BwAgEokEAAD4BgAwigQAAOIEABCLBAAA-AYAMIwEAQCdBgAhkARAAJ4GACGuBAAA-QbXBCKwBEAAngYAIcoEAQCdBgAhzgQIALEGACHXBEAAngYAIdgEQACeBgAh2QQIALEGACHaBAEAugYAIdsEAQC6BgAh3AQBALoGACHdBAgA-gYAId4EAQCdBgAh3wQBAJ0GACEDAAAAYQAgAwAA4QQAMFIAAOIEACADAAAAYQAgAwAAYgAwBAAAYwAgFCsAAPcGACAxAAD2BgAgiQQAAPIGADCKBAAAZQAQiwQAAPIGADCMBAEAAAABkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAAPQG0AQirwQBAL8GACGwBEAAvgYAIc4ECADzBgAh0ARAAM8GACHRBEAAzwYAIdIEQADPBgAh0wRAAM8GACHUBAgA8wYAIdUEAQAAAAEBAAAA5QQAIAEAAADlBAAgBysAALgNACAxAAC3DQAgrwQAAPgHACDQBAAA-AcAINEEAAD4BwAg0gQAAPgHACDTBAAA-AcAIAMAAABlACADAADoBAAwBAAA5QQAIAMAAABlACADAADoBAAwBAAA5QQAIAMAAABlACADAADoBAAwBAAA5QQAIBErAADGCQAgMQAAtg0AIIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGrBAAAAKsEAq4EAAAA0AQCrwQBAAAAAbAEQAAAAAHOBAgAAAAB0ARAAAAAAdEEQAAAAAHSBEAAAAAB0wRAAAAAAdQECAAAAAHVBAEAAAABAUYAAOwEACAPjAQBAAAAAZAEQAAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrgQAAADQBAKvBAEAAAABsARAAAAAAc4ECAAAAAHQBEAAAAAB0QRAAAAAAdIEQAAAAAHTBEAAAAAB1AQIAAAAAdUEAQAAAAEBRgAA7gQAMAFGAADuBAAwESsAAL4JACAxAAC1DQAgjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAvQnQBCKvBAEAnggAIbAEQAD9BwAhzgQIAJYIACHQBEAA_gcAIdEEQAD-BwAh0gRAAP4HACHTBEAA_gcAIdQECACWCAAh1QQBAPwHACECAAAA5QQAIEYAAPEEACAPjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAvQnQBCKvBAEAnggAIbAEQAD9BwAhzgQIAJYIACHQBEAA_gcAIdEEQAD-BwAh0gRAAP4HACHTBEAA_gcAIdQECACWCAAh1QQBAPwHACECAAAAZQAgRgAA8wQAIAIAAABlACBGAADzBAAgAwAAAOUEACBNAADsBAAgTgAA8QQAIAEAAADlBAAgAQAAAGUAIAoMAACwDQAgUwAAsQ0AIFQAALQNACBVAACzDQAgVgAAsg0AIK8EAAD4BwAg0AQAAPgHACDRBAAA-AcAINIEAAD4BwAg0wQAAPgHACASiQQAAO4GADCKBAAA-gQAEIsEAADuBgAwjAQBAJ0GACGQBEAAngYAIagECACxBgAhqQQBAJ0GACGrBAAAsgarBCKuBAAA7wbQBCKvBAEAugYAIbAEQACeBgAhzgQIALEGACHQBEAAnwYAIdEEQACfBgAh0gRAAJ8GACHTBEAAnwYAIdQECACxBgAh1QQBAJ0GACEDAAAAZQAgAwAA-QQAMFIAAPoEACADAAAAZQAgAwAA6AQAMAQAAOUEACABAAAAbQAgAQAAAG0AIAMAAABnACADAABsADAEAABtACADAAAAZwAgAwAAbAAwBAAAbQAgAwAAAGcAIAMAAGwAMAQAAG0AIAssAACnCQAgLgAAxQkAIIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGuBAAAAM0EArAEQAAAAAHKBAEAAAABywQBAAAAAc0EAQAAAAEBRgAAggUAIAmMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABrgQAAADNBAKwBEAAAAABygQBAAAAAcsEAQAAAAHNBAEAAAABAUYAAIQFADABRgAAhAUAMAssAAClCQAgLgAAxAkAIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHKBAEA_AcAIcsEAQD8BwAhzQQBAJ4IACECAAAAbQAgRgAAhwUAIAmMBAEA_AcAIZAEQAD9BwAhqAQIAJYIACGpBAEA_AcAIa4EAACjCc0EIrAEQAD9BwAhygQBAPwHACHLBAEA_AcAIc0EAQCeCAAhAgAAAGcAIEYAAIkFACACAAAAZwAgRgAAiQUAIAMAAABtACBNAACCBQAgTgAAhwUAIAEAAABtACABAAAAZwAgBgwAAKsNACBTAACsDQAgVAAArw0AIFUAAK4NACBWAACtDQAgzQQAAPgHACAMiQQAAOoGADCKBAAAkAUAEIsEAADqBgAwjAQBAJ0GACGQBEAAngYAIagECACxBgAhqQQBAJ0GACGuBAAA6wbNBCKwBEAAngYAIcoEAQCdBgAhywQBAJ0GACHNBAEAugYAIQMAAABnACADAACPBQAwUgAAkAUAIAMAAABnACADAABsADAEAABtACA1AgAA0gYAIAUAANMGACAHAADUBgAgCAAA1QYAIAkAANYGACANAADXBgAgDgAA2AYAIA8AANkGACAbAADaBgAgHAAA2wYAIB0AANwGACAeAADdBgAgHwAA3QYAICIAAN4GACAjAADeBgAgJAAA3wYAICUAAOAGACAmAADgBgAgKQAA4QYAICoAAOIGACAtAADjBgAgMwAA5AYAIDQAAOUGACA1AADlBgAgNgAA5gYAID0AAOcGACA-AADoBgAgPwAA6QYAIIkEAADLBgAwigQAAJYFABCLBAAAywYAMIwEAQAAAAGQBEAAvgYAIawEAQC_BgAhsARAAL4GACGzBAEAzAYAIbQEAQAAAAG1BAEAzAYAIbcEAADNBrcEIrgEAQC_BgAhuQQBAL8GACG6BCAAzgYAIbsEQADPBgAhvAQgAM4GACG9BCAAzgYAIb8EAADQBr8EIsAEQADPBgAhwQQgAM4GACHCBEAAzwYAIcMEQADPBgAhxAQCANEGACHFBEAAzwYAIcYEAgDRBgAhAQAAAJMFACABAAAAkwUAIDUCAADSBgAgBQAA0wYAIAcAANQGACAIAADVBgAgCQAA1gYAIA0AANcGACAOAADYBgAgDwAA2QYAIBsAANoGACAcAADbBgAgHQAA3AYAIB4AAN0GACAfAADdBgAgIgAA3gYAICMAAN4GACAkAADfBgAgJQAA4AYAICYAAOAGACApAADhBgAgKgAA4gYAIC0AAOMGACAzAADkBgAgNAAA5QYAIDUAAOUGACA2AADmBgAgPQAA5wYAID4AAOgGACA_AADpBgAgiQQAAMsGADCKBAAAlgUAEIsEAADLBgAwjAQBAMwGACGQBEAAvgYAIawEAQC_BgAhsARAAL4GACGzBAEAzAYAIbQEAQDMBgAhtQQBAMwGACG3BAAAzQa3BCK4BAEAvwYAIbkEAQC_BgAhugQgAM4GACG7BEAAzwYAIbwEIADOBgAhvQQgAM4GACG_BAAA0Aa_BCLABEAAzwYAIcEEIADOBgAhwgRAAM8GACHDBEAAzwYAIcQEAgDRBgAhxQRAAM8GACHGBAIA0QYAISQCAACTDQAgBQAAlA0AIAcAAJUNACAIAACWDQAgCQAAlw0AIA0AAJgNACAOAACZDQAgDwAAmg0AIBsAAJsNACAcAACcDQAgHQAAnQ0AIB4AAJ4NACAfAACeDQAgIgAAnw0AICMAAJ8NACAkAACgDQAgJQAAoQ0AICYAAKENACApAACiDQAgKgAAow0AIC0AAKQNACAzAAClDQAgNAAApg0AIDUAAKYNACA2AACnDQAgPQAAqA0AID4AAKkNACA_AACqDQAgrAQAAPgHACC4BAAA-AcAILkEAAD4BwAguwQAAPgHACDABAAA-AcAIMIEAAD4BwAgwwQAAPgHACDFBAAA-AcAIAMAAACWBQAgAwAAlwUAMAQAAJMFACADAAAAlgUAIAMAAJcFADAEAACTBQAgAwAAAJYFACADAACXBQAwBAAAkwUAIDICAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAUYAAJsFACAWjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAUYAAJ0FADABRgAAnQUAMDICAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIQIAAACTBQAgRgAAoAUAIBaMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhAgAAAJYFACBGAACiBQAgAgAAAJYFACBGAACiBQAgAwAAAJMFACBNAACbBQAgTgAAoAUAIAEAAACTBQAgAQAAAJYFACANDAAAoggAIFMAAKMIACBUAACmCAAgVQAApQgAIFYAAKQIACCsBAAA-AcAILgEAAD4BwAguQQAAPgHACC7BAAA-AcAIMAEAAD4BwAgwgQAAPgHACDDBAAA-AcAIMUEAAD4BwAgGYkEAADBBgAwigQAAKkFABCLBAAAwQYAMIwEAQCdBgAhkARAAJ4GACGsBAEAugYAIbAEQACeBgAhswQBAJ0GACG0BAEAnQYAIbUEAQCdBgAhtwQAAMIGtwQiuAQBALoGACG5BAEAugYAIboEIADDBgAhuwRAAJ8GACG8BCAAwwYAIb0EIADDBgAhvwQAAMQGvwQiwARAAJ8GACHBBCAAwwYAIcIEQACfBgAhwwRAAJ8GACHEBAIAqQYAIcUEQACfBgAhxgQCAKkGACEDAAAAlgUAIAMAAKgFADBSAACpBQAgAwAAAJYFACADAACXBQAwBAAAkwUAIAsBAADABgAgiQQAAL0GADCKBAAAAwAQiwQAAL0GADCMBAEAAAABjgRAAL4GACGQBEAAvgYAIaYEAQAAAAGwBEAAvgYAIbEEQAC-BgAhsgQBAL8GACEBAAAArAUAIAEAAACsBQAgAgEAAKEIACCyBAAA-AcAIAMAAAADACADAACvBQAwBAAArAUAIAMAAAADACADAACvBQAwBAAArAUAIAMAAAADACADAACvBQAwBAAArAUAIAgBAACgCAAgjAQBAAAAAY4EQAAAAAGQBEAAAAABpgQBAAAAAbAEQAAAAAGxBEAAAAABsgQBAAAAAQFGAACzBQAgB4wEAQAAAAGOBEAAAAABkARAAAAAAaYEAQAAAAGwBEAAAAABsQRAAAAAAbIEAQAAAAEBRgAAtQUAMAFGAAC1BQAwCAEAAJ8IACCMBAEA_AcAIY4EQAD9BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhsQRAAP0HACGyBAEAnggAIQIAAACsBQAgRgAAuAUAIAeMBAEA_AcAIY4EQAD9BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhsQRAAP0HACGyBAEAnggAIQIAAAADACBGAAC6BQAgAgAAAAMAIEYAALoFACADAAAArAUAIE0AALMFACBOAAC4BQAgAQAAAKwFACABAAAAAwAgBAwAAJsIACBVAACdCAAgVgAAnAgAILIEAAD4BwAgCokEAAC5BgAwigQAAMEFABCLBAAAuQYAMIwEAQCdBgAhjgRAAJ4GACGQBEAAngYAIaYEAQCdBgAhsARAAJ4GACGxBEAAngYAIbIEAQC6BgAhAwAAAAMAIAMAAMAFADBSAADBBQAgAwAAAAMAIAMAAK8FADAEAACsBQAgAQAAAAcAIAEAAAAHACADAAAABQAgAwAABgAwBAAABwAgAwAAAAUAIAMAAAYAMAQAAAcAIAMAAAAFACADAAAGADAEAAAHACAMAQAAmggAIIwEAQAAAAGQBEAAAAABpgQBAAAAAacEAgAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrAQBAAAAAa4EAAAArgQCrwQBAAAAAbAEQAAAAAEBRgAAyQUAIAuMBAEAAAABkARAAAAAAaYEAQAAAAGnBAIAAAABqAQIAAAAAakEAQAAAAGrBAAAAKsEAqwEAQAAAAGuBAAAAK4EAq8EAQAAAAGwBEAAAAABAUYAAMsFADABRgAAywUAMAwBAACZCAAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhpwQCAIYIACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirAQBAPwHACGuBAAAmAiuBCKvBAEA_AcAIbAEQAD9BwAhAgAAAAcAIEYAAM4FACALjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhpwQCAIYIACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirAQBAPwHACGuBAAAmAiuBCKvBAEA_AcAIbAEQAD9BwAhAgAAAAUAIEYAANAFACACAAAABQAgRgAA0AUAIAMAAAAHACBNAADJBQAgTgAAzgUAIAEAAAAHACABAAAABQAgBQwAAJEIACBTAACSCAAgVAAAlQgAIFUAAJQIACBWAACTCAAgDokEAACwBgAwigQAANcFABCLBAAAsAYAMIwEAQCdBgAhkARAAJ4GACGmBAEAnQYAIacEAgCpBgAhqAQIALEGACGpBAEAnQYAIasEAACyBqsEIqwEAQCdBgAhrgQAALMGrgQirwQBAJ0GACGwBEAAngYAIQMAAAAFACADAADWBQAwUgAA1wUAIAMAAAAFACADAAAGADAEAAAHACABAAAACwAgAQAAAAsAIAMAAAAJACADAAAKADAEAAALACADAAAACQAgAwAACgAwBAAACwAgAwAAAAkAIAMAAAoAMAQAAAsAIAoGAACQCAAgjAQBAAAAAZAEQAAAAAGRBAEAAAABoAQAAACgBAKhBAIAAAABogQBAAAAAaMEAQAAAAGkBAEAAAABpQQCAAAAAQFGAADfBQAgCYwEAQAAAAGQBEAAAAABkQQBAAAAAaAEAAAAoAQCoQQCAAAAAaIEAQAAAAGjBAEAAAABpAQBAAAAAaUEAgAAAAEBRgAA4QUAMAFGAADhBQAwCgYAAI8IACCMBAEA_AcAIZAEQAD9BwAhkQQBAPwHACGgBAAAjgigBCKhBAIAhggAIaIEAQD8BwAhowQBAPwHACGkBAEA_AcAIaUEAgCGCAAhAgAAAAsAIEYAAOQFACAJjAQBAPwHACGQBEAA_QcAIZEEAQD8BwAhoAQAAI4IoAQioQQCAIYIACGiBAEA_AcAIaMEAQD8BwAhpAQBAPwHACGlBAIAhggAIQIAAAAJACBGAADmBQAgAgAAAAkAIEYAAOYFACADAAAACwAgTQAA3wUAIE4AAOQFACABAAAACwAgAQAAAAkAIAUMAACJCAAgUwAAiggAIFQAAI0IACBVAACMCAAgVgAAiwgAIAyJBAAArAYAMIoEAADtBQAQiwQAAKwGADCMBAEAnQYAIZAEQACeBgAhkQQBAJ0GACGgBAAArQagBCKhBAIAqQYAIaIEAQCdBgAhowQBAJ0GACGkBAEAnQYAIaUEAgCpBgAhAwAAAAkAIAMAAOwFADBSAADtBQAgAwAAAAkAIAMAAAoAMAQAAAsAIAEAAAAPACABAAAADwAgAwAAAA0AIAMAAA4AMAQAAA8AIAMAAAANACADAAAOADAEAAAPACADAAAADQAgAwAADgAwBAAADwAgBwYAAIgIACCMBAEAAAABjgRAAAAAAZAEQAAAAAGRBAEAAAABnQQBAAAAAZ4EAgAAAAEBRgAA9QUAIAaMBAEAAAABjgRAAAAAAZAEQAAAAAGRBAEAAAABnQQBAAAAAZ4EAgAAAAEBRgAA9wUAMAFGAAD3BQAwBwYAAIcIACCMBAEA_AcAIY4EQAD9BwAhkARAAP0HACGRBAEA_AcAIZ0EAQD8BwAhngQCAIYIACECAAAADwAgRgAA-gUAIAaMBAEA_AcAIY4EQAD9BwAhkARAAP0HACGRBAEA_AcAIZ0EAQD8BwAhngQCAIYIACECAAAADQAgRgAA_AUAIAIAAAANACBGAAD8BQAgAwAAAA8AIE0AAPUFACBOAAD6BQAgAQAAAA8AIAEAAAANACAFDAAAgQgAIFMAAIIIACBUAACFCAAgVQAAhAgAIFYAAIMIACAJiQQAAKgGADCKBAAAgwYAEIsEAACoBgAwjAQBAJ0GACGOBEAAngYAIZAEQACeBgAhkQQBAJ0GACGdBAEAnQYAIZ4EAgCpBgAhAwAAAA0AIAMAAIIGADBSAACDBgAgAwAAAA0AIAMAAA4AMAQAAA8AIAEAAAATACABAAAAEwAgAwAAABEAIAMAABIAMAQAABMAIAMAAAARACADAAASADAEAAATACADAAAAEQAgAwAAEgAwBAAAEwAgBwYAAIAIACCMBAEAAAABjQQBAAAAAY4EQAAAAAGPBEAAAAABkARAAAAAAZEEAQAAAAEBRgAAiwYAIAaMBAEAAAABjQQBAAAAAY4EQAAAAAGPBEAAAAABkARAAAAAAZEEAQAAAAEBRgAAjQYAMAFGAACNBgAwBwYAAP8HACCMBAEA_AcAIY0EAQD8BwAhjgRAAP0HACGPBEAA_gcAIZAEQAD9BwAhkQQBAPwHACECAAAAEwAgRgAAkAYAIAaMBAEA_AcAIY0EAQD8BwAhjgRAAP0HACGPBEAA_gcAIZAEQAD9BwAhkQQBAPwHACECAAAAEQAgRgAAkgYAIAIAAAARACBGAACSBgAgAwAAABMAIE0AAIsGACBOAACQBgAgAQAAABMAIAEAAAARACAEDAAA-QcAIFUAAPsHACBWAAD6BwAgjwQAAPgHACAJiQQAAJwGADCKBAAAmQYAEIsEAACcBgAwjAQBAJ0GACGNBAEAnQYAIY4EQACeBgAhjwRAAJ8GACGQBEAAngYAIZEEAQCdBgAhAwAAABEAIAMAAJgGADBSAACZBgAgAwAAABEAIAMAABIAMAQAABMAIAmJBAAAnAYAMIoEAACZBgAQiwQAAJwGADCMBAEAnQYAIY0EAQCdBgAhjgRAAJ4GACGPBEAAnwYAIZAEQACeBgAhkQQBAJ0GACEODAAApAYAIFUAAKcGACBWAACnBgAgkgQBAAAAAZMEAQAAAASUBAEAAAAElQQBAAAAAZYEAQAAAAGXBAEAAAABmAQBAAAAAZkEAQCmBgAhmgQBAAAAAZsEAQAAAAGcBAEAAAABCwwAAKQGACBVAAClBgAgVgAApQYAIJIEQAAAAAGTBEAAAAAElARAAAAABJUEQAAAAAGWBEAAAAABlwRAAAAAAZgEQAAAAAGZBEAAowYAIQsMAAChBgAgVQAAogYAIFYAAKIGACCSBEAAAAABkwRAAAAABZQEQAAAAAWVBEAAAAABlgRAAAAAAZcEQAAAAAGYBEAAAAABmQRAAKAGACELDAAAoQYAIFUAAKIGACBWAACiBgAgkgRAAAAAAZMEQAAAAAWUBEAAAAAFlQRAAAAAAZYEQAAAAAGXBEAAAAABmARAAAAAAZkEQACgBgAhCJIEAgAAAAGTBAIAAAAFlAQCAAAABZUEAgAAAAGWBAIAAAABlwQCAAAAAZgEAgAAAAGZBAIAoQYAIQiSBEAAAAABkwRAAAAABZQEQAAAAAWVBEAAAAABlgRAAAAAAZcEQAAAAAGYBEAAAAABmQRAAKIGACELDAAApAYAIFUAAKUGACBWAAClBgAgkgRAAAAAAZMEQAAAAASUBEAAAAAElQRAAAAAAZYEQAAAAAGXBEAAAAABmARAAAAAAZkEQACjBgAhCJIEAgAAAAGTBAIAAAAElAQCAAAABJUEAgAAAAGWBAIAAAABlwQCAAAAAZgEAgAAAAGZBAIApAYAIQiSBEAAAAABkwRAAAAABJQEQAAAAASVBEAAAAABlgRAAAAAAZcEQAAAAAGYBEAAAAABmQRAAKUGACEODAAApAYAIFUAAKcGACBWAACnBgAgkgQBAAAAAZMEAQAAAASUBAEAAAAElQQBAAAAAZYEAQAAAAGXBAEAAAABmAQBAAAAAZkEAQCmBgAhmgQBAAAAAZsEAQAAAAGcBAEAAAABC5IEAQAAAAGTBAEAAAAElAQBAAAABJUEAQAAAAGWBAEAAAABlwQBAAAAAZgEAQAAAAGZBAEApwYAIZoEAQAAAAGbBAEAAAABnAQBAAAAAQmJBAAAqAYAMIoEAACDBgAQiwQAAKgGADCMBAEAnQYAIY4EQACeBgAhkARAAJ4GACGRBAEAnQYAIZ0EAQCdBgAhngQCAKkGACENDAAApAYAIFMAAKsGACBUAACkBgAgVQAApAYAIFYAAKQGACCSBAIAAAABkwQCAAAABJQEAgAAAASVBAIAAAABlgQCAAAAAZcEAgAAAAGYBAIAAAABmQQCAKoGACENDAAApAYAIFMAAKsGACBUAACkBgAgVQAApAYAIFYAAKQGACCSBAIAAAABkwQCAAAABJQEAgAAAASVBAIAAAABlgQCAAAAAZcEAgAAAAGYBAIAAAABmQQCAKoGACEIkgQIAAAAAZMECAAAAASUBAgAAAAElQQIAAAAAZYECAAAAAGXBAgAAAABmAQIAAAAAZkECACrBgAhDIkEAACsBgAwigQAAO0FABCLBAAArAYAMIwEAQCdBgAhkARAAJ4GACGRBAEAnQYAIaAEAACtBqAEIqEEAgCpBgAhogQBAJ0GACGjBAEAnQYAIaQEAQCdBgAhpQQCAKkGACEHDAAApAYAIFUAAK8GACBWAACvBgAgkgQAAACgBAKTBAAAAKAECJQEAAAAoAQImQQAAK4GoAQiBwwAAKQGACBVAACvBgAgVgAArwYAIJIEAAAAoAQCkwQAAACgBAiUBAAAAKAECJkEAACuBqAEIgSSBAAAAKAEApMEAAAAoAQIlAQAAACgBAiZBAAArwagBCIOiQQAALAGADCKBAAA1wUAEIsEAACwBgAwjAQBAJ0GACGQBEAAngYAIaYEAQCdBgAhpwQCAKkGACGoBAgAsQYAIakEAQCdBgAhqwQAALIGqwQirAQBAJ0GACGuBAAAswauBCKvBAEAnQYAIbAEQACeBgAhDQwAAKQGACBTAACrBgAgVAAAqwYAIFUAAKsGACBWAACrBgAgkgQIAAAAAZMECAAAAASUBAgAAAAElQQIAAAAAZYECAAAAAGXBAgAAAABmAQIAAAAAZkECAC4BgAhBwwAAKQGACBVAAC3BgAgVgAAtwYAIJIEAAAAqwQCkwQAAACrBAiUBAAAAKsECJkEAAC2BqsEIgcMAACkBgAgVQAAtQYAIFYAALUGACCSBAAAAK4EApMEAAAArgQIlAQAAACuBAiZBAAAtAauBCIHDAAApAYAIFUAALUGACBWAAC1BgAgkgQAAACuBAKTBAAAAK4ECJQEAAAArgQImQQAALQGrgQiBJIEAAAArgQCkwQAAACuBAiUBAAAAK4ECJkEAAC1Bq4EIgcMAACkBgAgVQAAtwYAIFYAALcGACCSBAAAAKsEApMEAAAAqwQIlAQAAACrBAiZBAAAtgarBCIEkgQAAACrBAKTBAAAAKsECJQEAAAAqwQImQQAALcGqwQiDQwAAKQGACBTAACrBgAgVAAAqwYAIFUAAKsGACBWAACrBgAgkgQIAAAAAZMECAAAAASUBAgAAAAElQQIAAAAAZYECAAAAAGXBAgAAAABmAQIAAAAAZkECAC4BgAhCokEAAC5BgAwigQAAMEFABCLBAAAuQYAMIwEAQCdBgAhjgRAAJ4GACGQBEAAngYAIaYEAQCdBgAhsARAAJ4GACGxBEAAngYAIbIEAQC6BgAhDgwAAKEGACBVAAC8BgAgVgAAvAYAIJIEAQAAAAGTBAEAAAAFlAQBAAAABZUEAQAAAAGWBAEAAAABlwQBAAAAAZgEAQAAAAGZBAEAuwYAIZoEAQAAAAGbBAEAAAABnAQBAAAAAQ4MAAChBgAgVQAAvAYAIFYAALwGACCSBAEAAAABkwQBAAAABZQEAQAAAAWVBAEAAAABlgQBAAAAAZcEAQAAAAGYBAEAAAABmQQBALsGACGaBAEAAAABmwQBAAAAAZwEAQAAAAELkgQBAAAAAZMEAQAAAAWUBAEAAAAFlQQBAAAAAZYEAQAAAAGXBAEAAAABmAQBAAAAAZkEAQC8BgAhmgQBAAAAAZsEAQAAAAGcBAEAAAABCwEAAMAGACCJBAAAvQYAMIoEAAADABCLBAAAvQYAMIwEAQDMBgAhjgRAAL4GACGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACGxBEAAvgYAIbIEAQC_BgAhCJIEQAAAAAGTBEAAAAAElARAAAAABJUEQAAAAAGWBEAAAAABlwRAAAAAAZgEQAAAAAGZBEAApQYAIQuSBAEAAAABkwQBAAAABZQEAQAAAAWVBAEAAAABlgQBAAAAAZcEAQAAAAGYBAEAAAABmQQBALwGACGaBAEAAAABmwQBAAAAAZwEAQAAAAE3AgAA0gYAIAUAANMGACAHAADUBgAgCAAA1QYAIAkAANYGACANAADXBgAgDgAA2AYAIA8AANkGACAbAADaBgAgHAAA2wYAIB0AANwGACAeAADdBgAgHwAA3QYAICIAAN4GACAjAADeBgAgJAAA3wYAICUAAOAGACAmAADgBgAgKQAA4QYAICoAAOIGACAtAADjBgAgMwAA5AYAIDQAAOUGACA1AADlBgAgNgAA5gYAID0AAOcGACA-AADoBgAgPwAA6QYAIIkEAADLBgAwigQAAJYFABCLBAAAywYAMIwEAQDMBgAhkARAAL4GACGsBAEAvwYAIbAEQAC-BgAhswQBAMwGACG0BAEAzAYAIbUEAQDMBgAhtwQAAM0GtwQiuAQBAL8GACG5BAEAvwYAIboEIADOBgAhuwRAAM8GACG8BCAAzgYAIb0EIADOBgAhvwQAANAGvwQiwARAAM8GACHBBCAAzgYAIcIEQADPBgAhwwRAAM8GACHEBAIA0QYAIcUEQADPBgAhxgQCANEGACGzBQAAlgUAILQFAACWBQAgGYkEAADBBgAwigQAAKkFABCLBAAAwQYAMIwEAQCdBgAhkARAAJ4GACGsBAEAugYAIbAEQACeBgAhswQBAJ0GACG0BAEAnQYAIbUEAQCdBgAhtwQAAMIGtwQiuAQBALoGACG5BAEAugYAIboEIADDBgAhuwRAAJ8GACG8BCAAwwYAIb0EIADDBgAhvwQAAMQGvwQiwARAAJ8GACHBBCAAwwYAIcIEQACfBgAhwwRAAJ8GACHEBAIAqQYAIcUEQACfBgAhxgQCAKkGACEHDAAApAYAIFUAAMoGACBWAADKBgAgkgQAAAC3BAKTBAAAALcECJQEAAAAtwQImQQAAMkGtwQiBQwAAKQGACBVAADIBgAgVgAAyAYAIJIEIAAAAAGZBCAAxwYAIQcMAACkBgAgVQAAxgYAIFYAAMYGACCSBAAAAL8EApMEAAAAvwQIlAQAAAC_BAiZBAAAxQa_BCIHDAAApAYAIFUAAMYGACBWAADGBgAgkgQAAAC_BAKTBAAAAL8ECJQEAAAAvwQImQQAAMUGvwQiBJIEAAAAvwQCkwQAAAC_BAiUBAAAAL8ECJkEAADGBr8EIgUMAACkBgAgVQAAyAYAIFYAAMgGACCSBCAAAAABmQQgAMcGACECkgQgAAAAAZkEIADIBgAhBwwAAKQGACBVAADKBgAgVgAAygYAIJIEAAAAtwQCkwQAAAC3BAiUBAAAALcECJkEAADJBrcEIgSSBAAAALcEApMEAAAAtwQIlAQAAAC3BAiZBAAAyga3BCI1AgAA0gYAIAUAANMGACAHAADUBgAgCAAA1QYAIAkAANYGACANAADXBgAgDgAA2AYAIA8AANkGACAbAADaBgAgHAAA2wYAIB0AANwGACAeAADdBgAgHwAA3QYAICIAAN4GACAjAADeBgAgJAAA3wYAICUAAOAGACAmAADgBgAgKQAA4QYAICoAAOIGACAtAADjBgAgMwAA5AYAIDQAAOUGACA1AADlBgAgNgAA5gYAID0AAOcGACA-AADoBgAgPwAA6QYAIIkEAADLBgAwigQAAJYFABCLBAAAywYAMIwEAQDMBgAhkARAAL4GACGsBAEAvwYAIbAEQAC-BgAhswQBAMwGACG0BAEAzAYAIbUEAQDMBgAhtwQAAM0GtwQiuAQBAL8GACG5BAEAvwYAIboEIADOBgAhuwRAAM8GACG8BCAAzgYAIb0EIADOBgAhvwQAANAGvwQiwARAAM8GACHBBCAAzgYAIcIEQADPBgAhwwRAAM8GACHEBAIA0QYAIcUEQADPBgAhxgQCANEGACELkgQBAAAAAZMEAQAAAASUBAEAAAAElQQBAAAAAZYEAQAAAAGXBAEAAAABmAQBAAAAAZkEAQCnBgAhmgQBAAAAAZsEAQAAAAGcBAEAAAABBJIEAAAAtwQCkwQAAAC3BAiUBAAAALcECJkEAADKBrcEIgKSBCAAAAABmQQgAMgGACEIkgRAAAAAAZMEQAAAAAWUBEAAAAAFlQRAAAAAAZYEQAAAAAGXBEAAAAABmARAAAAAAZkEQACiBgAhBJIEAAAAvwQCkwQAAAC_BAiUBAAAAL8ECJkEAADGBr8EIgiSBAIAAAABkwQCAAAABJQEAgAAAASVBAIAAAABlgQCAAAAAZcEAgAAAAGYBAIAAAABmQQCAKQGACENAQAAwAYAIIkEAAC9BgAwigQAAAMAEIsEAAC9BgAwjAQBAMwGACGOBEAAvgYAIZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIbEEQAC-BgAhsgQBAL8GACGzBQAAAwAgtAUAAAMAIAPHBAAABQAgyAQAAAUAIMkEAAAFACADxwQAAAkAIMgEAAAJACDJBAAACQAgA8cEAAANACDIBAAADQAgyQQAAA0AIAPHBAAAEQAgyAQAABEAIMkEAAARACADxwQAABUAIMgEAAAVACDJBAAAFQAgA8cEAAAZACDIBAAAGQAgyQQAABkAIAPHBAAAHwAgyAQAAB8AIMkEAAAfACADxwQAACMAIMgEAAAjACDJBAAAIwAgA8cEAAA8ACDIBAAAPAAgyQQAADwAIAPHBAAAMAAgyAQAADAAIMkEAAAwACADxwQAACcAIMgEAAAnACDJBAAAJwAgA8cEAABDACDIBAAAQwAgyQQAAEMAIAPHBAAAKgAgyAQAACoAIMkEAAAqACADxwQAAEkAIMgEAABJACDJBAAASQAgA8cEAABOACDIBAAATgAgyQQAAE4AIAPHBAAAUgAgyAQAAFIAIMkEAABSACADxwQAAFgAIMgEAABYACDJBAAAWAAgA8cEAABdACDIBAAAXQAgyQQAAF0AIAPHBAAAYQAgyAQAAGEAIMkEAABhACADxwQAAGcAIMgEAABnACDJBAAAZwAgA8cEAABvACDIBAAAbwAgyQQAAG8AIAPHBAAAfAAgyAQAAHwAIMkEAAB8ACADxwQAAHcAIMgEAAB3ACDJBAAAdwAgDIkEAADqBgAwigQAAJAFABCLBAAA6gYAMIwEAQCdBgAhkARAAJ4GACGoBAgAsQYAIakEAQCdBgAhrgQAAOsGzQQisARAAJ4GACHKBAEAnQYAIcsEAQCdBgAhzQQBALoGACEHDAAApAYAIFUAAO0GACBWAADtBgAgkgQAAADNBAKTBAAAAM0ECJQEAAAAzQQImQQAAOwGzQQiBwwAAKQGACBVAADtBgAgVgAA7QYAIJIEAAAAzQQCkwQAAADNBAiUBAAAAM0ECJkEAADsBs0EIgSSBAAAAM0EApMEAAAAzQQIlAQAAADNBAiZBAAA7QbNBCISiQQAAO4GADCKBAAA-gQAEIsEAADuBgAwjAQBAJ0GACGQBEAAngYAIagECACxBgAhqQQBAJ0GACGrBAAAsgarBCKuBAAA7wbQBCKvBAEAugYAIbAEQACeBgAhzgQIALEGACHQBEAAnwYAIdEEQACfBgAh0gRAAJ8GACHTBEAAnwYAIdQECACxBgAh1QQBAJ0GACEHDAAApAYAIFUAAPEGACBWAADxBgAgkgQAAADQBAKTBAAAANAECJQEAAAA0AQImQQAAPAG0AQiBwwAAKQGACBVAADxBgAgVgAA8QYAIJIEAAAA0AQCkwQAAADQBAiUBAAAANAECJkEAADwBtAEIgSSBAAAANAEApMEAAAA0AQIlAQAAADQBAiZBAAA8QbQBCIUKwAA9wYAIDEAAPYGACCJBAAA8gYAMIoEAABlABCLBAAA8gYAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAAPQG0AQirwQBAL8GACGwBEAAvgYAIc4ECADzBgAh0ARAAM8GACHRBEAAzwYAIdIEQADPBgAh0wRAAM8GACHUBAgA8wYAIdUEAQDMBgAhCJIECAAAAAGTBAgAAAAElAQIAAAABJUECAAAAAGWBAgAAAABlwQIAAAAAZgECAAAAAGZBAgAqwYAIQSSBAAAANAEApMEAAAA0AQIlAQAAADQBAiZBAAA8QbQBCIEkgQAAACrBAKTBAAAAKsECJQEAAAAqwQImQQAALcGqwQiGCwAAM4HACAuAADABgAgLwAAzQcAIDAAAMAGACCJBAAAygcAMIoEAABhABCLBAAAygcAMIwEAQDMBgAhkARAAL4GACGuBAAAywfXBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHXBEAAvgYAIdgEQAC-BgAh2QQIAPMGACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACHdBAgAzAcAId4EAQDMBgAh3wQBAMwGACGzBQAAYQAgtAUAAGEAIBAsAADJBwAgLgAAwAYAIIkEAADHBwAwigQAAGcAEIsEAADHBwAwjAQBAMwGACGQBEAAvgYAIagECADzBgAhqQQBAMwGACGuBAAAyAfNBCKwBEAAvgYAIcoEAQDMBgAhywQBAMwGACHNBAEAvwYAIbMFAABnACC0BQAAZwAgEokEAAD4BgAwigQAAOIEABCLBAAA-AYAMIwEAQCdBgAhkARAAJ4GACGuBAAA-QbXBCKwBEAAngYAIcoEAQCdBgAhzgQIALEGACHXBEAAngYAIdgEQACeBgAh2QQIALEGACHaBAEAugYAIdsEAQC6BgAh3AQBALoGACHdBAgA-gYAId4EAQCdBgAh3wQBAJ0GACEHDAAApAYAIFUAAP4GACBWAAD-BgAgkgQAAADXBAKTBAAAANcECJQEAAAA1wQImQQAAP0G1wQiDQwAAKEGACBTAAD8BgAgVAAA_AYAIFUAAPwGACBWAAD8BgAgkgQIAAAAAZMECAAAAAWUBAgAAAAFlQQIAAAAAZYECAAAAAGXBAgAAAABmAQIAAAAAZkECAD7BgAhDQwAAKEGACBTAAD8BgAgVAAA_AYAIFUAAPwGACBWAAD8BgAgkgQIAAAAAZMECAAAAAWUBAgAAAAFlQQIAAAAAZYECAAAAAGXBAgAAAABmAQIAAAAAZkECAD7BgAhCJIECAAAAAGTBAgAAAAFlAQIAAAABZUECAAAAAGWBAgAAAABlwQIAAAAAZgECAAAAAGZBAgA_AYAIQcMAACkBgAgVQAA_gYAIFYAAP4GACCSBAAAANcEApMEAAAA1wQIlAQAAADXBAiZBAAA_QbXBCIEkgQAAADXBAKTBAAAANcECJQEAAAA1wQImQQAAP4G1wQiEYkEAAD_BgAwigQAAMwEABCLBAAA_wYAMIwEAQCdBgAhkARAAJ4GACGuBAAAgQfnBCKwBEAAngYAIcoEAQCdBgAhzgQIALEGACHgBAEAnQYAIeEEAQCdBgAh4wQAAIAH4wQi5AQBAJ0GACHlBAgAsQYAIecEIADDBgAh6AQBALoGACHpBAAAggcAIAcMAACkBgAgVQAAhgcAIFYAAIYHACCSBAAAAOMEApMEAAAA4wQIlAQAAADjBAiZBAAAhQfjBCIHDAAApAYAIFUAAIQHACBWAACEBwAgkgQAAADnBAKTBAAAAOcECJQEAAAA5wQImQQAAIMH5wQiBJIEAQAAAAXqBAEAAAAB6wQBAAAABOwEAQAAAAQHDAAApAYAIFUAAIQHACBWAACEBwAgkgQAAADnBAKTBAAAAOcECJQEAAAA5wQImQQAAIMH5wQiBJIEAAAA5wQCkwQAAADnBAiUBAAAAOcECJkEAACEB-cEIgcMAACkBgAgVQAAhgcAIFYAAIYHACCSBAAAAOMEApMEAAAA4wQIlAQAAADjBAiZBAAAhQfjBCIEkgQAAADjBAKTBAAAAOMECJQEAAAA4wQImQQAAIYH4wQiCokEAACHBwAwigQAALYEABCLBAAAhwcAMIwEAQCdBgAhkARAAJ4GACHtBAIAqQYAIe4EAQC6BgAh7wQBAJ0GACHwBAEAnQYAIfEEAQCdBgAhCIkEAACIBwAwigQAAKAEABCLBAAAiAcAMIwEAQCdBgAhkARAAJ4GACHvBAEAnQYAIfIEAQCdBgAh8wQBAJ0GACEMiQQAAIkHADCKBAAAigQAEIsEAACJBwAwjAQBAJ0GACGQBEAAngYAIaIEAQCdBgAhpAQBAJ0GACGlBAIAqQYAIaYEAQCdBgAhsARAAJ4GACHhBAEAnQYAIfQEAgCpBgAhDYkEAACKBwAwigQAAPQDABCLBAAAigcAMIwEAQCdBgAhkARAAJ4GACGRBAEAnQYAIa4EAACMB_kEIrAEQACeBgAh9QQBAJ0GACH3BAAAiwf3BCL5BAIAqQYAIfoEQACeBgAh-wQBALoGACEHDAAApAYAIFUAAJAHACBWAACQBwAgkgQAAAD3BAKTBAAAAPcECJQEAAAA9wQImQQAAI8H9wQiBwwAAKQGACBVAACOBwAgVgAAjgcAIJIEAAAA-QQCkwQAAAD5BAiUBAAAAPkECJkEAACNB_kEIgcMAACkBgAgVQAAjgcAIFYAAI4HACCSBAAAAPkEApMEAAAA-QQIlAQAAAD5BAiZBAAAjQf5BCIEkgQAAAD5BAKTBAAAAPkECJQEAAAA-QQImQQAAI4H-QQiBwwAAKQGACBVAACQBwAgVgAAkAcAIJIEAAAA9wQCkwQAAAD3BAiUBAAAAPcECJkEAACPB_cEIgSSBAAAAPcEApMEAAAA9wQIlAQAAAD3BAiZBAAAkAf3BCIJiQQAAJEHADCKBAAA3gMAEIsEAACRBwAwjAQBAJ0GACGQBEAAngYAIZEEAQCdBgAh_AQBAJ0GACH9BAEAnQYAIf4EAQCdBgAhC4kEAACSBwAwigQAAMgDABCLBAAAkgcAMIwEAQCdBgAhkARAAJ4GACGRBAEAnQYAIaAEAQCdBgAh4AQBAJ0GACHzBAEAnQYAIf8EAQC6BgAhgAUgAMMGACEOiQQAAJMHADCKBAAAsgMAEIsEAACTBwAwjAQBAJ0GACGQBEAAngYAIfMEAQCdBgAhggUAAJQHggUigwUIAPoGACGFBQAAlQeFBSOGBUAAnwYAIYcFAQCdBgAhiAUBAJ0GACGJBQEAugYAIYoFAQC6BgAhBwwAAKQGACBVAACZBwAgVgAAmQcAIJIEAAAAggUCkwQAAACCBQiUBAAAAIIFCJkEAACYB4IFIgcMAAChBgAgVQAAlwcAIFYAAJcHACCSBAAAAIUFA5MEAAAAhQUJlAQAAACFBQmZBAAAlgeFBSMHDAAAoQYAIFUAAJcHACBWAACXBwAgkgQAAACFBQOTBAAAAIUFCZQEAAAAhQUJmQQAAJYHhQUjBJIEAAAAhQUDkwQAAACFBQmUBAAAAIUFCZkEAACXB4UFIwcMAACkBgAgVQAAmQcAIFYAAJkHACCSBAAAAIIFApMEAAAAggUIlAQAAACCBQiZBAAAmAeCBSIEkgQAAACCBQKTBAAAAIIFCJQEAAAAggUImQQAAJkHggUiCIkEAACaBwAwigQAAJgDABCLBAAAmgcAMIwEAQCdBgAhkARAAJ4GACGmBAEAnQYAIbAEQACeBgAhiwUBAJ0GACELiQQAAJsHADCKBAAAggMAEIsEAACbBwAwjAQBAJ0GACGQBEAAngYAIaYEAQCdBgAhrgQAAJwHjwUisARAAJ4GACGMBQEAnQYAIY0FCAD6BgAhjwUBAJ0GACEHDAAApAYAIFUAAJ4HACBWAACeBwAgkgQAAACPBQKTBAAAAI8FCJQEAAAAjwUImQQAAJ0HjwUiBwwAAKQGACBVAACeBwAgVgAAngcAIJIEAAAAjwUCkwQAAACPBQiUBAAAAI8FCJkEAACdB48FIgSSBAAAAI8FApMEAAAAjwUIlAQAAACPBQiZBAAAngePBSIRiQQAAJ8HADCKBAAA7AIAEIsEAACfBwAwjAQBAJ0GACGQBEAAngYAIbAEQACeBgAh4AQBAJ0GACHhBAEAnQYAIeMEAQCdBgAh5AQBAJ0GACGLBQEAnQYAIZAFCACxBgAhkQUBALoGACGSBUAAnwYAIZMFAQC6BgAhlAUBALoGACGVBSAAwwYAIRCJBAAAoAcAMIoEAADWAgAQiwQAAKAHADCMBAEAnQYAIZAEQACeBgAhpgQBAJ0GACGwBEAAngYAIcEEIADDBgAhwgRAAJ8GACHgBAEAnQYAIeEEAQCdBgAh4wQBAJ0GACHkBAEAnQYAIZEFAQC6BgAhlgUIALEGACGXBSAAwwYAIQmJBAAAoQcAMIoEAADAAgAQiwQAAKEHADCMBAEAnQYAIZAEQACeBgAhkQQBAJ0GACGwBEAAngYAIZgFQACfBgAhmQUBAJ0GACEJiQQAAKIHADCKBAAAqgIAEIsEAACiBwAwjAQBAJ0GACGQBEAAngYAIZEEAQCdBgAhsARAAJ4GACGaBQEAugYAIZsFAQCdBgAhDYkEAACjBwAwigQAAJQCABCLBAAAowcAMIwEAQCdBgAhkARAAJ4GACGwBEAAngYAIeAEAQCdBgAh4QQBALoGACGbBQEAnQYAIZwFAgCpBgAhnQUBALoGACGeBQEAugYAIZ8FAgCkBwAhDQwAAKEGACBTAAD8BgAgVAAAoQYAIFUAAKEGACBWAAChBgAgkgQCAAAAAZMEAgAAAAWUBAIAAAAFlQQCAAAAAZYEAgAAAAGXBAIAAAABmAQCAAAAAZkEAgClBwAhDQwAAKEGACBTAAD8BgAgVAAAoQYAIFUAAKEGACBWAAChBgAgkgQCAAAAAZMEAgAAAAWUBAIAAAAFlQQCAAAAAZYEAgAAAAGXBAIAAAABmAQCAAAAAZkEAgClBwAhDYkEAACmBwAwigQAAP4BABCLBAAApgcAMIwEAQCdBgAhkARAAJ4GACGuBAAAqAekBSKwBEAAngYAIeAEAQCdBgAh4QQBAJ0GACHjBAAApweiBSKgBQEAnQYAIaIFAQC6BgAhpAUBAJ0GACEHDAAApAYAIFUAAKwHACBWAACsBwAgkgQAAACiBQKTBAAAAKIFCJQEAAAAogUImQQAAKsHogUiBwwAAKQGACBVAACqBwAgVgAAqgcAIJIEAAAApAUCkwQAAACkBQiUBAAAAKQFCJkEAACpB6QFIgcMAACkBgAgVQAAqgcAIFYAAKoHACCSBAAAAKQFApMEAAAApAUIlAQAAACkBQiZBAAAqQekBSIEkgQAAACkBQKTBAAAAKQFCJQEAAAApAUImQQAAKoHpAUiBwwAAKQGACBVAACsBwAgVgAArAcAIJIEAAAAogUCkwQAAACiBQiUBAAAAKIFCJkEAACrB6IFIgSSBAAAAKIFApMEAAAAogUIlAQAAACiBQiZBAAArAeiBSIMiQQAAK0HADCKBAAA6AEAEIsEAACtBwAwjAQBAJ0GACGQBEAAngYAIaYEAQCdBgAhqAQIALEGACGpBAEAnQYAIa4EAADrBs0EIrAEQACeBgAhywQBAJ0GACHNBAEAugYAIQ-JBAAArgcAMIoEAADSAQAQiwQAAK4HADCMBAEAnQYAIZAEQACeBgAhqAQIALEGACGpBAEAnQYAIasEAACyBqsEIq4EAACvB6YFIq8EAQC6BgAhsARAAJ4GACHQBEAAnwYAIdEEQACfBgAh0gRAAJ8GACHxBAEAnQYAIQcMAACkBgAgVQAAsQcAIFYAALEHACCSBAAAAKYFApMEAAAApgUIlAQAAACmBQiZBAAAsAemBSIHDAAApAYAIFUAALEHACBWAACxBwAgkgQAAACmBQKTBAAAAKYFCJQEAAAApgUImQQAALAHpgUiBJIEAAAApgUCkwQAAACmBQiUBAAAAKYFCJkEAACxB6YFIhEXAAC0BwAgKwAAtQcAIIkEAACyBwAwigQAAKEBABCLBAAAsgcAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAALMHpgUirwQBAL8GACGwBEAAvgYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIfEEAQDMBgAhBJIEAAAApgUCkwQAAACmBQiUBAAAAKYFCJkEAACxB6YFIhwBAADABgAgEQAAwAYAIBkAAOQHACAaAADlBwAgLAAA6AcAIEAAAOkHACCJBAAA5gcAMIoEAAAnABCLBAAA5gcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIa4EAADnB6cFIrAEQAC-BgAh2gQBAL8GACHbBAEAvwYAIdwEAQC_BgAhiQUBAL8GACGKBQEAvwYAIYsFAQDMBgAhpwVAAM8GACGoBQEAvwYAIakFAQC_BgAhqgUIAMwHACGrBQEAvwYAIawFAQC_BgAhswUAACcAILQFAAAnACAQAQAAwAYAICwAANMHACCJBAAA0gcAMIoEAABYABCLBAAA0gcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIagECADzBgAhqQQBAMwGACGuBAAAyAfNBCKwBEAAvgYAIcsEAQDMBgAhzQQBAL8GACGzBQAAWAAgtAUAAFgAIBSJBAAAtgcAMIoEAAC6AQAQiwQAALYHADCMBAEAnQYAIZAEQACeBgAhpgQBAJ0GACGuBAAAtwenBSKwBEAAngYAIdoEAQC6BgAh2wQBALoGACHcBAEAugYAIYkFAQC6BgAhigUBALoGACGLBQEAnQYAIacFQACfBgAhqAUBALoGACGpBQEAugYAIaoFCAD6BgAhqwUBALoGACGsBQEAugYAIQcMAACkBgAgVQAAuQcAIFYAALkHACCSBAAAAKcFApMEAAAApwUIlAQAAACnBQiZBAAAuAenBSIHDAAApAYAIFUAALkHACBWAAC5BwAgkgQAAACnBQKTBAAAAKcFCJQEAAAApwUImQQAALgHpwUiBJIEAAAApwUCkwQAAACnBQiUBAAAAKcFCJkEAAC5B6cFIgKRBAEAAAABmwUBAAAAAQsGAADABgAgOAAAvAcAIIkEAAC7BwAwigQAAHwAEIsEAAC7BwAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhsARAAL4GACGaBQEAvwYAIZsFAQDMBgAhEjcAAMAGACA7AADGBwAgPAAA6AYAIIkEAADDBwAwigQAAG8AEIsEAADDBwAwjAQBAMwGACGQBEAAvgYAIa4EAADFB6QFIrAEQAC-BgAh4AQBAMwGACHhBAEAzAYAIeMEAADEB6IFIqAFAQDMBgAhogUBAL8GACGkBQEAzAYAIbMFAABvACC0BQAAbwAgApEEAQAAAAGZBQEAAAABCwYAAMAGACA5AAC_BwAgiQQAAL4HADCKBAAAdwAQiwQAAL4HADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACGwBEAAvgYAIZgFQADPBgAhmQUBAMwGACEROAAAvAcAIDoAAOkGACCJBAAAwQcAMIoEAABzABCLBAAAwQcAMIwEAQDMBgAhkARAAL4GACGwBEAAvgYAIeAEAQDMBgAh4QQBAL8GACGbBQEAzAYAIZwFAgDRBgAhnQUBAL8GACGeBQEAvwYAIZ8FAgDCBwAhswUAAHMAILQFAABzACACmwUBAAAAAZwFAgAAAAEPOAAAvAcAIDoAAOkGACCJBAAAwQcAMIoEAABzABCLBAAAwQcAMIwEAQDMBgAhkARAAL4GACGwBEAAvgYAIeAEAQDMBgAh4QQBAL8GACGbBQEAzAYAIZwFAgDRBgAhnQUBAL8GACGeBQEAvwYAIZ8FAgDCBwAhCJIEAgAAAAGTBAIAAAAFlAQCAAAABZUEAgAAAAGWBAIAAAABlwQCAAAAAZgEAgAAAAGZBAIAoQYAIRA3AADABgAgOwAAxgcAIDwAAOgGACCJBAAAwwcAMIoEAABvABCLBAAAwwcAMIwEAQDMBgAhkARAAL4GACGuBAAAxQekBSKwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAAAxAeiBSKgBQEAzAYAIaIFAQC_BgAhpAUBAMwGACEEkgQAAACiBQKTBAAAAKIFCJQEAAAAogUImQQAAKwHogUiBJIEAAAApAUCkwQAAACkBQiUBAAAAKQFCJkEAACqB6QFIgPHBAAAcwAgyAQAAHMAIMkEAABzACAOLAAAyQcAIC4AAMAGACCJBAAAxwcAMIoEAABnABCLBAAAxwcAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHKBAEAzAYAIcsEAQDMBgAhzQQBAL8GACEEkgQAAADNBAKTBAAAAM0ECJQEAAAAzQQImQQAAO0GzQQiFisAAPcGACAxAAD2BgAgiQQAAPIGADCKBAAAZQAQiwQAAPIGADCMBAEAzAYAIZAEQAC-BgAhqAQIAPMGACGpBAEAzAYAIasEAAD1BqsEIq4EAAD0BtAEIq8EAQC_BgAhsARAAL4GACHOBAgA8wYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIdMEQADPBgAh1AQIAPMGACHVBAEAzAYAIbMFAABlACC0BQAAZQAgFiwAAM4HACAuAADABgAgLwAAzQcAIDAAAMAGACCJBAAAygcAMIoEAABhABCLBAAAygcAMIwEAQDMBgAhkARAAL4GACGuBAAAywfXBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHXBEAAvgYAIdgEQAC-BgAh2QQIAPMGACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACHdBAgAzAcAId4EAQDMBgAh3wQBAMwGACEEkgQAAADXBAKTBAAAANcECJQEAAAA1wQImQQAAP4G1wQiCJIECAAAAAGTBAgAAAAFlAQIAAAABZUECAAAAAGWBAgAAAABlwQIAAAAAZgECAAAAAGZBAgA_AYAIRUuAADABgAgMgAA5QYAIIkEAADPBwAwigQAAF0AEIsEAADPBwAwjAQBAMwGACGQBEAAvgYAIa4EAADRB-cEIrAEQAC-BgAhygQBAMwGACHOBAgA8wYAIeAEAQDMBgAh4QQBAMwGACHjBAAA0AfjBCLkBAEAzAYAIeUECADzBgAh5wQgAM4GACHoBAEAvwYAIekEAACCBwAgswUAAF0AILQFAABdACAWKwAA9wYAIDEAAPYGACCJBAAA8gYAMIoEAABlABCLBAAA8gYAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAAPQG0AQirwQBAL8GACGwBEAAvgYAIc4ECADzBgAh0ARAAM8GACHRBEAAzwYAIdIEQADPBgAh0wRAAM8GACHUBAgA8wYAIdUEAQDMBgAhswUAAGUAILQFAABlACATLgAAwAYAIDIAAOUGACCJBAAAzwcAMIoEAABdABCLBAAAzwcAMIwEAQDMBgAhkARAAL4GACGuBAAA0QfnBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHgBAEAzAYAIeEEAQDMBgAh4wQAANAH4wQi5AQBAMwGACHlBAgA8wYAIecEIADOBgAh6AQBAL8GACHpBAAAggcAIASSBAAAAOMEApMEAAAA4wQIlAQAAADjBAiZBAAAhgfjBCIEkgQAAADnBAKTBAAAAOcECJQEAAAA5wQImQQAAIQH5wQiDgEAAMAGACAsAADTBwAgiQQAANIHADCKBAAAWAAQiwQAANIHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHLBAEAzAYAIc0EAQC_BgAhExcAALQHACArAAC1BwAgiQQAALIHADCKBAAAoQEAEIsEAACyBwAwjAQBAMwGACGQBEAAvgYAIagECADzBgAhqQQBAMwGACGrBAAA9QarBCKuBAAAswemBSKvBAEAvwYAIbAEQAC-BgAh0ARAAM8GACHRBEAAzwYAIdIEQADPBgAh8QQBAMwGACGzBQAAoQEAILQFAAChAQAgCiAAAMAGACAnAADVBwAgiQQAANQHADCKBAAAUgAQiwQAANQHADCMBAEAzAYAIZAEQAC-BgAh7wQBAMwGACHyBAEAzAYAIfMEAQDMBgAhEAEAAMAGACAoAADiBgAgiQQAANYHADCKBAAATgAQiwQAANYHADCMBAEAzAYAIZAEQAC-BgAhogQBAMwGACGkBAEAzAYAIaUEAgDRBgAhpgQBAMwGACGwBEAAvgYAIeEEAQDMBgAh9AQCANEGACGzBQAATgAgtAUAAE4AIA4BAADABgAgKAAA4gYAIIkEAADWBwAwigQAAE4AEIsEAADWBwAwjAQBAMwGACGQBEAAvgYAIaIEAQDMBgAhpAQBAMwGACGlBAIA0QYAIaYEAQDMBgAhsARAAL4GACHhBAEAzAYAIfQEAgDRBgAhAqYEAQAAAAGLBQEAAAABCwEAAMAGACARAADABgAgEgAA3wYAIIkEAADYBwAwigQAAEkAEIsEAADYBwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACGLBQEAzAYAIQ0XAAC0BwAgIAAAwAYAICEAAMAGACCJBAAA2QcAMIoEAABDABCLBAAA2QcAMIwEAQDMBgAhkARAAL4GACHtBAIA0QYAIe4EAQC_BgAh7wQBAMwGACHwBAEAzAYAIfEEAQDMBgAhExEAAMAGACAVAADcBgAgiQQAANoHADCKBAAAPAAQiwQAANoHADCMBAEAzAYAIZAEQAC-BgAhsARAAL4GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIYsFAQDMBgAhkAUIAPMGACGRBQEAvwYAIZIFQADPBgAhkwUBAL8GACGUBQEAvwYAIZUFIADOBgAhAqYEAQAAAAGPBQEAAAABDwEAAMAGACAWAADeBwAgFwAA3wcAIBgAAN8GACCJBAAA3AcAMIoEAAAwABCLBAAA3AcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIa4EAADdB48FIrAEQAC-BgAhjAUBAMwGACGNBQgAzAcAIY8FAQDMBgAhBJIEAAAAjwUCkwQAAACPBQiUBAAAAI8FCJkEAACeB48FIhURAADABgAgFQAA3AYAIIkEAADaBwAwigQAADwAEIsEAADaBwAwjAQBAMwGACGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAzAYAIeMEAQDMBgAh5AQBAMwGACGLBQEAzAYAIZAFCADzBgAhkQUBAL8GACGSBUAAzwYAIZMFAQC_BgAhlAUBAL8GACGVBSAAzgYAIbMFAAA8ACC0BQAAPAAgHAEAAMAGACARAADABgAgGQAA5AcAIBoAAOUHACAsAADoBwAgQAAA6QcAIIkEAADmBwAwigQAACcAEIsEAADmBwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAOcHpwUisARAAL4GACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACGJBQEAvwYAIYoFAQC_BgAhiwUBAMwGACGnBUAAzwYAIagFAQC_BgAhqQUBAL8GACGqBQgAzAcAIasFAQC_BgAhrAUBAL8GACGzBQAAJwAgtAUAACcAIBITAADjBwAgFAAAwAYAIBkAAOQHACAaAADlBwAgiQQAAOAHADCKBAAAKgAQiwQAAOAHADCMBAEAzAYAIZAEQAC-BgAh8wQBAMwGACGCBQAA4QeCBSKDBQgAzAcAIYUFAADiB4UFI4YFQADPBgAhhwUBAMwGACGIBQEAzAYAIYkFAQC_BgAhigUBAL8GACEEkgQAAACCBQKTBAAAAIIFCJQEAAAAggUImQQAAJkHggUiBJIEAAAAhQUDkwQAAACFBQmUBAAAAIUFCZkEAACXB4UFIw0BAADABgAgEQAAwAYAIBIAAN8GACCJBAAA2AcAMIoEAABJABCLBAAA2AcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIbAEQAC-BgAhiwUBAMwGACGzBQAASQAgtAUAAEkAIBEBAADABgAgFgAA3gcAIBcAAN8HACAYAADfBgAgiQQAANwHADCKBAAAMAAQiwQAANwHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGuBAAA3QePBSKwBEAAvgYAIYwFAQDMBgAhjQUIAMwHACGPBQEAzAYAIbMFAAAwACC0BQAAMAAgFQEAAMAGACAQAADdBgAgGAAA3wYAIIkEAADqBwAwigQAACMAEIsEAADqBwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACHBBCAAzgYAIcIEQADPBgAh4AQBAMwGACHhBAEAzAYAIeMEAQDMBgAh5AQBAMwGACGRBQEAvwYAIZYFCADzBgAhlwUgAM4GACGzBQAAIwAgtAUAACMAIBoBAADABgAgEQAAwAYAIBkAAOQHACAaAADlBwAgLAAA6AcAIEAAAOkHACCJBAAA5gcAMIoEAAAnABCLBAAA5gcAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIa4EAADnB6cFIrAEQAC-BgAh2gQBAL8GACHbBAEAvwYAIdwEAQC_BgAhiQUBAL8GACGKBQEAvwYAIYsFAQDMBgAhpwVAAM8GACGoBQEAvwYAIakFAQC_BgAhqgUIAMwHACGrBQEAvwYAIawFAQC_BgAhBJIEAAAApwUCkwQAAACnBQiUBAAAAKcFCJkEAAC5B6cFIhMXAAC0BwAgKwAAtQcAIIkEAACyBwAwigQAAKEBABCLBAAAsgcAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirgQAALMHpgUirwQBAL8GACGwBEAAvgYAIdAEQADPBgAh0QRAAM8GACHSBEAAzwYAIfEEAQDMBgAhswUAAKEBACC0BQAAoQEAIA8XAAC0BwAgIAAAwAYAICEAAMAGACCJBAAA2QcAMIoEAABDABCLBAAA2QcAMIwEAQDMBgAhkARAAL4GACHtBAIA0QYAIe4EAQC_BgAh7wQBAMwGACHwBAEAzAYAIfEEAQDMBgAhswUAAEMAILQFAABDACATAQAAwAYAIBAAAN0GACAYAADfBgAgiQQAAOoHADCKBAAAIwAQiwQAAOoHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIcEEIADOBgAhwgRAAM8GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIZEFAQC_BgAhlgUIAPMGACGXBSAAzgYAIQoGAADABgAgiQQAAOsHADCKBAAAHwAQiwQAAOsHADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACH8BAEAzAYAIf0EAQDMBgAh_gQBAMwGACEPBgAAwAYAIAoAAO8HACCJBAAA7AcAMIoEAAAZABCLBAAA7AcAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIa4EAADuB_kEIrAEQAC-BgAh9QQBAMwGACH3BAAA7Qf3BCL5BAIA0QYAIfoEQAC-BgAh-wQBAL8GACEEkgQAAAD3BAKTBAAAAPcECJQEAAAA9wQImQQAAJAH9wQiBJIEAAAA-QQCkwQAAAD5BAiUBAAAAPkECJkEAACOB_kEIg8GAADABgAgCwAA2AYAIIkEAADwBwAwigQAABUAEIsEAADwBwAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhoAQBAMwGACHgBAEAzAYAIfMEAQDMBgAh_wQBAL8GACGABSAAzgYAIbMFAAAVACC0BQAAFQAgDQYAAMAGACALAADYBgAgiQQAAPAHADCKBAAAFQAQiwQAAPAHADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACGgBAEAzAYAIeAEAQDMBgAh8wQBAMwGACH_BAEAvwYAIYAFIADOBgAhCgYAAMAGACCJBAAA8QcAMIoEAAARABCLBAAA8QcAMIwEAQDMBgAhjQQBAMwGACGOBEAAvgYAIY8EQADPBgAhkARAAL4GACGRBAEAzAYAIQoGAADABgAgiQQAAPIHADCKBAAADQAQiwQAAPIHADCMBAEAzAYAIY4EQAC-BgAhkARAAL4GACGRBAEAzAYAIZ0EAQDMBgAhngQCANEGACEDkQQBAAAAAaAEAAAAoAQCoQQCAAAAAQ0GAADABgAgiQQAAPQHADCKBAAACQAQiwQAAPQHADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACGgBAAA9QegBCKhBAIA0QYAIaIEAQDMBgAhowQBAMwGACGkBAEAzAYAIaUEAgDRBgAhBJIEAAAAoAQCkwQAAACgBAiUBAAAAKAECJkEAACvBqAEIg8BAADABgAgiQQAAPYHADCKBAAABQAQiwQAAPYHADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGnBAIA0QYAIagECADzBgAhqQQBAMwGACGrBAAA9QarBCKsBAEAzAYAIa4EAAD3B64EIq8EAQDMBgAhsARAAL4GACEEkgQAAACuBAKTBAAAAK4ECJQEAAAArgQImQQAALUGrgQiAAAAAAG4BQEAAAABAbgFQAAAAAEBuAVAAAAAAQVNAACyEAAgTgAAtRAAILUFAACzEAAgtgUAALQQACC7BQAAkwUAIANNAACyEAAgtQUAALMQACC7BQAAkwUAIAAAAAAABbgFAgAAAAG_BQIAAAABwAUCAAAAAcEFAgAAAAHCBQIAAAABBU0AAK0QACBOAACwEAAgtQUAAK4QACC2BQAArxAAILsFAACTBQAgA00AAK0QACC1BQAArhAAILsFAACTBQAgAAAAAAABuAUAAACgBAIFTQAAqBAAIE4AAKsQACC1BQAAqRAAILYFAACqEAAguwUAAJMFACADTQAAqBAAILUFAACpEAAguwUAAJMFACAAAAAAAAW4BQgAAAABvwUIAAAAAcAFCAAAAAHBBQgAAAABwgUIAAAAAQG4BQAAAKsEAgG4BQAAAK4EAgVNAACjEAAgTgAAphAAILUFAACkEAAgtgUAAKUQACC7BQAAkwUAIANNAACjEAAgtQUAAKQQACC7BQAAkwUAIAAAAAG4BQEAAAABBU0AAJ4QACBOAAChEAAgtQUAAJ8QACC2BQAAoBAAILsFAACTBQAgA00AAJ4QACC1BQAAnxAAILsFAACTBQAgJAIAAJMNACAFAACUDQAgBwAAlQ0AIAgAAJYNACAJAACXDQAgDQAAmA0AIA4AAJkNACAPAACaDQAgGwAAmw0AIBwAAJwNACAdAACdDQAgHgAAng0AIB8AAJ4NACAiAACfDQAgIwAAnw0AICQAAKANACAlAAChDQAgJgAAoQ0AICkAAKINACAqAACjDQAgLQAApA0AIDMAAKUNACA0AACmDQAgNQAApg0AIDYAAKcNACA9AACoDQAgPgAAqQ0AID8AAKoNACCsBAAA-AcAILgEAAD4BwAguQQAAPgHACC7BAAA-AcAIMAEAAD4BwAgwgQAAPgHACDDBAAA-AcAIMUEAAD4BwAgAAAAAAABuAUAAAC3BAIBuAUgAAAAAQG4BQAAAL8EAgdNAADyDAAgTgAA9QwAILUFAADzDAAgtgUAAPQMACC5BQAAAwAgugUAAAMAILsFAACsBQAgC00AAOYMADBOAADrDAAwtQUAAOcMADC2BQAA6AwAMLcFAADpDAAguAUAAOoMADC5BQAA6gwAMLoFAADqDAAwuwUAAOoMADC8BQAA7AwAML0FAADtDAAwC00AANoMADBOAADfDAAwtQUAANsMADC2BQAA3AwAMLcFAADdDAAguAUAAN4MADC5BQAA3gwAMLoFAADeDAAwuwUAAN4MADC8BQAA4AwAML0FAADhDAAwC00AAM4MADBOAADTDAAwtQUAAM8MADC2BQAA0AwAMLcFAADRDAAguAUAANIMADC5BQAA0gwAMLoFAADSDAAwuwUAANIMADC8BQAA1AwAML0FAADVDAAwC00AAMIMADBOAADHDAAwtQUAAMMMADC2BQAAxAwAMLcFAADFDAAguAUAAMYMADC5BQAAxgwAMLoFAADGDAAwuwUAAMYMADC8BQAAyAwAML0FAADJDAAwC00AAKkMADBOAACuDAAwtQUAAKoMADC2BQAAqwwAMLcFAACsDAAguAUAAK0MADC5BQAArQwAMLoFAACtDAAwuwUAAK0MADC8BQAArwwAML0FAACwDAAwC00AAJkMADBOAACeDAAwtQUAAJoMADC2BQAAmwwAMLcFAACcDAAguAUAAJ0MADC5BQAAnQwAMLoFAACdDAAwuwUAAJ0MADC8BQAAnwwAML0FAACgDAAwC00AAI0MADBOAACSDAAwtQUAAI4MADC2BQAAjwwAMLcFAACQDAAguAUAAJEMADC5BQAAkQwAMLoFAACRDAAwuwUAAJEMADC8BQAAkwwAML0FAACUDAAwC00AAOsLADBOAADwCwAwtQUAAOwLADC2BQAA7QsAMLcFAADuCwAguAUAAO8LADC5BQAA7wsAMLoFAADvCwAwuwUAAO8LADC8BQAA8QsAML0FAADyCwAwC00AANILADBOAADXCwAwtQUAANMLADC2BQAA1AsAMLcFAADVCwAguAUAANYLADC5BQAA1gsAMLoFAADWCwAwuwUAANYLADC8BQAA2AsAML0FAADZCwAwC00AALELADBOAAC2CwAwtQUAALILADC2BQAAswsAMLcFAAC0CwAguAUAALULADC5BQAAtQsAMLoFAAC1CwAwuwUAALULADC8BQAAtwsAML0FAAC4CwAwC00AAKYLADBOAACqCwAwtQUAAKcLADC2BQAAqAsAMLcFAACpCwAguAUAAP8KADC5BQAA_woAMLoFAAD_CgAwuwUAAP8KADC8BQAAqwsAML0FAACCCwAwC00AAPsKADBOAACACwAwtQUAAPwKADC2BQAA_QoAMLcFAAD-CgAguAUAAP8KADC5BQAA_woAMLoFAAD_CgAwuwUAAP8KADC8BQAAgQsAML0FAACCCwAwC00AAPAKADBOAAD0CgAwtQUAAPEKADC2BQAA8goAMLcFAADzCgAguAUAAOQKADC5BQAA5AoAMLoFAADkCgAwuwUAAOQKADC8BQAA9QoAML0FAADnCgAwC00AAOAKADBOAADlCgAwtQUAAOEKADC2BQAA4goAMLcFAADjCgAguAUAAOQKADC5BQAA5AoAMLoFAADkCgAwuwUAAOQKADC8BQAA5goAML0FAADnCgAwC00AANUKADBOAADZCgAwtQUAANYKADC2BQAA1woAMLcFAADYCgAguAUAALcKADC5BQAAtwoAMLoFAAC3CgAwuwUAALcKADC8BQAA2goAML0FAAC6CgAwC00AAMoKADBOAADOCgAwtQUAAMsKADC2BQAAzAoAMLcFAADNCgAguAUAAKoKADC5BQAAqgoAMLoFAACqCgAwuwUAAKoKADC8BQAAzwoAML0FAACtCgAwC00AAKYKADBOAACrCgAwtQUAAKcKADC2BQAAqAoAMLcFAACpCgAguAUAAKoKADC5BQAAqgoAMLoFAACqCgAwuwUAAKoKADC8BQAArAoAML0FAACtCgAwC00AAI0KADBOAACSCgAwtQUAAI4KADC2BQAAjwoAMLcFAACQCgAguAUAAJEKADC5BQAAkQoAMLoFAACRCgAwuwUAAJEKADC8BQAAkwoAML0FAACUCgAwC00AAP8JADBOAACECgAwtQUAAIAKADC2BQAAgQoAMLcFAACCCgAguAUAAIMKADC5BQAAgwoAMLoFAACDCgAwuwUAAIMKADC8BQAAhQoAML0FAACGCgAwC00AAPEJADBOAAD2CQAwtQUAAPIJADC2BQAA8wkAMLcFAAD0CQAguAUAAPUJADC5BQAA9QkAMLoFAAD1CQAwuwUAAPUJADC8BQAA9wkAML0FAAD4CQAwC00AANYJADBOAADbCQAwtQUAANcJADC2BQAA2AkAMLcFAADZCQAguAUAANoJADC5BQAA2gkAMLoFAADaCQAwuwUAANoJADC8BQAA3AkAML0FAADdCQAwC00AAMsJADBOAADPCQAwtQUAAMwJADC2BQAAzQkAMLcFAADOCQAguAUAAKwJADC5BQAArAkAMLoFAACsCQAwuwUAAKwJADC8BQAA0AkAML0FAACvCQAwC00AAKgJADBOAACtCQAwtQUAAKkJADC2BQAAqgkAMLcFAACrCQAguAUAAKwJADC5BQAArAkAMLoFAACsCQAwuwUAAKwJADC8BQAArgkAML0FAACvCQAwC00AAJkJADBOAACeCQAwtQUAAJoJADC2BQAAmwkAMLcFAACcCQAguAUAAJ0JADC5BQAAnQkAMLoFAACdCQAwuwUAAJ0JADC8BQAAnwkAML0FAACgCQAwC00AAOIIADBOAADnCAAwtQUAAOMIADC2BQAA5AgAMLcFAADlCAAguAUAAOYIADC5BQAA5ggAMLoFAADmCAAwuwUAAOYIADC8BQAA6AgAML0FAADpCAAwC00AANQIADBOAADZCAAwtQUAANUIADC2BQAA1ggAMLcFAADXCAAguAUAANgIADC5BQAA2AgAMLoFAADYCAAwuwUAANgIADC8BQAA2ggAML0FAADbCAAwC00AAMYIADBOAADLCAAwtQUAAMcIADC2BQAAyAgAMLcFAADJCAAguAUAAMoIADC5BQAAyggAMLoFAADKCAAwuwUAAMoIADC8BQAAzAgAML0FAADNCAAwBjkAANMIACCMBAEAAAABkARAAAAAAbAEQAAAAAGYBUAAAAABmQUBAAAAAQIAAAB5ACBNAADSCAAgAwAAAHkAIE0AANIIACBOAADQCAAgAUYAAJ0QADAMBgAAwAYAIDkAAL8HACCJBAAAvgcAMIoEAAB3ABCLBAAAvgcAMIwEAQAAAAGQBEAAvgYAIZEEAQDMBgAhsARAAL4GACGYBUAAzwYAIZkFAQDMBgAhrgUAAL0HACACAAAAeQAgRgAA0AgAIAIAAADOCAAgRgAAzwgAIAmJBAAAzQgAMIoEAADOCAAQiwQAAM0IADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACGwBEAAvgYAIZgFQADPBgAhmQUBAMwGACEJiQQAAM0IADCKBAAAzggAEIsEAADNCAAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhsARAAL4GACGYBUAAzwYAIZkFAQDMBgAhBYwEAQD8BwAhkARAAP0HACGwBEAA_QcAIZgFQAD-BwAhmQUBAPwHACEGOQAA0QgAIIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIZgFQAD-BwAhmQUBAPwHACEFTQAAmBAAIE4AAJsQACC1BQAAmRAAILYFAACaEAAguwUAAHUAIAY5AADTCAAgjAQBAAAAAZAEQAAAAAGwBEAAAAABmAVAAAAAAZkFAQAAAAEDTQAAmBAAILUFAACZEAAguwUAAHUAIAY4AADhCAAgjAQBAAAAAZAEQAAAAAGwBEAAAAABmgUBAAAAAZsFAQAAAAECAAAAfgAgTQAA4AgAIAMAAAB-ACBNAADgCAAgTgAA3ggAIAFGAACXEAAwDAYAAMAGACA4AAC8BwAgiQQAALsHADCKBAAAfAAQiwQAALsHADCMBAEAAAABkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmgUBAL8GACGbBQEAzAYAIa0FAAC6BwAgAgAAAH4AIEYAAN4IACACAAAA3AgAIEYAAN0IACAJiQQAANsIADCKBAAA3AgAEIsEAADbCAAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhsARAAL4GACGaBQEAvwYAIZsFAQDMBgAhCYkEAADbCAAwigQAANwIABCLBAAA2wgAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIbAEQAC-BgAhmgUBAL8GACGbBQEAzAYAIQWMBAEA_AcAIZAEQAD9BwAhsARAAP0HACGaBQEAnggAIZsFAQD8BwAhBjgAAN8IACCMBAEA_AcAIZAEQAD9BwAhsARAAP0HACGaBQEAnggAIZsFAQD8BwAhBU0AAJIQACBOAACVEAAgtQUAAJMQACC2BQAAlBAAILsFAABxACAGOAAA4QgAIIwEAQAAAAGQBEAAAAABsARAAAAAAZoFAQAAAAGbBQEAAAABA00AAJIQACC1BQAAkxAAILsFAABxACALOwAAlwkAIDwAAJgJACCMBAEAAAABkARAAAAAAa4EAAAApAUCsARAAAAAAeAEAQAAAAHhBAEAAAAB4wQAAACiBQKgBQEAAAABogUBAAAAAQIAAABxACBNAACWCQAgAwAAAHEAIE0AAJYJACBOAADuCAAgAUYAAJEQADAQNwAAwAYAIDsAAMYHACA8AADoBgAgiQQAAMMHADCKBAAAbwAQiwQAAMMHADCMBAEAAAABkARAAL4GACGuBAAAxQekBSKwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAAAxAeiBSKgBQEAAAABogUBAL8GACGkBQEAzAYAIQIAAABxACBGAADuCAAgAgAAAOoIACBGAADrCAAgDYkEAADpCAAwigQAAOoIABCLBAAA6QgAMIwEAQDMBgAhkARAAL4GACGuBAAAxQekBSKwBEAAvgYAIeAEAQDMBgAh4QQBAMwGACHjBAAAxAeiBSKgBQEAzAYAIaIFAQC_BgAhpAUBAMwGACENiQQAAOkIADCKBAAA6ggAEIsEAADpCAAwjAQBAMwGACGQBEAAvgYAIa4EAADFB6QFIrAEQAC-BgAh4AQBAMwGACHhBAEAzAYAIeMEAADEB6IFIqAFAQDMBgAhogUBAL8GACGkBQEAzAYAIQmMBAEA_AcAIZAEQAD9BwAhrgQAAO0IpAUisARAAP0HACHgBAEA_AcAIeEEAQD8BwAh4wQAAOwIogUioAUBAPwHACGiBQEAnggAIQG4BQAAAKIFAgG4BQAAAKQFAgs7AADvCAAgPAAA8AgAIIwEAQD8BwAhkARAAP0HACGuBAAA7QikBSKwBEAA_QcAIeAEAQD8BwAh4QQBAPwHACHjBAAA7AiiBSKgBQEA_AcAIaIFAQCeCAAhC00AAPwIADBOAACBCQAwtQUAAP0IADC2BQAA_ggAMLcFAAD_CAAguAUAAIAJADC5BQAAgAkAMLoFAACACQAwuwUAAIAJADC8BQAAggkAML0FAACDCQAwC00AAPEIADBOAAD1CAAwtQUAAPIIADC2BQAA8wgAMLcFAAD0CAAguAUAANgIADC5BQAA2AgAMLoFAADYCAAwuwUAANgIADC8BQAA9ggAML0FAADbCAAwBgYAAPsIACCMBAEAAAABkARAAAAAAZEEAQAAAAGwBEAAAAABmgUBAAAAAQIAAAB-ACBNAAD6CAAgAwAAAH4AIE0AAPoIACBOAAD4CAAgAUYAAJAQADACAAAAfgAgRgAA-AgAIAIAAADcCAAgRgAA9wgAIAWMBAEA_AcAIZAEQAD9BwAhkQQBAPwHACGwBEAA_QcAIZoFAQCeCAAhBgYAAPkIACCMBAEA_AcAIZAEQAD9BwAhkQQBAPwHACGwBEAA_QcAIZoFAQCeCAAhBU0AAIsQACBOAACOEAAgtQUAAIwQACC2BQAAjRAAILsFAACTBQAgBgYAAPsIACCMBAEAAAABkARAAAAAAZEEAQAAAAGwBEAAAAABmgUBAAAAAQNNAACLEAAgtQUAAIwQACC7BQAAkwUAIAo6AACVCQAgjAQBAAAAAZAEQAAAAAGwBEAAAAAB4AQBAAAAAeEEAQAAAAGcBQIAAAABnQUBAAAAAZ4FAQAAAAGfBQIAAAABAgAAAHUAIE0AAJQJACADAAAAdQAgTQAAlAkAIE4AAIcJACABRgAAihAAMBA4AAC8BwAgOgAA6QYAIIkEAADBBwAwigQAAHMAEIsEAADBBwAwjAQBAAAAAZAEQAC-BgAhsARAAL4GACHgBAEAzAYAIeEEAQC_BgAhmwUBAMwGACGcBQIA0QYAIZ0FAQC_BgAhngUBAL8GACGfBQIAwgcAIa8FAADABwAgAgAAAHUAIEYAAIcJACACAAAAhAkAIEYAAIUJACANiQQAAIMJADCKBAAAhAkAEIsEAACDCQAwjAQBAMwGACGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAvwYAIZsFAQDMBgAhnAUCANEGACGdBQEAvwYAIZ4FAQC_BgAhnwUCAMIHACENiQQAAIMJADCKBAAAhAkAEIsEAACDCQAwjAQBAMwGACGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAvwYAIZsFAQDMBgAhnAUCANEGACGdBQEAvwYAIZ4FAQC_BgAhnwUCAMIHACEJjAQBAPwHACGQBEAA_QcAIbAEQAD9BwAh4AQBAPwHACHhBAEAnggAIZwFAgCGCAAhnQUBAJ4IACGeBQEAnggAIZ8FAgCGCQAhBbgFAgAAAAG_BQIAAAABwAUCAAAAAcEFAgAAAAHCBQIAAAABCjoAAIgJACCMBAEA_AcAIZAEQAD9BwAhsARAAP0HACHgBAEA_AcAIeEEAQCeCAAhnAUCAIYIACGdBQEAnggAIZ4FAQCeCAAhnwUCAIYJACELTQAAiQkAME4AAI0JADC1BQAAigkAMLYFAACLCQAwtwUAAIwJACC4BQAAyggAMLkFAADKCAAwugUAAMoIADC7BQAAyggAMLwFAACOCQAwvQUAAM0IADAGBgAAkwkAIIwEAQAAAAGQBEAAAAABkQQBAAAAAbAEQAAAAAGYBUAAAAABAgAAAHkAIE0AAJIJACADAAAAeQAgTQAAkgkAIE4AAJAJACABRgAAiRAAMAIAAAB5ACBGAACQCQAgAgAAAM4IACBGAACPCQAgBYwEAQD8BwAhkARAAP0HACGRBAEA_AcAIbAEQAD9BwAhmAVAAP4HACEGBgAAkQkAIIwEAQD8BwAhkARAAP0HACGRBAEA_AcAIbAEQAD9BwAhmAVAAP4HACEFTQAAhBAAIE4AAIcQACC1BQAAhRAAILYFAACGEAAguwUAAJMFACAGBgAAkwkAIIwEAQAAAAGQBEAAAAABkQQBAAAAAbAEQAAAAAGYBUAAAAABA00AAIQQACC1BQAAhRAAILsFAACTBQAgCjoAAJUJACCMBAEAAAABkARAAAAAAbAEQAAAAAHgBAEAAAAB4QQBAAAAAZwFAgAAAAGdBQEAAAABngUBAAAAAZ8FAgAAAAEETQAAiQkAMLUFAACKCQAwtwUAAIwJACC7BQAAyggAMAs7AACXCQAgPAAAmAkAIIwEAQAAAAGQBEAAAAABrgQAAACkBQKwBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAAAAKIFAqAFAQAAAAGiBQEAAAABBE0AAPwIADC1BQAA_QgAMLcFAAD_CAAguwUAAIAJADAETQAA8QgAMLUFAADyCAAwtwUAAPQIACC7BQAA2AgAMAksAACnCQAgjAQBAAAAAZAEQAAAAAGoBAgAAAABqQQBAAAAAa4EAAAAzQQCsARAAAAAAcsEAQAAAAHNBAEAAAABAgAAAG0AIE0AAKYJACADAAAAbQAgTQAApgkAIE4AAKQJACABRgAAgxAAMA4sAADJBwAgLgAAwAYAIIkEAADHBwAwigQAAGcAEIsEAADHBwAwjAQBAAAAAZAEQAC-BgAhqAQIAPMGACGpBAEAzAYAIa4EAADIB80EIrAEQAC-BgAhygQBAMwGACHLBAEAAAABzQQBAL8GACECAAAAbQAgRgAApAkAIAIAAAChCQAgRgAAogkAIAyJBAAAoAkAMIoEAAChCQAQiwQAAKAJADCMBAEAzAYAIZAEQAC-BgAhqAQIAPMGACGpBAEAzAYAIa4EAADIB80EIrAEQAC-BgAhygQBAMwGACHLBAEAzAYAIc0EAQC_BgAhDIkEAACgCQAwigQAAKEJABCLBAAAoAkAMIwEAQDMBgAhkARAAL4GACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHKBAEAzAYAIcsEAQDMBgAhzQQBAL8GACEIjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGuBAAAownNBCKwBEAA_QcAIcsEAQD8BwAhzQQBAJ4IACEBuAUAAADNBAIJLAAApQkAIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHLBAEA_AcAIc0EAQCeCAAhBU0AAP4PACBOAACBEAAgtQUAAP8PACC2BQAAgBAAILsFAADlBAAgCSwAAKcJACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABrgQAAADNBAKwBEAAAAABywQBAAAAAc0EAQAAAAEDTQAA_g8AILUFAAD_DwAguwUAAOUEACARLAAAygkAIC8AAMgJACAwAADJCQAgjAQBAAAAAZAEQAAAAAGuBAAAANcEArAEQAAAAAHOBAgAAAAB1wRAAAAAAdgEQAAAAAHZBAgAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAAB3QQIAAAAAd4EAQAAAAHfBAEAAAABAgAAAGMAIE0AAMcJACADAAAAYwAgTQAAxwkAIE4AALQJACABRgAA_Q8AMBYsAADOBwAgLgAAwAYAIC8AAM0HACAwAADABgAgiQQAAMoHADCKBAAAYQAQiwQAAMoHADCMBAEAAAABkARAAL4GACGuBAAAywfXBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHXBEAAvgYAIdgEQAC-BgAh2QQIAPMGACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACHdBAgAzAcAId4EAQDMBgAh3wQBAMwGACECAAAAYwAgRgAAtAkAIAIAAACwCQAgRgAAsQkAIBKJBAAArwkAMIoEAACwCQAQiwQAAK8JADCMBAEAzAYAIZAEQAC-BgAhrgQAAMsH1wQisARAAL4GACHKBAEAzAYAIc4ECADzBgAh1wRAAL4GACHYBEAAvgYAIdkECADzBgAh2gQBAL8GACHbBAEAvwYAIdwEAQC_BgAh3QQIAMwHACHeBAEAzAYAId8EAQDMBgAhEokEAACvCQAwigQAALAJABCLBAAArwkAMIwEAQDMBgAhkARAAL4GACGuBAAAywfXBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHXBEAAvgYAIdgEQAC-BgAh2QQIAPMGACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACHdBAgAzAcAId4EAQDMBgAh3wQBAMwGACEOjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhzgQIAJYIACHXBEAA_QcAIdgEQAD9BwAh2QQIAJYIACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACHdBAgAswkAId4EAQD8BwAh3wQBAPwHACEBuAUAAADXBAIFuAUIAAAAAb8FCAAAAAHABQgAAAABwQUIAAAAAcIFCAAAAAERLAAAtwkAIC8AALUJACAwAAC2CQAgjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhzgQIAJYIACHXBEAA_QcAIdgEQAD9BwAh2QQIAJYIACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACHdBAgAswkAId4EAQD8BwAh3wQBAPwHACEFTQAA8A8AIE4AAPsPACC1BQAA8Q8AILYFAAD6DwAguwUAAF8AIAVNAADuDwAgTgAA-A8AILUFAADvDwAgtgUAAPcPACC7BQAAkwUAIAdNAAC4CQAgTgAAuwkAILUFAAC5CQAgtgUAALoJACC5BQAAZQAgugUAAGUAILsFAADlBAAgDysAAMYJACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABqwQAAACrBAKuBAAAANAEAq8EAQAAAAGwBEAAAAABzgQIAAAAAdAEQAAAAAHRBEAAAAAB0gRAAAAAAdMEQAAAAAHUBAgAAAABAgAAAOUEACBNAAC4CQAgAwAAAGUAIE0AALgJACBOAAC8CQAgEQAAAGUAICsAAL4JACBGAAC8CQAgjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAvQnQBCKvBAEAnggAIbAEQAD9BwAhzgQIAJYIACHQBEAA_gcAIdEEQAD-BwAh0gRAAP4HACHTBEAA_gcAIdQECACWCAAhDysAAL4JACCMBAEA_AcAIZAEQAD9BwAhqAQIAJYIACGpBAEA_AcAIasEAACXCKsEIq4EAAC9CdAEIq8EAQCeCAAhsARAAP0HACHOBAgAlggAIdAEQAD-BwAh0QRAAP4HACHSBEAA_gcAIdMEQAD-BwAh1AQIAJYIACEBuAUAAADQBAIHTQAAvwkAIE4AAMIJACC1BQAAwAkAILYFAADBCQAguQUAAGcAILoFAABnACC7BQAAbQAgCS4AAMUJACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABrgQAAADNBAKwBEAAAAABygQBAAAAAc0EAQAAAAECAAAAbQAgTQAAvwkAIAMAAABnACBNAAC_CQAgTgAAwwkAIAsAAABnACAuAADECQAgRgAAwwkAIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHKBAEA_AcAIc0EAQCeCAAhCS4AAMQJACCMBAEA_AcAIZAEQAD9BwAhqAQIAJYIACGpBAEA_AcAIa4EAACjCc0EIrAEQAD9BwAhygQBAPwHACHNBAEAnggAIQVNAADyDwAgTgAA9Q8AILUFAADzDwAgtgUAAPQPACC7BQAAkwUAIANNAADyDwAgtQUAAPMPACC7BQAAkwUAIANNAAC_CQAgtQUAAMAJACC7BQAAbQAgESwAAMoJACAvAADICQAgMAAAyQkAIIwEAQAAAAGQBEAAAAABrgQAAADXBAKwBEAAAAABzgQIAAAAAdcEQAAAAAHYBEAAAAAB2QQIAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAd0ECAAAAAHeBAEAAAAB3wQBAAAAAQNNAADwDwAgtQUAAPEPACC7BQAAXwAgA00AAO4PACC1BQAA7w8AILsFAACTBQAgA00AALgJACC1BQAAuQkAILsFAADlBAAgESwAAMoJACAuAADVCQAgLwAAyAkAIIwEAQAAAAGQBEAAAAABrgQAAADXBAKwBEAAAAABygQBAAAAAc4ECAAAAAHXBEAAAAAB2ARAAAAAAdkECAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAHdBAgAAAAB3gQBAAAAAQIAAABjACBNAADUCQAgAwAAAGMAIE0AANQJACBOAADSCQAgAUYAAO0PADACAAAAYwAgRgAA0gkAIAIAAACwCQAgRgAA0QkAIA6MBAEA_AcAIZAEQAD9BwAhrgQAALIJ1wQisARAAP0HACHKBAEA_AcAIc4ECACWCAAh1wRAAP0HACHYBEAA_QcAIdkECACWCAAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAh3QQIALMJACHeBAEA_AcAIREsAAC3CQAgLgAA0wkAIC8AALUJACCMBAEA_AcAIZAEQAD9BwAhrgQAALIJ1wQisARAAP0HACHKBAEA_AcAIc4ECACWCAAh1wRAAP0HACHYBEAA_QcAIdkECACWCAAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAh3QQIALMJACHeBAEA_AcAIQVNAADoDwAgTgAA6w8AILUFAADpDwAgtgUAAOoPACC7BQAAkwUAIBEsAADKCQAgLgAA1QkAIC8AAMgJACCMBAEAAAABkARAAAAAAa4EAAAA1wQCsARAAAAAAcoEAQAAAAHOBAgAAAAB1wRAAAAAAdgEQAAAAAHZBAgAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAAB3QQIAAAAAd4EAQAAAAEDTQAA6A8AILUFAADpDwAguwUAAJMFACAOMgAA8AkAIIwEAQAAAAGQBEAAAAABrgQAAADnBAKwBEAAAAABzgQIAAAAAeAEAQAAAAHhBAEAAAAB4wQAAADjBALkBAEAAAAB5QQIAAAAAecEIAAAAAHoBAEAAAAB6QQAAO8JACACAAAAXwAgTQAA7gkAIAMAAABfACBNAADuCQAgTgAA4wkAIAFGAADnDwAwEy4AAMAGACAyAADlBgAgiQQAAM8HADCKBAAAXQAQiwQAAM8HADCMBAEAAAABkARAAL4GACGuBAAA0QfnBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHgBAEAzAYAIeEEAQDMBgAh4wQAANAH4wQi5AQBAMwGACHlBAgA8wYAIecEIADOBgAh6AQBAL8GACHpBAAAggcAIAIAAABfACBGAADjCQAgAgAAAN4JACBGAADfCQAgEYkEAADdCQAwigQAAN4JABCLBAAA3QkAMIwEAQDMBgAhkARAAL4GACGuBAAA0QfnBCKwBEAAvgYAIcoEAQDMBgAhzgQIAPMGACHgBAEAzAYAIeEEAQDMBgAh4wQAANAH4wQi5AQBAMwGACHlBAgA8wYAIecEIADOBgAh6AQBAL8GACHpBAAAggcAIBGJBAAA3QkAMIoEAADeCQAQiwQAAN0JADCMBAEAzAYAIZAEQAC-BgAhrgQAANEH5wQisARAAL4GACHKBAEAzAYAIc4ECADzBgAh4AQBAMwGACHhBAEAzAYAIeMEAADQB-MEIuQEAQDMBgAh5QQIAPMGACHnBCAAzgYAIegEAQC_BgAh6QQAAIIHACANjAQBAPwHACGQBEAA_QcAIa4EAADhCecEIrAEQAD9BwAhzgQIAJYIACHgBAEA_AcAIeEEAQD8BwAh4wQAAOAJ4wQi5AQBAPwHACHlBAgAlggAIecEIACoCAAh6AQBAJ4IACHpBAAA4gkAIAG4BQAAAOMEAgG4BQAAAOcEAgK4BQEAAAAEvgUBAAAABQ4yAADkCQAgjAQBAPwHACGQBEAA_QcAIa4EAADhCecEIrAEQAD9BwAhzgQIAJYIACHgBAEA_AcAIeEEAQD8BwAh4wQAAOAJ4wQi5AQBAPwHACHlBAgAlggAIecEIACoCAAh6AQBAJ4IACHpBAAA4gkAIAtNAADlCQAwTgAA6QkAMLUFAADmCQAwtgUAAOcJADC3BQAA6AkAILgFAACsCQAwuQUAAKwJADC6BQAArAkAMLsFAACsCQAwvAUAAOoJADC9BQAArwkAMBEsAADKCQAgLgAA1QkAIDAAAMkJACCMBAEAAAABkARAAAAAAa4EAAAA1wQCsARAAAAAAcoEAQAAAAHOBAgAAAAB1wRAAAAAAdgEQAAAAAHZBAgAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAAB3QQIAAAAAd8EAQAAAAECAAAAYwAgTQAA7QkAIAMAAABjACBNAADtCQAgTgAA7AkAIAFGAADmDwAwAgAAAGMAIEYAAOwJACACAAAAsAkAIEYAAOsJACAOjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhygQBAPwHACHOBAgAlggAIdcEQAD9BwAh2ARAAP0HACHZBAgAlggAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAId0ECACzCQAh3wQBAPwHACERLAAAtwkAIC4AANMJACAwAAC2CQAgjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhygQBAPwHACHOBAgAlggAIdcEQAD9BwAh2ARAAP0HACHZBAgAlggAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAId0ECACzCQAh3wQBAPwHACERLAAAygkAIC4AANUJACAwAADJCQAgjAQBAAAAAZAEQAAAAAGuBAAAANcEArAEQAAAAAHKBAEAAAABzgQIAAAAAdcEQAAAAAHYBEAAAAAB2QQIAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAd0ECAAAAAHfBAEAAAABDjIAAPAJACCMBAEAAAABkARAAAAAAa4EAAAA5wQCsARAAAAAAc4ECAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAA4wQC5AQBAAAAAeUECAAAAAHnBCAAAAAB6AQBAAAAAekEAADvCQAgAbgFAQAAAAQETQAA5QkAMLUFAADmCQAwtwUAAOgJACC7BQAArAkAMAksAAD-CQAgjAQBAAAAAZAEQAAAAAGoBAgAAAABqQQBAAAAAa4EAAAAzQQCsARAAAAAAcsEAQAAAAHNBAEAAAABAgAAAFoAIE0AAP0JACADAAAAWgAgTQAA_QkAIE4AAPsJACABRgAA5Q8AMA4BAADABgAgLAAA0wcAIIkEAADSBwAwigQAAFgAEIsEAADSBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHLBAEAAAABzQQBAL8GACECAAAAWgAgRgAA-wkAIAIAAAD5CQAgRgAA-gkAIAyJBAAA-AkAMIoEAAD5CQAQiwQAAPgJADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGoBAgA8wYAIakEAQDMBgAhrgQAAMgHzQQisARAAL4GACHLBAEAzAYAIc0EAQC_BgAhDIkEAAD4CQAwigQAAPkJABCLBAAA-AkAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIagECADzBgAhqQQBAMwGACGuBAAAyAfNBCKwBEAAvgYAIcsEAQDMBgAhzQQBAL8GACEIjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGuBAAAownNBCKwBEAA_QcAIcsEAQD8BwAhzQQBAJ4IACEJLAAA_AkAIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHLBAEA_AcAIc0EAQCeCAAhBU0AAOAPACBOAADjDwAgtQUAAOEPACC2BQAA4g8AILsFAAC9AQAgCSwAAP4JACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABrgQAAADNBAKwBEAAAAABywQBAAAAAc0EAQAAAAEDTQAA4A8AILUFAADhDwAguwUAAL0BACAFJwAAjAoAIIwEAQAAAAGQBEAAAAAB8gQBAAAAAfMEAQAAAAECAAAAVAAgTQAAiwoAIAMAAABUACBNAACLCgAgTgAAiQoAIAFGAADfDwAwCiAAAMAGACAnAADVBwAgiQQAANQHADCKBAAAUgAQiwQAANQHADCMBAEAAAABkARAAL4GACHvBAEAzAYAIfIEAQDMBgAh8wQBAMwGACECAAAAVAAgRgAAiQoAIAIAAACHCgAgRgAAiAoAIAiJBAAAhgoAMIoEAACHCgAQiwQAAIYKADCMBAEAzAYAIZAEQAC-BgAh7wQBAMwGACHyBAEAzAYAIfMEAQDMBgAhCIkEAACGCgAwigQAAIcKABCLBAAAhgoAMIwEAQDMBgAhkARAAL4GACHvBAEAzAYAIfIEAQDMBgAh8wQBAMwGACEEjAQBAPwHACGQBEAA_QcAIfIEAQD8BwAh8wQBAPwHACEFJwAAigoAIIwEAQD8BwAhkARAAP0HACHyBAEA_AcAIfMEAQD8BwAhBU0AANoPACBOAADdDwAgtQUAANsPACC2BQAA3A8AILsFAABQACAFJwAAjAoAIIwEAQAAAAGQBEAAAAAB8gQBAAAAAfMEAQAAAAEDTQAA2g8AILUFAADbDwAguwUAAFAAIAkoAAClCgAgjAQBAAAAAZAEQAAAAAGiBAEAAAABpAQBAAAAAaUEAgAAAAGwBEAAAAAB4QQBAAAAAfQEAgAAAAECAAAAUAAgTQAApAoAIAMAAABQACBNAACkCgAgTgAAlwoAIAFGAADZDwAwDgEAAMAGACAoAADiBgAgiQQAANYHADCKBAAATgAQiwQAANYHADCMBAEAAAABkARAAL4GACGiBAEAzAYAIaQEAQDMBgAhpQQCANEGACGmBAEAzAYAIbAEQAC-BgAh4QQBAMwGACH0BAIA0QYAIQIAAABQACBGAACXCgAgAgAAAJUKACBGAACWCgAgDIkEAACUCgAwigQAAJUKABCLBAAAlAoAMIwEAQDMBgAhkARAAL4GACGiBAEAzAYAIaQEAQDMBgAhpQQCANEGACGmBAEAzAYAIbAEQAC-BgAh4QQBAMwGACH0BAIA0QYAIQyJBAAAlAoAMIoEAACVCgAQiwQAAJQKADCMBAEAzAYAIZAEQAC-BgAhogQBAMwGACGkBAEAzAYAIaUEAgDRBgAhpgQBAMwGACGwBEAAvgYAIeEEAQDMBgAh9AQCANEGACEIjAQBAPwHACGQBEAA_QcAIaIEAQD8BwAhpAQBAPwHACGlBAIAhggAIbAEQAD9BwAh4QQBAPwHACH0BAIAhggAIQkoAACYCgAgjAQBAPwHACGQBEAA_QcAIaIEAQD8BwAhpAQBAPwHACGlBAIAhggAIbAEQAD9BwAh4QQBAPwHACH0BAIAhggAIQtNAACZCgAwTgAAnQoAMLUFAACaCgAwtgUAAJsKADC3BQAAnAoAILgFAACDCgAwuQUAAIMKADC6BQAAgwoAMLsFAACDCgAwvAUAAJ4KADC9BQAAhgoAMAUgAACjCgAgjAQBAAAAAZAEQAAAAAHvBAEAAAAB8wQBAAAAAQIAAABUACBNAACiCgAgAwAAAFQAIE0AAKIKACBOAACgCgAgAUYAANgPADACAAAAVAAgRgAAoAoAIAIAAACHCgAgRgAAnwoAIASMBAEA_AcAIZAEQAD9BwAh7wQBAPwHACHzBAEA_AcAIQUgAAChCgAgjAQBAPwHACGQBEAA_QcAIe8EAQD8BwAh8wQBAPwHACEFTQAA0w8AIE4AANYPACC1BQAA1A8AILYFAADVDwAguwUAAJMFACAFIAAAowoAIIwEAQAAAAGQBEAAAAAB7wQBAAAAAfMEAQAAAAEDTQAA0w8AILUFAADUDwAguwUAAJMFACAJKAAApQoAIIwEAQAAAAGQBEAAAAABogQBAAAAAaQEAQAAAAGlBAIAAAABsARAAAAAAeEEAQAAAAH0BAIAAAABBE0AAJkKADC1BQAAmgoAMLcFAACcCgAguwUAAIMKADAGEQAAyAoAIBIAAMkKACCMBAEAAAABkARAAAAAAbAEQAAAAAGLBQEAAAABAgAAAEsAIE0AAMcKACADAAAASwAgTQAAxwoAIE4AALAKACABRgAA0g8AMAwBAADABgAgEQAAwAYAIBIAAN8GACCJBAAA2AcAMIoEAABJABCLBAAA2AcAMIwEAQAAAAGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACGLBQEAzAYAIbAFAADXBwAgAgAAAEsAIEYAALAKACACAAAArgoAIEYAAK8KACAIiQQAAK0KADCKBAAArgoAEIsEAACtCgAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhsARAAL4GACGLBQEAzAYAIQiJBAAArQoAMIoEAACuCgAQiwQAAK0KADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIYsFAQDMBgAhBIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIYsFAQD8BwAhBhEAALEKACASAACyCgAgjAQBAPwHACGQBEAA_QcAIbAEQAD9BwAhiwUBAPwHACEFTQAAvQ8AIE4AANAPACC1BQAAvg8AILYFAADPDwAguwUAAJMFACALTQAAswoAME4AALgKADC1BQAAtAoAMLYFAAC1CgAwtwUAALYKACC4BQAAtwoAMLkFAAC3CgAwugUAALcKADC7BQAAtwoAMLwFAAC5CgAwvQUAALoKADANFAAAxAoAIBkAAMUKACAaAADGCgAgjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABiAUBAAAAAYkFAQAAAAGKBQEAAAABAgAAACwAIE0AAMMKACADAAAALAAgTQAAwwoAIE4AAL8KACABRgAAzg8AMBITAADjBwAgFAAAwAYAIBkAAOQHACAaAADlBwAgiQQAAOAHADCKBAAAKgAQiwQAAOAHADCMBAEAAAABkARAAL4GACHzBAEAzAYAIYIFAADhB4IFIoMFCADMBwAhhQUAAOIHhQUjhgVAAM8GACGHBQEAzAYAIYgFAQDMBgAhiQUBAL8GACGKBQEAvwYAIQIAAAAsACBGAAC_CgAgAgAAALsKACBGAAC8CgAgDokEAAC6CgAwigQAALsKABCLBAAAugoAMIwEAQDMBgAhkARAAL4GACHzBAEAzAYAIYIFAADhB4IFIoMFCADMBwAhhQUAAOIHhQUjhgVAAM8GACGHBQEAzAYAIYgFAQDMBgAhiQUBAL8GACGKBQEAvwYAIQ6JBAAAugoAMIoEAAC7CgAQiwQAALoKADCMBAEAzAYAIZAEQAC-BgAh8wQBAMwGACGCBQAA4QeCBSKDBQgAzAcAIYUFAADiB4UFI4YFQADPBgAhhwUBAMwGACGIBQEAzAYAIYkFAQC_BgAhigUBAL8GACEKjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYgFAQD8BwAhiQUBAJ4IACGKBQEAnggAIQG4BQAAAIIFAgG4BQAAAIUFAw0UAADACgAgGQAAwQoAIBoAAMIKACCMBAEA_AcAIZAEQAD9BwAh8wQBAPwHACGCBQAAvQqCBSKDBQgAswkAIYUFAAC-CoUFI4YFQAD-BwAhiAUBAPwHACGJBQEAnggAIYoFAQCeCAAhBU0AAMMPACBOAADMDwAgtQUAAMQPACC2BQAAyw8AILsFAACTBQAgB00AAMEPACBOAADJDwAgtQUAAMIPACC2BQAAyA8AILkFAAAwACC6BQAAMAAguwUAADMAIAdNAAC_DwAgTgAAxg8AILUFAADADwAgtgUAAMUPACC5BQAAIwAgugUAACMAILsFAAAlACANFAAAxAoAIBkAAMUKACAaAADGCgAgjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABiAUBAAAAAYkFAQAAAAGKBQEAAAABA00AAMMPACC1BQAAxA8AILsFAACTBQAgA00AAMEPACC1BQAAwg8AILsFAAAzACADTQAAvw8AILUFAADADwAguwUAACUAIAYRAADICgAgEgAAyQoAIIwEAQAAAAGQBEAAAAABsARAAAAAAYsFAQAAAAEDTQAAvQ8AILUFAAC-DwAguwUAAJMFACAETQAAswoAMLUFAAC0CgAwtwUAALYKACC7BQAAtwoAMAYBAADUCgAgEgAAyQoAIIwEAQAAAAGQBEAAAAABpgQBAAAAAbAEQAAAAAECAAAASwAgTQAA0woAIAMAAABLACBNAADTCgAgTgAA0QoAIAFGAAC8DwAwAgAAAEsAIEYAANEKACACAAAArgoAIEYAANAKACAEjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhsARAAP0HACEGAQAA0goAIBIAALIKACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIQVNAAC3DwAgTgAAug8AILUFAAC4DwAgtgUAALkPACC7BQAAkwUAIAYBAADUCgAgEgAAyQoAIIwEAQAAAAGQBEAAAAABpgQBAAAAAbAEQAAAAAEDTQAAtw8AILUFAAC4DwAguwUAAJMFACANEwAA3woAIBkAAMUKACAaAADGCgAgjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABhwUBAAAAAYkFAQAAAAGKBQEAAAABAgAAACwAIE0AAN4KACADAAAALAAgTQAA3goAIE4AANwKACABRgAAtg8AMAIAAAAsACBGAADcCgAgAgAAALsKACBGAADbCgAgCowEAQD8BwAhkARAAP0HACHzBAEA_AcAIYIFAAC9CoIFIoMFCACzCQAhhQUAAL4KhQUjhgVAAP4HACGHBQEA_AcAIYkFAQCeCAAhigUBAJ4IACENEwAA3QoAIBkAAMEKACAaAADCCgAgjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYcFAQD8BwAhiQUBAJ4IACGKBQEAnggAIQVNAACxDwAgTgAAtA8AILUFAACyDwAgtgUAALMPACC7BQAASwAgDRMAAN8KACAZAADFCgAgGgAAxgoAIIwEAQAAAAGQBEAAAAAB8wQBAAAAAYIFAAAAggUCgwUIAAAAAYUFAAAAhQUDhgVAAAAAAYcFAQAAAAGJBQEAAAABigUBAAAAAQNNAACxDwAgtQUAALIPACC7BQAASwAgCBcAAO8KACAgAADuCgAgjAQBAAAAAZAEQAAAAAHtBAIAAAAB7gQBAAAAAe8EAQAAAAHxBAEAAAABAgAAAEUAIE0AAO0KACADAAAARQAgTQAA7QoAIE4AAOoKACABRgAAsA8AMA0XAAC0BwAgIAAAwAYAICEAAMAGACCJBAAA2QcAMIoEAABDABCLBAAA2QcAMIwEAQAAAAGQBEAAvgYAIe0EAgDRBgAh7gQBAL8GACHvBAEAzAYAIfAEAQDMBgAh8QQBAAAAAQIAAABFACBGAADqCgAgAgAAAOgKACBGAADpCgAgCokEAADnCgAwigQAAOgKABCLBAAA5woAMIwEAQDMBgAhkARAAL4GACHtBAIA0QYAIe4EAQC_BgAh7wQBAMwGACHwBAEAzAYAIfEEAQDMBgAhCokEAADnCgAwigQAAOgKABCLBAAA5woAMIwEAQDMBgAhkARAAL4GACHtBAIA0QYAIe4EAQC_BgAh7wQBAMwGACHwBAEAzAYAIfEEAQDMBgAhBowEAQD8BwAhkARAAP0HACHtBAIAhggAIe4EAQCeCAAh7wQBAPwHACHxBAEA_AcAIQgXAADsCgAgIAAA6woAIIwEAQD8BwAhkARAAP0HACHtBAIAhggAIe4EAQCeCAAh7wQBAPwHACHxBAEA_AcAIQVNAACoDwAgTgAArg8AILUFAACpDwAgtgUAAK0PACC7BQAAkwUAIAVNAACmDwAgTgAAqw8AILUFAACnDwAgtgUAAKoPACC7BQAAAQAgCBcAAO8KACAgAADuCgAgjAQBAAAAAZAEQAAAAAHtBAIAAAAB7gQBAAAAAe8EAQAAAAHxBAEAAAABA00AAKgPACC1BQAAqQ8AILsFAACTBQAgA00AAKYPACC1BQAApw8AILsFAAABACAIFwAA7woAICEAAPoKACCMBAEAAAABkARAAAAAAe0EAgAAAAHuBAEAAAAB8AQBAAAAAfEEAQAAAAECAAAARQAgTQAA-QoAIAMAAABFACBNAAD5CgAgTgAA9woAIAFGAAClDwAwAgAAAEUAIEYAAPcKACACAAAA6AoAIEYAAPYKACAGjAQBAPwHACGQBEAA_QcAIe0EAgCGCAAh7gQBAJ4IACHwBAEA_AcAIfEEAQD8BwAhCBcAAOwKACAhAAD4CgAgjAQBAPwHACGQBEAA_QcAIe0EAgCGCAAh7gQBAJ4IACHwBAEA_AcAIfEEAQD8BwAhBU0AAKAPACBOAACjDwAgtQUAAKEPACC2BQAAog8AILsFAACTBQAgCBcAAO8KACAhAAD6CgAgjAQBAAAAAZAEQAAAAAHtBAIAAAAB7gQBAAAAAfAEAQAAAAHxBAEAAAABA00AAKAPACC1BQAAoQ8AILsFAACTBQAgFREAAKELACAZAACjCwAgGgAAogsAICwAAKQLACBAAAClCwAgjAQBAAAAAZAEQAAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAECAAAAAQAgTQAAoAsAIAMAAAABACBNAACgCwAgTgAAhgsAIAFGAACfDwAwGgEAAMAGACARAADABgAgGQAA5AcAIBoAAOUHACAsAADoBwAgQAAA6QcAIIkEAADmBwAwigQAACcAEIsEAADmBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGuBAAA5wenBSKwBEAAvgYAIdoEAQC_BgAh2wQBAL8GACHcBAEAvwYAIYkFAQAAAAGKBQEAvwYAIYsFAQDMBgAhpwVAAM8GACGoBQEAvwYAIakFAQC_BgAhqgUIAMwHACGrBQEAvwYAIawFAQC_BgAhAgAAAAEAIEYAAIYLACACAAAAgwsAIEYAAIQLACAUiQQAAIILADCKBAAAgwsAEIsEAACCCwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAOcHpwUisARAAL4GACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACGJBQEAvwYAIYoFAQC_BgAhiwUBAMwGACGnBUAAzwYAIagFAQC_BgAhqQUBAL8GACGqBQgAzAcAIasFAQC_BgAhrAUBAL8GACEUiQQAAIILADCKBAAAgwsAEIsEAACCCwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAOcHpwUisARAAL4GACHaBAEAvwYAIdsEAQC_BgAh3AQBAL8GACGJBQEAvwYAIYoFAQC_BgAhiwUBAMwGACGnBUAAzwYAIagFAQC_BgAhqQUBAL8GACGqBQgAzAcAIasFAQC_BgAhrAUBAL8GACEQjAQBAPwHACGQBEAA_QcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhAbgFAAAApwUCFREAAIcLACAZAACJCwAgGgAAiAsAICwAAIoLACBAAACLCwAgjAQBAPwHACGQBEAA_QcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhBU0AAI8PACBOAACdDwAgtQUAAJAPACC2BQAAnA8AILsFAACTBQAgB00AAI0PACBOAACaDwAgtQUAAI4PACC2BQAAmQ8AILkFAAAjACC6BQAAIwAguwUAACUAIAdNAACLDwAgTgAAlw8AILUFAACMDwAgtgUAAJYPACC5BQAAMAAgugUAADAAILsFAAAzACAHTQAAkQsAIE4AAJQLACC1BQAAkgsAILYFAACTCwAguQUAAKEBACC6BQAAoQEAILsFAAC9AQAgB00AAIwLACBOAACPCwAgtQUAAI0LACC2BQAAjgsAILkFAABDACC6BQAAQwAguwUAAEUAIAggAADuCgAgIQAA-goAIIwEAQAAAAGQBEAAAAAB7QQCAAAAAe4EAQAAAAHvBAEAAAAB8AQBAAAAAQIAAABFACBNAACMCwAgAwAAAEMAIE0AAIwLACBOAACQCwAgCgAAAEMAICAAAOsKACAhAAD4CgAgRgAAkAsAIIwEAQD8BwAhkARAAP0HACHtBAIAhggAIe4EAQCeCAAh7wQBAPwHACHwBAEA_AcAIQggAADrCgAgIQAA-AoAIIwEAQD8BwAhkARAAP0HACHtBAIAhggAIe4EAQCeCAAh7wQBAPwHACHwBAEA_AcAIQwrAACfCwAgjAQBAAAAAZAEQAAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrgQAAACmBQKvBAEAAAABsARAAAAAAdAEQAAAAAHRBEAAAAAB0gRAAAAAAQIAAAC9AQAgTQAAkQsAIAMAAAChAQAgTQAAkQsAIE4AAJULACAOAAAAoQEAICsAAJcLACBGAACVCwAgjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAlgumBSKvBAEAnggAIbAEQAD9BwAh0ARAAP4HACHRBEAA_gcAIdIEQAD-BwAhDCsAAJcLACCMBAEA_AcAIZAEQAD9BwAhqAQIAJYIACGpBAEA_AcAIasEAACXCKsEIq4EAACWC6YFIq8EAQCeCAAhsARAAP0HACHQBEAA_gcAIdEEQAD-BwAh0gRAAP4HACEBuAUAAACmBQIHTQAAmAsAIE4AAJsLACC1BQAAmQsAILYFAACaCwAguQUAAFgAILoFAABYACC7BQAAWgAgCQEAAJ4LACCMBAEAAAABkARAAAAAAaYEAQAAAAGoBAgAAAABqQQBAAAAAa4EAAAAzQQCsARAAAAAAc0EAQAAAAECAAAAWgAgTQAAmAsAIAMAAABYACBNAACYCwAgTgAAnAsAIAsAAABYACABAACdCwAgRgAAnAsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIagECACWCAAhqQQBAPwHACGuBAAAownNBCKwBEAA_QcAIc0EAQCeCAAhCQEAAJ0LACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGoBAgAlggAIakEAQD8BwAhrgQAAKMJzQQisARAAP0HACHNBAEAnggAIQVNAACRDwAgTgAAlA8AILUFAACSDwAgtgUAAJMPACC7BQAAkwUAIANNAACRDwAgtQUAAJIPACC7BQAAkwUAIANNAACYCwAgtQUAAJkLACC7BQAAWgAgFREAAKELACAZAACjCwAgGgAAogsAICwAAKQLACBAAAClCwAgjAQBAAAAAZAEQAAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAEDTQAAjw8AILUFAACQDwAguwUAAJMFACADTQAAjQ8AILUFAACODwAguwUAACUAIANNAACLDwAgtQUAAIwPACC7BQAAMwAgA00AAJELACC1BQAAkgsAILsFAAC9AQAgA00AAIwLACC1BQAAjQsAILsFAABFACAVAQAAsAsAIBkAAKMLACAaAACiCwAgLAAApAsAIEAAAKULACCMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAacFQAAAAAGoBQEAAAABqQUBAAAAAaoFCAAAAAGrBQEAAAABrAUBAAAAAQIAAAABACBNAACvCwAgAwAAAAEAIE0AAK8LACBOAACtCwAgAUYAAIoPADACAAAAAQAgRgAArQsAIAIAAACDCwAgRgAArAsAIBCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAhQunBSKwBEAA_QcAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAIYkFAQCeCAAhigUBAJ4IACGnBUAA_gcAIagFAQCeCAAhqQUBAJ4IACGqBQgAswkAIasFAQCeCAAhrAUBAJ4IACEVAQAArgsAIBkAAIkLACAaAACICwAgLAAAigsAIEAAAIsLACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAhQunBSKwBEAA_QcAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAIYkFAQCeCAAhigUBAJ4IACGnBUAA_gcAIagFAQCeCAAhqQUBAJ4IACGqBQgAswkAIasFAQCeCAAhrAUBAJ4IACEFTQAAhQ8AIE4AAIgPACC1BQAAhg8AILYFAACHDwAguwUAAJMFACAVAQAAsAsAIBkAAKMLACAaAACiCwAgLAAApAsAIEAAAKULACCMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAacFQAAAAAGoBQEAAAABqQUBAAAAAaoFCAAAAAGrBQEAAAABrAUBAAAAAQNNAACFDwAgtQUAAIYPACC7BQAAkwUAIAoWAADPCwAgFwAA0AsAIBgAANELACCMBAEAAAABkARAAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABjwUBAAAAAQIAAAAzACBNAADOCwAgAwAAADMAIE0AAM4LACBOAAC8CwAgAUYAAIQPADAQAQAAwAYAIBYAAN4HACAXAADfBwAgGAAA3wYAIIkEAADcBwAwigQAADAAEIsEAADcBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGuBAAA3QePBSKwBEAAvgYAIYwFAQDMBgAhjQUIAMwHACGPBQEAzAYAIbEFAADbBwAgAgAAADMAIEYAALwLACACAAAAuQsAIEYAALoLACALiQQAALgLADCKBAAAuQsAEIsEAAC4CwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAN0HjwUisARAAL4GACGMBQEAzAYAIY0FCADMBwAhjwUBAMwGACELiQQAALgLADCKBAAAuQsAEIsEAAC4CwAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhrgQAAN0HjwUisARAAL4GACGMBQEAzAYAIY0FCADMBwAhjwUBAMwGACEHjAQBAPwHACGQBEAA_QcAIa4EAAC7C48FIrAEQAD9BwAhjAUBAPwHACGNBQgAswkAIY8FAQD8BwAhAbgFAAAAjwUCChYAAL0LACAXAAC-CwAgGAAAvwsAIIwEAQD8BwAhkARAAP0HACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQVNAAD-DgAgTgAAgg8AILUFAAD_DgAgtgUAAIEPACC7BQAAPgAgB00AAMkLACBOAADMCwAgtQUAAMoLACC2BQAAywsAILkFAAAnACC6BQAAJwAguwUAAAEAIAtNAADACwAwTgAAxAsAMLUFAADBCwAwtgUAAMILADC3BQAAwwsAILgFAAC3CgAwuQUAALcKADC6BQAAtwoAMLsFAAC3CgAwvAUAAMULADC9BQAAugoAMA0TAADfCgAgFAAAxAoAIBoAAMYKACCMBAEAAAABkARAAAAAAfMEAQAAAAGCBQAAAIIFAoMFCAAAAAGFBQAAAIUFA4YFQAAAAAGHBQEAAAABiAUBAAAAAYoFAQAAAAECAAAALAAgTQAAyAsAIAMAAAAsACBNAADICwAgTgAAxwsAIAFGAACADwAwAgAAACwAIEYAAMcLACACAAAAuwoAIEYAAMYLACAKjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYcFAQD8BwAhiAUBAPwHACGKBQEAnggAIQ0TAADdCgAgFAAAwAoAIBoAAMIKACCMBAEA_AcAIZAEQAD9BwAh8wQBAPwHACGCBQAAvQqCBSKDBQgAswkAIYUFAAC-CoUFI4YFQAD-BwAhhwUBAPwHACGIBQEA_AcAIYoFAQCeCAAhDRMAAN8KACAUAADECgAgGgAAxgoAIIwEAQAAAAGQBEAAAAAB8wQBAAAAAYIFAAAAggUCgwUIAAAAAYUFAAAAhQUDhgVAAAAAAYcFAQAAAAGIBQEAAAABigUBAAAAARUBAACwCwAgEQAAoQsAIBoAAKILACAsAACkCwAgQAAApQsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYoFAQAAAAGLBQEAAAABpwVAAAAAAagFAQAAAAGpBQEAAAABqgUIAAAAAasFAQAAAAGsBQEAAAABAgAAAAEAIE0AAMkLACADAAAAJwAgTQAAyQsAIE4AAM0LACAXAAAAJwAgAQAArgsAIBEAAIcLACAaAACICwAgLAAAigsAIEAAAIsLACBGAADNCwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhrgQAAIULpwUisARAAP0HACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhFQEAAK4LACARAACHCwAgGgAAiAsAICwAAIoLACBAAACLCwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhrgQAAIULpwUisARAAP0HACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhChYAAM8LACAXAADQCwAgGAAA0QsAIIwEAQAAAAGQBEAAAAABrgQAAACPBQKwBEAAAAABjAUBAAAAAY0FCAAAAAGPBQEAAAABA00AAP4OACC1BQAA_w4AILsFAAA-ACADTQAAyQsAILUFAADKCwAguwUAAAEAIARNAADACwAwtQUAAMELADC3BQAAwwsAILsFAAC3CgAwDhUAAOoLACCMBAEAAAABkARAAAAAAbAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAQAAAAHkBAEAAAABkAUIAAAAAZEFAQAAAAGSBUAAAAABkwUBAAAAAZQFAQAAAAGVBSAAAAABAgAAAD4AIE0AAOkLACADAAAAPgAgTQAA6QsAIE4AANwLACABRgAA_Q4AMBMRAADABgAgFQAA3AYAIIkEAADaBwAwigQAADwAEIsEAADaBwAwjAQBAAAAAZAEQAC-BgAhsARAAL4GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIYsFAQDMBgAhkAUIAPMGACGRBQEAvwYAIZIFQADPBgAhkwUBAL8GACGUBQEAvwYAIZUFIADOBgAhAgAAAD4AIEYAANwLACACAAAA2gsAIEYAANsLACARiQQAANkLADCKBAAA2gsAEIsEAADZCwAwjAQBAMwGACGQBEAAvgYAIbAEQAC-BgAh4AQBAMwGACHhBAEAzAYAIeMEAQDMBgAh5AQBAMwGACGLBQEAzAYAIZAFCADzBgAhkQUBAL8GACGSBUAAzwYAIZMFAQC_BgAhlAUBAL8GACGVBSAAzgYAIRGJBAAA2QsAMIoEAADaCwAQiwQAANkLADCMBAEAzAYAIZAEQAC-BgAhsARAAL4GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIYsFAQDMBgAhkAUIAPMGACGRBQEAvwYAIZIFQADPBgAhkwUBAL8GACGUBQEAvwYAIZUFIADOBgAhDYwEAQD8BwAhkARAAP0HACGwBEAA_QcAIeAEAQD8BwAh4QQBAPwHACHjBAEA_AcAIeQEAQD8BwAhkAUIAJYIACGRBQEAnggAIZIFQAD-BwAhkwUBAJ4IACGUBQEAnggAIZUFIACoCAAhDhUAAN0LACCMBAEA_AcAIZAEQAD9BwAhsARAAP0HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZAFCACWCAAhkQUBAJ4IACGSBUAA_gcAIZMFAQCeCAAhlAUBAJ4IACGVBSAAqAgAIQtNAADeCwAwTgAA4gsAMLUFAADfCwAwtgUAAOALADC3BQAA4QsAILgFAAC1CwAwuQUAALULADC6BQAAtQsAMLsFAAC1CwAwvAUAAOMLADC9BQAAuAsAMAoBAADoCwAgFwAA0AsAIBgAANELACCMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAI8FArAEQAAAAAGMBQEAAAABjQUIAAAAAQIAAAAzACBNAADnCwAgAwAAADMAIE0AAOcLACBOAADlCwAgAUYAAPwOADACAAAAMwAgRgAA5QsAIAIAAAC5CwAgRgAA5AsAIAeMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACEKAQAA5gsAIBcAAL4LACAYAAC_CwAgjAQBAPwHACGQBEAA_QcAIaYEAQD8BwAhrgQAALsLjwUisARAAP0HACGMBQEA_AcAIY0FCACzCQAhBU0AAPcOACBOAAD6DgAgtQUAAPgOACC2BQAA-Q4AILsFAACTBQAgCgEAAOgLACAXAADQCwAgGAAA0QsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABA00AAPcOACC1BQAA-A4AILsFAACTBQAgDhUAAOoLACCMBAEAAAABkARAAAAAAbAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAQAAAAHkBAEAAAABkAUIAAAAAZEFAQAAAAGSBUAAAAABkwUBAAAAAZQFAQAAAAGVBSAAAAABBE0AAN4LADC1BQAA3wsAMLcFAADhCwAguwUAALULADAOEAAAiwwAIBgAAIwMACCMBAEAAAABkARAAAAAAbAEQAAAAAHBBCAAAAABwgRAAAAAAeAEAQAAAAHhBAEAAAAB4wQBAAAAAeQEAQAAAAGRBQEAAAABlgUIAAAAAZcFIAAAAAECAAAAJQAgTQAAigwAIAMAAAAlACBNAACKDAAgTgAA9QsAIAFGAAD2DgAwEwEAAMAGACAQAADdBgAgGAAA3wYAIIkEAADqBwAwigQAACMAEIsEAADqBwAwjAQBAAAAAZAEQAC-BgAhpgQBAMwGACGwBEAAvgYAIcEEIADOBgAhwgRAAM8GACHgBAEAzAYAIeEEAQDMBgAh4wQBAMwGACHkBAEAzAYAIZEFAQC_BgAhlgUIAPMGACGXBSAAzgYAIQIAAAAlACBGAAD1CwAgAgAAAPMLACBGAAD0CwAgEIkEAADyCwAwigQAAPMLABCLBAAA8gsAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIbAEQAC-BgAhwQQgAM4GACHCBEAAzwYAIeAEAQDMBgAh4QQBAMwGACHjBAEAzAYAIeQEAQDMBgAhkQUBAL8GACGWBQgA8wYAIZcFIADOBgAhEIkEAADyCwAwigQAAPMLABCLBAAA8gsAMIwEAQDMBgAhkARAAL4GACGmBAEAzAYAIbAEQAC-BgAhwQQgAM4GACHCBEAAzwYAIeAEAQDMBgAh4QQBAMwGACHjBAEAzAYAIeQEAQDMBgAhkQUBAL8GACGWBQgA8wYAIZcFIADOBgAhDIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIcEEIACoCAAhwgRAAP4HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZEFAQCeCAAhlgUIAJYIACGXBSAAqAgAIQ4QAAD2CwAgGAAA9wsAIIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIcEEIACoCAAhwgRAAP4HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZEFAQCeCAAhlgUIAJYIACGXBSAAqAgAIQtNAACBDAAwTgAAhQwAMLUFAACCDAAwtgUAAIMMADC3BQAAhAwAILgFAAD_CgAwuQUAAP8KADC6BQAA_woAMLsFAAD_CgAwvAUAAIYMADC9BQAAggsAMAtNAAD4CwAwTgAA_AsAMLUFAAD5CwAwtgUAAPoLADC3BQAA-wsAILgFAAC3CgAwuQUAALcKADC6BQAAtwoAMLsFAAC3CgAwvAUAAP0LADC9BQAAugoAMA0TAADfCgAgFAAAxAoAIBkAAMUKACCMBAEAAAABkARAAAAAAfMEAQAAAAGCBQAAAIIFAoMFCAAAAAGFBQAAAIUFA4YFQAAAAAGHBQEAAAABiAUBAAAAAYkFAQAAAAECAAAALAAgTQAAgAwAIAMAAAAsACBNAACADAAgTgAA_wsAIAFGAAD1DgAwAgAAACwAIEYAAP8LACACAAAAuwoAIEYAAP4LACAKjAQBAPwHACGQBEAA_QcAIfMEAQD8BwAhggUAAL0KggUigwUIALMJACGFBQAAvgqFBSOGBUAA_gcAIYcFAQD8BwAhiAUBAPwHACGJBQEAnggAIQ0TAADdCgAgFAAAwAoAIBkAAMEKACCMBAEA_AcAIZAEQAD9BwAh8wQBAPwHACGCBQAAvQqCBSKDBQgAswkAIYUFAAC-CoUFI4YFQAD-BwAhhwUBAPwHACGIBQEA_AcAIYkFAQCeCAAhDRMAAN8KACAUAADECgAgGQAAxQoAIIwEAQAAAAGQBEAAAAAB8wQBAAAAAYIFAAAAggUCgwUIAAAAAYUFAAAAhQUDhgVAAAAAAYcFAQAAAAGIBQEAAAABiQUBAAAAARUBAACwCwAgEQAAoQsAIBkAAKMLACAsAACkCwAgQAAApQsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYkFAQAAAAGLBQEAAAABpwVAAAAAAagFAQAAAAGpBQEAAAABqgUIAAAAAasFAQAAAAGsBQEAAAABAgAAAAEAIE0AAIkMACADAAAAAQAgTQAAiQwAIE4AAIgMACABRgAA9A4AMAIAAAABACBGAACIDAAgAgAAAIMLACBGAACHDAAgEIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGLBQEA_AcAIacFQAD-BwAhqAUBAJ4IACGpBQEAnggAIaoFCACzCQAhqwUBAJ4IACGsBQEAnggAIRUBAACuCwAgEQAAhwsAIBkAAIkLACAsAACKCwAgQAAAiwsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGLBQEA_AcAIacFQAD-BwAhqAUBAJ4IACGpBQEAnggAIaoFCACzCQAhqwUBAJ4IACGsBQEAnggAIRUBAACwCwAgEQAAoQsAIBkAAKMLACAsAACkCwAgQAAApQsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYkFAQAAAAGLBQEAAAABpwVAAAAAAagFAQAAAAGpBQEAAAABqgUIAAAAAasFAQAAAAGsBQEAAAABDhAAAIsMACAYAACMDAAgjAQBAAAAAZAEQAAAAAGwBEAAAAABwQQgAAAAAcIEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAQAAAAHkBAEAAAABkQUBAAAAAZYFCAAAAAGXBSAAAAABBE0AAIEMADC1BQAAggwAMLcFAACEDAAguwUAAP8KADAETQAA-AsAMLUFAAD5CwAwtwUAAPsLACC7BQAAtwoAMAWMBAEAAAABkARAAAAAAfwEAQAAAAH9BAEAAAAB_gQBAAAAAQIAAAAhACBNAACYDAAgAwAAACEAIE0AAJgMACBOAACXDAAgAUYAAPMOADAKBgAAwAYAIIkEAADrBwAwigQAAB8AEIsEAADrBwAwjAQBAAAAAZAEQAC-BgAhkQQBAMwGACH8BAEAAAAB_QQBAMwGACH-BAEAzAYAIQIAAAAhACBGAACXDAAgAgAAAJUMACBGAACWDAAgCYkEAACUDAAwigQAAJUMABCLBAAAlAwAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIfwEAQDMBgAh_QQBAMwGACH-BAEAzAYAIQmJBAAAlAwAMIoEAACVDAAQiwQAAJQMADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACH8BAEAzAYAIf0EAQDMBgAh_gQBAMwGACEFjAQBAPwHACGQBEAA_QcAIfwEAQD8BwAh_QQBAPwHACH-BAEA_AcAIQWMBAEA_AcAIZAEQAD9BwAh_AQBAPwHACH9BAEA_AcAIf4EAQD8BwAhBYwEAQAAAAGQBEAAAAAB_AQBAAAAAf0EAQAAAAH-BAEAAAABCgoAAKgMACCMBAEAAAABkARAAAAAAa4EAAAA-QQCsARAAAAAAfUEAQAAAAH3BAAAAPcEAvkEAgAAAAH6BEAAAAAB-wQBAAAAAQIAAAAbACBNAACnDAAgAwAAABsAIE0AAKcMACBOAAClDAAgAUYAAPIOADAPBgAAwAYAIAoAAO8HACCJBAAA7AcAMIoEAAAZABCLBAAA7AcAMIwEAQAAAAGQBEAAvgYAIZEEAQDMBgAhrgQAAO4H-QQisARAAL4GACH1BAEAzAYAIfcEAADtB_cEIvkEAgDRBgAh-gRAAL4GACH7BAEAvwYAIQIAAAAbACBGAAClDAAgAgAAAKEMACBGAACiDAAgDYkEAACgDAAwigQAAKEMABCLBAAAoAwAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIa4EAADuB_kEIrAEQAC-BgAh9QQBAMwGACH3BAAA7Qf3BCL5BAIA0QYAIfoEQAC-BgAh-wQBAL8GACENiQQAAKAMADCKBAAAoQwAEIsEAACgDAAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhrgQAAO4H-QQisARAAL4GACH1BAEAzAYAIfcEAADtB_cEIvkEAgDRBgAh-gRAAL4GACH7BAEAvwYAIQmMBAEA_AcAIZAEQAD9BwAhrgQAAKQM-QQisARAAP0HACH1BAEA_AcAIfcEAACjDPcEIvkEAgCGCAAh-gRAAP0HACH7BAEAnggAIQG4BQAAAPcEAgG4BQAAAPkEAgoKAACmDAAgjAQBAPwHACGQBEAA_QcAIa4EAACkDPkEIrAEQAD9BwAh9QQBAPwHACH3BAAAowz3BCL5BAIAhggAIfoEQAD9BwAh-wQBAJ4IACEFTQAA7Q4AIE4AAPAOACC1BQAA7g4AILYFAADvDgAguwUAABcAIAoKAACoDAAgjAQBAAAAAZAEQAAAAAGuBAAAAPkEArAEQAAAAAH1BAEAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEDTQAA7Q4AILUFAADuDgAguwUAABcAIAgLAADBDAAgjAQBAAAAAZAEQAAAAAGgBAEAAAAB4AQBAAAAAfMEAQAAAAH_BAEAAAABgAUgAAAAAQIAAAAXACBNAADADAAgAwAAABcAIE0AAMAMACBOAACzDAAgAUYAAOwOADANBgAAwAYAIAsAANgGACCJBAAA8AcAMIoEAAAVABCLBAAA8AcAMIwEAQAAAAGQBEAAvgYAIZEEAQDMBgAhoAQBAMwGACHgBAEAzAYAIfMEAQDMBgAh_wQBAL8GACGABSAAzgYAIQIAAAAXACBGAACzDAAgAgAAALEMACBGAACyDAAgC4kEAACwDAAwigQAALEMABCLBAAAsAwAMIwEAQDMBgAhkARAAL4GACGRBAEAzAYAIaAEAQDMBgAh4AQBAMwGACHzBAEAzAYAIf8EAQC_BgAhgAUgAM4GACELiQQAALAMADCKBAAAsQwAEIsEAACwDAAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhoAQBAMwGACHgBAEAzAYAIfMEAQDMBgAh_wQBAL8GACGABSAAzgYAIQeMBAEA_AcAIZAEQAD9BwAhoAQBAPwHACHgBAEA_AcAIfMEAQD8BwAh_wQBAJ4IACGABSAAqAgAIQgLAAC0DAAgjAQBAPwHACGQBEAA_QcAIaAEAQD8BwAh4AQBAPwHACHzBAEA_AcAIf8EAQCeCAAhgAUgAKgIACELTQAAtQwAME4AALkMADC1BQAAtgwAMLYFAAC3DAAwtwUAALgMACC4BQAAnQwAMLkFAACdDAAwugUAAJ0MADC7BQAAnQwAMLwFAAC6DAAwvQUAAKAMADAKBgAAvwwAIIwEAQAAAAGQBEAAAAABkQQBAAAAAa4EAAAA-QQCsARAAAAAAfcEAAAA9wQC-QQCAAAAAfoEQAAAAAH7BAEAAAABAgAAABsAIE0AAL4MACADAAAAGwAgTQAAvgwAIE4AALwMACABRgAA6w4AMAIAAAAbACBGAAC8DAAgAgAAAKEMACBGAAC7DAAgCYwEAQD8BwAhkARAAP0HACGRBAEA_AcAIa4EAACkDPkEIrAEQAD9BwAh9wQAAKMM9wQi-QQCAIYIACH6BEAA_QcAIfsEAQCeCAAhCgYAAL0MACCMBAEA_AcAIZAEQAD9BwAhkQQBAPwHACGuBAAApAz5BCKwBEAA_QcAIfcEAACjDPcEIvkEAgCGCAAh-gRAAP0HACH7BAEAnggAIQVNAADmDgAgTgAA6Q4AILUFAADnDgAgtgUAAOgOACC7BQAAkwUAIAoGAAC_DAAgjAQBAAAAAZAEQAAAAAGRBAEAAAABrgQAAAD5BAKwBEAAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEDTQAA5g4AILUFAADnDgAguwUAAJMFACAICwAAwQwAIIwEAQAAAAGQBEAAAAABoAQBAAAAAeAEAQAAAAHzBAEAAAAB_wQBAAAAAYAFIAAAAAEETQAAtQwAMLUFAAC2DAAwtwUAALgMACC7BQAAnQwAMAWMBAEAAAABjQQBAAAAAY4EQAAAAAGPBEAAAAABkARAAAAAAQIAAAATACBNAADNDAAgAwAAABMAIE0AAM0MACBOAADMDAAgAUYAAOUOADAKBgAAwAYAIIkEAADxBwAwigQAABEAEIsEAADxBwAwjAQBAAAAAY0EAQDMBgAhjgRAAL4GACGPBEAAzwYAIZAEQAC-BgAhkQQBAMwGACECAAAAEwAgRgAAzAwAIAIAAADKDAAgRgAAywwAIAmJBAAAyQwAMIoEAADKDAAQiwQAAMkMADCMBAEAzAYAIY0EAQDMBgAhjgRAAL4GACGPBEAAzwYAIZAEQAC-BgAhkQQBAMwGACEJiQQAAMkMADCKBAAAygwAEIsEAADJDAAwjAQBAMwGACGNBAEAzAYAIY4EQAC-BgAhjwRAAM8GACGQBEAAvgYAIZEEAQDMBgAhBYwEAQD8BwAhjQQBAPwHACGOBEAA_QcAIY8EQAD-BwAhkARAAP0HACEFjAQBAPwHACGNBAEA_AcAIY4EQAD9BwAhjwRAAP4HACGQBEAA_QcAIQWMBAEAAAABjQQBAAAAAY4EQAAAAAGPBEAAAAABkARAAAAAAQWMBAEAAAABjgRAAAAAAZAEQAAAAAGdBAEAAAABngQCAAAAAQIAAAAPACBNAADZDAAgAwAAAA8AIE0AANkMACBOAADYDAAgAUYAAOQOADAKBgAAwAYAIIkEAADyBwAwigQAAA0AEIsEAADyBwAwjAQBAAAAAY4EQAC-BgAhkARAAL4GACGRBAEAzAYAIZ0EAQDMBgAhngQCANEGACECAAAADwAgRgAA2AwAIAIAAADWDAAgRgAA1wwAIAmJBAAA1QwAMIoEAADWDAAQiwQAANUMADCMBAEAzAYAIY4EQAC-BgAhkARAAL4GACGRBAEAzAYAIZ0EAQDMBgAhngQCANEGACEJiQQAANUMADCKBAAA1gwAEIsEAADVDAAwjAQBAMwGACGOBEAAvgYAIZAEQAC-BgAhkQQBAMwGACGdBAEAzAYAIZ4EAgDRBgAhBYwEAQD8BwAhjgRAAP0HACGQBEAA_QcAIZ0EAQD8BwAhngQCAIYIACEFjAQBAPwHACGOBEAA_QcAIZAEQAD9BwAhnQQBAPwHACGeBAIAhggAIQWMBAEAAAABjgRAAAAAAZAEQAAAAAGdBAEAAAABngQCAAAAAQiMBAEAAAABkARAAAAAAaAEAAAAoAQCoQQCAAAAAaIEAQAAAAGjBAEAAAABpAQBAAAAAaUEAgAAAAECAAAACwAgTQAA5QwAIAMAAAALACBNAADlDAAgTgAA5AwAIAFGAADjDgAwDgYAAMAGACCJBAAA9AcAMIoEAAAJABCLBAAA9AcAMIwEAQAAAAGQBEAAvgYAIZEEAQDMBgAhoAQAAPUHoAQioQQCANEGACGiBAEAzAYAIaMEAQDMBgAhpAQBAMwGACGlBAIA0QYAIbIFAADzBwAgAgAAAAsAIEYAAOQMACACAAAA4gwAIEYAAOMMACAMiQQAAOEMADCKBAAA4gwAEIsEAADhDAAwjAQBAMwGACGQBEAAvgYAIZEEAQDMBgAhoAQAAPUHoAQioQQCANEGACGiBAEAzAYAIaMEAQDMBgAhpAQBAMwGACGlBAIA0QYAIQyJBAAA4QwAMIoEAADiDAAQiwQAAOEMADCMBAEAzAYAIZAEQAC-BgAhkQQBAMwGACGgBAAA9QegBCKhBAIA0QYAIaIEAQDMBgAhowQBAMwGACGkBAEAzAYAIaUEAgDRBgAhCIwEAQD8BwAhkARAAP0HACGgBAAAjgigBCKhBAIAhggAIaIEAQD8BwAhowQBAPwHACGkBAEA_AcAIaUEAgCGCAAhCIwEAQD8BwAhkARAAP0HACGgBAAAjgigBCKhBAIAhggAIaIEAQD8BwAhowQBAPwHACGkBAEA_AcAIaUEAgCGCAAhCIwEAQAAAAGQBEAAAAABoAQAAACgBAKhBAIAAAABogQBAAAAAaMEAQAAAAGkBAEAAAABpQQCAAAAAQqMBAEAAAABkARAAAAAAacEAgAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrAQBAAAAAa4EAAAArgQCrwQBAAAAAbAEQAAAAAECAAAABwAgTQAA8QwAIAMAAAAHACBNAADxDAAgTgAA8AwAIAFGAADiDgAwDwEAAMAGACCJBAAA9gcAMIoEAAAFABCLBAAA9gcAMIwEAQAAAAGQBEAAvgYAIaYEAQDMBgAhpwQCANEGACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirAQBAMwGACGuBAAA9weuBCKvBAEAAAABsARAAL4GACECAAAABwAgRgAA8AwAIAIAAADuDAAgRgAA7wwAIA6JBAAA7QwAMIoEAADuDAAQiwQAAO0MADCMBAEAzAYAIZAEQAC-BgAhpgQBAMwGACGnBAIA0QYAIagECADzBgAhqQQBAMwGACGrBAAA9QarBCKsBAEAzAYAIa4EAAD3B64EIq8EAQDMBgAhsARAAL4GACEOiQQAAO0MADCKBAAA7gwAEIsEAADtDAAwjAQBAMwGACGQBEAAvgYAIaYEAQDMBgAhpwQCANEGACGoBAgA8wYAIakEAQDMBgAhqwQAAPUGqwQirAQBAMwGACGuBAAA9weuBCKvBAEAzAYAIbAEQAC-BgAhCowEAQD8BwAhkARAAP0HACGnBAIAhggAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKsBAEA_AcAIa4EAACYCK4EIq8EAQD8BwAhsARAAP0HACEKjAQBAPwHACGQBEAA_QcAIacEAgCGCAAhqAQIAJYIACGpBAEA_AcAIasEAACXCKsEIqwEAQD8BwAhrgQAAJgIrgQirwQBAPwHACGwBEAA_QcAIQqMBAEAAAABkARAAAAAAacEAgAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrAQBAAAAAa4EAAAArgQCrwQBAAAAAbAEQAAAAAEGjAQBAAAAAY4EQAAAAAGQBEAAAAABsARAAAAAAbEEQAAAAAGyBAEAAAABAgAAAKwFACBNAADyDAAgAwAAAAMAIE0AAPIMACBOAAD2DAAgCAAAAAMAIEYAAPYMACCMBAEA_AcAIY4EQAD9BwAhkARAAP0HACGwBEAA_QcAIbEEQAD9BwAhsgQBAJ4IACEGjAQBAPwHACGOBEAA_QcAIZAEQAD9BwAhsARAAP0HACGxBEAA_QcAIbIEAQCeCAAhA00AAPIMACC1BQAA8wwAILsFAACsBQAgBE0AAOYMADC1BQAA5wwAMLcFAADpDAAguwUAAOoMADAETQAA2gwAMLUFAADbDAAwtwUAAN0MACC7BQAA3gwAMARNAADODAAwtQUAAM8MADC3BQAA0QwAILsFAADSDAAwBE0AAMIMADC1BQAAwwwAMLcFAADFDAAguwUAAMYMADAETQAAqQwAMLUFAACqDAAwtwUAAKwMACC7BQAArQwAMARNAACZDAAwtQUAAJoMADC3BQAAnAwAILsFAACdDAAwBE0AAI0MADC1BQAAjgwAMLcFAACQDAAguwUAAJEMADAETQAA6wsAMLUFAADsCwAwtwUAAO4LACC7BQAA7wsAMARNAADSCwAwtQUAANMLADC3BQAA1QsAILsFAADWCwAwBE0AALELADC1BQAAsgsAMLcFAAC0CwAguwUAALULADAETQAApgsAMLUFAACnCwAwtwUAAKkLACC7BQAA_woAMARNAAD7CgAwtQUAAPwKADC3BQAA_goAILsFAAD_CgAwBE0AAPAKADC1BQAA8QoAMLcFAADzCgAguwUAAOQKADAETQAA4AoAMLUFAADhCgAwtwUAAOMKACC7BQAA5AoAMARNAADVCgAwtQUAANYKADC3BQAA2AoAILsFAAC3CgAwBE0AAMoKADC1BQAAywoAMLcFAADNCgAguwUAAKoKADAETQAApgoAMLUFAACnCgAwtwUAAKkKACC7BQAAqgoAMARNAACNCgAwtQUAAI4KADC3BQAAkAoAILsFAACRCgAwBE0AAP8JADC1BQAAgAoAMLcFAACCCgAguwUAAIMKADAETQAA8QkAMLUFAADyCQAwtwUAAPQJACC7BQAA9QkAMARNAADWCQAwtQUAANcJADC3BQAA2QkAILsFAADaCQAwBE0AAMsJADC1BQAAzAkAMLcFAADOCQAguwUAAKwJADAETQAAqAkAMLUFAACpCQAwtwUAAKsJACC7BQAArAkAMARNAACZCQAwtQUAAJoJADC3BQAAnAkAILsFAACdCQAwBE0AAOIIADC1BQAA4wgAMLcFAADlCAAguwUAAOYIADAETQAA1AgAMLUFAADVCAAwtwUAANcIACC7BQAA2AgAMARNAADGCAAwtQUAAMcIADC3BQAAyQgAILsFAADKCAAwAgEAAKEIACCyBAAA-AcAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVNAADdDgAgTgAA4A4AILUFAADeDgAgtgUAAN8OACC7BQAAYwAgA00AAN0OACC1BQAA3g4AILsFAABjACAILAAApg4AIC4AAKEIACAvAACnDgAgMAAAoQgAINoEAAD4BwAg2wQAAPgHACDcBAAA-AcAIN0EAAD4BwAgAywAAKYOACAuAAChCAAgzQQAAPgHACAAAAAAAAAAAAAABU0AANgOACBOAADbDgAgtQUAANkOACC2BQAA2g4AILsFAACTBQAgA00AANgOACC1BQAA2Q4AILsFAACTBQAgAAAAAAAAAAAAAAAAAAVNAADTDgAgTgAA1g4AILUFAADUDgAgtgUAANUOACC7BQAAkwUAIANNAADTDgAgtQUAANQOACC7BQAAkwUAIAAAAAAAAAAABU0AAM4OACBOAADRDgAgtQUAAM8OACC2BQAA0A4AILsFAACTBQAgA00AAM4OACC1BQAAzw4AILsFAACTBQAgAAAABU0AAMkOACBOAADMDgAgtQUAAMoOACC2BQAAyw4AILsFAACTBQAgA00AAMkOACC1BQAAyg4AILsFAACTBQAgAAAAAAAAAAAAAAAAAAAAAAAABU0AAMQOACBOAADHDgAgtQUAAMUOACC2BQAAxg4AILsFAACTBQAgA00AAMQOACC1BQAAxQ4AILsFAACTBQAgAAAAAAAFTQAAvw4AIE4AAMIOACC1BQAAwA4AILYFAADBDgAguwUAAJMFACADTQAAvw4AILUFAADADgAguwUAAJMFACAAAAAAAAAAAAAAAAVNAAC6DgAgTgAAvQ4AILUFAAC7DgAgtgUAALwOACC7BQAAcQAgA00AALoOACC1BQAAuw4AILsFAABxACAAAAAFTQAAtQ4AIE4AALgOACC1BQAAtg4AILYFAAC3DgAguwUAAJMFACADTQAAtQ4AILUFAAC2DgAguwUAAJMFACAAAAAAAAAAAAAABU0AALAOACBOAACzDgAgtQUAALEOACC2BQAAsg4AILsFAAABACADTQAAsA4AILUFAACxDgAguwUAAAEAIBEBAAChCAAgEQAAoQgAIBkAAKwOACAaAACtDgAgLAAAqA4AIEAAAK4OACDaBAAA-AcAINsEAAD4BwAg3AQAAPgHACCJBQAA-AcAIIoFAAD4BwAgpwUAAPgHACCoBQAA-AcAIKkFAAD4BwAgqgUAAPgHACCrBQAA-AcAIKwFAAD4BwAgAwEAAKEIACAsAACoDgAgzQQAAPgHACAAAAAAAAQ3AAChCAAgOwAApQ4AIDwAAKkNACCiBQAA-AcAIAY4AACjDgAgOgAAqg0AIOEEAAD4BwAgnQUAAPgHACCeBQAA-AcAIJ8FAAD4BwAgAAcrAAC4DQAgMQAAtw0AIK8EAAD4BwAg0AQAAPgHACDRBAAA-AcAINIEAAD4BwAg0wQAAPgHACADLgAAoQgAIDIAAKYNACDoBAAA-AcAIAYXAACcDgAgKwAAnQ4AIK8EAAD4BwAg0AQAAPgHACDRBAAA-AcAINIEAAD4BwAgAgEAAKEIACAoAACjDQAgBhEAAKEIACAVAACdDQAgkQUAAPgHACCSBQAA-AcAIJMFAAD4BwAglAUAAPgHACADAQAAoQgAIBEAAKEIACASAACgDQAgBQEAAKEIACAWAACqDgAgFwAAnA4AIBgAAKANACCNBQAA-AcAIAUBAAChCAAgEAAAng0AIBgAAKANACDCBAAA-AcAIJEFAAD4BwAgBBcAAJwOACAgAAChCAAgIQAAoQgAIO4EAAD4BwAgAwYAAKEIACALAACZDQAg_wQAAPgHACAWAQAAsAsAIBEAAKELACAZAACjCwAgGgAAogsAIEAAAKULACCMBAEAAAABkARAAAAAAaYEAQAAAAGuBAAAAKcFArAEQAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAGJBQEAAAABigUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAECAAAAAQAgTQAAsA4AIAMAAAAnACBNAACwDgAgTgAAtA4AIBgAAAAnACABAACuCwAgEQAAhwsAIBkAAIkLACAaAACICwAgQAAAiwsAIEYAALQOACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAhQunBSKwBEAA_QcAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAIYkFAQCeCAAhigUBAJ4IACGLBQEA_AcAIacFQAD-BwAhqAUBAJ4IACGpBQEAnggAIaoFCACzCQAhqwUBAJ4IACGsBQEAnggAIRYBAACuCwAgEQAAhwsAIBkAAIkLACAaAACICwAgQAAAiwsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAtQ4AIAMAAACWBQAgTQAAtQ4AIE4AALkOACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA-AADECAAgPwAAxQgAIEYAALkOACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEMNwAAjw4AIDwAAJgJACCMBAEAAAABkARAAAAAAa4EAAAApAUCsARAAAAAAeAEAQAAAAHhBAEAAAAB4wQAAACiBQKgBQEAAAABogUBAAAAAaQFAQAAAAECAAAAcQAgTQAAug4AIAMAAABvACBNAAC6DgAgTgAAvg4AIA4AAABvACA3AACODgAgPAAA8AgAIEYAAL4OACCMBAEA_AcAIZAEQAD9BwAhrgQAAO0IpAUisARAAP0HACHgBAEA_AcAIeEEAQD8BwAh4wQAAOwIogUioAUBAPwHACGiBQEAnggAIaQFAQD8BwAhDDcAAI4OACA8AADwCAAgjAQBAPwHACGQBEAA_QcAIa4EAADtCKQFIrAEQAD9BwAh4AQBAPwHACHhBAEA_AcAIeMEAADsCKIFIqAFAQD8BwAhogUBAJ4IACGkBQEA_AcAITECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAL8OACADAAAAlgUAIE0AAL8OACBOAADDDgAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAADDDgAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAxA4AIAMAAACWBQAgTQAAxA4AIE4AAMgOACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAAMgOACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAA9wwAIAUAAPgMACAHAAD5DAAgCAAA-gwAIAkAAPsMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAgAAAJMFACBNAADJDgAgAwAAAJYFACBNAADJDgAgTgAAzQ4AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAAzQ4AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAM4OACADAAAAlgUAIE0AAM4OACBOAADSDgAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAADSDgAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAA0w4AIAMAAACWBQAgTQAA0w4AIE4AANcOACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAANcOACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAA9wwAIAUAAPgMACAHAAD5DAAgCAAA-gwAIAkAAPsMACANAAD8DAAgDgAA_QwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAgAAAJMFACBNAADYDgAgAwAAAJYFACBNAADYDgAgTgAA3A4AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAA3A4AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIRIuAADVCQAgLwAAyAkAIDAAAMkJACCMBAEAAAABkARAAAAAAa4EAAAA1wQCsARAAAAAAcoEAQAAAAHOBAgAAAAB1wRAAAAAAdgEQAAAAAHZBAgAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAAB3QQIAAAAAd4EAQAAAAHfBAEAAAABAgAAAGMAIE0AAN0OACADAAAAYQAgTQAA3Q4AIE4AAOEOACAUAAAAYQAgLgAA0wkAIC8AALUJACAwAAC2CQAgRgAA4Q4AIIwEAQD8BwAhkARAAP0HACGuBAAAsgnXBCKwBEAA_QcAIcoEAQD8BwAhzgQIAJYIACHXBEAA_QcAIdgEQAD9BwAh2QQIAJYIACHaBAEAnggAIdsEAQCeCAAh3AQBAJ4IACHdBAgAswkAId4EAQD8BwAh3wQBAPwHACESLgAA0wkAIC8AALUJACAwAAC2CQAgjAQBAPwHACGQBEAA_QcAIa4EAACyCdcEIrAEQAD9BwAhygQBAPwHACHOBAgAlggAIdcEQAD9BwAh2ARAAP0HACHZBAgAlggAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAId0ECACzCQAh3gQBAPwHACHfBAEA_AcAIQqMBAEAAAABkARAAAAAAacEAgAAAAGoBAgAAAABqQQBAAAAAasEAAAAqwQCrAQBAAAAAa4EAAAArgQCrwQBAAAAAbAEQAAAAAEIjAQBAAAAAZAEQAAAAAGgBAAAAKAEAqEEAgAAAAGiBAEAAAABowQBAAAAAaQEAQAAAAGlBAIAAAABBYwEAQAAAAGOBEAAAAABkARAAAAAAZ0EAQAAAAGeBAIAAAABBYwEAQAAAAGNBAEAAAABjgRAAAAAAY8EQAAAAAGQBEAAAAABMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAA5g4AIAMAAACWBQAgTQAA5g4AIE4AAOoOACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAAOoOACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEJjAQBAAAAAZAEQAAAAAGRBAEAAAABrgQAAAD5BAKwBEAAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEHjAQBAAAAAZAEQAAAAAGgBAEAAAAB4AQBAAAAAfMEAQAAAAH_BAEAAAABgAUgAAAAAQkGAADiDQAgjAQBAAAAAZAEQAAAAAGRBAEAAAABoAQBAAAAAeAEAQAAAAHzBAEAAAAB_wQBAAAAAYAFIAAAAAECAAAAFwAgTQAA7Q4AIAMAAAAVACBNAADtDgAgTgAA8Q4AIAsAAAAVACAGAADhDQAgRgAA8Q4AIIwEAQD8BwAhkARAAP0HACGRBAEA_AcAIaAEAQD8BwAh4AQBAPwHACHzBAEA_AcAIf8EAQCeCAAhgAUgAKgIACEJBgAA4Q0AIIwEAQD8BwAhkARAAP0HACGRBAEA_AcAIaAEAQD8BwAh4AQBAPwHACHzBAEA_AcAIf8EAQCeCAAhgAUgAKgIACEJjAQBAAAAAZAEQAAAAAGuBAAAAPkEArAEQAAAAAH1BAEAAAAB9wQAAAD3BAL5BAIAAAAB-gRAAAAAAfsEAQAAAAEFjAQBAAAAAZAEQAAAAAH8BAEAAAAB_QQBAAAAAf4EAQAAAAEQjAQBAAAAAZAEQAAAAAGmBAEAAAABrgQAAACnBQKwBEAAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAABiQUBAAAAAYsFAQAAAAGnBUAAAAABqAUBAAAAAakFAQAAAAGqBQgAAAABqwUBAAAAAawFAQAAAAEKjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABhwUBAAAAAYgFAQAAAAGJBQEAAAABDIwEAQAAAAGQBEAAAAABsARAAAAAAcEEIAAAAAHCBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAEAAAAB5AQBAAAAAZEFAQAAAAGWBQgAAAABlwUgAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAPcOACADAAAAlgUAIE0AAPcOACBOAAD7DgAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAAD7DgAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhB4wEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABDYwEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAAB4wQBAAAAAeQEAQAAAAGQBQgAAAABkQUBAAAAAZIFQAAAAAGTBQEAAAABlAUBAAAAAZUFIAAAAAEPEQAA9g0AIIwEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAAB4wQBAAAAAeQEAQAAAAGLBQEAAAABkAUIAAAAAZEFAQAAAAGSBUAAAAABkwUBAAAAAZQFAQAAAAGVBSAAAAABAgAAAD4AIE0AAP4OACAKjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABhwUBAAAAAYgFAQAAAAGKBQEAAAABAwAAADwAIE0AAP4OACBOAACDDwAgEQAAADwAIBEAAPUNACBGAACDDwAgjAQBAPwHACGQBEAA_QcAIbAEQAD9BwAh4AQBAPwHACHhBAEA_AcAIeMEAQD8BwAh5AQBAPwHACGLBQEA_AcAIZAFCACWCAAhkQUBAJ4IACGSBUAA_gcAIZMFAQCeCAAhlAUBAJ4IACGVBSAAqAgAIQ8RAAD1DQAgjAQBAPwHACGQBEAA_QcAIbAEQAD9BwAh4AQBAPwHACHhBAEA_AcAIeMEAQD8BwAh5AQBAPwHACGLBQEA_AcAIZAFCACWCAAhkQUBAJ4IACGSBUAA_gcAIZMFAQCeCAAhlAUBAJ4IACGVBSAAqAgAIQeMBAEAAAABkARAAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABjwUBAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAIUPACADAAAAlgUAIE0AAIUPACBOAACJDwAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAACJDwAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhEIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYkFAQAAAAGKBQEAAAABpwVAAAAAAagFAQAAAAGpBQEAAAABqgUIAAAAAasFAQAAAAGsBQEAAAABCwEAAOgLACAWAADPCwAgGAAA0QsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABjwUBAAAAAQIAAAAzACBNAACLDwAgDwEAAP0NACAYAACMDAAgjAQBAAAAAZAEQAAAAAGmBAEAAAABsARAAAAAAcEEIAAAAAHCBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAEAAAAB5AQBAAAAAZEFAQAAAAGWBQgAAAABlwUgAAAAAQIAAAAlACBNAACNDwAgMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAjw8AIDECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAJEPACADAAAAlgUAIE0AAJEPACBOAACVDwAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAACVDwAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhAwAAADAAIE0AAIsPACBOAACYDwAgDQAAADAAIAEAAOYLACAWAAC9CwAgGAAAvwsAIEYAAJgPACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQsBAADmCwAgFgAAvQsAIBgAAL8LACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQMAAAAjACBNAACNDwAgTgAAmw8AIBEAAAAjACABAAD8DQAgGAAA9wsAIEYAAJsPACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIcEEIACoCAAhwgRAAP4HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZEFAQCeCAAhlgUIAJYIACGXBSAAqAgAIQ8BAAD8DQAgGAAA9wsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhwQQgAKgIACHCBEAA_gcAIeAEAQD8BwAh4QQBAPwHACHjBAEA_AcAIeQEAQD8BwAhkQUBAJ4IACGWBQgAlggAIZcFIACoCAAhAwAAAJYFACBNAACPDwAgTgAAng8AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAAng8AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIRCMBAEAAAABkARAAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYkFAQAAAAGKBQEAAAABiwUBAAAAAacFQAAAAAGoBQEAAAABqQUBAAAAAaoFCAAAAAGrBQEAAAABrAUBAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAKAPACADAAAAlgUAIE0AAKAPACBOAACkDwAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAACkDwAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhBowEAQAAAAGQBEAAAAAB7QQCAAAAAe4EAQAAAAHwBAEAAAAB8QQBAAAAARYBAACwCwAgEQAAoQsAIBkAAKMLACAaAACiCwAgLAAApAsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAApwUCsARAAAAAAdoEAQAAAAHbBAEAAAAB3AQBAAAAAYkFAQAAAAGKBQEAAAABiwUBAAAAAacFQAAAAAGoBQEAAAABqQUBAAAAAaoFCAAAAAGrBQEAAAABrAUBAAAAAQIAAAABACBNAACmDwAgMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAqA8AIAMAAAAnACBNAACmDwAgTgAArA8AIBgAAAAnACABAACuCwAgEQAAhwsAIBkAAIkLACAaAACICwAgLAAAigsAIEYAAKwPACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAhQunBSKwBEAA_QcAIdoEAQCeCAAh2wQBAJ4IACHcBAEAnggAIYkFAQCeCAAhigUBAJ4IACGLBQEA_AcAIacFQAD-BwAhqAUBAJ4IACGpBQEAnggAIaoFCACzCQAhqwUBAJ4IACGsBQEAnggAIRYBAACuCwAgEQAAhwsAIBkAAIkLACAaAACICwAgLAAAigsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIa4EAACFC6cFIrAEQAD9BwAh2gQBAJ4IACHbBAEAnggAIdwEAQCeCAAhiQUBAJ4IACGKBQEAnggAIYsFAQD8BwAhpwVAAP4HACGoBQEAnggAIakFAQCeCAAhqgUIALMJACGrBQEAnggAIawFAQCeCAAhAwAAAJYFACBNAACoDwAgTgAArw8AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAArw8AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIQaMBAEAAAABkARAAAAAAe0EAgAAAAHuBAEAAAAB7wQBAAAAAfEEAQAAAAEHAQAA1AoAIBEAAMgKACCMBAEAAAABkARAAAAAAaYEAQAAAAGwBEAAAAABiwUBAAAAAQIAAABLACBNAACxDwAgAwAAAEkAIE0AALEPACBOAAC1DwAgCQAAAEkAIAEAANIKACARAACxCgAgRgAAtQ8AIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhiwUBAPwHACEHAQAA0goAIBEAALEKACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIYsFAQD8BwAhCowEAQAAAAGQBEAAAAAB8wQBAAAAAYIFAAAAggUCgwUIAAAAAYUFAAAAhQUDhgVAAAAAAYcFAQAAAAGJBQEAAAABigUBAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AALcPACADAAAAlgUAIE0AALcPACBOAAC7DwAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAAC7DwAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhBIwEAQAAAAGQBEAAAAABpgQBAAAAAbAEQAAAAAExAgAA9wwAIAUAAPgMACAHAAD5DAAgCAAA-gwAIAkAAPsMACANAAD8DAAgDgAA_QwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAgAAAJMFACBNAAC9DwAgDwEAAP0NACAQAACLDAAgjAQBAAAAAZAEQAAAAAGmBAEAAAABsARAAAAAAcEEIAAAAAHCBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAEAAAAB5AQBAAAAAZEFAQAAAAGWBQgAAAABlwUgAAAAAQIAAAAlACBNAAC_DwAgCwEAAOgLACAWAADPCwAgFwAA0AsAIIwEAQAAAAGQBEAAAAABpgQBAAAAAa4EAAAAjwUCsARAAAAAAYwFAQAAAAGNBQgAAAABjwUBAAAAAQIAAAAzACBNAADBDwAgMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAww8AIAMAAAAjACBNAAC_DwAgTgAAxw8AIBEAAAAjACABAAD8DQAgEAAA9gsAIEYAAMcPACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGwBEAA_QcAIcEEIACoCAAhwgRAAP4HACHgBAEA_AcAIeEEAQD8BwAh4wQBAPwHACHkBAEA_AcAIZEFAQCeCAAhlgUIAJYIACGXBSAAqAgAIQ8BAAD8DQAgEAAA9gsAIIwEAQD8BwAhkARAAP0HACGmBAEA_AcAIbAEQAD9BwAhwQQgAKgIACHCBEAA_gcAIeAEAQD8BwAh4QQBAPwHACHjBAEA_AcAIeQEAQD8BwAhkQUBAJ4IACGWBQgAlggAIZcFIACoCAAhAwAAADAAIE0AAMEPACBOAADKDwAgDQAAADAAIAEAAOYLACAWAAC9CwAgFwAAvgsAIEYAAMoPACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQsBAADmCwAgFgAAvQsAIBcAAL4LACCMBAEA_AcAIZAEQAD9BwAhpgQBAPwHACGuBAAAuwuPBSKwBEAA_QcAIYwFAQD8BwAhjQUIALMJACGPBQEA_AcAIQMAAACWBQAgTQAAww8AIE4AAM0PACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAAM0PACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEKjAQBAAAAAZAEQAAAAAHzBAEAAAABggUAAACCBQKDBQgAAAABhQUAAACFBQOGBUAAAAABiAUBAAAAAYkFAQAAAAGKBQEAAAABAwAAAJYFACBNAAC9DwAgTgAA0Q8AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAA0Q8AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIQSMBAEAAAABkARAAAAAAbAEQAAAAAGLBQEAAAABMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAA0w8AIAMAAACWBQAgTQAA0w8AIE4AANcPACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAANcPACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEEjAQBAAAAAZAEQAAAAAHvBAEAAAAB8wQBAAAAAQiMBAEAAAABkARAAAAAAaIEAQAAAAGkBAEAAAABpQQCAAAAAbAEQAAAAAHhBAEAAAAB9AQCAAAAAQoBAADTDQAgjAQBAAAAAZAEQAAAAAGiBAEAAAABpAQBAAAAAaUEAgAAAAGmBAEAAAABsARAAAAAAeEEAQAAAAH0BAIAAAABAgAAAFAAIE0AANoPACADAAAATgAgTQAA2g8AIE4AAN4PACAMAAAATgAgAQAA0g0AIEYAAN4PACCMBAEA_AcAIZAEQAD9BwAhogQBAPwHACGkBAEA_AcAIaUEAgCGCAAhpgQBAPwHACGwBEAA_QcAIeEEAQD8BwAh9AQCAIYIACEKAQAA0g0AIIwEAQD8BwAhkARAAP0HACGiBAEA_AcAIaQEAQD8BwAhpQQCAIYIACGmBAEA_AcAIbAEQAD9BwAh4QQBAPwHACH0BAIAhggAIQSMBAEAAAABkARAAAAAAfIEAQAAAAHzBAEAAAABDRcAAJsOACCMBAEAAAABkARAAAAAAagECAAAAAGpBAEAAAABqwQAAACrBAKuBAAAAKYFAq8EAQAAAAGwBEAAAAAB0ARAAAAAAdEEQAAAAAHSBEAAAAAB8QQBAAAAAQIAAAC9AQAgTQAA4A8AIAMAAAChAQAgTQAA4A8AIE4AAOQPACAPAAAAoQEAIBcAAJoOACBGAADkDwAgjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAlgumBSKvBAEAnggAIbAEQAD9BwAh0ARAAP4HACHRBEAA_gcAIdIEQAD-BwAh8QQBAPwHACENFwAAmg4AIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirgQAAJYLpgUirwQBAJ4IACGwBEAA_QcAIdAEQAD-BwAh0QRAAP4HACHSBEAA_gcAIfEEAQD8BwAhCIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGuBAAAAM0EArAEQAAAAAHLBAEAAAABzQQBAAAAAQ6MBAEAAAABkARAAAAAAa4EAAAA1wQCsARAAAAAAcoEAQAAAAHOBAgAAAAB1wRAAAAAAdgEQAAAAAHZBAgAAAAB2gQBAAAAAdsEAQAAAAHcBAEAAAAB3QQIAAAAAd8EAQAAAAENjAQBAAAAAZAEQAAAAAGuBAAAAOcEArAEQAAAAAHOBAgAAAAB4AQBAAAAAeEEAQAAAAHjBAAAAOMEAuQEAQAAAAHlBAgAAAAB5wQgAAAAAegEAQAAAAHpBAAA7wkAIDECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAOgPACADAAAAlgUAIE0AAOgPACBOAADsDwAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAADsDwAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhDowEAQAAAAGQBEAAAAABrgQAAADXBAKwBEAAAAABygQBAAAAAc4ECAAAAAHXBEAAAAAB2ARAAAAAAdkECAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAHdBAgAAAAB3gQBAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAO4PACAPLgAAxA0AIIwEAQAAAAGQBEAAAAABrgQAAADnBAKwBEAAAAABygQBAAAAAc4ECAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAA4wQC5AQBAAAAAeUECAAAAAHnBCAAAAAB6AQBAAAAAekEAADvCQAgAgAAAF8AIE0AAPAPACAxAgAA9wwAIAUAAPgMACAHAAD5DAAgCAAA-gwAIAkAAPsMACANAAD8DAAgDgAA_QwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAgAAAJMFACBNAADyDwAgAwAAAJYFACBNAADyDwAgTgAA9g8AIDMAAACWBQAgAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAA9g8AIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAIQMAAACWBQAgTQAA7g8AIE4AAPkPACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAAPkPACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEDAAAAXQAgTQAA8A8AIE4AAPwPACARAAAAXQAgLgAAww0AIEYAAPwPACCMBAEA_AcAIZAEQAD9BwAhrgQAAOEJ5wQisARAAP0HACHKBAEA_AcAIc4ECACWCAAh4AQBAPwHACHhBAEA_AcAIeMEAADgCeMEIuQEAQD8BwAh5QQIAJYIACHnBCAAqAgAIegEAQCeCAAh6QQAAOIJACAPLgAAww0AIIwEAQD8BwAhkARAAP0HACGuBAAA4QnnBCKwBEAA_QcAIcoEAQD8BwAhzgQIAJYIACHgBAEA_AcAIeEEAQD8BwAh4wQAAOAJ4wQi5AQBAPwHACHlBAgAlggAIecEIACoCAAh6AQBAJ4IACHpBAAA4gkAIA6MBAEAAAABkARAAAAAAa4EAAAA1wQCsARAAAAAAc4ECAAAAAHXBEAAAAAB2ARAAAAAAdkECAAAAAHaBAEAAAAB2wQBAAAAAdwEAQAAAAHdBAgAAAAB3gQBAAAAAd8EAQAAAAEQMQAAtg0AIIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGrBAAAAKsEAq4EAAAA0AQCrwQBAAAAAbAEQAAAAAHOBAgAAAAB0ARAAAAAAdEEQAAAAAHSBEAAAAAB0wRAAAAAAdQECAAAAAHVBAEAAAABAgAAAOUEACBNAAD-DwAgAwAAAGUAIE0AAP4PACBOAACCEAAgEgAAAGUAIDEAALUNACBGAACCEAAgjAQBAPwHACGQBEAA_QcAIagECACWCAAhqQQBAPwHACGrBAAAlwirBCKuBAAAvQnQBCKvBAEAnggAIbAEQAD9BwAhzgQIAJYIACHQBEAA_gcAIdEEQAD-BwAh0gRAAP4HACHTBEAA_gcAIdQECACWCAAh1QQBAPwHACEQMQAAtQ0AIIwEAQD8BwAhkARAAP0HACGoBAgAlggAIakEAQD8BwAhqwQAAJcIqwQirgQAAL0J0AQirwQBAJ4IACGwBEAA_QcAIc4ECACWCAAh0ARAAP4HACHRBEAA_gcAIdIEQAD-BwAh0wRAAP4HACHUBAgAlggAIdUEAQD8BwAhCIwEAQAAAAGQBEAAAAABqAQIAAAAAakEAQAAAAGuBAAAAM0EArAEQAAAAAHLBAEAAAABzQQBAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAIQQACADAAAAlgUAIE0AAIQQACBOAACIEAAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACBGAACIEAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhBYwEAQAAAAGQBEAAAAABkQQBAAAAAbAEQAAAAAGYBUAAAAABCYwEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAABnAUCAAAAAZ0FAQAAAAGeBQEAAAABnwUCAAAAATECAAD3DAAgBQAA-AwAIAcAAPkMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAIsQACADAAAAlgUAIE0AAIsQACBOAACPEAAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID8AAMUIACBGAACPEAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhBYwEAQAAAAGQBEAAAAABkQQBAAAAAbAEQAAAAAGaBQEAAAABCYwEAQAAAAGQBEAAAAABrgQAAACkBQKwBEAAAAAB4AQBAAAAAeEEAQAAAAHjBAAAAKIFAqAFAQAAAAGiBQEAAAABDDcAAI8OACA7AACXCQAgjAQBAAAAAZAEQAAAAAGuBAAAAKQFArAEQAAAAAHgBAEAAAAB4QQBAAAAAeMEAAAAogUCoAUBAAAAAaIFAQAAAAGkBQEAAAABAgAAAHEAIE0AAJIQACADAAAAbwAgTQAAkhAAIE4AAJYQACAOAAAAbwAgNwAAjg4AIDsAAO8IACBGAACWEAAgjAQBAPwHACGQBEAA_QcAIa4EAADtCKQFIrAEQAD9BwAh4AQBAPwHACHhBAEA_AcAIeMEAADsCKIFIqAFAQD8BwAhogUBAJ4IACGkBQEA_AcAIQw3AACODgAgOwAA7wgAIIwEAQD8BwAhkARAAP0HACGuBAAA7QikBSKwBEAA_QcAIeAEAQD8BwAh4QQBAPwHACHjBAAA7AiiBSKgBQEA_AcAIaIFAQCeCAAhpAUBAPwHACEFjAQBAAAAAZAEQAAAAAGwBEAAAAABmgUBAAAAAZsFAQAAAAELOAAAig4AIIwEAQAAAAGQBEAAAAABsARAAAAAAeAEAQAAAAHhBAEAAAABmwUBAAAAAZwFAgAAAAGdBQEAAAABngUBAAAAAZ8FAgAAAAECAAAAdQAgTQAAmBAAIAMAAABzACBNAACYEAAgTgAAnBAAIA0AAABzACA4AACJDgAgRgAAnBAAIIwEAQD8BwAhkARAAP0HACGwBEAA_QcAIeAEAQD8BwAh4QQBAJ4IACGbBQEA_AcAIZwFAgCGCAAhnQUBAJ4IACGeBQEAnggAIZ8FAgCGCQAhCzgAAIkOACCMBAEA_AcAIZAEQAD9BwAhsARAAP0HACHgBAEA_AcAIeEEAQCeCAAhmwUBAPwHACGcBQIAhggAIZ0FAQCeCAAhngUBAJ4IACGfBQIAhgkAIQWMBAEAAAABkARAAAAAAbAEQAAAAAGYBUAAAAABmQUBAAAAATEFAAD4DAAgBwAA-QwAIAgAAPoMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAJ4QACADAAAAlgUAIE0AAJ4QACBOAACiEAAgMwAAAJYFACAFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAACiEAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITEFAACrCAAgBwAArAgAIAgAAK0IACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAPcMACAHAAD5DAAgCAAA-gwAIAkAAPsMACANAAD8DAAgDgAA_QwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAoxAAIAMAAACWBQAgTQAAoxAAIE4AAKcQACAzAAAAlgUAIAIAAKoIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAAKcQACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAHAACsCAAgCAAArQgAIAkAAK4IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAA9wwAIAUAAPgMACAIAAD6DAAgCQAA-wwAIA0AAPwMACAOAAD9DAAgDwAA_gwAIBsAAP8MACAcAACADQAgHQAAgQ0AIB4AAIINACAfAACDDQAgIgAAhA0AICMAAIUNACAkAACGDQAgJQAAhw0AICYAAIgNACApAACJDQAgKgAAig0AIC0AAIsNACAzAACMDQAgNAAAjQ0AIDUAAI4NACA2AACPDQAgPQAAkA0AID4AAJENACA_AACSDQAgjAQBAAAAAZAEQAAAAAGsBAEAAAABsARAAAAAAbMEAQAAAAG0BAEAAAABtQQBAAAAAbcEAAAAtwQCuAQBAAAAAbkEAQAAAAG6BCAAAAABuwRAAAAAAbwEIAAAAAG9BCAAAAABvwQAAAC_BALABEAAAAABwQQgAAAAAcIEQAAAAAHDBEAAAAABxAQCAAAAAcUEQAAAAAHGBAIAAAABAgAAAJMFACBNAACoEAAgAwAAAJYFACBNAACoEAAgTgAArBAAIDMAAACWBQAgAgAAqggAIAUAAKsIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgRgAArBAAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACExAgAAqggAIAUAAKsIACAIAACtCAAgCQAArggAIA0AAK8IACAOAACwCAAgDwAAsQgAIBsAALIIACAcAACzCAAgHQAAtAgAIB4AALUIACAfAAC2CAAgIgAAtwgAICMAALgIACAkAAC5CAAgJQAAuggAICYAALsIACApAAC8CAAgKgAAvQgAIC0AAL4IACAzAAC_CAAgNAAAwAgAIDUAAMEIACA2AADCCAAgPQAAwwgAID4AAMQIACA_AADFCAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAAD3DAAgBQAA-AwAIAcAAPkMACAJAAD7DAAgDQAA_AwAIA4AAP0MACAPAAD-DAAgGwAA_wwAIBwAAIANACAdAACBDQAgHgAAgg0AIB8AAIMNACAiAACEDQAgIwAAhQ0AICQAAIYNACAlAACHDQAgJgAAiA0AICkAAIkNACAqAACKDQAgLQAAiw0AIDMAAIwNACA0AACNDQAgNQAAjg0AIDYAAI8NACA9AACQDQAgPgAAkQ0AID8AAJINACCMBAEAAAABkARAAAAAAawEAQAAAAGwBEAAAAABswQBAAAAAbQEAQAAAAG1BAEAAAABtwQAAAC3BAK4BAEAAAABuQQBAAAAAboEIAAAAAG7BEAAAAABvAQgAAAAAb0EIAAAAAG_BAAAAL8EAsAEQAAAAAHBBCAAAAABwgRAAAAAAcMEQAAAAAHEBAIAAAABxQRAAAAAAcYEAgAAAAECAAAAkwUAIE0AAK0QACADAAAAlgUAIE0AAK0QACBOAACxEAAgMwAAAJYFACACAACqCAAgBQAAqwgAIAcAAKwIACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACBGAACxEAAgjAQBAPwHACGQBEAA_QcAIawEAQCeCAAhsARAAP0HACGzBAEA_AcAIbQEAQD8BwAhtQQBAPwHACG3BAAApwi3BCK4BAEAnggAIbkEAQCeCAAhugQgAKgIACG7BEAA_gcAIbwEIACoCAAhvQQgAKgIACG_BAAAqQi_BCLABEAA_gcAIcEEIACoCAAhwgRAAP4HACHDBEAA_gcAIcQEAgCGCAAhxQRAAP4HACHGBAIAhggAITECAACqCAAgBQAAqwgAIAcAAKwIACAJAACuCAAgDQAArwgAIA4AALAIACAPAACxCAAgGwAAsggAIBwAALMIACAdAAC0CAAgHgAAtQgAIB8AALYIACAiAAC3CAAgIwAAuAgAICQAALkIACAlAAC6CAAgJgAAuwgAICkAALwIACAqAAC9CAAgLQAAvggAIDMAAL8IACA0AADACAAgNQAAwQgAIDYAAMIIACA9AADDCAAgPgAAxAgAID8AAMUIACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAPcMACAFAAD4DAAgBwAA-QwAIAgAAPoMACANAAD8DAAgDgAA_QwAIA8AAP4MACAbAAD_DAAgHAAAgA0AIB0AAIENACAeAACCDQAgHwAAgw0AICIAAIQNACAjAACFDQAgJAAAhg0AICUAAIcNACAmAACIDQAgKQAAiQ0AICoAAIoNACAtAACLDQAgMwAAjA0AIDQAAI0NACA1AACODQAgNgAAjw0AID0AAJANACA-AACRDQAgPwAAkg0AIIwEAQAAAAGQBEAAAAABrAQBAAAAAbAEQAAAAAGzBAEAAAABtAQBAAAAAbUEAQAAAAG3BAAAALcEArgEAQAAAAG5BAEAAAABugQgAAAAAbsEQAAAAAG8BCAAAAABvQQgAAAAAb8EAAAAvwQCwARAAAAAAcEEIAAAAAHCBEAAAAABwwRAAAAAAcQEAgAAAAHFBEAAAAABxgQCAAAAAQIAAACTBQAgTQAAshAAIAMAAACWBQAgTQAAshAAIE4AALYQACAzAAAAlgUAIAIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIEYAALYQACCMBAEA_AcAIZAEQAD9BwAhrAQBAJ4IACGwBEAA_QcAIbMEAQD8BwAhtAQBAPwHACG1BAEA_AcAIbcEAACnCLcEIrgEAQCeCAAhuQQBAJ4IACG6BCAAqAgAIbsEQAD-BwAhvAQgAKgIACG9BCAAqAgAIb8EAACpCL8EIsAEQAD-BwAhwQQgAKgIACHCBEAA_gcAIcMEQAD-BwAhxAQCAIYIACHFBEAA_gcAIcYEAgCGCAAhMQIAAKoIACAFAACrCAAgBwAArAgAIAgAAK0IACANAACvCAAgDgAAsAgAIA8AALEIACAbAACyCAAgHAAAswgAIB0AALQIACAeAAC1CAAgHwAAtggAICIAALcIACAjAAC4CAAgJAAAuQgAICUAALoIACAmAAC7CAAgKQAAvAgAICoAAL0IACAtAAC-CAAgMwAAvwgAIDQAAMAIACA1AADBCAAgNgAAwggAID0AAMMIACA-AADECAAgPwAAxQgAIIwEAQD8BwAhkARAAP0HACGsBAEAnggAIbAEQAD9BwAhswQBAPwHACG0BAEA_AcAIbUEAQD8BwAhtwQAAKcItwQiuAQBAJ4IACG5BAEAnggAIboEIACoCAAhuwRAAP4HACG8BCAAqAgAIb0EIACoCAAhvwQAAKkIvwQiwARAAP4HACHBBCAAqAgAIcIEQAD-BwAhwwRAAP4HACHEBAIAhggAIcUEQAD-BwAhxgQCAIYIACEGAQACEQACGaABEBqfAQwsogEaQKMBFR0CBAMFCAQHDAUIEAYJFAcMACYNGAgOHgkPIgsbJgwcPxEdQBAeQQEfQgEiRhUjRxUkSA0lTA4mTQ4pURYqVxctWxkzYBs0ahw1axw2bh49ciA-ggEkP4MBIgEBAAIBAQACAQYAAgEGAAIBBgACAwYAAgscCQwACgIGAAIKAAgBCx0AAQYAAgQBAAIMABQQKQEYLQ0EEwAOFAACGTEQGjkMBAEAAgwADxEAAhIuDQESLwAFAQACDAATFgARFzYBGDcNAwwAEhEAAhU0EAEVNQABGDgAAhA6ABg7AAMXAAEgAAIhAAIDAQACDAAYKFUXAiAAAicAFgEoVgACAQACLAAaAhcAAStcGQMMAB8uAAIyZBwELGYdLgACLwAbMAACAitoHjEAHAIsAB0uAAIBMmkABAwAJTcAAjt2ITx_JAMMACM4ACA6eiICBgACOQAhATp7AAIGAAI4ACACO4ABADyBAQAbBYQBAAeFAQAIhgEACYcBAA2IAQAOiQEAD4oBABuLAQAcjAEAHY0BAB6OAQAfjwEAIpABACORAQAkkgEAJZMBACaUAQAplQEAKpYBAC2XAQAzmAEANJkBADWaAQA2mwEAPZwBAD6dAQA_ngEAAAQBAAIRAAIZrgEQGq0BDAQBAAIRAAIZtQEQGrQBDAUMACtTACxUAC1VAC5WAC8AAAAAAAUMACtTACxUAC1VAC5WAC8BFwABARcAAQUMADRTADVUADZVADdWADgAAAAAAAUMADRTADVUADZVADdWADgCAQACLAAaAgEAAiwAGgUMAD1TAD5UAD9VAEBWAEEAAAAAAAUMAD1TAD5UAD9VAEBWAEEBNwACATcAAgMMAEZVAEdWAEgAAAADDABGVQBHVgBIATgAIAE4ACAFDABNUwBOVABPVQBQVgBRAAAAAAAFDABNUwBOVABPVQBQVgBRAgYAAjgAIAIGAAI4ACADDABWVQBXVgBYAAAAAwwAVlUAV1YAWAIGAAI5ACECBgACOQAhAwwAXVUAXlYAXwAAAAMMAF1VAF5WAF8BAQACAQEAAgUMAGRTAGVUAGZVAGdWAGgAAAAAAAUMAGRTAGVUAGZVAGdWAGgBEQACAREAAgUMAG1TAG5UAG9VAHBWAHEAAAAAAAUMAG1TAG5UAG9VAHBWAHECAQACFgARAgEAAhYAEQUMAHZTAHdUAHhVAHlWAHoAAAAAAAUMAHZTAHdUAHhVAHlWAHoCAQACEQACAgEAAhEAAgMMAH9VAIABVgCBAQAAAAMMAH9VAIABVgCBAQQTAA4UAAIZpQMQGqYDDAQTAA4UAAIZrAMQGq0DDAUMAIYBUwCHAVQAiAFVAIkBVgCKAQAAAAAABQwAhgFTAIcBVACIAVUAiQFWAIoBAQYAAgEGAAIDDACPAVUAkAFWAJEBAAAAAwwAjwFVAJABVgCRAQEGAAIBBgACAwwAlgFVAJcBVgCYAQAAAAMMAJYBVQCXAVYAmAECBgACCgAIAgYAAgoACAUMAJ0BUwCeAVQAnwFVAKABVgChAQAAAAAABQwAnQFTAJ4BVACfAVUAoAFWAKEBAQEAAgEBAAIFDACmAVMApwFUAKgBVQCpAVYAqgEAAAAAAAUMAKYBUwCnAVQAqAFVAKkBVgCqAQIgAAInABYCIAACJwAWAwwArwFVALABVgCxAQAAAAMMAK8BVQCwAVYAsQEDFwABIAACIQACAxcAASAAAiEAAgUMALYBUwC3AVQAuAFVALkBVgC6AQAAAAAABQwAtgFTALcBVAC4AVUAuQFWALoBAS4AAgEuAAIFDAC_AVMAwAFUAMEBVQDCAVYAwwEAAAAAAAUMAL8BUwDAAVQAwQFVAMIBVgDDAQMuAAIvABswAAIDLgACLwAbMAACBQwAyAFTAMkBVADKAVUAywFWAMwBAAAAAAAFDADIAVMAyQFUAMoBVQDLAVYAzAEBMQAcATEAHAUMANEBUwDSAVQA0wFVANQBVgDVAQAAAAAABQwA0QFTANIBVADTAVUA1AFWANUBAiwAHS4AAgIsAB0uAAIFDADaAVMA2wFUANwBVQDdAVYA3gEAAAAAAAUMANoBUwDbAVQA3AFVAN0BVgDeAQAABQwA4wFTAOQBVADlAVUA5gFWAOcBAAAAAAAFDADjAVMA5AFUAOUBVQDmAVYA5wEBAQACAQEAAgMMAOwBVQDtAVYA7gEAAAADDADsAVUA7QFWAO4BAQEAAgEBAAIFDADzAVMA9AFUAPUBVQD2AVYA9wEAAAAAAAUMAPMBUwD0AVQA9QFVAPYBVgD3AQEGAAIBBgACBQwA_AFTAP0BVAD-AVUA_wFWAIACAAAAAAAFDAD8AVMA_QFUAP4BVQD_AVYAgAIBBgACAQYAAgUMAIUCUwCGAlQAhwJVAIgCVgCJAgAAAAAABQwAhQJTAIYCVACHAlUAiAJWAIkCAQYAAgEGAAIDDACOAlUAjwJWAJACAAAAAwwAjgJVAI8CVgCQAkECAUKkAQFDpQEBRKYBAUWnAQFHqQEBSKsBJ0msAShKsAEBS7IBJ0yzASlPtgEBULcBAVG4ASdXuwEqWLwBMFm-ARpavwEaW8EBGlzCARpdwwEaXsUBGl_HASdgyAExYcoBGmLMASdjzQEyZM4BGmXPARpm0AEnZ9MBM2jUATlp1QEZatYBGWvXARls2AEZbdkBGW7bARlv3QEncN4BOnHgARly4gEnc-MBO3TkARl15QEZduYBJ3fpATx46gFCeesBIHrsASB77QEgfO4BIH3vASB-8QEgf_MBJ4AB9AFDgQH2ASCCAfgBJ4MB-QFEhAH6ASCFAfsBIIYB_AEnhwH_AUWIAYACSYkBgQIhigGCAiGLAYMCIYwBhAIhjQGFAiGOAYcCIY8BiQInkAGKAkqRAYwCIZIBjgInkwGPAkuUAZACIZUBkQIhlgGSAieXAZUCTJgBlgJSmQGXAiSaAZgCJJsBmQIknAGaAiSdAZsCJJ4BnQIknwGfAiegAaACU6EBogIkogGkAiejAaUCVKQBpgIkpQGnAiSmAagCJ6cBqwJVqAGsAlmpAa0CIqoBrgIiqwGvAiKsAbACIq0BsQIirgGzAiKvAbUCJ7ABtgJasQG4AiKyAboCJ7MBuwJbtAG8AiK1Ab0CIrYBvgIntwHBAly4AcICYLkBwwIMugHEAgy7AcUCDLwBxgIMvQHHAgy-AckCDL8BywInwAHMAmHBAc4CDMIB0AInwwHRAmLEAdICDMUB0wIMxgHUAifHAdcCY8gB2AJpyQHZAhHKAdoCEcsB2wIRzAHcAhHNAd0CEc4B3wIRzwHhAifQAeICatEB5AIR0gHmAifTAecCa9QB6AIR1QHpAhHWAeoCJ9cB7QJs2AHuAnLZAe8CENoB8AIQ2wHxAhDcAfICEN0B8wIQ3gH1AhDfAfcCJ-AB-AJz4QH6AhDiAfwCJ-MB_QJ05AH-AhDlAf8CEOYBgAMn5wGDA3XoAYQDe-kBhQMO6gGGAw7rAYcDDuwBiAMO7QGJAw7uAYsDDu8BjQMn8AGOA3zxAZADDvIBkgMn8wGTA330AZQDDvUBlQMO9gGWAyf3AZkDfvgBmgOCAfkBmwMN-gGcAw37AZ0DDfwBngMN_QGfAw3-AaEDDf8BowMngAKkA4MBgQKoAw2CAqoDJ4MCqwOEAYQCrgMNhQKvAw2GArADJ4cCswOFAYgCtAOLAYkCtQMIigK2AwiLArcDCIwCuAMIjQK5AwiOArsDCI8CvQMnkAK-A4wBkQLAAwiSAsIDJ5MCwwONAZQCxAMIlQLFAwiWAsYDJ5cCyQOOAZgCygOSAZkCywMLmgLMAwubAs0DC5wCzgMLnQLPAwueAtEDC58C0wMnoALUA5MBoQLWAwuiAtgDJ6MC2QOUAaQC2gMLpQLbAwumAtwDJ6cC3wOVAagC4AOZAakC4QMJqgLiAwmrAuMDCawC5AMJrQLlAwmuAucDCa8C6QMnsALqA5oBsQLsAwmyAu4DJ7MC7wObAbQC8AMJtQLxAwm2AvIDJ7cC9QOcAbgC9gOiAbkC9wMWugL4Axa7AvkDFrwC-gMWvQL7Axa-Av0DFr8C_wMnwAKABKMBwQKCBBbCAoQEJ8MChQSkAcQChgQWxQKHBBbGAogEJ8cCiwSlAcgCjASrAckCjQQXygKOBBfLAo8EF8wCkAQXzQKRBBfOApMEF88ClQQn0AKWBKwB0QKYBBfSApoEJ9MCmwStAdQCnAQX1QKdBBfWAp4EJ9cCoQSuAdgCogSyAdkCowQV2gKkBBXbAqUEFdwCpgQV3QKnBBXeAqkEFd8CqwQn4AKsBLMB4QKuBBXiArAEJ-MCsQS0AeQCsgQV5QKzBBXmArQEJ-cCtwS1AegCuAS7AekCuQQb6gK6BBvrArsEG-wCvAQb7QK9BBvuAr8EG-8CwQQn8ALCBLwB8QLEBBvyAsYEJ_MCxwS9AfQCyAQb9QLJBBv2AsoEJ_cCzQS-AfgCzgTEAfkCzwQc-gLQBBz7AtEEHPwC0gQc_QLTBBz-AtUEHP8C1wQngAPYBMUBgQPaBByCA9wEJ4MD3QTGAYQD3gQchQPfBByGA-AEJ4cD4wTHAYgD5ATNAYkD5gQdigPnBB2LA-kEHYwD6gQdjQPrBB2OA-0EHY8D7wQnkAPwBM4BkQPyBB2SA_QEJ5MD9QTPAZQD9gQdlQP3BB2WA_gEJ5cD-wTQAZgD_ATWAZkD_QQemgP-BB6bA_8EHpwDgAUenQOBBR6eA4MFHp8DhQUnoAOGBdcBoQOIBR6iA4oFJ6MDiwXYAaQDjAUepQONBR6mA44FJ6cDkQXZAagDkgXfAakDlAUCqgOVBQKrA5gFAqwDmQUCrQOaBQKuA5wFAq8DngUnsAOfBeABsQOhBQKyA6MFJ7MDpAXhAbQDpQUCtQOmBQK2A6cFJ7cDqgXiAbgDqwXoAbkDrQUDugOuBQO7A7AFA7wDsQUDvQOyBQO-A7QFA78DtgUnwAO3BekBwQO5BQPCA7sFJ8MDvAXqAcQDvQUDxQO-BQPGA78FJ8cDwgXrAcgDwwXvAckDxAUEygPFBQTLA8YFBMwDxwUEzQPIBQTOA8oFBM8DzAUn0APNBfAB0QPPBQTSA9EFJ9MD0gXxAdQD0wUE1QPUBQTWA9UFJ9cD2AXyAdgD2QX4AdkD2gUF2gPbBQXbA9wFBdwD3QUF3QPeBQXeA-AFBd8D4gUn4APjBfkB4QPlBQXiA-cFJ-MD6AX6AeQD6QUF5QPqBQXmA-sFJ-cD7gX7AegD7wWBAukD8AUG6gPxBQbrA_IFBuwD8wUG7QP0BQbuA_YFBu8D-AUn8AP5BYIC8QP7BQbyA_0FJ_MD_gWDAvQD_wUG9QOABgb2A4EGJ_cDhAaEAvgDhQaKAvkDhgYH-gOHBgf7A4gGB_wDiQYH_QOKBgf-A4wGB_8DjgYngASPBosCgQSRBgeCBJMGJ4MElAaMAoQElQYHhQSWBgeGBJcGJ4cEmgaNAogEmwaRAg"
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

// app/lib/active-session.ts
async function resolveActiveAuth(token) {
  if (!token) return null;
  const auth = await verifyToken(token);
  if (!auth) return null;
  const record = await prisma_default.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'true', true)`;
    return tx.user.findUnique({
      where: { id: auth.userId },
      select: { suspendedAt: true, tokenVersion: true, role: true }
    });
  });
  if (!record || record.suspendedAt || record.tokenVersion !== auth.tokenVersion) {
    return null;
  }
  return {
    userId: auth.userId,
    email: auth.email,
    role: record.role,
    tokenVersion: auth.tokenVersion
  };
}
var init_active_session = __esm({
  "app/lib/active-session.ts"() {
    "use strict";
    init_prisma();
    init_jwt();
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
  const auth = await resolveActiveAuth(token);
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
  const auth = await resolveActiveAuth(token);
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
    init_active_session();
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
  return !("providerKycDocument" in client2) || !("providerPortfolioItem" in client2) || !("providerSubscription" in client2) || !("notificationOutbox" in client2);
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
    PRISMA_CLIENT_GENERATION = 8;
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
        this.redisSubscriber = null;
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
        if (this.redisSubscribed || this.redisSubscriber) return;
        const redis = getRedisClient();
        if (!redis) return;
        try {
          const subscriber = redis.duplicate();
          this.redisSubscriber = subscriber;
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
          const failed = this.redisSubscriber;
          this.redisSubscriber = null;
          this.redisSubscribed = false;
          if (failed) {
            void failed.quit().catch(() => void 0);
          }
        }
      }
      async shutdown() {
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
        const subscriber = this.redisSubscriber;
        this.redisSubscriber = null;
        this.redisSubscribed = false;
        if (subscriber) {
          try {
            await subscriber.unsubscribe(REALTIME_REDIS_CHANNEL);
          } catch {
          }
          try {
            await subscriber.quit();
          } catch {
            subscriber.disconnect();
          }
        }
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
  return resolveActiveAuth(token);
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
      await hub.shutdown();
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
    init_active_session();
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
function isVideoUploadApiPath(pathname) {
  return VIDEO_UPLOAD_PATH_PATTERNS.some((re) => re.test(pathname));
}
function maxBodyBytesForPath(pathname) {
  if (isVideoUploadApiPath(pathname)) return MAX_VIDEO_UPLOAD_BODY_BYTES;
  return isUploadApiPath(pathname) ? MAX_UPLOAD_BODY_BYTES : MAX_API_BODY_BYTES;
}
var MAX_API_BODY_BYTES, MAX_UPLOAD_BODY_BYTES, MAX_VIDEO_UPLOAD_BODY_BYTES, PAYLOAD_TOO_LARGE_MESSAGE, UPLOAD_PATH_PATTERNS, VIDEO_UPLOAD_PATH_PATTERNS;
var init_request_limits = __esm({
  "app/lib/request-limits.ts"() {
    "use strict";
    MAX_API_BODY_BYTES = 1024 * 1024;
    MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024;
    MAX_VIDEO_UPLOAD_BODY_BYTES = 310 * 1024 * 1024;
    PAYLOAD_TOO_LARGE_MESSAGE = "Payload trop volumineux";
    UPLOAD_PATH_PATTERNS = [
      /^\/api\/services\/[^/]+\/cover\/?$/,
      /^\/api\/requests\/[^/]+\/cover\/?$/,
      /^\/api\/users\/me\/avatar\/?$/,
      /^\/api\/provider\/portfolio\/?$/,
      /^\/api\/provider\/portfolio\/[^/]+\/?$/,
      /^\/api\/provider\/kyc\/upload\/?$/,
      /^\/api\/rental\/equipment\/[^/]+\/photos\/?$/
    ];
    VIDEO_UPLOAD_PATH_PATTERNS = [
      /^\/api\/admin\/learning\/lessons\/[^/]+\/video\/?$/
    ];
  }
});

// app/lib/rate-limit.ts
var import_server, CLEANUP_INTERVAL_MS, lastCleanup, AUTH_RATE_LIMITS, API_RATE_LIMITS;
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
      verifyOtp: { maxAttempts: 20, windowMs: 15 * 60 * 1e3 },
      sendOtp: { maxAttempts: 5, windowMs: 15 * 60 * 1e3 },
      resetPassword: { maxAttempts: 10, windowMs: 15 * 60 * 1e3 }
    };
    API_RATE_LIMITS = {
      message: { maxAttempts: 60, windowMs: 60 * 1e3 },
      upload: { maxAttempts: 20, windowMs: 15 * 60 * 1e3 },
      adminExport: { maxAttempts: 10, windowMs: 15 * 60 * 1e3 }
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
  rejectInvalidUploadContentLength: () => rejectInvalidUploadContentLength,
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
  const contentLengthRaw = getHeader(headers, "content-length");
  const maxBytes = maxBodyBytesForPath(pathname);
  const isUpload = isUploadApiPath(pathname);
  if (isUpload) {
    if (contentLengthRaw == null || contentLengthRaw === "") {
      return true;
    }
    const contentLength2 = parseInt(contentLengthRaw, 10);
    if (!Number.isFinite(contentLength2) || contentLength2 <= 0) {
      return true;
    }
    return contentLength2 > maxBytes;
  }
  const contentLength = parseInt(contentLengthRaw ?? "0", 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0) {
    return false;
  }
  return contentLength > maxBytes;
}
function rejectInvalidUploadContentLength(req, maxBytes = MAX_UPLOAD_BODY_BYTES) {
  const raw2 = req.headers.get("content-length");
  if (raw2 == null || raw2 === "") {
    logSecurityEvent({
      event: "request.body_too_large",
      detail: "missing Content-Length on upload"
    });
    return import_server2.NextResponse.json(
      { error: PAYLOAD_TOO_LARGE_MESSAGE },
      { status: 413 }
    );
  }
  const contentLength = parseInt(raw2, 10);
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > maxBytes) {
    logSecurityEvent({
      event: "request.body_too_large",
      detail: "Content-Length over upload limit or invalid",
      meta: { contentLength: raw2, maxBytes }
    });
    return import_server2.NextResponse.json(
      { error: PAYLOAD_TOO_LARGE_MESSAGE },
      { status: 413 }
    );
  }
  return null;
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
var import_url, import_server2;
var init_http_security = __esm({
  "app/lib/http-security.ts"() {
    "use strict";
    import_url = require("url");
    import_server2 = require("next/server");
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

// app/lib/request-context.ts
var request_context_exports = {};
__export(request_context_exports, {
  createRequestId: () => createRequestId,
  getRequestContext: () => getRequestContext,
  getRequestId: () => getRequestId,
  runWithRequestContext: () => runWithRequestContext
});
function runWithRequestContext(ctx, fn) {
  return requestStorage.run(ctx, fn);
}
function getRequestContext() {
  return requestStorage.getStore();
}
function getRequestId() {
  return requestStorage.getStore()?.requestId;
}
function createRequestId(incoming) {
  const trimmed = incoming?.trim();
  if (trimmed && /^[\w\-.=]{8,128}$/.test(trimmed)) return trimmed;
  return (0, import_node_crypto.randomUUID)();
}
var import_node_async_hooks2, import_node_crypto, requestStorage;
var init_request_context = __esm({
  "app/lib/request-context.ts"() {
    "use strict";
    import_node_async_hooks2 = require("node:async_hooks");
    import_node_crypto = require("node:crypto");
    requestStorage = new import_node_async_hooks2.AsyncLocalStorage();
  }
});

// app/lib/logger.ts
var logger_exports = {};
__export(logger_exports, {
  logRouteError: () => logRouteError,
  logger: () => logger
});
function logRouteError(route, error) {
  if (error instanceof Error) {
    logger.error({ err: error, route }, error.message);
  } else {
    logger.error({ route, error }, "Unknown error");
  }
}
var import_pino, isProd, logger;
var init_logger = __esm({
  "app/lib/logger.ts"() {
    "use strict";
    import_pino = __toESM(require("pino"));
    isProd = process.env.NODE_ENV === "production";
    logger = (0, import_pino.default)({
      level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
      ...isProd ? {} : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" }
        }
      }
    });
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
  PLAYWRIGHT_BASE_URL: import_zod.z.string().url().optional(),
  /** Shared cookie Domain for SSO across subdomains, e.g. `.tairo-ampio.mg` */
  AUTH_COOKIE_DOMAIN: import_zod.z.string().optional(),
  /** Host header for Tairo ampindramo (e.g. ampindramo.tairo-ampio.mg) */
  RENTAL_HOST: import_zod.z.string().optional(),
  /** Host header for Tairo ampianaro */
  LEARNING_HOST: import_zod.z.string().optional(),
  RENTAL_ENABLED: import_zod.z.string().optional(),
  LEARNING_ENABLED: import_zod.z.string().optional()
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
  if (env.NODE_ENV === "production" && !env.REDIS_URL) {
    throw new Error("REDIS_URL est obligatoire en production");
  }
  if (env.NODE_ENV === "production" && process.env.TAIRO_CUSTOM_SERVER !== "1") {
    throw new Error(
      "Le serveur custom (server.ts / dist/server.js) est obligatoire en production. N'utilisez pas `next start`."
    );
  }
}

// server.ts
init_redis();

// app/lib/image-optimize-queue.ts
var import_bullmq = require("bullmq");

// app/lib/storage/backend.ts
var import_client_s3 = require("@aws-sdk/client-s3");

// app/lib/image-optimize-queue.ts
var queue = null;
var queueEvents = null;
async function disconnectImageOptimizeQueue() {
  const closing = [];
  if (queue) {
    closing.push(queue.close());
    queue = null;
  }
  if (queueEvents) {
    closing.push(queueEvents.close());
    queueEvents = null;
  }
  await Promise.all(closing);
}

// server.ts
process.env.TAIRO_CUSTOM_SERVER = "1";
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
    await disconnectImageOptimizeQueue();
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
    const { createRequestId: createRequestId2, runWithRequestContext: runWithRequestContext2 } = await Promise.resolve().then(() => (init_request_context(), request_context_exports));
    const { logger: logger2 } = await Promise.resolve().then(() => (init_logger(), logger_exports));
    const requestId = createRequestId2(
      typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"] : Array.isArray(req.headers["x-request-id"]) ? req.headers["x-request-id"][0] : null
    );
    res.setHeader("x-request-id", requestId);
    const startedAt = Date.now();
    const rlsContext = await resolveRlsContextFromRequest2(
      req.url ?? void 0,
      req.headers.cookie
    );
    void runWithRequestContext2({ requestId }, async () => {
      await runWithRls2(rlsContext, async () => {
        await handle(req, res, parsedUrl);
      });
    }).catch((error) => {
      console.error("[Tairo ampio] Erreur requ\xEAte HTTP :", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }).finally(() => {
      if (pathname.startsWith("/api")) {
        logger2.info(
          {
            requestId,
            method: req.method,
            path: pathname,
            status: res.statusCode,
            durationMs: Date.now() - startedAt
          },
          "api.access"
        );
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
