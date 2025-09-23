import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Grid,
  Typography,
  TextInput,
  Toggle,
  Alert,
  Flex,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils/getTranslation';
import api from '../../utils/api';

interface TranslatorConfig {
  enabled: boolean;
  appId?: string;
  appKey?: string;
  secretId?: string;
  secretKey?: string;
  apiKey?: string;
  region?: string;
  projectId?: string;
}

interface Props {
  title: string;
  engineKey: string;
  config: TranslatorConfig;
  onUpdate: (config: TranslatorConfig) => void;
  fields: string[];
}

export const TranslationEngineConfig: React.FC<Props> = ({
  title,
  engineKey,
  config,
  onUpdate,
  fields,
}) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    onUpdate({
      ...config,
      [field]: value,
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await api.post('/test-translator', {
        translator: engineKey,
        config,
      });
      setTestResult(response.data);

      if (response.data.success) {
        toggleNotification({
          type: 'success',
          message: formatMessage({ id: getTranslation('translator.test.success') }),
        });
      } else {
        toggleNotification({
          type: 'warning',
          message: response.data.message,
        });
      }
    } catch (error) {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: getTranslation('translator.test.error') }),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getFieldLabel = (field: string) => {
    return formatMessage({ id: getTranslation(`translator.field.${field}`) });
  };

  return (
    <Box padding={4} background="neutral0">
      <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Typography variant="beta">{title}</Typography>

        <Flex gap={2} alignItems="center">
          <Toggle
            onLabel={formatMessage({ id: getTranslation('translator.enabled') })}
            offLabel={formatMessage({ id: getTranslation('translator.disable') })}
            checked={config.enabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onUpdate({ ...config, enabled: e.target.checked })
            }
          />
        </Flex>
      </Flex>

      {config.enabled && (
        <>
          <Grid.Root gap={3}>
            {fields.map((field) => (
              <Grid.Item col={3} gap={3}>
                <Typography variant="pi" textColor="neutral600">
                  {getFieldLabel(field)}
                </Typography>
                <Box flex={{ initial: '1 1 auto', medium: '1', large: '1 1 0' }}>
                  <TextInput
                    key={field}
                    label={getFieldLabel(field)}
                    type={
                      field.toLowerCase().includes('key') || field.toLowerCase().includes('secret')
                        ? 'text'
                        : 'text'
                    }
                    value={config[field as keyof TranslatorConfig] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleFieldChange(field, e.target.value)
                    }
                  />
                </Box>
              </Grid.Item>
            ))}
          </Grid.Root>

          {fields.length === 0 && (
            <Alert variant="default" marginTop={3}>
              {formatMessage({ id: getTranslation('translator.google.noConfig') })}
            </Alert>
          )}

          <Flex gap={2} marginTop={3}>
            <Button onClick={handleTest} loading={isTesting} variant="secondary" size="S">
              {formatMessage({ id: getTranslation('translator.test.button') })}
            </Button>
          </Flex>

          {testResult && (
            <Alert variant={testResult.success ? 'success' : 'danger'} marginTop={3}>
              {testResult.message}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};
