import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextInput,
  Toggle,
  SingleSelect,
  SingleSelectOption,
  Alert,
  Flex,
  IconButton,
  Badge,
  ProgressBar,
  Field
} from '@strapi/design-system';
import { Check, ArrowClockwise } from '@strapi/icons';
import { useNotification } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils/getTranslation';
import { TranslationEngineConfig } from '../../components/Settings/TranslationEngineConfig';
import api from '../../utils/api';

type TranslatorConfig = {
  enabled: boolean;
  appId?: string;
  appKey?: string;
  secretId?: string;
  secretKey?: string;
  apiKey?: string;
  region?: string;
  projectId?: string;
  priority?: number;
  monthlyCharLimit?: number;
};

type UsageStats = {
  currentMonth: string;
  charsUsed: number;
  lastResetDate: string;
  limit: number;
  available: number;
};

interface Settings {
  mode: 'translation' | 'pinyin';
  translators: {
    baidu?: TranslatorConfig;
    tencent?: TranslatorConfig;
    alibaba?: TranslatorConfig;
    deepl?: TranslatorConfig;
    volcano?: TranslatorConfig;
    google?: TranslatorConfig;
  };
  defaultTargetLanguage: string;
  autoSwitchOnFailure: boolean;
  alwaysAppendLocaleSuffix: boolean;
  usageMode: 'priority' | 'balanced';
  usageStats?: {
    baidu?: UsageStats;
    tencent?: UsageStats;
    alibaba?: UsageStats;
    deepl?: UsageStats;
    volcano?: UsageStats;
    google?: UsageStats;
  };
}

