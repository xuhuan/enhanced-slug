import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';
import { Box } from '@strapi/design-system';
import { Button } from '@strapi/design-system';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { useEffect, useState } from 'react';
import { PLUGIN_ID } from '../pluginId';
import { Check } from '@strapi/icons';
import { Typography } from '@strapi/design-system';
import { Grid } from '@strapi/design-system';
import { SingleSelect } from '@strapi/design-system';
import { SingleSelectOption } from '@strapi/design-system';

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({ mode: 'pinyin' });

  useEffect(() => {
    get(`/${PLUGIN_ID}/settings`)
      .then((res) => setSettings(res.data))
      .catch(() => toggleNotification({ type: 'warning', message: 'Failed to load settings' }))
      .finally(() => setIsLoading(false));
  }, [get, toggleNotification]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await post(`/${PLUGIN_ID}/settings`, settings);
      toggleNotification({ type: 'success', message: 'Settings saved successfully' });
    } catch (error) {
      toggleNotification({ type: 'warning', message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Main>
      {!isLoading && (
        <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
          <Grid.Root gap={5} padding={4}>
            <Grid.Item col={12} s={12}>
              <Typography variant="delta" as="h3">
                {formatMessage({ id: getTranslation('settings.title') })}
              </Typography>
            </Grid.Item>
            <Grid.Item col={12} s={12}>
              <SingleSelect
                value={settings.mode}
                onChange={(value: 'pinyin' | 'google-translate') =>
                  setSettings({ ...settings, mode: value })
                }
              >
                <SingleSelectOption value="pinyin">Pinyin</SingleSelectOption>
                <SingleSelectOption value="google-translate">Google Translate</SingleSelectOption>
              </SingleSelect>
            </Grid.Item>
            <Grid.Item col={12} s={12}>
              <Button onClick={handleSave} loading={isSaving} startIcon={<Check />}>
                {formatMessage({ id: getTranslation('settings.save') })}
              </Button>
            </Grid.Item>
          </Grid.Root>
        </Box>
      )}
    </Main>
  );
};

export { HomePage };
