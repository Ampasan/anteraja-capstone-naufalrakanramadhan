import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../LoginForm';
import type { LoginFormState } from '../../types';
import type { Hub } from '../../../monitoring/types';

type LoginFormProps = Parameters<typeof LoginForm>[0];

const HUBS: Hub[] = [
  {
    id: 'hub-1',
    name: 'Hub Halim - Jakarta Timur',
    shortName: 'HUB HALIM',
    position: { lat: -6.265, lng: 106.876 },
    radiusKm: 5,
    capacityUsed: 40,
    capacityTotal: 100,
  },
];

const FORM: LoginFormState = {
  hubId: 'hub-1',
  email: '',
  password: '',
  rememberMe: false,
  showPassword: false,
  isLoading: false,
  errorMessage: null,
};

function makeProps(overrides: Partial<LoginFormState> = {}): LoginFormProps {
  return {
    formState: { ...FORM, ...overrides },
    hubs: HUBS,
    isPreparingHubs: false,
    onHubChange: vi.fn(),
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onRememberMeChange: vi.fn(),
    onTogglePassword: vi.fn(),
    onSubmit: vi.fn(),
  };
}

function renderForm(overrides: Partial<LoginFormState> = {}) {
  const props = makeProps(overrides);
  render(<LoginForm {...props} />);
  return props;
}

describe('LoginForm', () => {
  it('merender seluruh kontrol masuk', () => {
    renderForm();

    expect(screen.getByLabelText('Pilih stasiun layanan')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata Sandi')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Ingat saya di perangkat ini' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ })).toBeInTheDocument();
  });

  it('pengiriman formulir memanggil onSubmit', async () => {
    const user = userEvent.setup();
    const props = renderForm({ email: 'nina@anteraja.id', password: 'rahasia' });

    await user.click(screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('pesan galat tampil sebagai alert', () => {
    renderForm({ errorMessage: 'Email atau kata sandi salah.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Email atau kata sandi salah.');
  });

  it('tanpa galat tidak ada alert di layar', () => {
    renderForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('tombol masuk terkunci selagi daftar hub belum siap', () => {
    render(<LoginForm {...makeProps()} isPreparingHubs />);

    expect(screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ })).toBeDisabled();
  });

  it('tombol masuk terkunci selagi permintaan masuk berjalan', () => {
    renderForm({ isLoading: true });

    // Saat loading label diganti spinner, jadi tombol diambil dari urutan DOM.
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBeDisabled();
    expect(buttons[buttons.length - 1]).not.toHaveTextContent('Masuk ke Panel Dispatch');
  });

  it('mengetik email meneruskan nilainya ke handler', () => {
    const props = renderForm();

    // Value dikendalikan induk, jadi perubahan dikirim sebagai satu peristiwa.
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nina@anteraja.id' } });

    expect(props.onEmailChange).toHaveBeenLastCalledWith('nina@anteraja.id');
  });

  it('memilih hub meneruskan id terpilih', async () => {
    const user = userEvent.setup();
    const props = renderForm();

    await user.selectOptions(screen.getByLabelText('Pilih stasiun layanan'), 'hub-1');

    expect(props.onHubChange).toHaveBeenCalledWith('hub-1');
  });

  it('mencentang "ingat saya" meneruskan nilai benar', async () => {
    const user = userEvent.setup();
    const props = renderForm();

    await user.click(screen.getByRole('checkbox', { name: 'Ingat saya di perangkat ini' }));

    expect(props.onRememberMeChange).toHaveBeenCalledWith(true);
  });

  it('tombol lihat sandi menukar tipe input dan labelnya', async () => {
    const user = userEvent.setup();
    const props = renderForm();

    expect(screen.getByLabelText('Kata Sandi')).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }));

    expect(props.onTogglePassword).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Tampilkan kata sandi' })).toBeInTheDocument();
  });

  it('sandi tampil terbuka bila formState.showPassword benar', () => {
    renderForm({ showPassword: true });

    expect(screen.getByLabelText('Kata Sandi')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Sembunyikan kata sandi' })).toBeInTheDocument();
  });
});
