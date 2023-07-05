/**
 * DateTime's interface design comes from Luxon, a date-time library for JavaScript.
 * @see https://github.com/moment/luxon
 */
export class DateTime {
  readonly month: number;
  readonly seconds: number;

  private constructor(private readonly date: Date) {
    this.seconds = date.getTime() / 1000;
    this.month = date.getMonth() + 1;
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }

  plus({
    seconds = 0,
    months = 0,
  }: {
    seconds?: number;
    months?: number;
  }): DateTime {
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    date.setMonth(date.getMonth() + months);
    return new DateTime(date);
  }

  toJSDate(): Date {
    // TODO: Make new Date for immutability
    return this.date;
  }

  diffNow(unit: "seconds"): Duration {
    return new Duration(Math.abs(this.date.getTime() - new Date().getTime()));
  }
}

class Duration {
  constructor(readonly seconds: number) {}
}
