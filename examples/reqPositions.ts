import chalk from "chalk";

import { IBApi } from "..";

export function run(ib: IBApi): void {

  // register event handler

  ib.on("position", function (account, contract, pos, avgCost) {
    console.log(
      "%s %s%s %s%s %s%s %s%s",
      chalk.cyan("[position]"),
      chalk.bold("account="), account,
      chalk.bold("contract="), JSON.stringify(contract),
      chalk.bold("pos="), pos,
      chalk.bold("avgCost="), avgCost
    );
  }).on("positionEnd", function () {
    console.log(chalk.cyan("[positionEnd]"));
  });

  // request positions

  ib.reqPositions();
}
