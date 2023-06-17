export class DateTime {
    readonly seconds: number;
    private constructor(date: Date) {
        this.seconds = date.getTime() / 1000;
    }

    static now(): DateTime {
        throw new Error("Method not implemented.");
    }

    plus(param: { seconds?: number, months?: number }): DateTime {
        throw new Error("Method not implemented.");
    }

    toJSDate(): Date {
        throw new Error("Method not implemented.");
    }

    diffNow(seconds: string): DateTime {
        throw new Error("Method not implemented.");
    }
}
