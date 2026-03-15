import React, { useEffect, useRef, useState } from 'react';
import { useStraplight, SearchResult } from '../hooks/useStraplight';
import { Box, Flex, Divider, Typography, Loader } from '@strapi/design-system';
import { Search } from '@strapi/icons';

const OVERLAY_STYLES = `
#straplight-portal input::placeholder {
  color: inherit;
  opacity: 0.6;
}
@keyframes straplight-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes straplight-slide-in {
  from { opacity: 0; transform: translateX(-50%) translateY(16px); }
  to { opacity: 1; transform: translateX(-50%); }
}
@keyframes straplight-spin {
  to { transform: rotate(360deg); }
}
`;

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
      <Box
        onClick={close}
        background='rgba(0, 0, 0, 0.5)'
        position='fixed'
        zIndex={99999}
        animation='straplight-fade-in 0.15s ease-out'
        style={{
          inset: 0,
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Modal */}
      <Box
        onKeyDown={onKeyDown}
        background="neutral0"
        shadow="filterShadow"
        borderRadius="12px"
        maxHeight="440px"
        maxWidth="calc(100vw - 32px)"
        overflow="hidden"
        position='fixed'
        top='calc(50% - 50px)'
        left='50%'
        width='580px'
        zIndex={100000}
        animation='straplight-slide-in 0.2s ease-out 0.05s both'
      >
        <Box
          paddingLeft={4}
          paddingRight={4}
          paddingTop={3}
          paddingBottom={3}
        >

          {/* Search input */}
          <Flex
            items="center"
            gap="10px"
          >
            <Box
              display="contents"
              color="neutral400"
            >
              <Search width={20} height={20}/>
            </Box>
            <Box
              color="neutral700"
              flex="1"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Search content..."
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: "inherit",
                  backgroundColor: 'transparent',
                }}
              />
            </Box>
            {loading && <Loader small />}
          </Flex>
        </Box>
        <Divider />
        {/* Results */}
        <Box
          flex="1"
          overflow="auto"
          ref={listRef}
          padding={results.length > 0 ? 2 : 0}
        >
          {query.trim() && !loading && results.length === 0 && (
            <Box
              color="neutral600"
              paddingLeft={4}
              paddingRight={4}
              paddingTop={8}
              paddingBottom={8}
              textAlign="center"
            >
              <Typography>
                No results found
              </Typography>
            </Box>
          )}
          {results.map((result, index) => (
            <ResultItem
              key={`${result.uid}-${result.documentId}`}
              result={result}
              isSelected={index === selectedIndex}
              onClick={() => navigateToResult(result)}
            />
          ))}
        </Box>

        {/* Footer */}
        <Divider />
        <Box
          paddingLeft={4}
          paddingRight={4}
          paddingTop={3}
          paddingBottom={3}
        >
          <Flex
            color="neutral600"
            gap="16px"
          >
            <Typography fontSize="12px"><Kbd>{'\u2191\u2193'}</Kbd> navigate</Typography>
            <Typography fontSize="12px"><Kbd>{'\u23CE'}</Kbd> open</Typography>
            <Typography fontSize="12px"><Kbd>esc</Kbd> close</Typography>
            <Typography fontSize="12px" style={{ marginLeft: 'auto' }}><Kbd>{modKey}+K</Kbd> toggle</Typography>
          </Flex>
        </Box>
      </Box>
    </>
  );
}

function ResultItem({
  result,
  isSelected,
  onClick,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      paddingLeft={3}
      paddingRight={3}
      paddingTop={2}
      paddingBottom={2}
      borderRadius="8px"
      transition="background-color 0.1s"
      cursor="pointer"
      background={(isSelected || hovered) ? 'neutral150' : 'transparent'}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
      >
        <Box
          flex="1"
          overflow="hidden"
          marginRight={3}
        >
          <Flex
            alignItems="baseline"
            gap="8px"
          >
            <Box
              shrink="0"
              minWidth={0}
            >
              <Typography
                fontWeight={isSelected ? 600 : 400}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {result.label}
              </Typography>
            </Box>
            {result.fields && result.fields.length > 0 && (
              <Box
                shrink="1"
                minWidth={0}
              >
                <Typography
                  fontSize="12px"
                  textColor="neutral600"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.fields.map((f) => f.value).join(' · ')}
                </Typography>
              </Box>
            )}
          </Flex>
        </Box>
        <Box
          color="neutral600"
          background="neutral150"
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
          borderRadius="4px"
          shrink="0"
        >
          <Typography fontSize="11px">
            {result.contentType}
          </Typography>
        </Box>
      </Flex>
    </Box>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Box
      display="inline-block"
      borderColor="neutral200"
      background="neutral150"
      borderRadius="4px"
    >
      <kbd
        style={{
          display: 'inline-block',
          padding: '1px 5px',
          fontSize: '11px',
          fontFamily: 'inherit',
          borderRadius: '4px',
        }}
      >
        {children}
      </kbd>
    </Box>
  );
}
