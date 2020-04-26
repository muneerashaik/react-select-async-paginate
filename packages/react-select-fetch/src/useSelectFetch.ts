import { useCallback } from 'react';

import type {
  LoadOptions,
  UseAsyncPaginateParams,
} from 'react-select-async-paginate';

import {
  get as defaultGet,
} from './get';

import type {
  Additional,
  MapResponse,
  UseSelectFetchParams,
} from './types';

export const defaultAdditional: Additional = {
  page: 1,
};

export const defaultResponseMapper: MapResponse = (response) => response;

export const useSelectFetchPure = <OptionType>(
  useCallbackParam: typeof useCallback,
  {
    url,
    queryParams = {},
    searchParamName = 'search',
    pageParamName = 'page',
    offsetParamName = 'offset',
    mapResponse = defaultResponseMapper,
    get = defaultGet,
  }: UseSelectFetchParams<OptionType>,
): UseAsyncPaginateParams<OptionType, Additional> => {
  const loadOptions = useCallbackParam<LoadOptions<OptionType, Additional>>(
    async (search, prevOptions, { page }) => {
      const params = {
        ...queryParams,
        [searchParamName]: search,
      };

      if (pageParamName) {
        params[pageParamName] = page;
      }

      if (offsetParamName) {
        params[offsetParamName] = prevOptions.length;
      }

      let responseRaw;
      let hasError = false;

      try {
        responseRaw = await get(url, params);
      } catch (e) {
        hasError = true;
      }

      if (hasError) {
        return {
          options: [],
          hasMore: false,
        };
      }

      const response = mapResponse(responseRaw, {
        search,
        prevPage: page,
        prevOptions,
      });

      return {
        ...response,

        additional: {
          page: page + 1,
        },
      };
    },

    [
      url,
      queryParams,
      searchParamName,
      pageParamName,
      offsetParamName,
      mapResponse,
      get,
    ],
  );

  return {
    loadOptions,
    additional: defaultAdditional,
  };
};

export const useSelectFetch = <OptionType>(
  params: UseSelectFetchParams<OptionType>,
): UseAsyncPaginateParams<OptionType, Additional> => useSelectFetchPure<OptionType>(
    useCallback,
    params,
  );