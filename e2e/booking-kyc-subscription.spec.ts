import { test, expect } from "@playwright/test";
import {
  E2E_PNG,
  PASSWORD,
  cleanupTestUsers,
  createTestUsers,
  futureBookingDate,
  login,
  promoteToAdmin,
  registerUser,
} from "./helpers";

test.describe.serial("E2E — réservation, KYC, abonnement", () => {
  const runId = `${Date.now()}`;
  let providerId = "";
  let serviceId = "";
  let bookingId = "";

  const emails = [
    `e2e-provider-${runId}@test.local`,
    `e2e-client-${runId}@test.local`,
    `e2e-admin-${runId}@test.local`,
  ];

  test.afterAll(async () => {
    await cleanupTestUsers(emails);
  });

  test("prépare les comptes (provider, client, admin)", async ({ request }) => {
    await createTestUsers(runId);

    await registerUser(request, {
      name: "E2E Prestataire",
      email: emails[0],
      password: PASSWORD,
      role: "PROVIDER",
      phone: "0340000001",
    });
    await registerUser(request, {
      name: "E2E Client",
      email: emails[1],
      password: PASSWORD,
      role: "CLIENT",
      phone: "0340000002",
    });
    await registerUser(request, {
      name: "E2E Admin",
      email: emails[2],
      password: PASSWORD,
      role: "CLIENT",
    });

    const provider = await login(request, emails[0], PASSWORD);
    providerId = provider.id;

    const client = await login(request, emails[1], PASSWORD);

    await promoteToAdmin(emails[2]);
    const admin = await login(request, emails[2], PASSWORD);

    expect(provider.role).toBe("PROVIDER");
    expect(client.role).toBe("CLIENT");
    expect(admin.role).toBe("ADMIN");
  });

  test("KYC — upload, soumission, validation admin", async ({ request }) => {
    await login(request, emails[0], PASSWORD);

    const uploadRes = await request.post("/api/provider/kyc/upload", {
      multipart: {
        type: "CIN",
        cinSlot: "1",
        file: {
          name: "cin-e2e.png",
          mimeType: "image/png",
          buffer: E2E_PNG,
        },
      },
    });
    const uploadBody = await uploadRes.json();
    expect(uploadRes.ok(), uploadBody.error ?? "upload KYC").toBeTruthy();
    expect(uploadBody.kyc?.documents?.length).toBeGreaterThan(0);

    const submitRes = await request.post("/api/provider/kyc/submit");
    const submitBody = await submitRes.json();
    expect(submitRes.ok(), submitBody.error ?? "submit KYC").toBeTruthy();
    expect(submitBody.kyc?.status).toBe("PENDING");

    await login(request, emails[2], PASSWORD);

    const approveRes = await request.patch(
      `/api/admin/providers/${providerId}/kyc`,
      { data: { action: "approve" } }
    );
    const approveBody = await approveRes.json();
    expect(approveRes.ok(), approveBody.error ?? "approve KYC").toBeTruthy();

    await login(request, emails[0], PASSWORD);
    const kycRes = await request.get("/api/provider/kyc");
    const kycBody = await kycRes.json();
    expect(kycBody.kyc?.status).toBe("APPROVED");
  });

  test("prestataire publie une annonce", async ({ request }) => {
    await login(request, emails[0], PASSWORD);

    const res = await request.post("/api/services", {
      data: {
        title: `Service E2E ${runId}`,
        description: "Annonce créée par test E2E Playwright",
        price: 25000,
        category: "Plomberie",
        location: "Antananarivo",
      },
    });
    const body = await res.json();
    expect(res.ok(), body.error ?? "create service").toBeTruthy();
    serviceId = body.service.id;
    expect(serviceId).toBeTruthy();
  });

  test("réservation — client réserve, prestataire confirme", async ({
    request,
  }) => {
    await login(request, emails[1], PASSWORD);

    const bookRes = await request.post("/api/bookings", {
      data: {
        serviceId,
        date: await futureBookingDate(),
        slotStart: "09:00",
        slotEnd: "11:00",
      },
    });
    const bookBody = await bookRes.json();
    expect(bookRes.status(), bookBody.error ?? "create booking").toBe(201);
    bookingId = bookBody.booking.id;
    expect(bookBody.booking.status).toBe("PENDING");

    await login(request, emails[0], PASSWORD);

    const confirmRes = await request.patch(`/api/bookings/${bookingId}`, {
      data: { status: "CONFIRMED" },
    });
    const confirmBody = await confirmRes.json();
    expect(confirmRes.ok(), confirmBody.error ?? "confirm booking").toBeTruthy();
    expect(confirmBody.booking.status).toBe("CONFIRMED");

    await login(request, emails[1], PASSWORD);
    const listRes = await request.get("/api/bookings");
    const listBody = await listRes.json();
    const found = listBody.bookings?.find((b: { id: string }) => b.id === bookingId);
    expect(found?.status).toBe("CONFIRMED");
  });

  test("abonnement — achat simulé actif", async ({ request }) => {
    await login(request, emails[0], PASSWORD);

    const purchaseRes = await request.post("/api/provider/subscription/purchase", {
      data: {
        months: 1,
        paymentMethod: "MVOLA",
        phone: "0341234567",
      },
    });
    const purchaseBody = await purchaseRes.json();
    expect(purchaseRes.ok(), purchaseBody.error ?? "purchase subscription").toBeTruthy();
    expect(purchaseBody.subscription?.isActive).toBe(true);

    const subRes = await request.get("/api/provider/subscription");
    const subBody = await subRes.json();
    expect(subBody.subscription?.isActive).toBe(true);
  });

  test("sanity UI — pages clés accessibles", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

    await page.goto("/services");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
