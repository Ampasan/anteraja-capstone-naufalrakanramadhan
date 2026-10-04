import { hasSession } from './lib/session';
import { warmAppShell, warmPublicShell } from './lib/prefetch';

warmPublicShell();
if (hasSession()) warmAppShell();
