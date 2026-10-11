import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal, ModalBody, ModalHeader } from '../Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Buka
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalHeader onClose={() => setOpen(false)}>Judul panel</ModalHeader>
        <ModalBody>Isi panel</ModalBody>
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  it('menampilkan isi di dalam dialog bila terbuka', () => {
    render(
      <Modal open onClose={vi.fn()}>
        <ModalBody>Isi panel</ModalBody>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Isi panel')).toBeInTheDocument();
  });

  it('tidak merender apa pun bila tertutup', () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <ModalBody>Isi panel</ModalBody>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Escape menutup dialog dan melepas penguncian fokus', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Buka' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Buka' });
    expect(document.activeElement === document.body || document.activeElement === trigger).toBe(true);
  });

  it('tombol tutup memanggil onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <ModalHeader onClose={onClose}>Judul panel</ModalHeader>
        <ModalBody>Isi panel</ModalBody>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Tutup modal' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fokus terkunci di dalam dialog selama dibuka', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Buka' }));
    const dialog = screen.getByRole('dialog');

    for (let i = 0; i < 4; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
