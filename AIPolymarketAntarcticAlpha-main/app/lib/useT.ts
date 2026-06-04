import { useLang } from '@/app/providers';
import { dict, type Lang } from './i18n';

export function useT() {
  const { lang } = useLang();
  const t = (key: string, vars?: Record<string, string>) => {
    const d = dict[lang] || dict.RU;
    let val = d[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        val = val.replace(`{${k}}`, v);
      }
    }
    return val;
  };
  return { t, lang };
}
