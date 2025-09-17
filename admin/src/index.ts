import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import { Typhoon as SlugIcon } from '@strapi/icons';

export default {
  register(app: any) {
    // 注册自定义字段
    app.customFields.register({
      name: 'enhanced-slug',
      PLUGIN_ID: 'enhanced-slug',
      type: 'string',
      intlLabel: {
        id: `${PLUGIN_ID}.label`,
        defaultMessage: 'Enhanced Slug',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.description`,
        defaultMessage: 'Generates a slug from another field (Pinyin/Translate).',
      },
      icon: SlugIcon,
      components: {
        Input: async () =>
          import(
            './components/Input'
          ),
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.options.title`,
              defaultMessage: 'Configuration',
            },
            items: [
              {
                name: 'options.sourceField',
                type: 'string',
                intlLabel: {
                  id: `${PLUGIN_ID}.options.sourceField.label`,
                  defaultMessage: 'Source Field Name',
                },
                description: {
                  id: `${PLUGIN_ID}.options.sourceField.description`,
                  defaultMessage: 'API ID of the field to generate the slug from (e.g., title).',
                },
              },
            ],
          },
        ],
      },
    });

    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
