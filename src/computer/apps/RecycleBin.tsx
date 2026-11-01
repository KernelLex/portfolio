import { TRASH_EMPTY } from '../../content/desktop';
import { TrashIcon } from '../icons';

export default function RecycleBin() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <TrashIcon className="h-12 w-12 opacity-60" />
      <p className="text-sm text-ink-muted">{TRASH_EMPTY}</p>
    </div>
  );
}
