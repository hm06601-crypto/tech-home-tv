import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';

/**
 * Tech Home TV: lay the whole interface out right-to-left for Arabic.
 * Set to `false` to keep the original left-to-right layout (Arabic text is
 * still shown) if a screen looks wrong in RTL.
 */
export const ENABLE_RTL_LAYOUT = true as boolean;

const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar', 'ary']);

export function isRtlLanguage(appLanguage?: string | null): boolean {
    return RTL_LANGUAGES.has((appLanguage ?? '').trim().toLowerCase());
}

/** UI language codes that are not valid BCP 47 tags. */
const DOCUMENT_LANGUAGE_OVERRIDES: Readonly<Record<string, string>> = {
    by: 'be',
    pt: 'pt-BR',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
    zhtw: 'zh-TW',
};

/**
 * Maps an app language code to the value for `<html lang>`. The browser uses
 * it for font fallback (Han variants), hyphenation and locale-aware
 * `text-transform` (Turkish dotted İ, Greek accents in uppercase labels).
 */
export function toDocumentLanguage(appLanguage?: string | null): string {
    const code = appLanguage?.trim().replace(/_/g, '-');
    if (!code) {
        return 'en';
    }
    return DOCUMENT_LANGUAGE_OVERRIDES[code.toLowerCase()] ?? code;
}

/**
 * Keeps `<html lang>` in step with the language the UI renders, whichever
 * code path switches it (startup, settings). With no active language the UI
 * renders the fallback: startup seeds it from the stored hint and then resets
 * it to English when no settings exist, without an active-language change.
 * Must run in an injection context.
 */
export function syncDocumentLanguage(): void {
    const document = inject(DOCUMENT);
    const translate = inject(TranslateService);
    const apply = (): void => {
        const active = translate.currentLang || translate.getDefaultLang();
        document.documentElement.lang = toDocumentLanguage(active);
        document.documentElement.dir =
            ENABLE_RTL_LAYOUT && isRtlLanguage(active) ? 'rtl' : 'ltr';
    };

    apply();
    merge(translate.onLangChange, translate.onDefaultLangChange)
        .pipe(takeUntilDestroyed(inject(DestroyRef)))
        .subscribe(apply);
}
