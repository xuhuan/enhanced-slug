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
    EmptyStateLayout,
} from '@strapi/design-system';
import { Check, Trash, Plus } from '@strapi/icons';
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
};

type FieldMapping = {
    contentType: string;
    sourceField: string;
    targetField: string;
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
    fieldMappings: FieldMapping[];
}

const SettingsPage: React.FC = () => {
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const [settings, setSettings] = useState<Settings>({
        mode: 'translation',
        translators: {},
        defaultTargetLanguage: 'en',
        autoSwitchOnFailure: true,
        fieldMappings: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'translators' | 'mappings'>('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
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
            await api.put('/settings', settings);
            toggleNotification({
                type: 'success',
                message: formatMessage({ id: getTranslation('settings.save.success') }),
            });
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
        config: TranslatorConfig,
    ) => {
        setSettings((prev) => ({
            ...prev,
            translators: { ...prev.translators, [translator]: config },
        }));
    };

    const handleFieldMappingAdd = () => {
        setSettings((prev) => ({
            ...prev,
            fieldMappings: [...prev.fieldMappings, { contentType: '', sourceField: '', targetField: '' }],
        }));
    };

    const handleFieldMappingRemove = (index: number) => {
        setSettings((prev) => {
            const newMappings = [...prev.fieldMappings];
            newMappings.splice(index, 1);
            return { ...prev, fieldMappings: newMappings };
        });
    };

    const handleFieldMappingChange = (index: number, field: keyof FieldMapping, value: string) => {
        setSettings((prev) => {
            const newMappings = [...prev.fieldMappings];
            newMappings[index] = { ...newMappings[index], [field]: value };
            return { ...prev, fieldMappings: newMappings };
        });
    };

    if (isLoading) {
        return (
            <Box padding={8}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box padding={8}>
            <Typography variant="alpha" marginBottom={6}>
                {formatMessage({ id: getTranslation('settings.title') })}
            </Typography>

            {/* 自定义 Tab 按钮 */}
            <Flex gap={2} marginBottom={4}>
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
                    variant={activeTab === 'mappings' ? 'primary' : 'tertiary'}
                    onClick={() => setActiveTab('mappings')}
                >
                    {formatMessage({ id: getTranslation('settings.tabs.mappings') })}
                </Button>
            </Flex>

            {/* General Settings */}
            {activeTab === 'general' && (
                <Box padding={4} background="neutral0" hasRadius shadow="tableShadow">
                    <Grid.Root gap={4}>
                        <SingleSelect
                            label={formatMessage({ id: getTranslation('settings.mode.label') })}
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

                        <TextInput
                            label={formatMessage({ id: getTranslation('settings.targetLanguage.label') })}
                            hint={formatMessage({ id: getTranslation('settings.targetLanguage.hint') })}
                            value={settings.defaultTargetLanguage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setSettings((prev) => ({ ...prev, defaultTargetLanguage: e.target.value }))
                            }
                        />

                        <Flex gap={2} alignItems="center">
                            <Typography>
                                {formatMessage({ id: getTranslation('settings.autoSwitch.label') })}
                            </Typography>
                            <Toggle
                                checked={settings.autoSwitchOnFailure}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setSettings((prev) => ({ ...prev, autoSwitchOnFailure: e.target.checked }))
                                }
                            />
                        </Flex>
                        <Typography variant="pi" textColor="neutral600">
                            {formatMessage({ id: getTranslation('settings.autoSwitch.hint') })}
                        </Typography>
                    </Grid.Root>
                </Box>
            )}

            {/* Translators */}
            {activeTab === 'translators' && (
                <Box padding={4} background="neutral0" hasRadius shadow="tableShadow">
                    <Grid.Root gap={6}>
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.baidu.title') })}
                            engineKey="baidu"
                            config={settings.translators.baidu ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('baidu', config)}
                            fields={['appId', 'appKey']}
                        />
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.tencent.title') })}
                            engineKey="tencent"
                            config={settings.translators.tencent ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('tencent', config)}
                            fields={['secretId', 'secretKey', 'region', 'projectId']}
                        />
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.alibaba.title') })}
                            engineKey="alibaba"
                            config={settings.translators.alibaba ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('alibaba', config)}
                            fields={['appId', 'appKey']}
                        />
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.deepl.title') })}
                            engineKey="deepl"
                            config={settings.translators.deepl ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('deepl', config)}
                            fields={['apiKey']}
                        />
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.volcano.title') })}
                            engineKey="volcano"
                            config={settings.translators.volcano ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('volcano', config)}
                            fields={['appId', 'appKey']}
                        />
                        <TranslationEngineConfig
                            title={formatMessage({ id: getTranslation('translator.google.title') })}
                            engineKey="google"
                            config={settings.translators.google ?? { enabled: false }}
                            onUpdate={(config) => handleTranslatorUpdate('google', config)}
                            fields={[]}
                        />
                    </Grid.Root>
                </Box>
            )}

            {/* Field mappings */}
            {activeTab === 'mappings' && (
                <Box padding={4} background="neutral0" hasRadius shadow="tableShadow">
                    <Flex justifyContent="space-between" marginBottom={4}>
                        <Typography variant="beta">
                            {formatMessage({ id: getTranslation('settings.mappings.title') })}
                        </Typography>
                        <Button startIcon={<Plus />} variant="secondary" onClick={handleFieldMappingAdd}>
                            {formatMessage({ id: getTranslation('settings.mappings.add') })}
                        </Button>
                    </Flex>

                    {settings.fieldMappings.length > 0 ? (
                        <Grid.Root gap={4}>
                            {settings.fieldMappings.map((mapping, index) => (

                                <Flex key={index} gap={2} alignItems="flex-end">
                                    <Grid.Item col={4}> <TextInput
                                        label={formatMessage({ id: getTranslation('settings.mappings.contentType') })}
                                        value={mapping.contentType}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleFieldMappingChange(index, 'contentType', e.target.value)
                                        }
                                    /></Grid.Item>
                                    <Grid.Item col={4}>  <TextInput
                                        label={formatMessage({ id: getTranslation('settings.mappings.sourceField') })}
                                        value={mapping.sourceField}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleFieldMappingChange(index, 'sourceField', e.target.value)
                                        }
                                    /></Grid.Item>
                                    <Grid.Item col={4}>  <TextInput
                                        label={formatMessage({ id: getTranslation('settings.mappings.targetField') })}
                                        value={mapping.targetField}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            handleFieldMappingChange(index, 'targetField', e.target.value)
                                        }
                                    /></Grid.Item>
                                    <Grid.Item col={4}>  <IconButton
                                        label="Delete"
                                        icon={<Trash />}
                                        variant="danger-light"
                                        onClick={() => handleFieldMappingRemove(index)}
                                    /></Grid.Item>
                                </Flex>
                            ))}
                        </Grid.Root>
                    ) : (
                        <EmptyStateLayout
                            content={formatMessage({ id: getTranslation('settings.mappings.empty') })}
                        />
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
