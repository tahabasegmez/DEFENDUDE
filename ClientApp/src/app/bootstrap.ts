import { loadAppConfig } from "../platform/http/load-app-config";

export async function bootstrapDefendude(): Promise<void> {
  const shell = document.querySelector<HTMLElement>(".shell");
  const title = document.querySelector<HTMLElement>("#app-title");
  const status = document.querySelector<HTMLElement>("#boot-status");

  if (!shell || !title || !status) {
    throw new Error("Application shell is missing required DOM nodes.");
  }

  try {
    const config = await loadAppConfig();

    document.title = config.appName;
    title.textContent = config.appName;
    status.textContent = "Ana uygulama kabugu hazir.";
    shell.dataset.state = "ready";
  } catch (error) {
    console.error(error);

    title.textContent = "Baslatilamadi";
    status.textContent = "Sunucu bilgisi alinamadi.";
    shell.dataset.state = "error";
  }
}
