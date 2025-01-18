export const fetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then(res => res.json());

// date can be YYYY-MM-DD: 2024-03-06
type GetCurrencyRateParams = {
  baseCurrencyCode?: '' | string;
  date?: 'latest' | string;
  apiVersion?: string;
};

// date can be YYYY-MM-DD: 2024-03-06
type GetCurrencyChartParams = {
  currency?: '' | string;
  baseCurrency?: 'latest' | string;
};

export const getCurrencyRateApiUrl = ({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams) => {
  return `https://${date}.currency-api.pages.dev/${apiVersion}/currencies${baseCurrencyCode ? '/' + baseCurrencyCode : ''}.json`;
}


export const getCurrencyChartApiUrl = ({ baseCurrency = '', currency = '', }: GetCurrencyChartParams) => {
  return `https://www.mtfxgroup.com/api/rates/getCurrencyChartData/?ratepair=${currency + baseCurrency}&start=undefined&end=undefined`;
}

export type CurrencyRate4All = {
  [key: string]: string;
}

export type CurrencyRate4BaseCur = {
  date: string;
  [currency: string]: {
    [key: string]: number;
  } | string; // Allow string for the 'date' property
};
