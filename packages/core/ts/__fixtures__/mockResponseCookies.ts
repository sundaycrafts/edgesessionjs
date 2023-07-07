import { ResponseCookies } from "../cookies";
import { Spy } from "./spy";

export class MockResponseCookies implements ResponseCookies {
  public spy = {
    delete: new Spy(),
    get: new Spy(),
    set: new Spy(),
  };

  constructor(private cookieStore: Record<string, string>) {}

  delete(name: string): void {
    this.spy.delete.call(name);
    delete this.cookieStore[name];
  }

  get(name: string): { value: string | undefined } {
    this.spy.get.call(name);
    return { value: this.cookieStore[name] };
  }

  set(options: {
    name: string;
    value: string;
    expires?: Date | number;
    maxAge?: number;
    sameSite?: "strict";
    httpOnly?: boolean;
    path?: string;
    secure: true;
  }): void {
    this.spy.set.call(options);
    this.cookieStore[options.name] = options.value;
  }
}
