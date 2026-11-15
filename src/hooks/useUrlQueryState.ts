import { useSearchParams } from 'react-router-dom';

export function useUrlQueryState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues?: readonly T[],
  replace = false
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryValue = searchParams.get(key);
  const value = queryValue !== null && (!allowedValues || allowedValues.includes(queryValue as T))
    ? queryValue as T
    : defaultValue;

  const setValue = (nextValue: T) => {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (nextValue === defaultValue) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, nextValue);
      }
      return nextParams;
    }, { replace });
  };

  return [value, setValue];
}