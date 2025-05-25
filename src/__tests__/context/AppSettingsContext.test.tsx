import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AppSettingsProvider, useAppSettings } from '../../context/AppSettingsContext';
import { getSettings, updateSettings } from '../../services/settingsService';

// Mock the settings service
jest.mock('../../services/settingsService', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn()
}));

// Test component that uses the settings context
const TestComponent = () => {
  const { settings, updateCompanyProfile } = useAppSettings();
  return (
    <div>
      <div data-testid="company-name">{settings.company.name}</div>
      <button
        data-testid="update-button"
        onClick={() => updateCompanyProfile({ name: 'Updated Company' })}
      >
        Update
      </button>
    </div>
  );
};

describe('AppSettingsContext', () => {
  const mockSettings = {
    company: {
      name: 'Test Company',
      address: '123 Test St',
      phone: '123-456-7890',
      email: 'test@company.com',
      nif: '12345',
      nis: '67890',
      rc: 'RC123',
      ai: 'AI456',
      rib: 'RIB789'
    },
    language: 'fr' as const,
    theme: 'light' as const,
    currency: 'DZD'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSettings as jest.Mock).mockResolvedValue(mockSettings);
  });

  it('should provide default settings initially', async () => {
    const { getByTestId } = render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('company-name')).toHaveTextContent('Test Company');
    });
  });

  it('should update company profile', async () => {
    const updatedSettings = {
      ...mockSettings,
      company: {
        ...mockSettings.company,
        name: 'Updated Company'
      }
    };

    (updateSettings as jest.Mock).mockResolvedValue(updatedSettings);

    const { getByTestId } = render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('company-name')).toHaveTextContent('Test Company');
    });

    act(() => {
      getByTestId('update-button').click();
    });

    await waitFor(() => {
      expect(getByTestId('company-name')).toHaveTextContent('Updated Company');
    });
  });

  it('should handle settings update error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (updateSettings as jest.Mock).mockRejectedValue(new Error('Update failed'));

    const { getByTestId } = render(
      <AppSettingsProvider>
        <TestComponent />
      </AppSettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('company-name')).toHaveTextContent('Test Company');
    });

    act(() => {
      getByTestId('update-button').click();
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating company profile:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should throw error when used outside provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppSettings must be used within an AppSettingsProvider');

    consoleErrorSpy.mockRestore();
  });
}); 