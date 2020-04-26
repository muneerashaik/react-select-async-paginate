import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { defaultShouldLoadMore } from './defaultShouldLoadMore';
import { defaultReduceOptions } from './defaultReduceOptions';

import type {
  GetInitialOptionsCacheParams,
  OptionsCache,
  OptionsCacheItem,
  UseAsyncPaginateBaseResult,
  UseAsyncPaginateBaseParams,
  ReduceOptions,
} from './types';

const errorText = '[react-select-async-paginate] response of "loadOptions" should be an object with "options" prop, which contains array of options.';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(() => {
    resolve();
  }, ms);
});

export const validateResponse = (
  console: Console,
  response: any,
): void => {
  if (!response) {
    console.error(errorText, 'Received:', response);
    throw new Error(errorText);
  }

  if (!Array.isArray(response.options)) {
    console.error(errorText, 'Received:', response);
    throw new Error(errorText);
  }
};

export const getInitialOptionsCache = <OptionType, Additional>({
  options,
  defaultOptions,
  additional,
}: GetInitialOptionsCacheParams<OptionType, Additional>): OptionsCache<OptionType, Additional> => {
  const initialOptions = defaultOptions === true
    ? null
    : (defaultOptions instanceof Array)
      ? defaultOptions
      : options;

  if (initialOptions) {
    return {
      '': {
        isFirstLoad: false,
        isLoading: false,
        options: initialOptions,
        hasMore: true,
        additional,
      },
    };
  }

  return {};
};

export const getInitialCache = <OptionType, Additional>(
  params: UseAsyncPaginateBaseParams<OptionType, Additional>,
): OptionsCacheItem<OptionType, Additional> => ({
    isFirstLoad: true,
    options: [],
    hasMore: true,
    isLoading: false,
    additional: params.additional,
  });

type MapOptionsCache<OptionType> = (
  prevCache: OptionsCache<OptionType>,
) => OptionsCache<OptionType>;

type SetOptionsCache<OptionType> = (stateMapper: MapOptionsCache<OptionType>) => void;

export const requestOptions = async <OptionType, Additional>(
  paramsRef: {
    current: UseAsyncPaginateBaseParams<OptionType>;
  },
  optionsCache: OptionsCache<OptionType>,
  debounceTimeout: number,
  sleepParam: typeof sleep,
  setOptionsCache: SetOptionsCache<OptionType>,
  validateResponseParam: typeof validateResponse,
  reduceOptions: ReduceOptions,
): Promise<void> => {
  const currentInputValue = paramsRef.current.inputValue;

  const currentOptions: OptionsCacheItem<OptionType, Additional> = optionsCache[currentInputValue]
    || getInitialCache(paramsRef.current);

  if (currentOptions.isLoading || !currentOptions.hasMore) {
    return;
  }

  setOptionsCache((prevOptionsCache: OptionsCache<OptionType>): OptionsCache<OptionType> => ({
    ...prevOptionsCache,
    [currentInputValue]: {
      ...currentOptions,
      isLoading: true,
    },
  }));

  if (debounceTimeout > 0) {
    await sleepParam(debounceTimeout);

    const newInputValue = paramsRef.current.inputValue;

    if (currentInputValue !== newInputValue) {
      setOptionsCache((prevOptionsCache) => ({
        ...prevOptionsCache,
        [currentInputValue]: {
          ...currentOptions,
          isLoading: false,
        },
      }));

      return;
    }
  }

  let response;
  let hasError;

  try {
    const {
      loadOptions,
    } = paramsRef.current;

    response = await loadOptions(
      currentInputValue,
      currentOptions.options,
      currentOptions.additional,
    );

    hasError = false;
  } catch (e) {
    hasError = true;
  }

  if (hasError) {
    setOptionsCache((prevOptionsCache) => ({
      ...prevOptionsCache,
      [currentInputValue]: {
        ...currentOptions,
        isLoading: false,
      },
    }));

    return;
  }

  validateResponseParam(console, response);

  const {
    options,
    hasMore,
  } = response;

  // eslint-disable-next-line no-prototype-builtins
  const newAdditional = response.hasOwnProperty('additional')
    ? response.additional
    : currentOptions.additional;

  setOptionsCache((prevOptionsCache) => ({
    ...prevOptionsCache,
    [currentInputValue]: {
      ...currentOptions,
      options: reduceOptions(currentOptions.options, options, newAdditional),
      hasMore: !!hasMore,
      isLoading: false,
      isFirstLoad: false,
      additional: newAdditional,
    },
  }));
};

