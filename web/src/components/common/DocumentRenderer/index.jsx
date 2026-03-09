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

import React, { useEffect, useState } from 'react';
import { API, showError } from '../../../helpers';
import { Empty, Card, Spin, Typography } from '@douyinfe/semi-ui';
const { Title } = Typography;
import {
  IllustrationConstruction,
  IllustrationConstructionDark,
} from '@douyinfe/semi-illustrations';
import { useTranslation } from 'react-i18next';
import MarkdownRenderer from '../markdown/MarkdownRenderer';

// 检查是否为 URL
const isUrl = (content) => {
  try {
    new URL(content.trim());
    return true;
  } catch {
    return false;
  }
};

// 检查是否为 HTML 内容
const isHtmlContent = (content) => {
  if (!content || typeof content !== 'string') return false;

  // 检查是否包含HTML标签
  const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlTagRegex.test(content);
};

// 安全地渲染HTML内容
const sanitizeHtml = (html) => {
  // 创建一个临时元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // 提取样式
  const styles = Array.from(tempDiv.querySelectorAll('style'))
    .map((style) => style.innerHTML)
    .join('\n');

  // 提取body内容，如果没有body标签则使用全部内容
  const bodyContent = tempDiv.querySelector('body');
  const content = bodyContent ? bodyContent.innerHTML : html;

  return { content, styles };
};

/**
 * 通用文档渲染组件
 * @param {string} apiEndpoint - API 接口地址
 * @param {string} title - 文档标题
 * @param {string} cacheKey - 本地存储缓存键
 * @param {string} emptyMessage - 空内容时的提示消息
 */
const DocumentRenderer = ({ apiEndpoint, title, cacheKey, emptyMessage }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [htmlStyles, setHtmlStyles] = useState('');
  const [processedHtmlContent, setProcessedHtmlContent] = useState('');

  const loadContent = async () => {
    // 先从缓存中获取
    const cachedContent = localStorage.getItem(cacheKey) || '';
    if (cachedContent) {
      setContent(cachedContent);
      processContent(cachedContent);
      setLoading(false);
    }

    try {
      const res = await API.get(apiEndpoint);
      const { success, message, data } = res.data;
      if (success && data) {
        setContent(data);
        processContent(data);
        localStorage.setItem(cacheKey, data);
      } else {
        if (!cachedContent) {
          showError(message || emptyMessage);
          setContent('');
        }
      }
    } catch (error) {
      if (!cachedContent) {
        showError(emptyMessage);
        setContent('');
      }
    } finally {
      setLoading(false);
    }
  };

  const processContent = (rawContent) => {
    if (isHtmlContent(rawContent)) {
      const { content: htmlContent, styles } = sanitizeHtml(rawContent);
      setProcessedHtmlContent(htmlContent);
      setHtmlStyles(styles);
    } else {
      setProcessedHtmlContent('');
      setHtmlStyles('');
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  // 处理HTML样式注入
  useEffect(() => {
    const styleId = `document-renderer-styles-${cacheKey}`;

    if (htmlStyles) {
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.type = 'text/css';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = htmlStyles;
    } else {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [htmlStyles, cacheKey]);

  // 显示加载状态
  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spin size='large' tip={t('正在加载文档...')} />
      </div>
    );
  }

  // 如果没有内容，显示空状态
  if (!content || content.trim() === '') {
    return (
      <div className='flex justify-center items-center min-h-[60vh] bg-[var(--semi-color-bg-0)]'>
        <Empty
          title={t('管理员未设置' + title + '内容')}
          image={
            <IllustrationConstruction style={{ width: 200, height: 200 }} />
          }
          darkModeImage={
            <IllustrationConstructionDark style={{ width: 200, height: 200 }} />
          }
          className='p-8'
        />
      </div>
    );
  }

  // 如果是 URL，显示链接卡片
  if (isUrl(content)) {
    return (
      <div className='flex justify-center items-center min-h-[70vh] p-6 bg-[var(--semi-color-bg-0)]'>
        <Card className='max-w-lg w-full !rounded-2xl shadow-xl border-none p-8 text-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950'>
          <div className='w-16 h-16 bg-[var(--semi-color-primary-light-default)] text-[var(--semi-color-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner'>
            <IconInfoCircle size='extra-large' />
          </div>
          <Title heading={3} className='mb-3 font-black tracking-tight'>
            {title}
          </Title>
          <p className='text-[15px] leading-relaxed mb-8' style={{ color: 'var(--semi-color-text-2)' }}>
            {t('此文档由外部链接托管，点击下方按钮前往查看最新内容。')}
          </p>
          <a
            href={content.trim()}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center gap-2 w-full py-4 bg-[var(--semi-color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]'
          >
            {t('立即访问')}
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='top-right' /></svg>
          </a>
          <div className='mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-[12px] opacity-40 font-mono truncate'>
             {content.trim()}
          </div>
        </Card>
      </div>
    );
  }

  // 统一的渲染容器
  const RenderContainer = ({ children }) => (
    <div className='min-h-screen bg-[var(--semi-color-bg-0)] py-12 md:py-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-8'>
        <div className='bg-[var(--semi-color-bg-0)] rounded-3xl border border-[var(--semi-color-border)] p-6 md:p-12 shadow-sm transition-shadow hover:shadow-md'>
          <div className='mb-12 text-center'>
             <div className='inline-block px-3 py-1 rounded-full bg-[var(--semi-color-primary-light-default)] text-[var(--semi-color-primary)] text-[11px] font-bold mb-4 uppercase tracking-widest'>
                Official Document
             </div>
             <Title heading={1} className='!text-3xl md:!text-4xl font-black tracking-tight m-0'>
               {title}
             </Title>
             <div className='w-12 h-1 bg-[var(--semi-color-primary)] mx-auto mt-6 rounded-full' />
          </div>
          <div className='prose prose-slate dark:prose-invert max-w-none'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // 如果是 HTML 内容，直接渲染
  if (isHtmlContent(content)) {
    const { content: htmlContent } = sanitizeHtml(content);

    return (
      <RenderContainer>
        <div
          className='prose prose-lg max-w-none'
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </RenderContainer>
    );
  }

  // 其他内容统一使用 Markdown 渲染器
  return (
    <RenderContainer>
      <MarkdownRenderer content={content} />
    </RenderContainer>
  );
};

export default DocumentRenderer;
