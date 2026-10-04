import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '../Input';

describe('Input', () => {
  it('label terhubung ke input melalui htmlFor/id', () => {
    render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" placeholder="email@anteraja.id" />
      </>,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
    expect(screen.getByPlaceholderText('email@anteraja.id')).toBe(input);
  });

  it('ketikan diteruskan ke onChange beserta nilainya', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" onChange={onChange} />
      </>,
    );
    await user.type(screen.getByLabelText('Email'), 'a');

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText('Email')).toHaveValue('a');
  });

  it('pesan galat terhubung lewat aria-describedby', () => {
    render(
      <>
        <label htmlFor="password">Kata Sandi</label>
        <Input id="password" aria-invalid="true" aria-describedby="password-error" />
        <p id="password-error">Wajib diisi.</p>
      </>,
    );

    const input = screen.getByLabelText('Kata Sandi');
    expect(input).toHaveAccessibleDescription('Wajib diisi.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('elemen kiri dan kanan ikut terender bersama input', () => {
    render(
      <Input
        aria-label="Kata Sandi"
        leftIcon={<span>ikon-kiri</span>}
        rightElement={<button type="button">Tampilkan</button>}
      />,
    );

    expect(screen.getByText('ikon-kiri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tampilkan' })).toBeInTheDocument();
  });
});
