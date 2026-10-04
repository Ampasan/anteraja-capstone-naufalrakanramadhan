import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, type ButtonVariant } from '../Button';

describe('Button', () => {
  it('merender label dan menyalurkan klik', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Simpan</Button>);
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('tombol disabled tidak menerima klik', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Simpan
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });

  it('mode loading mengunci tombol dan mengganti isi dengan spinner', () => {
    render(<Button loading>Simpan</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByText('Simpan')).not.toBeInTheDocument();
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'ghost', 'destructive', 'outline-magenta'])(
    'varian %s tetap merender tombol yang bisa diklik',
    async (variant) => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button variant={variant} onClick={onClick}>
          Kirim
        </Button>,
      );
      await user.click(screen.getByRole('button', { name: 'Kirim' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    },
  );

  it('prop type diteruskan ke elemen button', () => {
    render(<Button type="submit">Masuk</Button>);

    expect(screen.getByRole('button', { name: 'Masuk' })).toHaveAttribute('type', 'submit');
  });
});
