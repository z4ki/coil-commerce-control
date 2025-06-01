import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider } from 'next-themes';
import Settings from '../../pages/Settings';
import * as settingsService from '@/services/settingsService';
import { toast } from 'sonner';

// Mock the services and dependencies
vi.mock('@/services/settingsService');
vi.mock('sonner');

// Mock MainLayout component
vi.mock('../../components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockSettings = {
  company: {
    name: 'Test Company',
    address: '123 Test St',
    phone: '123-456-7890',
    email: 'test@example.com',
    website: 'www.test.com',
    logo: null,
  },
  theme: 'light',
  invoice: {
    prefix: 'INV',
    nextNumber: 1,
    template: 'default',
  },
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the getSettings function
    (settingsService.getSettings as any).mockResolvedValue(mockSettings);
  });

  test('loads and displays settings', async () => {
    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    );

    // Check loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for settings to load
    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalled();
    });

    // Check if company details are displayed
    expect(screen.getByLabelText(/nom de la société/i)).toHaveValue('Test Company');
    expect(screen.getByLabelText(/adresse/i)).toHaveValue('123 Test St');
    expect(screen.getByLabelText(/téléphone/i)).toHaveValue('123-456-7890');
  });

  test('updates company profile', async () => {
    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalled();
    });

    // Change company name
    const nameInput = screen.getByLabelText(/nom de la société/i);
    fireEvent.change(nameInput, { target: { value: 'New Company Name' } });

    // Click save button
    const saveButton = screen.getByRole('button', { name: /enregistrer/i });
    fireEvent.click(saveButton);

    // Verify update was called
    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          company: expect.objectContaining({
            name: 'New Company Name',
          }),
        })
      );
    });

    // Check success toast
    expect(toast.success).toHaveBeenCalledWith('Settings saved successfully');
  });

  test('handles save error', async () => {
    // Mock updateSettings to reject
    (settingsService.updateSettings as any).mockRejectedValueOnce(new Error('Update failed'));

    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalled();
    });

    // Click save button
    const saveButton = screen.getByRole('button', { name: /enregistrer/i });
    fireEvent.click(saveButton);

    // Verify error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save settings');
    });
  });

  test('switches theme', async () => {
    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(settingsService.getSettings).toHaveBeenCalled();
    });

    // Click the theme switch
    const themeSwitch = screen.getByRole('switch', { name: /mode sombre/i });
    fireEvent.click(themeSwitch);

    // Check if theme was toggled
    expect(themeSwitch).toBeChecked();
  });
});
