import { exec } from "child_process";

export async function runBash(command: string) {
  try {
    const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing script", error);
          resolve({ stdout, stderr: error.message });
          return;
        }
        resolve({ stdout, stderr });
      });
    });

    return [stdout, stderr];
  } catch (error) {
    return ["", "Error executing script"];
  }
}