const SettingsPage: React.FC = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const [settings, setSettings] = useState<Settings>({
    mode: 'translation',
    translators: {},
    defaultTargetLanguage: 'en',
    autoSwitchOnFailure: true,
    alwaysAppendLocaleSuffix: true,
    usageMode: 'priority',
    usageStats: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'translators' | 'usage'>('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response);
    } catch {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: getTranslation('settings.fetch.error') }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log(settings)
      await api.put('/settings', settings);
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTranslation('settings.save.success') }),
      });
      await fetchSettings();
    } catch {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: getTranslation('settings.save.error') }),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranslatorUpdate = (
    translator: keyof Settings['translators'],
    config: TranslatorConfig
  ) => {
    setSettings((prev) => ({
      ...prev,
      translators: { ...prev.translators, [translator]: config },
    }));
  };

  const handleResetUsage = async (translatorName: string) => {
    try {
      await api.post(`/reset-usage/${translatorName}`);
      toggleNotification({
        type: 'success',
        message: formatMessage({ id: getTranslation('usage.reset.success') }),
      });
      await fetchSettings();
    } catch {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: getTranslation('usage.reset.error') }),
      });
    }
  };

  const formatNumber = (num: number): string => {
    return num === Infinity ? '∞' : num.toLocaleString();
  };

  const getUsagePercentage = (stats?: UsageStats): number => {
    if (!stats || stats.limit === 0) return 0;
    return Math.min(100, (stats.charsUsed / stats.limit) * 100);
  };

  const getUsageColor = (percentage: number): 'success' | 'warning' | 'danger' => {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'danger';
  };

  if (isLoading) {
    return (
      <Box padding={8}>
        <Typography>{formatMessage({ id: getTranslation('settings.loading') })}</Typography>
      </Box>
    );
  }

  return (
    <Box padding={8}>
      <Typography variant="alpha" marginBottom={6}>
        {formatMessage({ id: getTranslation('settings.title') })}
      </Typography>

      <Flex gap={2} marginBottom={4} marginTop={3}>
        <Button
          variant={activeTab === 'general' ? 'primary' : 'tertiary'}
          onClick={() => setActiveTab('general')}
        >
          {formatMessage({ id: getTranslation('settings.tabs.general') })}
        </Button>
        <Button
          variant={activeTab === 'translators' ? 'primary' : 'tertiary'}
          onClick={() => setActiveTab('translators')}
        >
          {formatMessage({ id: getTranslation('settings.tabs.translators') })}
        </Button>
        <Button
          variant={activeTab === 'usage' ? 'primary' : 'tertiary'}
          onClick={() => setActiveTab('usage')}
        >
          {formatMessage({ id: getTranslation('settings.tabs.usage') })}
        </Button>
      </Flex>

      {activeTab === 'general' && (
        <Box background="neutral0" borderColor="neutral200" hasRadius padding={4}>
          <Grid.Root gap={4}>
            <Grid.Item col={12}>
              <Field.Root>
                <Field.Label>
                  {formatMessage({ id: getTranslation('settings.mode.label') })}
                </Field.Label>
                <SingleSelect
                  value={settings.mode}
                  onChange={(value: string) =>
                    setSettings((prev) => ({ ...prev, mode: value as 'translation' | 'pinyin' }))
                  }
                >
                  <SingleSelectOption value="translation">
                    {formatMessage({ id: getTranslation('settings.mode.translation') })}
                  </SingleSelectOption>
                  <SingleSelectOption value="pinyin">
                    {formatMessage({ id: getTranslation('settings.mode.pinyin') })}
                  </SingleSelectOption>
                </SingleSelect>
              </Field.Root>
            </Grid.Item>

            <Grid.Item col={12}>
              <Field.Root
                hint={formatMessage({ id: getTranslation('settings.usageMode.hint') })}
              >
                <Field.Label>
                  {formatMessage({ id: getTranslation('settings.usageMode.label') })}
                </Field.Label>
                <SingleSelect
                  value={settings.usageMode}
                  onChange={(value: string) =>
                    setSettings((prev) => ({ ...prev, usageMode: value as 'priority' | 'balanced' }))
                  }
                >
                  <SingleSelectOption value="priority">
                    {formatMessage({ id: getTranslation('settings.usageMode.priority') })}
                  </SingleSelectOption>
                  <SingleSelectOption value="balanced">
                    {formatMessage({ id: getTranslation('settings.usageMode.balanced') })}
                  </SingleSelectOption>
                </SingleSelect>
                <Field.Hint />
              </Field.Root>
            </Grid.Item>

            <Grid.Item col={12}>
              <Field.Root
                hint={formatMessage({ id: getTranslation('settings.targetLanguage.hint') })}
              >
                <Field.Label>
                  {formatMessage({ id: getTranslation('settings.targetLanguage.label') })}
                </Field.Label>
                <TextInput
                  value={settings.defaultTargetLanguage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings((prev) => ({ ...prev, defaultTargetLanguage: e.target.value }))
                  }
                />
                <Field.Hint />
              </Field.Root>
            </Grid.Item>

            <Grid.Item col={12}>
              <Field.Root
                hint={formatMessage({ id: getTranslation('settings.autoSwitch.hint') })}
              >
                <Field.Label>
                  {formatMessage({ id: getTranslation('settings.autoSwitch.label') })}
                </Field.Label>
                <Toggle
                  onLabel={formatMessage({ id: getTranslation('settings.autoSwitch.enabled') })}
                  offLabel={formatMessage({ id: getTranslation('settings.autoSwitch.disabled') })}
                  checked={settings.autoSwitchOnFailure}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings((prev) => ({ ...prev, autoSwitchOnFailure: e.target.checked }))
                  }
                />
                <Field.Hint />
              </Field.Root>
            </Grid.Item>

            <Grid.Item col={12}>
              <Field.Root
                hint={formatMessage({ id: getTranslation('settings.suffix.hint') })}
              >
                <Field.Label>
                  {formatMessage({ id: getTranslation('settings.suffix.label') })}
                </Field.Label>
                <Toggle
                  onLabel={formatMessage({ id: getTranslation('settings.suffix.always') })}
                  offLabel={formatMessage({ id: getTranslation('settings.suffix.smart') })}
                  checked={settings.alwaysAppendLocaleSuffix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings((prev) => ({ ...prev, alwaysAppendLocaleSuffix: e.target.checked }))
                  }
                />
                <Field.Hint />
              </Field.Root>
            </Grid.Item>
          </Grid.Root>
        </Box>
      )}

      {activeTab === 'translators' && (
        <Box padding={4} background="neutral0" borderColor="neutral200" hasRadius>
          <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.google.title') })}
            engineKey="google"
            config={settings.translators.google ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('google', config)}
            fields={[]}
            showPriorityAndLimit
          />
          <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.alibaba.title') })}
            engineKey="alibaba"
            config={settings.translators.alibaba ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('alibaba', config)}
            fields={['appId', 'appKey']}
            showPriorityAndLimit
          />
          <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.tencent.title') })}
            engineKey="tencent"
            config={settings.translators.tencent ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('tencent', config)}
            fields={['secretId', 'secretKey', 'region', 'projectId']}
            showPriorityAndLimit
          />
          {/* <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.baidu.title') })}
            engineKey="baidu"
            config={settings.translators.baidu ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('baidu', config)}
            fields={['appId', 'appKey']}
            showPriorityAndLimit
          /> */}
          {/* <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.deepl.title') })}
            engineKey="deepl"
            config={settings.translators.deepl ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('deepl', config)}
            fields={['apiKey']}
            showPriorityAndLimit
          />
          <TranslationEngineConfig
            title={formatMessage({ id: getTranslation('translator.volcano.title') })}
            engineKey="volcano"
            config={settings.translators.volcano ?? { enabled: false }}
            onUpdate={(config) => handleTranslatorUpdate('volcano', config)}
            fields={['appId', 'appKey']}
            showPriorityAndLimit
          /> */}
        </Box>
      )}

      {activeTab === 'usage' && (
        <Box padding={4} background="neutral0" borderColor="neutral200" hasRadius>
          <Typography variant="beta" marginBottom={4}>
            {formatMessage({ id: getTranslation('usage.title') })} (
            {settings.usageStats?.alibaba?.currentMonth || new Date().toISOString().slice(0, 7)})
          </Typography>

          {Object.entries(settings.translators).map(([name, config]) => {
            if (!config?.enabled) return null;
            const stats = settings.usageStats?.[name as keyof typeof settings.usageStats];
            const percentage = getUsagePercentage(stats);


            return (
              <Box key={name} marginBottom={4} marginTop={4} padding={4} background="neutral100" borderColor="neutral150" hasRadius>
                <Flex justifyContent="space-between" alignItems="center" marginBottom={2}>
                  <Flex gap={2} alignItems="center">
                    <Typography variant="beta">
                      {formatMessage({ id: getTranslation(`translator.${name}.title`) })}
                    </Typography>
                    <Badge variant={getUsageColor(percentage)}>
                      {percentage.toFixed(1)}%
                    </Badge>
                  </Flex>
                  <IconButton aria-label={formatMessage({ id: getTranslation('usage.reset.button') })}
                    onClick={() => handleResetUsage(name)}>
                    <ArrowClockwise />
                  </IconButton>
                </Flex>

                <Box marginBottom={2}>
                  <ProgressBar value={percentage} />
                </Box>

                <Grid.Root gap={4}>
                  <Grid.Item col={4}>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({ id: getTranslation('usage.used') })}
                    </Typography>
                    <Typography variant="omega" fontWeight="bold">
                      {formatNumber(stats?.charsUsed || 0)}{' '}
                      {formatMessage({ id: getTranslation('usage.characters') })}
                    </Typography>
                  </Grid.Item>
                  <Grid.Item col={4}>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({ id: getTranslation('usage.remaining') })}
                    </Typography>
                    <Typography variant="omega" fontWeight="bold">
                      {formatNumber(stats?.available || 0)}{' '}
                      {formatMessage({ id: getTranslation('usage.characters') })}
                    </Typography>
                  </Grid.Item>
                  <Grid.Item col={4}>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({ id: getTranslation('usage.monthlyLimit') })}
                    </Typography>
                    <Typography variant="omega" fontWeight="bold">
                      {stats?.limit
                        ? `${formatNumber(stats.limit)} ${formatMessage({ id: getTranslation('usage.characters') })}`
                        : formatMessage({ id: getTranslation('usage.unlimited') })}
                    </Typography>
                  </Grid.Item>
                  <Grid.Item col={4}>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({ id: getTranslation('usage.priority') })}
                    </Typography>
                    <Typography variant="omega" fontWeight="bold">
                      {config.priority ?? 999}
                    </Typography>
                  </Grid.Item>
                  <Grid.Item col={8}>
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage({ id: getTranslation('usage.lastReset') })}
                    </Typography>
                    <Typography variant="omega">
                      {stats?.lastResetDate
                        ? new Date(stats.lastResetDate).toLocaleString()
                        : '-'}
                    </Typography>
                  </Grid.Item>
                </Grid.Root>

                {stats && stats.limit > 0 && percentage >= 90 && (
                  <Alert variant="danger" marginTop={3}>
                    {formatMessage(
                      { id: getTranslation('usage.warning') },
                      { percentage: percentage.toFixed(1) }
                    )}
                  </Alert>
                )}
              </Box>
            );
          })}

          {Object.values(settings.translators).every((config) => !config?.enabled) && (
            <Alert variant="default">
              {formatMessage({ id: getTranslation('usage.noTranslators') })}
            </Alert>
          )}
        </Box>
      )}

      <Flex justifyContent="flex-end" marginTop={6}>
        <Button loading={isSaving} startIcon={<Check />} onClick={handleSave}>
          {formatMessage({ id: getTranslation('settings.save.button') })}
        </Button>
      </Flex>
    </Box>
  );
};

export default SettingsPage;
