
export const fetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then(res => res.json());

// date can be YYYY-MM-DD: 2024-03-06
type GetCurrencyRateParams = {
  baseCurrencyCode?: '' | string;
  date?: 'latest' | string;
  apiVersion?: string;
};

export const getApiUrl = ({ baseCurrencyCode = '', date = 'latest', apiVersion = 'v1' }: GetCurrencyRateParams) => `https://${date}.currency-api.pages.dev/${apiVersion}/currencies${baseCurrencyCode ? '/' + baseCurrencyCode : ''}.json`;

export type CurrencyRate4All = {
  [key: string]: string;
}

export type CurrencyRate4BaseCur = {
  // @ts-ignore: Property 'date'
  date: string;
  [currency: string]: {
    [key: string]: number;
  };
};

