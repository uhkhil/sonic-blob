/**
 * @file Unit tests for the ThemeSwitcher component.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useStore } from '../store';
import { INITIAL_THEMES } from '../themes';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    // Reset the store directly before each test
    useStore.setState({
      activeThemeIndex: 0,
      themes: structuredClone(INITIAL_THEMES),
    });
  });

  it('renders the initial theme name', () => {
    render(<ThemeSwitcher />);

    // By default, the name of the first theme is 'Amethyst'
    const initialThemeName = INITIAL_THEMES[0].name;
    expect(screen.getByText(initialThemeName)).toBeInTheDocument();
  });

  it('advances to the next theme name when next button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    const nextButton = screen.getByTitle('Next Theme (→)');
    await user.click(nextButton);

    const nextThemeName = INITIAL_THEMES[1].name;
    // Should display the newly active theme
    expect(screen.getByText(nextThemeName)).toBeInTheDocument();

    // Store should inherently be updated
    expect(useStore.getState().activeThemeIndex).toBe(1);
  });

  it('returns to previous theme when previous button is clicked', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />); // starts at 0

    const prevButton = screen.getByTitle('Previous Theme (←)');
    await user.click(prevButton);

    // It should wrap around to the end of the array
    const lastThemeIndex = INITIAL_THEMES.length - 1;
    const prevThemeName = INITIAL_THEMES[lastThemeIndex].name;

    expect(screen.getByText(prevThemeName)).toBeInTheDocument();
    expect(useStore.getState().activeThemeIndex).toBe(lastThemeIndex);
  });
});
