import type { Core } from '@strapi/strapi';

async function handleSlugGeneration(strapi: Core.Strapi, event: any) {
  const { data, model } = event.params;
  const settings = await strapi.plugin('enhanced-slug').service('settings').getSettings();

  if (!settings.fieldMappings || settings.fieldMappings.length === 0) return;

  const mapping = settings.fieldMappings.find(m => m.contentType === model.uid);
  if (!mapping) return;

  // Check if source field exists and target field needs to be generated
  if (data[mapping.sourceField] && !data[mapping.targetField]) {
    const slug = await strapi
      .plugin('enhanced-slug')
      .service('slug')
      .generateSlug(data[mapping.sourceField]);

    if (slug) {
      data[mapping.targetField] = slug;
    }
  }
}


const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  const contentTypes = Object.keys(strapi.contentTypes);

  contentTypes.forEach((uid) => {
    const model = strapi.contentTypes[uid];

    // Skip if it's not a content type we want to handle
    if (!model.collectionName || model.plugin) return;

    // Add lifecycle hooks
    strapi.db.lifecycles.subscribe({
      models: [uid],
      async beforeCreate(event: any) {
        await handleSlugGeneration(strapi, event);
      },
      async beforeUpdate(event: any) {
        await handleSlugGeneration(strapi, event);
      },
    });
  });
};

export default bootstrap;
