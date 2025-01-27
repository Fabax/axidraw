import { runAppleScript } from "@raycast/utils";

export function runInTerminal(command: string) {
  const script = `
    tell application "Terminal"
      do script "${command}"
      activate
    end tell
  `;

  runAppleScript(script);
}
