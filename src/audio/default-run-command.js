import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const defaultRunCommand = async (command, args) => {
  const result = await execFileAsync(command, args, {
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 10,
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};
