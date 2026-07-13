export class ApiClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

export type ApiRouter = { push(path: string): void };

export type ApiFetchOptions = RequestInit & {
  router?: ApiRouter;
  loginPath?: string;
};

export type ApiFetchJsonOptions = Omit<RequestInit, "body"> & {
  router?: ApiRouter;
  loginPath?: string;
  body?: unknown;
};

function errorMessageFromBody(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

export async function apiFetch<T>(
  url: string,
  options?: ApiFetchOptions
): Promise<T> {
  const { router, loginPath, ...fetchOptions } = options ?? {};

  const res = await fetch(url, {
    credentials: "include",
    ...fetchOptions,
  });

  const data = await res.json().catch(() => ({
    error: "Réponse serveur invalide",
  }));

  if (res.status === 401) {
    router?.push(loginPath ?? "/auth/login");
    throw new ApiClientError(
      errorMessageFromBody(data, "Non autorisé"),
      401,
      data
    );
  }

  if (!res.ok) {
    throw new ApiClientError(
      errorMessageFromBody(data, "Erreur serveur"),
      res.status,
      data
    );
  }

  return data as T;
}

export async function apiFetchJson<T>(
  url: string,
  options?: ApiFetchJsonOptions
): Promise<T> {
  const { body, headers, ...rest } = options ?? {};
  return apiFetch<T>(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
