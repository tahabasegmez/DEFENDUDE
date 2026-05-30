import type { AppConfig } from "./AppConfig";
import { HttpClient } from "./HttpClient";

interface SystemInfoResponse {
  readonly applicationName: string;
  readonly environmentName: string;
  readonly serverTimeUtc: string;
}

export async function loadAppConfig(): Promise<AppConfig> {
  const http = new HttpClient("/api");
  const response = await http.get<SystemInfoResponse>("/system/info");

  return {
    appName: response.applicationName,
    environmentName: response.environmentName,
    serverTimeUtc: response.serverTimeUtc
  };
}
