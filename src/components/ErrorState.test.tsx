import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders a user-friendly error and invokes retry', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Nearby places are unavailable" message="Please try again shortly." onRetry={onRetry} />);

    expect(screen.getByText('Nearby places are unavailable')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
