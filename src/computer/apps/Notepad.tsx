import { README } from '../../content/desktop';

export default function Notepad() {
  return (
    <pre className="max-h-[60vh] overflow-auto px-5 py-4 font-mono text-[13px] leading-6 whitespace-pre-wrap text-ink">
      {README}
    </pre>
  );
}
