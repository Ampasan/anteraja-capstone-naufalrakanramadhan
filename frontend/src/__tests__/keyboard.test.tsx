import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../features/auth/components/LoginForm';
import type { LoginFormState } from '../features/auth/types';
import type { Hub } from '../features/monitoring/types';

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
  email: 'nina@anteraja.id',
  password: 'rahasia',
  rememberMe: false,
  showPassword: false,
  isLoading: false,
  errorMessage: null,
};

function renderLoginForm() {
  const onSubmit = vi.fn();
  render(
    <LoginForm
      formState={FORM}
      hubs={HUBS}
      isPreparingHubs={false}
      onHubChange={vi.fn()}
      onEmailChange={vi.fn()}
      onPasswordChange={vi.fn()}
      onRememberMeChange={vi.fn()}
      onTogglePassword={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit };
}

describe('aksesibilitas papan ketik: LoginForm', () => {
  it('seluruh kontrol terjangkau berurutan lewat Tab', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const expectedOrder = [
      screen.getByLabelText('Pilih stasiun layanan'),
      screen.getByLabelText('Email'),
      screen.getByLabelText('Kata Sandi'),
      screen.getByRole('button', { name: 'Tampilkan kata sandi' }),
      screen.getByRole('checkbox', { name: 'Ingat saya di perangkat ini' }),
      screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ }),
    ];

    for (const control of expectedOrder) {
      await user.tab();
      expect(control).toHaveFocus();
    }
  });

  it('Enter pada kolom kata sandi mengirim formulir', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderLoginForm();
    const password = screen.getByLabelText('Kata Sandi');

    password.focus();
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('Enter pada tombol utama mengirim formulir', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderLoginForm();
    const submit = screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ });

    submit.focus();
    await user.keyboard('{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('spasi pada tombol utama juga mengirim formulir', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderLoginForm();
    const submit = screen.getByRole('button', { name: /Masuk ke Panel Dispatch/ });

    submit.focus();
    await user.keyboard(' ');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('tombol lihat sandi sendiri terjangkau dan tidak mengirim formulir', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderLoginForm();
    const toggle = screen.getByRole('button', { name: 'Tampilkan kata sandi' });

    await user.click(toggle);

    expect(toggle).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
