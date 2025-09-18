import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from "../../admin/src/pluginId";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Access Settings',
      uid: `${PLUGIN_ID}.settings.read`,
      pluginName: PLUGIN_ID,
    },
    {
      section: 'plugins',
      displayName: 'Update Settings',
      uid: `${PLUGIN_ID}.settings.update`,
      pluginName: PLUGIN_ID,
    },
  ];

  actions.forEach((action) => {
    strapi.admin?.services.permission.actionProvider.register(action);
  });

  strapi.customFields.register({
    name: PLUGIN_ID,
    plugin: PLUGIN_ID,
    type: "string",
  });
};

export default register;
