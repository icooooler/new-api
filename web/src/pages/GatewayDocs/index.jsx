import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Typography,
  Collapse,
  Tag,
  Banner,
  Button,
  Tooltip,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconCopy,
  IconTerminal,
  IconCheckCircleStroked,
  IconInfoCircle,
  IconAlertTriangle,
  IconKey,
} from '@douyinfe/semi-icons';
import {
  Terminal,
  Zap,
  BookOpen,
  CheckCircle2,
  Globe,
  Shield,
  MousePointerClick,
  Download,
  MonitorSmartphone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { StatusContext } from '../../context/Status';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { copy, showSuccess } from '../../helpers';

const { Title, Paragraph, Text } = Typography;

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Dark-themed code block with copy button */
const CodeBlock = ({ children, onCopy, label }) => {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = async () => {
    const ok = await copy(children);
    if (ok) {
      setCopied(true);
      showSuccess(t('已复制到剪切板'));
      setTimeout(() => setCopied(false), 2000);
    }
    onCopy?.();
  };

  return (
    <div className='relative group my-5 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md' style={{ border: '1px solid var(--semi-color-border)' }}>
      {label && (
        <div
          className='px-4 py-2 text-[11px] font-bold uppercase tracking-widest select-none border-b flex items-center justify-between'
          style={{
            background: 'var(--semi-color-fill-0)',
            color: 'var(--semi-color-text-2)',
            borderColor: 'var(--semi-color-border)',
          }}
        >
          <span className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-red-400/50' />
            <div className='w-2 h-2 rounded-full bg-yellow-400/50' />
            <div className='w-2 h-2 rounded-full bg-green-400/50' />
            <span className='ml-2'>{label}</span>
          </span>
        </div>
      )}
      <pre
        className='p-5 overflow-x-auto font-mono text-[13px] leading-relaxed m-0 custom-scrollbar'
        style={{
          background: '#0F172A', // Deep slate for better contrast
          color: '#E2E8F0',
          borderTop: label ? 'none' : undefined,
        }}
      >
        <code>{children}</code>
      </pre>
      <Tooltip content={copied ? t('已复制') : t('复制')} position='left'>
        <Button
          size='small'
          theme='borderless'
          icon={
            copied ? (
              <IconCheckCircleStroked style={{ color: '#10B981' }} />
            ) : (
              <IconCopy style={{ color: '#94A3B8' }} />
            )
          }
          className='!absolute top-2.5 right-2.5 transition-all duration-200 hover:bg-white/10'
          style={{ top: label ? '2.8rem' : '0.6rem' }}
          onClick={handleCopy}
        />
      </Tooltip>
    </div>
  );
};

/** Numbered step */
const StepItem = ({ number, children }) => (
  <div className='flex gap-4 items-start py-2 group'>
    <span
      className='flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-transform group-hover:scale-110'
      style={{
        background: 'var(--semi-color-primary)',
        color: 'white',
        boxShadow: '0 2px 4px rgba(var(--semi-primary-rgb), 0.2)',
      }}
    >
      {number}
    </span>
    <div className='text-[14px] leading-relaxed flex-1 pt-0.5' style={{ color: 'var(--semi-color-text-1)' }}>{children}</div>
  </div>
);

/** Environment variable row */
const EnvVarRow = ({ name, value, description }) => (
  <div className='grid grid-cols-[1.2fr_1.5fr_auto] gap-x-4 gap-y-1 items-center py-3 px-2 border-b last:border-b-0 hover:bg-[var(--semi-color-fill-0)] transition-colors rounded-md' style={{ borderColor: 'var(--semi-color-border)' }}>
    <code className='text-[13px] font-bold font-mono tracking-tight' style={{ color: 'var(--semi-color-primary)' }}>
      {name}
    </code>
    <span className='text-[13px]' style={{ color: 'var(--semi-color-text-2)' }}>
      {description}
    </span>
    <code className='text-[12px] font-mono px-2 py-1 rounded-md border shadow-sm max-w-[260px] truncate' style={{ background: 'var(--semi-color-bg-0)', color: 'var(--semi-color-text-0)', borderColor: 'var(--semi-color-border)' }}>
      {value}
    </code>
  </div>
);

/** Section heading */
const SectionHeading = ({ children, extra }) => (
  <div className='flex items-center justify-between mb-8 relative'>
    <div className='flex items-center gap-4'>
      <div className='absolute -left-5 w-1 h-8 rounded-full bg-[var(--semi-color-primary)] opacity-80' />
      <h3 className='flex items-center gap-3.5 text-2xl font-black m-0 tracking-tighter' style={{ color: 'var(--semi-color-text-0)' }}>
        {children}
      </h3>
    </div>
    {extra}
  </div>
);

/** Shell config tabs */
const ShellConfigTabs = ({ envVars, t, commentPrefix }) => (
  <Tabs type='line' size='small' className='mt-3 mb-1'>
    <TabPane tab='macOS / Linux' itemKey='unix'>
      <div className='mt-3'>
        <Text className='text-xs font-medium' style={{ color: 'var(--semi-color-text-2)' }}>
          Bash / Zsh — {t('添加到 ~/.bashrc 或 ~/.zshrc：')}
        </Text>
        <CodeBlock label='~/.zshrc'>
          {`# ${commentPrefix}\n${envVars.map(({ key, val }) => `export ${key}="${val}"`).join('\n')}`}
        </CodeBlock>

        <Text className='text-xs font-medium' style={{ color: 'var(--semi-color-text-2)' }}>
          Fish — {t('添加到 ~/.config/fish/config.fish：')}
        </Text>
        <CodeBlock label='config.fish'>
          {`# ${commentPrefix}\n${envVars.map(({ key, val }) => `set -gx ${key} "${val}"`).join('\n')}`}
        </CodeBlock>
      </div>
    </TabPane>

    <TabPane tab='Windows' itemKey='windows'>
      <div className='mt-3'>
        <Text className='text-xs font-medium' style={{ color: 'var(--semi-color-text-2)' }}>
          PowerShell — {t('临时设置（当前会话）')}
        </Text>
        <CodeBlock label='PowerShell'>
          {`# ${commentPrefix}\n${envVars.map(({ key, val }) => `$env:${key} = "${val}"`).join('\n')}`}
        </CodeBlock>

        <Text className='text-xs font-medium' style={{ color: 'var(--semi-color-text-2)' }}>
          PowerShell — {t('永久设置（写入用户环境变量）')}
        </Text>
        <CodeBlock label='PowerShell'>
          {`# ${commentPrefix}\n${envVars.map(({ key, val }) => `[System.Environment]::SetEnvironmentVariable("${key}", "${val}", "User")`).join('\n')}`}
        </CodeBlock>

        <Text className='text-xs font-medium' style={{ color: 'var(--semi-color-text-2)' }}>
          CMD — {t('永久设置')}
        </Text>
        <CodeBlock label='CMD'>
          {`:: ${commentPrefix}\n${envVars.map(({ key, val }) => `setx ${key} "${val}"`).join('\n')}`}
        </CodeBlock>

        <Banner
          type='info'
          className='mt-2 !rounded-lg'
          icon={<IconInfoCircle size='small' />}
          closeIcon={null}
          description={t('Windows 下使用 setx 或 [System.Environment] 设置的环境变量在当前终端窗口不会立即生效，需要重新打开一个新的终端窗口。')}
        />
      </div>
    </TabPane>
  </Tabs>
);

/** Inline note list */
const NoteList = ({ items }) => (
  <div className='space-y-1.5 mt-4 text-sm' style={{ color: 'var(--semi-color-text-2)' }}>
    {items.map((item, i) => (
      <div key={i} className='flex items-start gap-2'>
        <CheckCircle2 size={14} className='mt-0.5 flex-shrink-0' style={{ color: 'var(--semi-color-success)' }} />
        <span>{item}</span>
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

const QuickStartSection = ({ t, serverAddress }) => (
  <div className='space-y-6'>
    <SectionHeading>
      <Zap size={20} className='text-amber-500' />
      {t('快速开始')}
    </SectionHeading>

    <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
      <div className='p-6 rounded-xl transition-all hover:shadow-md hover:border-[var(--semi-color-primary)]' style={{ border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>
        <div className='flex items-center gap-3 mb-4'>
          <span className='font-mono text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center' style={{ background: 'var(--semi-color-primary-light-default)', color: 'var(--semi-color-primary)' }}>1</span>
          <Text strong className='text-md'>{t('获取 API 密钥')}</Text>
        </div>
        <Paragraph className='text-[13px] mb-5 leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
          {t('前往令牌管理页面创建一个 API 密钥，确保该令牌有权访问你需要的模型。')}
        </Paragraph>
        <Link to='/console/token'>
          <Button theme='solid' type='primary' size='default' icon={<IconKey size='small' />} className='!rounded-lg shadow-sm hover:shadow-md transition-all'>
            {t('前往创建令牌')}
          </Button>
        </Link>
      </div>

      <div className='p-6 rounded-xl transition-all hover:shadow-md hover:border-[var(--semi-color-primary)]' style={{ border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>
        <div className='flex items-center gap-3 mb-4'>
          <span className='font-mono text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center' style={{ background: 'var(--semi-color-primary-light-default)', color: 'var(--semi-color-primary)' }}>2</span>
          <Text strong className='text-md'>{t('配置开发工具')}</Text>
        </div>
        <Paragraph className='text-[13px] mb-4 leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
          {t('将下方对应工具的环境变量配置到你的终端中，Base URL 为：')}
        </Paragraph>
        <div className='relative group'>
          <code
            className='block text-[12px] font-mono rounded-lg px-4 py-3 break-all transition-colors group-hover:border-[var(--semi-color-primary)]'
            style={{ background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)' }}
          >
            {serverAddress}
          </code>
          <Button
            size='small'
            theme='borderless'
            icon={<IconCopy />}
            className='!absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={() => {
              copy(serverAddress);
              showSuccess(t('已复制'));
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

const CCSwitchSection = ({ t, serverAddress }) => (
  <div className='space-y-6'>
    <SectionHeading
      extra={
        <Button
          theme='borderless'
          type='tertiary'
          size='small'
          icon={<ExternalLink size={14} />}
          iconPosition='right'
          onClick={() => window.open('https://github.com/farion1231/cc-switch', '_blank')}
          className='hover:!bg-[var(--semi-color-fill-0)] !rounded-lg'
        >
          GitHub
        </Button>
      }
    >
      <MousePointerClick size={20} className='text-indigo-500' />
      CC Switch
      <Tag color='violet' size='small' shape='circle' className='ml-1 uppercase font-bold tracking-tighter shadow-sm'>{t('推荐')}</Tag>
    </SectionHeading>

    <div className='bg-indigo-50/30 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/20'>
      <Paragraph className='text-[14px] leading-relaxed m-0' style={{ color: 'var(--semi-color-text-1)' }}>
        {t('CC Switch 是一款跨平台桌面应用，提供可视化界面统一管理 Claude Code、Codex CLI、Gemini CLI、OpenCode、OpenClaw 等多个 AI 编程工具的 API 配置。支持一键切换供应商、MCP 服务器管理、Prompt 预设、用量监控等功能，免去手动编辑环境变量的繁琐步骤。')}
      </Paragraph>
    </div>

    {/* Features — 3-col minimal cards */}
    <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
      {[
        { icon: <Zap size={18} />, title: t('一键切换'), desc: t('可视化管理多个供应商配置，点击即可切换，Claude Code 支持热切换无需重启'), color: 'text-amber-500' },
        { icon: <Globe size={18} />, title: t('五合一管理'), desc: t('支持 Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw 五个工具'), color: 'text-blue-500' },
        { icon: <Shield size={18} />, title: t('安全便捷'), desc: t('SQLite 原子写入防止配置损坏，自动备份，密钥仅本地传递'), color: 'text-emerald-500' },
      ].map((f) => (
        <div
          key={f.title}
          className='p-5 rounded-xl transition-all hover:translate-y-[-2px] hover:shadow-md'
          style={{ background: 'var(--semi-color-bg-0)', border: '1px solid var(--semi-color-border)' }}
        >
          <div className={`flex items-center gap-2.5 mb-2 ${f.color}`}>
            {f.icon}
            <span className='text-[14px] font-bold' style={{ color: 'var(--semi-color-text-0)' }}>{f.title}</span>
          </div>
          <div className='text-[12px] leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>{f.desc}</div>
        </div>
      ))}
    </div>

    {/* Install */}
    <div className='mt-8'>
      <div className='flex items-center gap-2 mb-4'>
        <div className='w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center'>
          <Download size={16} />
        </div>
        <Text strong className='text-md'>{t('安装 CC Switch')}</Text>
      </div>
      <Tabs type='line' size='default' className='custom-tabs'>
        <TabPane tab='macOS' itemKey='macos'>
          <div className='mt-4'>
            <CodeBlock label='Homebrew'>
              {`brew tap farion1231/ccswitch\nbrew install --cask cc-switch`}
            </CodeBlock>
            <div className='flex items-center gap-2 px-1'>
               <IconInfoCircle className='text-gray-400' size='small' />
               <Text className='text-xs' style={{ color: 'var(--semi-color-text-2)' }}>
                {t('更新：')}<code className='font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded'>brew upgrade --cask cc-switch</code>
              </Text>
            </div>
          </div>
        </TabPane>
        <TabPane tab='Windows' itemKey='windows'>
          <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div className='flex items-center justify-between p-4 rounded-xl hover:border-blue-400 transition-colors' style={{ border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-xs'>MSI</div>
                <div>
                  <div className='text-sm font-bold'>Windows Installer</div>
                  <div className='text-[11px] opacity-60 font-mono'>v2.x.x · Recommended</div>
                </div>
              </div>
              <Button theme='light' size='small' icon={<Download size={14} />} onClick={() => window.open('https://github.com/farion1231/cc-switch/releases', '_blank')} />
            </div>
            <div className='flex items-center justify-between p-4 rounded-xl hover:border-gray-400 transition-colors' style={{ border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-gray-600 font-bold text-xs'>ZIP</div>
                <div>
                  <div className='text-sm font-bold'>Portable Version</div>
                  <div className='text-[11px] opacity-60 font-mono'>v2.x.x · Standalone</div>
                </div>
              </div>
              <Button theme='light' size='small' icon={<Download size={14} />} onClick={() => window.open('https://github.com/farion1231/cc-switch/releases', '_blank')} />
            </div>
          </div>
        </TabPane>
        <TabPane tab='Linux' itemKey='linux'>
          <div className='mt-4 space-y-3'>
            {[
              ['Arch', 'orange', 'paru -S cc-switch-bin', <Zap size={14} />],
              ['Deb', 'cyan', t('下载 .deb 安装包'), <Download size={14} />],
              ['RPM', 'blue', t('下载 .rpm 安装包'), <Download size={14} />],
              ['Flatpak', 'green', t('下载 .flatpak 安装包'), <Download size={14} />],
            ].map(([label, color, cmd, icon]) => (
              <div key={label} className='flex items-center gap-4 p-4 rounded-xl' style={{ border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-bg-0)' }}>
                <Tag color={color} size='large' className='w-20 justify-center font-bold'>{label}</Tag>
                <code className='text-[13px] font-mono flex-1 text-gray-500'>{cmd}</code>
                <Button theme='borderless' size='small' icon={icon} onClick={() => window.open('https://github.com/farion1231/cc-switch/releases', '_blank')} />
              </div>
            ))}
          </div>
        </TabPane>
      </Tabs>
    </div>

    {/* Steps */}
    <div className='mt-8 p-6 rounded-2xl' style={{ background: 'var(--semi-color-fill-0)' }}>
      <Text strong className='text-md mb-4 block'>{t('在本站使用 CC Switch')}</Text>
      <div className='space-y-2'>
        <StepItem number={1}><Text>{t('安装并启动 CC Switch 桌面应用')}</Text></StepItem>
        <StepItem number={2}>
          <Text>{t('前往本站的')} <Link to='/console/token' className='text-[var(--semi-color-primary)] font-bold hover:underline'>{t('令牌管理')}</Link> {t('页面，创建或选择一个已有令牌')}</Text>
        </StepItem>
        <StepItem number={3}>
          <Text>{t('点击令牌操作栏中的')} <Tag size='small' color='violet' className='font-bold px-2 py-0.5'>CC Switch</Tag> {t('按钮')}</Text>
        </StepItem>
        <StepItem number={4}>
          <Text>{t('在弹出的对话框中选择目标应用（Claude / Codex / Gemini）和模型，然后点击「打开 CC Switch」')}</Text>
        </StepItem>
        <StepItem number={5}>
          <Text>{t('CC Switch 桌面应用将自动打开并导入该供应商配置，导入后在 CC Switch 中点击「启用」即可生效')}</Text>
        </StepItem>
      </div>
    </div>

    <NoteList
      items={[
        t('Claude Code 支持热切换，切换后无需重启终端即刻生效'),
        t('其他工具（Codex、Gemini CLI 等）切换后需要重启终端或重新启动 CLI 工具'),
        t('如需恢复官方登录，可在 CC Switch 中添加一个「Official Login」预设，切换到该预设后重新执行 CLI 工具的 OAuth 登录流程'),
      ]}
    />

    {/* Advanced */}
    <Collapse className='!rounded-lg !border-0' style={{ background: 'var(--semi-color-fill-0)' }}>
      <Collapse.Panel
        header={<span className='flex items-center gap-2 text-xs font-medium'><BookOpen size={13} /> {t('工作原理')}</span>}
        itemKey='how-it-works'
      >
        <Paragraph className='text-sm mb-3' style={{ color: 'var(--semi-color-text-2)' }}>
          {t('点击 CC Switch 按钮后，系统会生成一个 ccswitch:// 协议的深度链接（Deep Link），包含以下配置信息：')}
        </Paragraph>
        <CodeBlock label='Deep Link'>
          {`ccswitch://v1/import?resource=provider\n  &app=claude          # ${t('目标应用：claude / codex / gemini')}\n  &name=My Claude      # ${t('供应商显示名称')}\n  &endpoint=${serverAddress}\n  &apiKey=sk-xxx\n  &model=claude-sonnet-4-20250514\n  &homepage=${serverAddress}\n  &enabled=true`}
        </CodeBlock>
      </Collapse.Panel>
      <Collapse.Panel
        header={<span className='flex items-center gap-2 text-xs font-medium'><MonitorSmartphone size={13} /> {t('更多功能')}</span>}
        itemKey='more-features'
      >
        <div className='space-y-1.5 text-sm' style={{ color: 'var(--semi-color-text-2)' }}>
          {[
            [t('MCP 服务器管理'), t('跨 4 个应用统一管理 MCP 服务器，支持双向同步和模板导入')],
            [t('Prompt 预设'), t('使用 Markdown 编辑器创建预设，激活后自动同步到 CLAUDE.md / AGENTS.md / GEMINI.md')],
            [t('用量监控'), t('追踪各工具的花费、请求次数和 Token 用量，支持趋势图表')],
            [t('本地代理与故障转移'), t('内置本地代理支持格式转换、自动故障转移、熔断器和健康监测')],
            [t('会话管理'), t('浏览、搜索和恢复所有工具的对话历史记录')],
            [t('云同步'), t('支持通过 Dropbox、OneDrive、iCloud 或 WebDAV 同步配置数据')],
          ].map(([title, desc]) => (
            <div key={title} className='flex items-start gap-2'>
              <ChevronRight size={14} className='mt-0.5 flex-shrink-0' style={{ color: 'var(--semi-color-text-3)' }} />
              <span><Text strong>{title}</Text> — {desc}</span>
            </div>
          ))}
        </div>
      </Collapse.Panel>
    </Collapse>
  </div>
);

const ClaudeCodeSection = ({ t, serverAddress }) => (
  <div className='space-y-6'>
    <SectionHeading>
      <div className='w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg'>
        <IconTerminal size='large' />
      </div>
      Claude Code
      <Tag size='small' className='font-bold' style={{ background: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }}>Anthropic</Tag>
    </SectionHeading>

    <Paragraph className='text-[14px] leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
      {t('Claude Code 是 Anthropic 官方推出的命令行 AI 编程助手。通过配置环境变量将 API 请求转发到本站来使用。')}
    </Paragraph>

    <div className='rounded-xl overflow-hidden' style={{ border: '1px solid var(--semi-color-border)' }}>
      <div className='bg-[var(--semi-color-fill-0)] px-4 py-2 border-b text-[11px] font-bold uppercase tracking-wider' style={{ borderColor: 'var(--semi-color-border)', color: 'var(--semi-color-text-3)' }}>
        Environment Variables
      </div>
      <div className='p-2 bg-[var(--semi-color-bg-0)]'>
        <EnvVarRow name='ANTHROPIC_BASE_URL' value={serverAddress} description={t('API 转发地址，不需要 /v1 后缀')} />
        <EnvVarRow name='ANTHROPIC_API_KEY' value='sk-xxx' description={t('在本站令牌页面创建的 API 密钥')} />
      </div>
    </div>

    <ShellConfigTabs
      t={t}
      commentPrefix='Claude Code API Gateway'
      envVars={[
        { key: 'ANTHROPIC_BASE_URL', val: serverAddress },
        { key: 'ANTHROPIC_API_KEY', val: 'sk-your-key-here' },
      ]}
    />

    <div className='flex items-start gap-4 p-5 rounded-xl border border-dashed' style={{ borderColor: 'var(--semi-color-border)' }}>
      <div className='mt-1 text-emerald-500'><CheckCircle2 size={18} /></div>
      <div>
        <Text strong className='text-sm block mb-1'>{t('验证配置')}</Text>
        <Paragraph className='text-xs m-0 mb-3' style={{ color: 'var(--semi-color-text-2)' }}>
          {t('重新打开终端后运行以下命令启动：')}
        </Paragraph>
        <code className='px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm border'>claude</code>
      </div>
    </div>

    <NoteList
      items={[
        <span key='1'><code className='text-xs font-mono font-bold text-[var(--semi-color-primary)]'>ANTHROPIC_BASE_URL</code> {t('不需要添加 /v1 后缀，直接使用站点地址即可')}</span>,
        t('确保令牌有访问 Claude 系列模型的权限（如 claude-sonnet-4-20250514 等）'),
        t('支持所有 Claude Code 功能，包括对话、代码编辑、文件操作等'),
      ]}
    />
  </div>
);

const CodexSection = ({ t, serverAddress }) => (
  <div className='space-y-6'>
    <SectionHeading>
      <div className='w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg'>
        <Terminal size={20} />
      </div>
      Codex CLI
      <Tag size='small' className='font-bold' style={{ background: 'var(--semi-color-fill-1)', color: 'var(--semi-color-text-2)' }}>OpenAI</Tag>
    </SectionHeading>

    <Paragraph className='text-[14px] leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
      {t('Codex CLI 是 OpenAI 官方推出的命令行 AI 编程工具。通过配置环境变量将 API 请求转发到本站来使用。')}
    </Paragraph>

    <Banner
      type='warning'
      className='!rounded-xl shadow-sm border-none'
      icon={<IconAlertTriangle className='text-amber-500' />}
      closeIcon={null}
      description={
        <span className='text-[13px] leading-relaxed font-medium'>
          {t('Codex CLI 使用 OpenAI 兼容接口，Base URL 必须包含')}
          <code className='text-xs font-bold font-mono mx-1.5 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'>/v1</code>
          {t('后缀，这与 Claude Code 不同。')}
        </span>
      }
    />

    <div className='rounded-xl overflow-hidden' style={{ border: '1px solid var(--semi-color-border)' }}>
      <div className='bg-[var(--semi-color-fill-0)] px-4 py-2 border-b text-[11px] font-bold uppercase tracking-wider' style={{ borderColor: 'var(--semi-color-border)', color: 'var(--semi-color-text-3)' }}>
        Environment Variables
      </div>
      <div className='p-2 bg-[var(--semi-color-bg-0)]'>
        <EnvVarRow name='OPENAI_BASE_URL' value={`${serverAddress}/v1`} description={t('API 转发地址，注意必须加 /v1 后缀')} />
        <EnvVarRow name='OPENAI_API_KEY' value='sk-xxx' description={t('在本站令牌页面创建的 API 密钥')} />
      </div>
    </div>

    <ShellConfigTabs
      t={t}
      commentPrefix='Codex CLI API Gateway'
      envVars={[
        { key: 'OPENAI_BASE_URL', val: `${serverAddress}/v1` },
        { key: 'OPENAI_API_KEY', val: 'sk-your-key-here' },
      ]}
    />

    <div className='flex items-start gap-4 p-5 rounded-xl border border-dashed' style={{ borderColor: 'var(--semi-color-border)' }}>
      <div className='mt-1 text-emerald-500'><CheckCircle2 size={18} /></div>
      <div>
        <Text strong className='text-sm block mb-1'>{t('验证配置')}</Text>
        <Paragraph className='text-xs m-0 mb-3' style={{ color: 'var(--semi-color-text-2)' }}>
          {t('重新打开终端后运行以下命令启动：')}
        </Paragraph>
        <code className='px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-sm border'>codex</code>
      </div>
    </div>

    <NoteList
      items={[
        t('确保令牌有访问 OpenAI 系列模型的权限（如 o3-mini、codex-mini 等）'),
        t('同样适用于其他使用 OpenAI 兼容接口的工具（如 Cursor、Continue 等）'),
      ]}
    />
  </div>
);

const OtherToolsSection = ({ t, serverAddress }) => (
  <div className='space-y-6'>
    <SectionHeading>
      <div className='w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg'>
        <Globe size={20} />
      </div>
      {t('其他 OpenAI 兼容工具')}
    </SectionHeading>

    <Paragraph className='text-[14px] leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
      {t('本站完全兼容 OpenAI API 格式，因此任何支持自定义 Base URL 的工具都可以接入。')}
    </Paragraph>

    <Collapse accordion className='!rounded-xl !border-0 overflow-hidden' style={{ background: 'var(--semi-color-fill-0)' }}>
      <Collapse.Panel header={<span className='text-sm font-bold flex items-center gap-2'><MonitorSmartphone size={16} /> Cursor / Windsurf / VS Code AI</span>} itemKey='cursor'>
        <div className='rounded-xl p-4 bg-[var(--semi-color-bg-0)] border' style={{ borderColor: 'var(--semi-color-border)' }}>
          <EnvVarRow name='Base URL' value={`${serverAddress}/v1`} description={t('API 地址，需包含 /v1')} />
          <EnvVarRow name='API Key' value='sk-xxx' description={t('本站创建的令牌密钥')} />
        </div>
      </Collapse.Panel>
      <Collapse.Panel header={<span className='text-sm font-bold flex items-center gap-2'><IconTerminal size='small' /> Python (openai SDK)</span>} itemKey='python'>
        <CodeBlock label='Python'>
          {`from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${serverAddress}/v1",\n    api_key="sk-your-key-here",\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[{"role": "user", "content": "Hello!"}],\n)\nprint(response.choices[0].message.content)`}
        </CodeBlock>
      </Collapse.Panel>
      <Collapse.Panel header={<span className='text-sm font-bold flex items-center gap-2'><IconTerminal size='small' /> Node.js (openai SDK)</span>} itemKey='nodejs'>
        <CodeBlock label='JavaScript'>
          {`import OpenAI from 'openai';\n\nconst client = new OpenAI({\n  baseURL: '${serverAddress}/v1',\n  apiKey: 'sk-your-key-here',\n});\n\nconst response = await client.chat.completions.create({\n  model: 'gpt-4o',\n  messages: [{ role: 'user', content: 'Hello!' }],\n});\nconsole.log(response.choices[0].message.content);`}
        </CodeBlock>
      </Collapse.Panel>
      <Collapse.Panel header={<span className='text-sm font-bold flex items-center gap-2'><IconTerminal size='small' /> cURL</span>} itemKey='curl'>
        <CodeBlock label='Shell'>
          {`curl ${serverAddress}/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer sk-your-key-here" \\\n  -d '{\n    "model": "gpt-4o",\n    "messages": [\n      {"role": "user", "content": "Hello!"}\n    ]\n  }'`}
        </CodeBlock>
      </Collapse.Panel>
    </Collapse>
  </div>
);

const FAQSection = ({ t }) => (
  <div className='space-y-6'>
    <SectionHeading>
      <div className='w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-lg'>
        <HelpCircle size={20} />
      </div>
      {t('常见问题')}
    </SectionHeading>
    <Collapse accordion className='!rounded-xl !border-0 overflow-hidden' style={{ background: 'var(--semi-color-fill-0)' }}>
      {[
        [t('Claude Code 和 Codex CLI 的 Base URL 有什么区别？'), t('Claude Code 使用 Anthropic 原生接口，Base URL 直接使用站点地址即可（不加 /v1）。Codex CLI 使用 OpenAI 兼容接口，Base URL 必须添加 /v1 后缀。这是因为两者使用不同的 API 协议规范。')],
        [t('配置后提示认证失败怎么办？'), t('请检查以下几点：1) API 密钥是否正确复制（以 sk- 开头）；2) 令牌是否已过期或被禁用；3) 令牌是否有访问对应模型的权限；4) 环境变量是否正确生效（可用 echo $ANTHROPIC_BASE_URL 验证）。')],
        [t('可以同时配置 Claude Code 和 Codex CLI 吗？'), t('可以。两者使用不同的环境变量（ANTHROPIC_* 和 OPENAI_*），互不冲突。你可以在同一个终端中同时配置两组环境变量。')],
        [t('CC Switch 必须安装吗？可以手动配置吗？'), t('CC Switch 是可选的便捷工具，不是必须 de。你完全可以按照上方的手动配置方式设置环境变量，效果是一样的。CC Switch 只是简化了这个过程。')],
        [t('Windows 下设置环境变量后不生效怎么办？'), t('Windows 下使用 setx 或 PowerShell 的 [System.Environment] 设置的环境变量不会在当前终端窗口中立即生效。你需要关闭当前终端并重新打开一个新的终端窗口，新窗口中环境变量才会生效。或者你可以直接使用 CC Switch 来避免手动配置环境变量。')],
      ].map(([q, a], i) => (
        <Collapse.Panel key={i} header={<span className='text-[14px] font-bold py-1'>{q}</span>} itemKey={`faq-${i}`}>
          <div className='pb-2'>
            <Paragraph className='text-[13px] leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>{a}</Paragraph>
          </div>
        </Collapse.Panel>
      ))}
    </Collapse>
  </div>
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { id: 'quick-start', iconName: 'zap', labelKey: '快速开始' },
  { id: 'cc-switch', iconName: 'mouse', labelKey: 'CC Switch', recommended: true },
  { id: 'claude-code', iconName: 'terminal-semi', labelKey: 'Claude Code' },
  { id: 'codex-cli', iconName: 'terminal', labelKey: 'Codex CLI' },
  { id: 'other-tools', iconName: 'globe', labelKey: '其他兼容工具' },
  { id: 'faq', iconName: 'help', labelKey: '常见问题' },
];

const NAV_ICONS = {
  'zap': (active) => <Zap size={15} className={active ? 'text-amber-500' : ''} />,
  'terminal-semi': (active) => <IconTerminal size='small' className={active ? 'text-slate-900 dark:text-white' : ''} />,
  'terminal': (active) => <Terminal size={15} className={active ? 'text-emerald-500' : ''} />,
  'mouse': (active) => <MousePointerClick size={15} className={active ? 'text-indigo-500' : ''} />,
  'globe': (active) => <Globe size={15} className={active ? 'text-blue-500' : ''} />,
  'help': (active) => <HelpCircle size={15} className={active ? 'text-purple-500' : ''} />,
};

const SideNav = ({ activeId, onNavigate, t }) => (
  <nav className='space-y-1 pr-4'>
    {NAV_ITEMS.map((item) => {
      const isActive = activeId === item.id;
      const iconActive = isActive;
      const IconComp = NAV_ICONS[item.iconName];
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className='w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-left border-0 cursor-pointer transition-all duration-200 rounded-xl group relative overflow-hidden'
          style={{
            background: isActive ? 'var(--semi-color-fill-0)' : 'transparent',
            color: isActive ? 'var(--semi-color-text-0)' : 'var(--semi-color-text-2)',
            fontWeight: isActive ? 700 : 500,
          }}
        >
          <span className={`flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'opacity-60 group-hover:opacity-100'}`}>
            {IconComp && IconComp(iconActive)}
          </span>
          <span className='truncate flex-1'>
            {['Claude Code', 'Codex CLI', 'CC Switch'].includes(item.labelKey) ? item.labelKey : t(item.labelKey)}
          </span>
          {item.recommended && (
            <span className='absolute top-0 right-0'>
               <div className='bg-violet-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-sm tracking-tighter'>
                 {t('推荐')}
               </div>
            </span>
          )}
          {isActive && (
            <div className='w-1.5 h-1.5 rounded-full bg-[var(--semi-color-primary)] shadow-[0_0_8px_var(--semi-color-primary)]' />
          )}
        </button>
      );
    })}
  </nav>
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const GatewayDocs = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState('quick-start');
  const isScrollingRef = useRef(false);
  const sidebarPlaceholderRef = useRef(null);
  const [sidebarLeft, setSidebarLeft] = useState(0);

  const serverAddress = useMemo(() => {
    return statusState?.status?.server_address || window.location.origin;
  }, [statusState?.status?.server_address]);

  const getScrollContainer = useCallback(() => {
    return document.querySelector('.app-layout > .semi-layout') || null;
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const updateLeft = () => {
      if (sidebarPlaceholderRef.current) {
        setSidebarLeft(sidebarPlaceholderRef.current.getBoundingClientRect().left);
      }
    };
    updateLeft();
    window.addEventListener('resize', updateLeft);
    const sc = getScrollContainer();
    if (sc) sc.addEventListener('scroll', updateLeft, { passive: true });
    return () => {
      window.removeEventListener('resize', updateLeft);
      if (sc) sc.removeEventListener('scroll', updateLeft);
    };
  }, [isMobile, getScrollContainer]);

  useEffect(() => {
    const ids = NAV_ITEMS.map((item) => item.id);
    const handleIntersect = (entries) => {
      if (isScrollingRef.current) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
          break;
        }
      }
    };
    const scrollRoot = getScrollContainer();
    const observer = new IntersectionObserver(handleIntersect, {
      root: scrollRoot,
      rootMargin: '-10% 0px -70% 0px', // More aggressive for smoother tracking
      threshold: 0,
    });
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [getScrollContainer]);

  const handleNavigate = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    isScrollingRef.current = true;
    const scrollContainer = getScrollContainer();
    const headerOffset = 90;
    if (scrollContainer) {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const top = scrollContainer.scrollTop + (elTop - containerTop) - headerOffset;
      scrollContainer.scrollTo({ top, behavior: 'smooth' });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  }, [getScrollContainer]);

  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-8 py-12 md:py-20'>
      <div className='flex gap-12 items-start'>
        {/* Sidebar */}
        {!isMobile && (
          <div className='w-56 flex-shrink-0' ref={sidebarPlaceholderRef}>
            <div
              style={{
                position: 'fixed',
                top: 100,
                left: sidebarLeft,
                width: 224,
              }}
            >
               <div className='mb-6 px-3'>
                 <Text className='text-[11px] font-bold uppercase tracking-widest opacity-40'>{t('文档目录')}</Text>
               </div>
              <SideNav activeId={activeId} onNavigate={handleNavigate} t={t} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className='flex-1 min-w-0'>
          {/* Page header */}
          <div className='mb-16'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--semi-color-primary-light-default)] text-[var(--semi-color-primary)] text-[11px] font-bold mb-4 uppercase tracking-wider'>
              <BookOpen size={12} />
              {t('Documentation')}
            </div>
            <h1
              className='text-3xl md:text-4xl font-black m-0 mb-3 tracking-tight'
              style={{ color: 'var(--semi-color-text-0)' }}
            >
              {t('Gateway 使用文档')}
            </h1>
            <p className='text-[15px] md:text-[16px] m-0 max-w-2xl leading-relaxed' style={{ color: 'var(--semi-color-text-2)' }}>
              {t('本页介绍如何将本站的 API 转发服务配置到 Claude Code、Codex CLI 等 AI 开发工具中，同时支持通过 CC Switch 一键导入配置。')}
            </p>
          </div>

          {/* Sections */}
          <div className='space-y-24'>
            <div id='quick-start' className='scroll-mt-24'>
              <QuickStartSection t={t} serverAddress={serverAddress} />
            </div>
            <div id='cc-switch' className='scroll-mt-24'>
              <CCSwitchSection t={t} serverAddress={serverAddress} />
            </div>
            <div id='claude-code' className='scroll-mt-24'>
              <ClaudeCodeSection t={t} serverAddress={serverAddress} />
            </div>
            <div id='codex-cli' className='scroll-mt-24'>
              <CodexSection t={t} serverAddress={serverAddress} />
            </div>
            <div id='other-tools' className='scroll-mt-24'>
              <OtherToolsSection t={t} serverAddress={serverAddress} />
            </div>
            <div id='faq' className='scroll-mt-24 pb-20'>
              <FAQSection t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayDocs;