export const useAsyncPaginateBasePure = <OptionType, Additional>(
  useRefParam: typeof useRef,
  useStateParam: typeof useState,
  useEffectParam: typeof useEffect,
  useCallbackParam: typeof useCallback,
  validateResponseParam: typeof validateResponse,
  getInitialOptionsCacheParam: typeof getInitialOptionsCache,
  requestOptionsParam: typeof requestOptions,
  params: UseAsyncPaginateBaseParams<OptionType, Additional>,
  deps: ReadonlyArray<any> = [],
): UseAsyncPaginateBaseResult<OptionType> => {
  const {
    options,
    defaultOptions,
    additional,
    loadOptionsOnMenuOpen = true,
    debounceTimeout = 0,
    inputValue,
    menuIsOpen,
    filterOption = null,
    reduceOptions = defaultReduceOptions,
    shouldLoadMore = defaultShouldLoadMore,
  } = params;

  const isInitRef = useRefParam<boolean>(true);
  const paramsRef = useRefParam<UseAsyncPaginateBaseParams<OptionType, Additional>>(params);

  paramsRef.current = params;

  const [
    optionsCache,
    setOptionsCache,
  ] = useStateParam<OptionsCache<OptionType, Additional>>(() => getInitialOptionsCacheParam({
    options,
    defaultOptions,
    additional,
  }));

  const callRequestOptions = (): void => {
    requestOptionsParam(
      paramsRef,
      optionsCache,
      debounceTimeout,
      sleep,
      setOptionsCache,
      validateResponseParam,
      reduceOptions,
    );
  };

  const handleScrolledToBottom = useCallbackParam((): void => {
    const currentInputValue = paramsRef.current.inputValue;
    const currentOptions = optionsCache[currentInputValue];

    if (currentOptions) {
      callRequestOptions();
    }
  }, [optionsCache]);

  useEffectParam(() => {
    if (isInitRef.current) {
      isInitRef.current = false;
    } else {
      setOptionsCache({});
    }

    if (defaultOptions === true) {
      callRequestOptions();
    }
  }, deps);

  useEffectParam(() => {
    if (!optionsCache[inputValue]) {
      callRequestOptions();
    }
  }, [inputValue]);

  useEffectParam(() => {
    if (
      menuIsOpen
      && !optionsCache['']
      && loadOptionsOnMenuOpen
    ) {
      callRequestOptions();
    }
  }, [menuIsOpen]);

  const currentOptions: OptionsCacheItem<OptionType, Additional> = optionsCache[inputValue]
    || getInitialCache(params);

  return {
    handleScrolledToBottom,
    shouldLoadMore,
    filterOption,
    isLoading: currentOptions.isLoading,
    isFirstLoad: currentOptions.isFirstLoad,
    options: currentOptions.options,
  };
};

export const useAsyncPaginateBase = <OptionType = any, Additional = any>(
  params: UseAsyncPaginateBaseParams<OptionType, Additional>,
  deps: ReadonlyArray<any> = [],
): UseAsyncPaginateBaseResult<OptionType> => useAsyncPaginateBasePure<OptionType, Additional>(
    useRef,
    useState,
    useEffect,
    useCallback,
    validateResponse,
    getInitialOptionsCache,
    requestOptions,
    params,
    deps,
  );
