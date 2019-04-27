import * as fs from 'fs';

export class Config {

  private data: { [key: string]: any } = {};

  constructor(private path: string) {
    if(fs.existsSync(path)) {
      this.data = JSON.parse(fs.readFileSync(path).toString('utf-8'));
    }
  }

  private save(): void {
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }

  public get(key: string, defaultValue: any = undefined): any {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  public set(key: string, value: any): void {
    this.data[key] = value;
    this.save();
  }
}
