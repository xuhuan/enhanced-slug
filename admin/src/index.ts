import { addPrefix, getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import SettingsPage from './pages/Settings';

export default {
  register(app: any) {

    app.customFields.register({
      name: PLUGIN_ID,
      pluginId: PLUGIN_ID,
      type: 'string',
      intlLabel: {
        id: `${PLUGIN_ID}.label`,
        defaultMessage: 'Enhanced Slug',
      },
      intlDescription: {
        id: `${PLUGIN_ID}.description`,
        defaultMessage: 'Generates a slug from another field (Pinyin/Translate).',
      },
      icon: PluginIcon,
      components: {
        Input: async () =>
          import(
            './components/SlugInput'
          ),
      },
      options: {
        base: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.options.title`,
              defaultMessage: 'Must Required Field',
            },
            items: [
              {
                name: 'options.sourceField',
                type: 'text',
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
        advanced: [
          {
            sectionTitle: {
              id: `${PLUGIN_ID}.options.advanced`,
              defaultMessage: "Advanced Settings",
            },
            items: [
              {
                name: "required",
                type: "checkbox",
                intlLabel: {
                  id: `${PLUGIN_ID}.options.advanced.required.label`,
                  defaultMessage: "Required field",
                },
                description: {
                  id: `${PLUGIN_ID}.options.advanced.required.description`,
                  defaultMessage:
                    "You won't be able to create an entry if this field is empty",
                },
                defaultValue: true,
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
      Component: async () => import('./pages/App').then(m => m.App),
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

          return { data: addPrefix(data, PLUGIN_ID), locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
