export const FundDistributionPolicyIndicator = {
  None: "None",
  AccumulationFund: "N",
  IncomeFund: "Y",
} as const;
export type FundDistributionPolicyIndicator =
  (typeof FundDistributionPolicyIndicator)[keyof typeof FundDistributionPolicyIndicator];

export const FundAssetType = {
  None: "None",
  AccumulationFund: "N",
  IncomeFund: "Y",
} as const;
export type FundAssetType = (typeof FundAssetType)[keyof typeof FundAssetType];
