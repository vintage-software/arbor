import { Injectable } from '@angular/core';
import * as readline from 'readline';

@Injectable()
export class ConsoleService {
  private consoleContents = '';
  private currentProgress = '';

  log(output?: string) {
    this.consoleContents += `${output ? output : ''}\n`;
    this.update();
  }

  question(prompt: string): Promise<string> {
    const reader = readline.createInterface({ input: process.stdin, output: process.stdout });

    return new Promise<string>(resolve => {
      reader.question(`\n${prompt}`, response => {
        reader.close();
        this.consoleContents += `${prompt}${response}\n`;
        this.update();

        resolve(response);
      });
    });
  }

  progress(output: string) {
    if (this.currentProgress !== output) {
      this.currentProgress = output;
      this.update();
    }
  }

  finalizeProgress() {
    this.consoleContents += `\n${this.currentProgress}\n\n`;
    this.currentProgress = '';

    this.update();
  }

  private update() {
    console.log(`\x1Bc${this.consoleContents}\n${this.currentProgress}`.trim());
  }
}
