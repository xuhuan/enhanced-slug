import { getTranslation } from '../utils/getTranslation';
import React, { useEffect, useState } from 'react';
import { Main } from '@strapi/design-system';
import { Box, Grid, Button, TextInput, Field, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../pluginId';

const engines = [
  'pinyin', 'baidu', 'tencent', 'aliyun', 'deepl', 'volcengine', 'google'
];

const HomePage = () => {
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();

  const [settings, setSettings] = useState<any>({ mode: 'pinyin' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get(`/${PLUGIN_ID}/settings`).then(res => setSettings(res.data || {}));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await post(`/${PLUGIN_ID}/settings`, settings);
      toggleNotification({ type: 'success', message: formatMessage({ id: `${PLUGIN_ID}.settings.save.success` }) });
    } catch {
      toggleNotification({ type: 'warning', message: formatMessage({ id: `${PLUGIN_ID}.settings.save.error` }) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Main>
      <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
        <Grid.Root gap={5}>
          <Grid.Item col={12}>
            <Field.Root name="mode" required>
              <Field.Label>{formatMessage({ id: `${PLUGIN_ID}.settings.mode` })}</Field.Label>
              <SingleSelect value={settings.mode} onChange={(v: any) => setSettings({ ...settings, mode: v })}>
                {engines.map(m => <SingleSelectOption key={m} value={m}>{m}</SingleSelectOption>)}
              </SingleSelect>
            </Field.Root>
          </Grid.Item>

          {settings.mode !== 'pinyin' && (
            <>
              <Grid.Item col={12}>
                <Field.Root name="apiKey">
                  <Field.Label>{formatMessage({ id: `${PLUGIN_ID}.settings.apiKey` })}</Field.Label>
                  <Field.Input
                    as={TextInput}
                    value={settings.apiKey || ''}
                    onChange={(e: { target: { value: any; }; }) => setSettings({ ...settings, apiKey: e.target.value })}
                  />
                </Field.Root>
              </Grid.Item>
              <Grid.Item col={12}>
                <Field.Root name="apiSecret">
                  <Field.Label>{formatMessage({ id: `${PLUGIN_ID}.settings.apiSecret` })}</Field.Label>
                  <Field.Input
                    as={TextInput}
                    value={settings.apiSecret || ''}
                    onChange={(e: { target: { value: any; }; }) => setSettings({ ...settings, apiSecret: e.target.value })}
                  />
                </Field.Root>
              </Grid.Item>
            </>
          )}

          <Grid.Item col={12}>
            <Button onClick={save} loading={saving}>{formatMessage({ id: `${PLUGIN_ID}.settings.save` })}</Button>
          </Grid.Item>
        </Grid.Root>
      </Box>
    </Main>
  );
};

export { HomePage };
