import { launchCommand, LaunchType, showHUD } from "@raycast/api";
import { errorMessage, MissingCLIError, stopLiveStream } from "./lib/glimmer";

export default async function StopStreaming() {
  try {
    await stopLiveStream();
    await showHUD("Nothing is streaming.");
  } catch (error) {
    await showHUD(errorMessage(error));
    if (error instanceof MissingCLIError) {
      await launchCommand({ name: "stream-app", type: LaunchType.UserInitiated });
    }
  }
}
