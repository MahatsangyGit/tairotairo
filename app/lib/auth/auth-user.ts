export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "PROVIDER" | "ADMIN";
  avatar: string | null;
  clientKind?: "INDIVIDUAL" | "PROFESSIONAL";
  companyName?: string | null;
};
