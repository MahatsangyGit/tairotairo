export type RequestResponseStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

const CLIENT_TRANSITIONS: Record<RequestResponseStatus, RequestResponseStatus[]> =
  {
    PENDING: ["ACCEPTED", "REJECTED"],
    ACCEPTED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

const PROVIDER_TRANSITIONS: Record<
  RequestResponseStatus,
  RequestResponseStatus[]
> = {
  PENDING: ["WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canTransitionResponseStatus(
  current: RequestResponseStatus,
  next: RequestResponseStatus,
  role: string,
  isClientOwner: boolean,
  isProvider: boolean
): boolean {
  if (current === next) return false;
  if (current !== "PENDING") return false;

  if (role === "ADMIN") return true;

  if (isClientOwner && role === "CLIENT") {
    return CLIENT_TRANSITIONS[current].includes(next);
  }

  if (isProvider && role === "PROVIDER") {
    return PROVIDER_TRANSITIONS[current].includes(next);
  }

  return false;
}

export const RESPONSE_STATUS_LABEL: Record<RequestResponseStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  REJECTED: "Refusée",
  WITHDRAWN: "Retirée",
};

export const RESPONSE_STATUS_CLASS: Record<RequestResponseStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-gray-50 text-gray-500 border-gray-200",
};
