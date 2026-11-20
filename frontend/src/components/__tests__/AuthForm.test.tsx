import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AuthForm from '../AuthForm';
import { useAuth } from '../../contexts/AuthContext';

vi.mock('../../contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('AuthForm', () => {
    const mockLogin = vi.fn();
    const mockRegister = vi.fn();

    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            login: mockLogin,
            register: mockRegister,
            user: null,
            logout: vi.fn(),
            isLoading: false,
            isAuthenticated: false,
        });
        vi.clearAllMocks();
    });

    it('renders sign in form by default', () => {
        render(<AuthForm />);

        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    });

    it('switches to create account form without role selector', () => {
        render(<AuthForm />);

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    });

    it('submits login form with credentials', async () => {
        mockLogin.mockResolvedValue(undefined);
        render(<AuthForm />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'testpass' },
        });

        const submitButtons = screen.getAllByRole('button', { name: /sign in/i });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'testpass',
            });
        });
    });

    it('submits registration form without role field', async () => {
        mockRegister.mockResolvedValue(undefined);
        render(<AuthForm />);

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByLabelText(/full name/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'newuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'newpass' },
        });

        const submitButtons = screen.getAllByRole('button', { name: /create account/i });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                email: 'test@example.com',
                username: 'newuser',
                password: 'newpass',
                full_name: 'Test User',
            });
        });
    });

    it('displays error message when login fails', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid username or password'));
        render(<AuthForm />);

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpass' },
        });

        const submitButtons = screen.getAllByRole('button', { name: /sign in/i });
        fireEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => {
            expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
        });
    });
});
