
// date can be YYYY-MM-DD 2024-03-06
type GetCurrencyRateParams = {
  baseCurrencyCode?: '' | string;
  date?: 'latest' | string;
  apiVersion?: string;
};
export const fetcher = (...args) => fetch(...args).then(res => res.json());

export const getApiUrl = ({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams) => `https://${date}.currency-api.pages.dev/${apiVersion}/currencies${baseCurrencyCode ? '/' + baseCurrencyCode : ''}.json`;

export type CurrencyRate4All = {
  [key: string]: string;
}

export type baseCurrencyObject = {
  date: string;
  [currency: string]: number;
};

export type CurrencyRate4BaseCur = {
  date: string;
  [currency: string]: baseCurrencyObject;
};
