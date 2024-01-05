import { useCallback, useEffect } from 'react';

import useDebounce from '../hooks/useDebounce';

import { SearchBox } from './SearchBox';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  runSearch: (newValue: string) => void;
  toggleInput?: boolean;
}

export function DebouncedSearch(props: Props) {
  const { runSearch, toggleInput = undefined, ...restOfProps } = props;

  const { newValue, setNewValue } = useDebounce((newValue: string) => {
    runSearch(newValue);
  }, 800);

  const handleTermChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewValue(event.target.value);
    },
    [setNewValue],
  );

  useEffect(() => {
    if (toggleInput !== undefined) {
      setNewValue('');
    }
  }, [setNewValue, toggleInput]);

  return (
    <SearchBox
      name="search"
      placeholder="Search"
      value={newValue}
      onChange={handleTermChange}
      {...restOfProps}
    />
  );
}
