/** Matches EnterpriseERP ApiResponse<T> (Auth + BuildingBlocks). */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  traceId?: string;
  data?: T;
  errors?: Array<{ code?: string; message?: string } | string>;
}

export function unwrapApiData<T>(body: unknown): T {
  const envelope = body as ApiEnvelope<T>;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("Invalid API response");
  }
  const raw = body as Record<string, unknown>;
  const success =
    typeof envelope.success === "boolean"
      ? envelope.success
      : typeof raw.Success === "boolean"
        ? raw.Success
        : undefined;
  const data =
    envelope.data !== undefined
      ? envelope.data
      : (raw.Data as T | undefined);

  if (success === undefined) {
    return body as T;
  }
  if (!success) {
    const errors =
      envelope.errors ??
      (raw.Errors as Array<{ code?: string; message?: string } | string> | undefined);
    const msg =
      errors
        ?.map((e) => (typeof e === "string" ? e : e.message))
        .filter(Boolean)
        .join("; ") ||
      envelope.message ||
      (typeof raw.Message === "string" ? raw.Message : undefined) ||
      "Request failed";
    throw new Error(msg);
  }
  if (data === undefined || data === null) {
    return undefined as T;
  }
  return data;
}

export function firstApiErrorMessage(body: unknown): string | undefined {
  const envelope = body as ApiEnvelope<unknown>;
  const first = envelope?.errors?.[0];
  if (typeof first === "string") return first;
  if (first?.message) return first.message;
  const problem = body as { message?: string; detail?: string; title?: string } | undefined;
  return problem?.message || problem?.detail || problem?.title;
}

/** Pulls a user-facing message from a failed Axios (or similar) HTTP call. */
export function getHttpErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const err = error as {
    message?: string;
    response?: { status?: number; data?: unknown };
  };

  const fromBody = firstApiErrorMessage(err.response?.data);
  if (fromBody) {
    if (fromBody.toLowerCase().includes("rwb")) {
      return "Device buffer read failed (RWB). Restart PunchDataService, try Use UDP, then Collect again — if LAN still fails, the server should import from the cloud ZKTeco database when RemoteZktecoDb is configured.";
    }
    const status = err.response?.status;
    return status ? `${fromBody} (HTTP ${status})` : fromBody;
  }

  if (err.response?.status === 502 || err.response?.status === 503) {
    const data = err.response?.data as { message?: string; errors?: { message?: string }[] } | undefined;
    if (data?.message) return data.message;
    if (data?.errors?.[0]?.message) return data.errors[0].message;
    return "The service is temporarily unavailable. Try again or contact your administrator.";
  }

  if (err.message && err.message !== "Request failed with status code 502") {
    return err.message;
  }

  if (err.response?.status) {
    return `${fallback} (HTTP ${err.response.status})`;
  }

  return fallback;
}
