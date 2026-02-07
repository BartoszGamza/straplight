import React, { useEffect, useRef, useState } from 'react';
import { useStraplight, SearchResult } from '../hooks/useStraplight';

const OVERLAY_STYLES = `
@keyframes straplight-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes straplight-slide-in {
  from { opacity: 0; transform: translate(-50%, -50%) translateY(16px); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}
@keyframes straplight-spin {
  to { transform: rotate(360deg); }
}
`;

// Strapi stores theme preference in localStorage under 'STRAPI_THEME'
// Values: 'light', 'dark', or 'system'
function resolveIsDark(): boolean {
  const stored = localStorage.getItem('STRAPI_THEME') || 'system';
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function useIsDarkMode() {
  const [dark, setDark] = useState(resolveIsDark);

  useEffect(() => {
    const check = () => setDark(resolveIsDark());

    // Cross-tab localStorage changes
    window.addEventListener('storage', check);
    // System theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', check);
    // Same-tab localStorage changes (storage event doesn't fire in same tab)
    const interval = setInterval(check, 1000);

    return () => {
      window.removeEventListener('storage', check);
      mq.removeEventListener('change', check);
      clearInterval(interval);
    };
  }, []);

  return dark;
}

// Colors matching Strapi's design system
const themes = {
  light: {
    bg: '#ffffff',
    bgHover: '#f6f6f9',
    bgSelected: '#f0f0ff',
    text: '#32324d',
    textMuted: '#8e8ea9',
    border: '#eaeaef',
    inputText: '#32324d',
    badge: '#f6f6f9',
    kbd: '#f6f6f9',
    kbdBorder: '#dcdce4',
    kbdText: '#666687',
    backdrop: 'rgba(0, 0, 0, 0.4)',
    shadow: '0 16px 70px rgba(0, 0, 0, 0.2)',
    spinnerTrack: '#eaeaef',
    spinnerAccent: '#4945ff',
  },
  dark: {
    bg: '#212134',
    bgHover: '#2a2a3e',
    bgSelected: '#2e2e48',
    text: '#eaeaef',
    textMuted: '#a5a5ba',
    border: '#3d3d57',
    inputText: '#eaeaef',
    badge: '#2e2e48',
    kbd: '#2e2e48',
    kbdBorder: '#3d3d57',
    kbdText: '#a5a5ba',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    shadow: '0 16px 70px rgba(0, 0, 0, 0.5)',
    spinnerTrack: '#3d3d57',
    spinnerAccent: '#7b79ff',
  },
};

type Theme = typeof themes.light;

export function StraplightOverlay() {
  const {
    isOpen,
    query,
    setQuery,
    results,
    loading,
    selectedIndex,
    close,
    onKeyDown,
    navigateToResult,
  } = useStraplight();

  const dark = useIsDarkMode();
  const t = dark ? themes.dark : themes.light;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    /mac/i.test(navigator.platform || navigator.userAgent);
  const modKey = isMac ? '\u2318' : 'Ctrl';

  return (
    <>
      <style>{OVERLAY_STYLES}</style>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: t.backdrop,
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          animation: 'straplight-fade-in 0.15s ease-out',
        }}
      />
      {/* Modal */}
      <div
        onKeyDown={onKeyDown}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '580px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '440px',
          backgroundColor: t.bg,
          borderRadius: '12px',
          boxShadow: t.shadow,
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'straplight-slide-in 0.2s ease-out 0.05s both',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: `1px solid ${t.border}`,
            gap: '10px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.textMuted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search content..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontFamily: 'inherit',
              color: t.inputText,
              backgroundColor: 'transparent',
            }}
          />
          {loading && (
            <div
              style={{
                width: '18px',
                height: '18px',
                border: `2px solid ${t.spinnerTrack}`,
                borderTopColor: t.spinnerAccent,
                borderRadius: '50%',
                animation: 'straplight-spin 0.6s linear infinite',
              }}
            />
          )}
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: results.length > 0 ? '8px' : '0',
          }}
        >
          {query.trim() && !loading && results.length === 0 && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: t.textMuted,
                fontSize: '14px',
              }}
            >
              No results found
            </div>
          )}
          {results.map((result, index) => (
            <ResultItem
              key={`${result.uid}-${result.documentId}`}
              result={result}
              isSelected={index === selectedIndex}
              onClick={() => navigateToResult(result)}
              t={t}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '10px 16px',
            borderTop: `1px solid ${t.border}`,
            fontSize: '12px',
            color: t.textMuted,
          }}
        >
          <span><Kbd t={t}>{'\u2191\u2193'}</Kbd> navigate</span>
          <span><Kbd t={t}>{'\u23CE'}</Kbd> open</span>
          <span><Kbd t={t}>esc</Kbd> close</span>
          <span style={{ marginLeft: 'auto' }}><Kbd t={t}>{modKey}+K</Kbd> toggle</span>
        </div>
      </div>
    </>
  );
}

function ResultItem({
  result,
  isSelected,
  onClick,
  t,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  t: Theme;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: isSelected ? t.bgSelected : 'transparent',
        transition: 'background-color 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLElement).style.backgroundColor = t.bgHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = isSelected
          ? t.bgSelected
          : 'transparent';
      }}
    >
      <span
        style={{
          fontSize: '14px',
          color: t.text,
          fontWeight: isSelected ? 600 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginRight: '12px',
        }}
      >
        {result.label}
      </span>
      <span
        style={{
          fontSize: '11px',
          color: t.textMuted,
          backgroundColor: t.badge,
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {result.contentType}
      </span>
    </div>
  );
}

function Kbd({ children, t }: { children: React.ReactNode; t: Theme }) {
  return (
    <kbd
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        fontSize: '11px',
        fontFamily: 'inherit',
        color: t.kbdText,
        backgroundColor: t.kbd,
        border: `1px solid ${t.kbdBorder}`,
        borderRadius: '4px',
      }}
    >
      {children}
    </kbd>
  );
}
