import { RequestCookies } from "edgesession";
import { Spy } from "./spy";

export class MockRequestCookies implements RequestCookies {
  public spy = {
    get: new Spy(),
  };

  constructor(private cookieStore: Record<string, string | undefined>) {}

  get(name: string): { value: string | undefined } {
    this.spy.get.call(name);
    return { value: this.cookieStore[name] };
  }
}
