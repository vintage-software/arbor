import * as readline from 'readline';

export class ConsoleService {
  private static consoleContents = '';
  private static currentProgress = '';

  static log(output: string) {
    ConsoleService.consoleContents += `${output}\n`;
    ConsoleService.update();
  }

  static question(prompt: string): Promise<string> {
    let reader = readline.createInterface({ input: process.stdin, output: process.stdout });

    return new Promise<string>(resolve => {
      reader.question(`\n${prompt}`, response => {
        reader.close();
        ConsoleService.consoleContents += `${prompt}${response}\n`;
        ConsoleService.update();

        resolve(response);
      });
    });
  }

  static progress(output: string) {
    if (ConsoleService.currentProgress !== output) {
      ConsoleService.currentProgress = output;
      ConsoleService.update();
    }
  }

  static finalizeProgress() {
    ConsoleService.consoleContents += `\n${ConsoleService.currentProgress}\n\n`;
    ConsoleService.currentProgress = '';

    ConsoleService.update();
  }

  private static update() {
    console.log(`\x1Bc${ConsoleService.consoleContents}\n${ConsoleService.currentProgress}`.trim());
  }
}
