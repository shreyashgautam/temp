import { fetchApi } from "@/lib/backend-api";

export const DEFAULT_PATIENT_ID = "P001";

export async function agentQuery(
  prompt: string,
  patientId = DEFAULT_PATIENT_ID,
  options?: { allPatients?: boolean }
) {
  const isAllPatients = options?.allPatients === true;
  const body: Record<string, unknown> = {
    prompt,
    allPatients: isAllPatients,
  };
  if (!isAllPatients && patientId) {
    body.patientId = patientId;
  }

  let api: { answer?: string; response?: string; error?: string };
  try {
    api = await fetchApi<{ answer?: string; response?: string; error?: string }>(
      "/api/agent/query",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  } catch (e) {
    api = { error: e instanceof Error ? e.message : "Backend unavailable" };
  }

  if (api.answer) return api.answer;
  if (api.response) return api.response;
  if (api.error) return `Backend error: ${api.error}`;
  return "No response returned from backend.";
}
