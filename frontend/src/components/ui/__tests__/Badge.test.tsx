import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, type BadgeVariant } from '../Badge';

describe('Badge', () => {
  it.each<BadgeVariant>(['online', 'idle', 'alert', 'offline', 'frozen', 'regular'])(
    'varian %s menampilkan label status apa adanya',
    (variant) => {
      render(<Badge variant={variant}>ONLINE</Badge>);

      expect(screen.getByText('ONLINE')).toBeInTheDocument();
    },
  );

  it('tanpa varian tetap merender label', () => {
    render(<Badge>REGULER</Badge>);

    expect(screen.getByText('REGULER')).toBeInTheDocument();
  });

  it('dot menambah satu penanda di dalam badge', () => {
    const withDot = render(
      <Badge variant="idle" dot>
        IDLE
      </Badge>,
    );
    const withoutDot = render(<Badge variant="idle">IDLE</Badge>);

    expect(withDot.container.querySelectorAll('span')).toHaveLength(2);
    expect(withoutDot.container.querySelectorAll('span')).toHaveLength(1);
  });
});
