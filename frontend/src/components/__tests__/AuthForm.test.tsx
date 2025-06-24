import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthForm from '../AuthForm';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('AuthForm', () => {
    const mockLogin = vi.fn();
    const mockRegister = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            register: mockRegister,
            user: null,
            logout: vi.fn(),
            isLoading: false,
        });
        vi.clearAllMocks();
    });

    it('renders login form by default', () => {
        render(<AuthForm />);

        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    });

    it('switches to registration form when register button is clicked', () => {
        render(<AuthForm />);

        fireEvent.click(screen.getByText('Register'));

        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('displays role selection dropdown in registration form', () => {
        render(<AuthForm />);

        fireEvent.click(screen.getByText('Register'));

        const roleSelect = screen.getByLabelText(/role/i);
        expect(roleSelect).toBeInTheDocument();
        expect(roleSelect).toHaveValue('user');

        // Check if all role options are present
        expect(
            screen.getByText('User (Record and receive feedback)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Scholar (Review and provide feedback)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Admin (Manage users and system)'),
        ).toBeInTheDocument();
    });

    it('submits login form with correct data', async () => {
        mockLogin.mockResolvedValue(undefined);
        render(<AuthForm onSuccess={mockOnSuccess} />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'testpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'testpass',
            });
        });

        expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('submits registration form with role selection', async () => {
        mockRegister.mockResolvedValue(undefined);
        render(<AuthForm onSuccess={mockOnSuccess} />);

        // Switch to registration
        fireEvent.click(screen.getByText('Register'));

        // Fill form
        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'newuser' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'newpass' },
        });
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/role/i), {
            target: { value: 'scholar' },
        });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                username: 'newuser',
                email: 'test@example.com',
                password: 'newpass',
                full_name: 'Test User',
                role: 'scholar',
            });
        });

        expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('displays error message when login fails', async () => {
        const errorMessage = 'Invalid credentials';
        mockLogin.mockRejectedValue(new Error(errorMessage));
        render(<AuthForm />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('shows loading state during form submission', async () => {
        mockLogin.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100)),
        );
        render(<AuthForm />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'testpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /login/i }));

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });
    });

    it('defaults to user role in registration form', () => {
        render(<AuthForm />);

        fireEvent.click(screen.getByText('Register'));

        const roleSelect = screen.getByLabelText(/role/i) as HTMLSelectElement;
        expect(roleSelect.value).toBe('user');
    });

    it('allows changing role selection', () => {
        render(<AuthForm />);

        fireEvent.click(screen.getByText('Register'));

        const roleSelect = screen.getByLabelText(/role/i);
        fireEvent.change(roleSelect, { target: { value: 'admin' } });

        expect(roleSelect).toHaveValue('admin');
    });
});
