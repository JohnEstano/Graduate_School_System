const { render, screen, fireEvent } = require('@testing-library/react');
const DefenseRequestDetails = require('./details'); // Adjust the import based on your actual component path

test('handles scheduling correctly', () => {
    render(<DefenseRequestDetails />);
    
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);
    
    fireEvent.change(startTimeInput, { target: { value: '2023-10-01T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2023-10-01T09:00' } });
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
});

test('handles network errors gracefully', async () => {
    global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
    );

    render(<DefenseRequestDetails />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
});

test('validates CSRF token implementation', () => {
    render(<DefenseRequestDetails />);
    
    const csrfToken = screen.getByTestId('csrf-token'); // Assuming you have a way to test the CSRF token
    expect(csrfToken).toBeInTheDocument();
});