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
  NumberInput,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils/getTranslation';
import api from '../../utils/api';
import { Field } from '@strapi/design-system';

interface TranslatorConfig {
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
}

interface Props {
  title: string;
  engineKey: string;
  config: TranslatorConfig;
  onUpdate: (config: TranslatorConfig) => void;
  fields: string[];
  showPriorityAndLimit?: boolean;
}

export const TranslationEngineConfig: React.FC<Props> = ({
  title,
  engineKey,
  config,
  onUpdate,
  fields,
  showPriorityAndLimit = false,
}) => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFieldChange = (field: string, value: string | number) => {
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
    <Box padding={4} background="neutral100" borderColor="neutral150" marginBottom={4} hasRadius>
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
          <Grid.Root gap={4} marginBottom={4}>
            {fields.map((field) => (
              <Grid.Item key={field} col={6}>
                <Field.Root style={{ width: '100%' }}>
                  <Field.Label>
                    {getFieldLabel(field)}
                  </Field.Label>
                  <TextInput
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
                  <Field.Hint />
                </Field.Root>
              </Grid.Item>
            ))}
          </Grid.Root>

          {showPriorityAndLimit && (
            <Grid.Root gap={4} marginBottom={4}>
              <Grid.Item col={6}>
                <Field.Root
                  style={{ width: '100%' }}
                  hint={formatMessage({ id: getTranslation('translator.priority.hint') })}
                >
                  <Field.Label>
                    {formatMessage({ id: getTranslation('translator.field.priority') })}
                  </Field.Label>
                  <NumberInput
                    value={config.priority ?? 999}
                    onValueChange={(value: number) => handleFieldChange('priority', value)}
                    min={1}
                    max={999}
                  />
                  <Field.Hint />
                </Field.Root>
              </Grid.Item>
              <Grid.Item col={6}>
                <Field.Root
                  style={{ width: '100%' }}
                  hint={formatMessage({ id: getTranslation('translator.limit.hint') })}
                >
                  <Field.Label>
                    {formatMessage({ id: getTranslation('translator.field.monthlyCharLimit') })}
                  </Field.Label>
                  <NumberInput
                    value={config.monthlyCharLimit ?? 0}
                    onValueChange={(value: number) => handleFieldChange('monthlyCharLimit', value)}
                    min={0}
                    step={1000}
                  />
                  <Field.Hint />
                </Field.Root>
              </Grid.Item>
            </Grid.Root>
          )}

          {fields.length === 0 && (
            <Alert variant="default" marginBottom={3}>
              {formatMessage({ id: getTranslation('translator.google.noConfig') })}
            </Alert>
          )}

          <Flex gap={2}>
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
