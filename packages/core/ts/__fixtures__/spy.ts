export class Spy {
  private count = 0;
  private with: any[] = [];

  call(...args: any[]): void {
    this.count++;
    this.with = args;
  }

  hasBeenCalledNth(): number {
    return this.count;
  }

  hasBeenCalledWith(): unknown {
    return this.with;
  }
}
