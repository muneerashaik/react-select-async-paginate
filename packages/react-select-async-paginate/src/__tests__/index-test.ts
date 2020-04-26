import { wrapMenuList} from '../wrapMenuList';
import { reduceGroupedOptions } from '../reduceGroupedOptions';
import { withAsyncPaginateBase } from '../withAsyncPaginateBase';
import { withAsyncPaginate } from '../withAsyncPaginate';
import { useAsyncPaginateBase } from '../useAsyncPaginateBase';
import { useAsyncPaginate } from '../useAsyncPaginate';

import * as lib from '../index';

test('should export needed modules', () => {
  expect(lib.AsyncPaginate).toBeTruthy();
  expect(lib.AsyncPaginateBase).toBeTruthy();
  expect(lib.wrapMenuList).toBe(wrapMenuList);
  expect(lib.reduceGroupedOptions).toBe(reduceGroupedOptions);
  expect(lib.withAsyncPaginateBase).toBe(withAsyncPaginateBase);
  expect(lib.withAsyncPaginate).toBe(withAsyncPaginate);
  expect(lib.useAsyncPaginateBase).toBe(useAsyncPaginateBase);
  expect(lib.useAsyncPaginate).toBe(useAsyncPaginate);
});
