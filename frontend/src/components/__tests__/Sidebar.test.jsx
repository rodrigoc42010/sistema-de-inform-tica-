import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Sidebar from '../Sidebar';

// Mock do Redux store
const mockStore = configureStore({
  reducer: {
    auth: () => ({
      user: {
        name: 'Test User',
        role: 'client',
      },
    }),
  },
});

// Helper para renderizar com providers
const renderWithProviders = (component) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('Sidebar Component', () => {
  test('deve renderizar o sidebar corretamente', () => {
    renderWithProviders(<Sidebar />);

    // Verificar se elementos principais estão presentes
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  test('deve exibir menu para cliente', () => {
    renderWithProviders(<Sidebar />);

    // Verificar itens de menu para cliente
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Chamados/i)).toBeInTheDocument();
  });

  test('deve permitir navegação ao clicar em item de menu', () => {
    renderWithProviders(<Sidebar />);

    const dashboardLink = screen.getByText(/Dashboard/i);
    fireEvent.click(dashboardLink);

    // Verificar se a navegação ocorreu
    expect(window.location.pathname).toBe('/');
  });

  test('deve exibir botão de logout', () => {
    renderWithProviders(<Sidebar />);

    const logoutButton = screen.getByText(/Sair/i);
    expect(logoutButton).toBeInTheDocument();
  });
});
