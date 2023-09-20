/**
 * A WshEventData event.
 */
export class WshEventData {
  constructor(
    public conId: number,
    public fillWatchlist: boolean = false,
    public fillPortfolio: boolean = false,
    public fillCompetitors: boolean = false,
    public startDate: string = "",
    public endDate: string = "",
    public totalLimit: number = 0,
  ) {}

  public filter = "";
}

export default WshEventData;
