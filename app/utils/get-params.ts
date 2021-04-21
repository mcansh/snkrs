import type { ParsedUrlQuery } from 'querystring';

function getParam<T extends string>(param: T | T[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

function getParams<T extends ParsedUrlQuery>(
  params: T
): { [key: string]: string } {
  return Object.entries(params).reduce((acc, [key, values]) => {
    const value = getParam(values);
    return { ...acc, [key]: value };
  }, {});
}

export { getParam, getParams };
