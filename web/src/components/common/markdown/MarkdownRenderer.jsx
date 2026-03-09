/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';
import './markdown.css';
import RemarkMath from 'remark-math';
import RemarkBreaks from 'remark-breaks';
import RehypeKatex from 'rehype-katex';
import RemarkGfm from 'remark-gfm';
import RehypeHighlight from 'rehype-highlight';
import { useRef, useState, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';
import { Button, Tooltip, Toast } from '@douyinfe/semi-ui';
import { copy, rehypeSplitWordsIntoSpans } from '../../../helpers';
import { IconCopy } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

export function Mermaid(props) {
  const ref = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (props.code && ref.current) {
      mermaid
        .run({
          nodes: [ref.current],
          suppressErrors: true,
        })
        .catch((e) => {
          setHasError(true);
          console.error('[Mermaid] ', e.message);
        });
    }
  }, [props.code]);

  function viewSvgInNewWindow() {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  if (hasError) {
    return null;
  }

  return (
    <div
      className={clsx('mermaid-container')}
      style={{
        cursor: 'pointer',
        overflow: 'auto',
        padding: '12px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '8px',
        backgroundColor: 'var(--semi-color-bg-1)',
        margin: '12px 0',
      }}
      ref={ref}
      onClick={() => viewSvgInNewWindow()}
    >
      {props.code}
    </div>
  );
}

function SandboxedHtmlPreview({ code }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(150);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const height =
            doc.documentElement.scrollHeight || doc.body.scrollHeight;
          setIframeHeight(Math.min(Math.max(height + 16, 60), 600));
        }
      } catch {
        // sandbox restrictions may prevent access, that's fine
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      sandbox='allow-same-origin'
      srcDoc={code}
      title='HTML Preview'
      style={{
        width: '100%',
        height: `${iframeHeight}px`,
        border: 'none',
        overflow: 'auto',
        backgroundColor: '#fff',
        borderRadius: '4px',
      }}
    />
  );
}

