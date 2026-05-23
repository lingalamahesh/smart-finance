import Common "../types/common";

mixin (defaultRates : Common.ExchangeRates) {
  public query func getExchangeRates() : async Common.ExchangeRates {
    defaultRates;
  };
};
