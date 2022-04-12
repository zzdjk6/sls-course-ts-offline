export const getAuctionsTableName = (): string => {
  if (process.env.AUCTIONS_TABLE_NAME) {
    return process.env.AUCTIONS_TABLE_NAME;
  }

  return "auctions-offline";
};
