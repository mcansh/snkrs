import * as React from 'react';

import styles from '~/styles/loading-button.css';

interface VoidFunctionComponentStyles<P = any> extends React.VFC<P> {
  styles: string;
}

export interface LoadingButtonProps {
  ariaErrorAlert: string;
  ariaLoadingAlert: string;
  ariaSuccessAlert: string;
  ariaText: string;
  icon: React.ReactNode;
  iconError: React.ReactNode;
  iconLoading: React.ReactNode;
  iconSuccess: React.ReactNode;
  state: 'error' | 'idle' | 'loading' | 'success';
  text: React.ReactNode;
  textLoading: React.ReactNode;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const LoadingButton: VoidFunctionComponentStyles<
  ButtonProps & LoadingButtonProps
> = ({
  ariaErrorAlert,
  ariaLoadingAlert,
  ariaSuccessAlert,
  ariaText,
  icon,
  iconError,
  iconLoading,
  iconSuccess,
  state,
  text,
  textLoading,
  ...props
}) => {
  const [derivedState, setDerivedState] = React.useState(state);
  const [previousState, setPreviousState] = React.useState(state);

  if (derivedState !== state) {
    setPreviousState(derivedState);
    setDerivedState(state);
  }

  const getDirection = (activeState: LoadingButtonProps['state']) =>
    state === activeState
      ? 'enter'
      : previousState === activeState
      ? 'enter'
      : null;

  const idle = (
    <span
      hidden={state !== 'idle'}
      aria-hidden={true}
      data-lb-direction={getDirection('idle')}
    >
      <span data-lb-slider>{text}</span>
      <span data-lb-icon>{icon}</span>
    </span>
  );

  const loading = (
    <span
      hidden={state !== 'loading'}
      aria-hidden={true}
      data-lb-direction={getDirection('loading')}
    >
      <span data-lb-slider>{textLoading}</span>
      <span data-lb-icon>{iconLoading}</span>
    </span>
  );

  const success = (
    <span
      hidden={state !== 'success'}
      aria-hidden={true}
      data-lb-direction={getDirection('success')}
    >
      <span data-lb-slider>{iconSuccess}</span>
    </span>
  );

  const error = (
    <span
      hidden={state !== 'error'}
      aria-hidden={true}
      data-lb-direction={getDirection('error')}
    >
      <span data-lb-slider>{iconError}</span>
    </span>
  );

  const label =
    state === 'loading'
      ? ariaLoadingAlert
      : state === 'error'
      ? ariaErrorAlert
      : state === 'success'
      ? ariaSuccessAlert
      : ariaText;

  return (
    <button
      aria-live="assertive"
      aria-label={label}
      data-loading-button
      {...props}
    >
      {idle}
      {loading}
      {success}
      {error}
    </button>
  );
};

LoadingButton.styles = styles;

export { LoadingButton };