export function PreCode(props) {
  const ref = useRef(null);
  const [mermaidCode, setMermaidCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const { t } = useTranslation();

  const renderArtifacts = useDebouncedCallback(() => {
    if (!ref.current) return;
    const mermaidDom = ref.current.querySelector('code.language-mermaid');
    if (mermaidDom) {
      setMermaidCode(mermaidDom.innerText);
    }
    const htmlDom = ref.current.querySelector('code.language-html');
    const refText = ref.current.querySelector('code')?.innerText;
    if (htmlDom) {
      setHtmlCode(htmlDom.innerText);
    } else if (
      refText?.startsWith('<!DOCTYPE') ||
      refText?.startsWith('<svg') ||
      refText?.startsWith('<?xml')
    ) {
      setHtmlCode(refText);
    }
  }, 600);

  // 处理代码块的换行
  useEffect(() => {
    if (ref.current) {
      const codeElements = ref.current.querySelectorAll('code');
      const wrapLanguages = [
        '',
        'md',
        'markdown',
        'text',
        'txt',
        'plaintext',
        'tex',
        'latex',
      ];
      codeElements.forEach((codeElement) => {
        let languageClass = codeElement.className.match(/language-(\w+)/);
        let name = languageClass ? languageClass[1] : '';
        if (wrapLanguages.includes(name)) {
          codeElement.style.whiteSpace = 'pre-wrap';
        }
      });
      setTimeout(renderArtifacts, 1);
    }
  }, []);

  return (
    <div className='relative group my-6'>
      <pre
        ref={ref}
        className='rounded-xl overflow-hidden shadow-sm'
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid var(--semi-color-border)',
          padding: '20px',
          margin: '0',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#E2E8F0',
        }}
      >
        <div
          className='copy-code-button'
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            gap: '4px',
            zIndex: 10,
            opacity: 0,
            transition: 'all 0.2s ease',
          }}
        >
          <Tooltip content={t('复制代码')}>
            <Button
              size='small'
              theme='borderless'
              icon={<IconCopy style={{ color: '#94A3B8' }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (ref.current) {
                  const codeElement = ref.current.querySelector('code');
                  const code = codeElement?.textContent ?? '';
                  copy(code).then((success) => {
                    if (success) {
                      Toast.success(t('代码已复制到剪贴板'));
                    } else {
                      Toast.error(t('复制失败，请手动复制'));
                    }
                  });
                }
              }}
              className='!bg-white/10 hover:!bg-white/20 !rounded-lg border border-white/10 shadow-lg backdrop-blur-sm'
            />
          </Tooltip>
        </div>
        {props.children}
      </pre>
      {mermaidCode.length > 0 && (
        <Mermaid code={mermaidCode} key={mermaidCode} />
      )}
      {htmlCode.length > 0 && (
        <div
          className='mt-4 p-5 rounded-xl border border-dashed'
          style={{
            borderColor: 'var(--semi-color-border)',
            backgroundColor: 'var(--semi-color-bg-1)',
          }}
        >
          <div
            className='mb-3 text-[11px] font-bold uppercase tracking-widest opacity-40'
          >
            HTML Preview:
          </div>
          <SandboxedHtmlPreview code={htmlCode} />
        </div>
      )}
      <style>{`
        .group:hover .copy-code-button {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .copy-code-button {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

function CustomCode(props) {
  const ref = useRef(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showToggle, setShowToggle] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (ref.current) {
      const codeHeight = ref.current.scrollHeight;
      setShowToggle(codeHeight > 400);
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [props.children]);

  const toggleCollapsed = () => {
    setCollapsed((collapsed) => !collapsed);
  };

  const renderShowMoreButton = () => {
    if (showToggle && collapsed) {
      return (
        <div
          className='absolute bottom-2 left-0 right-0 flex justify-center pb-2 bg-gradient-to-t from-[var(--semi-color-fill-0)] to-transparent'
        >
          <Button size='small' onClick={toggleCollapsed} theme='solid' className='!rounded-full shadow-md'>
            {t('显示更多')}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='relative inline-block align-middle mx-1'>
      <code
        className={clsx(props?.className, 'font-mono')}
        ref={ref}
        style={{
          maxHeight: collapsed ? '400px' : 'none',
          overflowY: 'hidden',
          display: 'inline-block',
          padding: '2px 6px',
          backgroundColor: 'var(--semi-color-fill-0)',
          border: '1px solid var(--semi-color-border)',
          borderRadius: '6px',
          fontSize: '0.9em',
          color: 'var(--semi-color-primary)',
          fontWeight: '500',
        }}
      >
        {props.children}
      </code>
      {renderShowMoreButton()}
    </div>
  );
}

function escapeBrackets(text) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$${squareBracket}$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      }
      return match;
    },
  );
}

function tryWrapHtmlCode(text) {
  // 尝试包装HTML代码
  if (text.includes('```')) {
    return text;
  }
  return text
    .replace(
      /([`]*?)(\w*?)([\n\r]*?)(<!DOCTYPE html>)/g,
      (match, quoteStart, lang, newLine, doctype) => {
        return !quoteStart ? '\n```html\n' + doctype : match;
      },
    )
    .replace(
      /(<\/body>)([\r\n\s]*?)(<\/html>)([\n\r]*)([`]*)([\n\r]*?)/g,
      (match, bodyEnd, space, htmlEnd, newLine, quoteEnd) => {
        return !quoteEnd ? bodyEnd + space + htmlEnd + '\n```\n' : match;
      },
    );
}

function _MarkdownContent(props) {
  const {
    content,
    className,
    animated = false,
    previousContentLength = 0,
  } = props;

  const escapedContent = useMemo(() => {
    return tryWrapHtmlCode(escapeBrackets(content));
  }, [content]);

  // 判断是否为用户消息
  const isUserMessage = className && className.includes('user-message');

  const rehypePluginsBase = useMemo(() => {
    const base = [
      RehypeKatex,
      [
        RehypeHighlight,
        {
          detect: false,
          ignoreMissing: true,
        },
      ],
    ];
    if (animated) {
      base.push([rehypeSplitWordsIntoSpans, { previousContentLength }]);
    }
    return base;
  }, [animated, previousContentLength]);

  return (
    <ReactMarkdown
      remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
      rehypePlugins={rehypePluginsBase}
      components={{
        pre: PreCode,
        code: CustomCode,
        p: (pProps) => (
          <p
            {...pProps}
            dir='auto'
            style={{
              lineHeight: '1.6',
              color: isUserMessage ? 'white' : 'inherit',
            }}
          />
        ),
        a: (aProps) => {
          const href = aProps.href || '';
          if (/\.(aac|mp3|opus|wav)$/.test(href)) {
            return (
              <figure style={{ margin: '12px 0' }}>
                <audio controls src={href} style={{ width: '100%' }}></audio>
              </figure>
            );
          }
          if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
            return (
              <video
                controls
                style={{ width: '100%', maxWidth: '100%', margin: '12px 0' }}
              >
                <source src={href} />
              </video>
            );
          }
          const isInternal = /^\/#/i.test(href);
          const target = isInternal ? '_self' : (aProps.target ?? '_blank');
          return (
            <a
              {...aProps}
              target={target}
              style={{
                color: isUserMessage ? '#87CEEB' : 'var(--semi-color-primary)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.textDecoration = 'none';
              }}
            />
          );
        },
        h1: (props) => (
          <h1
            {...props}
            style={{
              fontSize: '28px',
              fontWeight: '900',
              margin: '40px 0 20px 0',
              letterSpacing: '-0.025em',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
              borderBottom: '1px solid var(--semi-color-border)',
              paddingBottom: '12px'
            }}
          />
        ),
        h2: (props) => (
          <h2
            {...props}
            style={{
              fontSize: '22px',
              fontWeight: '800',
              margin: '32px 0 16px 0',
              letterSpacing: '-0.02em',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
            }}
          />
        ),
        h3: (props) => (
          <h3
            {...props}
            style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: '24px 0 12px 0',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
            }}
          />
        ),
        h4: (props) => (
          <h4
            {...props}
            style={{
              fontSize: '16px',
              fontWeight: '700',
              margin: '20px 0 10px 0',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
            }}
          />
        ),
        h5: (props) => (
          <h5
            {...props}
            style={{
              fontSize: '14px',
              fontWeight: '700',
              margin: '12px 0 4px 0',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
            }}
          />
        ),
        h6: (props) => (
          <h6
            {...props}
            style={{
              fontSize: '13px',
              fontWeight: '700',
              margin: '10px 0 4px 0',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-0)',
            }}
          />
        ),
        blockquote: (props) => (
          <blockquote
            {...props}
            className='!border-l-4 !border-[var(--semi-color-primary)] !bg-[var(--semi-color-fill-0)] !rounded-r-xl shadow-sm'
            style={{
              paddingLeft: '24px',
              margin: '24px 0',
              padding: '16px 24px',
              fontStyle: 'italic',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-2)',
            }}
          />
        ),
        ul: (props) => (
          <ul
            {...props}
            className='list-disc'
            style={{
              margin: '16px 0',
              paddingLeft: '24px',
              color: isUserMessage ? 'white' : 'inherit',
            }}
          />
        ),
        ol: (props) => (
          <ol
            {...props}
            className='list-decimal'
            style={{
              margin: '16px 0',
              paddingLeft: '24px',
              color: isUserMessage ? 'white' : 'inherit',
            }}
          />
        ),
        li: (props) => (
          <li
            {...props}
            style={{
              margin: '8px 0',
              lineHeight: '1.7',
              color: isUserMessage ? 'white' : 'inherit',
            }}
          />
        ),
        table: (props) => (
          <div className='my-8 overflow-hidden rounded-xl border border-[var(--semi-color-border)] shadow-sm'>
            <table
              {...props}
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            />
          </div>
        ),
        th: (props) => (
          <th
            {...props}
            className='!bg-[var(--semi-color-fill-0)]'
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--semi-color-border)',
              fontWeight: 'bold',
              textAlign: 'left',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isUserMessage ? 'white' : 'var(--semi-color-text-2)',
            }}
          />
        ),
        td: (props) => (
          <td
            {...props}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--semi-color-border)',
              fontSize: '14px',
              color: isUserMessage ? 'white' : 'inherit',
            }}
          />
        ),
      }}
    >
      {escapedContent}
    </ReactMarkdown>
  );
}

export const MarkdownContent = React.memo(_MarkdownContent);

export function MarkdownRenderer(props) {
  const {
    content,
    loading,
    fontSize = 14,
    fontFamily = 'inherit',
    className,
    style,
    animated = false,
    previousContentLength = 0,
    ...otherProps
  } = props;

  return (
    <div
      className={clsx('markdown-body', className)}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: '1.6',
        color: 'var(--semi-color-text-0)',
        ...style,
      }}
      dir='auto'
      {...otherProps}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px',
            color: 'var(--semi-color-text-2)',
          }}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--semi-color-border)',
              borderTop: '2px solid var(--semi-color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          正在渲染...
        </div>
      ) : (
        <MarkdownContent
          content={content}
          className={className}
          animated={animated}
          previousContentLength={previousContentLength}
        />
      )}
    </div>
  );
}

export default MarkdownRenderer;
