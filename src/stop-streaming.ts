import { launchCommand, LaunchType, showHUD } from "@raycast/api";
import { errorMessage, MissingCLIError, stopLiveStream } from "./lib/glimmer";

export default async function StopStreaming() {
  try {
    const stopped = await stopLiveStream();
    await showHUD(stopped ? "Streaming stopped. The app is still running on the PC." : "Nothing is streaming.");
  } catch (error) {
    await showHUD(errorMessage(error));
    if (error instanceof MissingCLIError) {
      await launchCommand({ name: "stream-app", type: LaunchType.UserInitiated });
    }
  }
}
