import { RESUME } from '../content/links';

/** Save Amogh's résumé to the visitor's device. */
export function downloadResume(): void {
  const link = document.createElement('a');
  link.href = RESUME.href;
  link.download = RESUME.file;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
