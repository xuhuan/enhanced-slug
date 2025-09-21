import type { Core } from '@strapi/strapi';

// async function handleSlugGeneration(strapi: Core.Strapi, event: any) {
//   const { data, model } = event.params;
//   const settings = await strapi.plugin('enhanced-slug').service('settings').getSettings();

//   if (!settings.fieldMappings || settings.fieldMappings.length === 0) return;

//   const mapping = settings.fieldMappings.find(m => m.contentType === model.uid);
//   if (!mapping) return;

//   // Check if source field exists and target field needs to be generated
//   if (data[mapping.sourceField] && !data[mapping.targetField]) {
//     const slug = await strapi
//       .plugin('enhanced-slug')
//       .service('slug')
//       .generateSlug(data[mapping.sourceField]);

//     if (slug) {
//       data[mapping.targetField] = slug;
//     }
//   }
// }


const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {

  console.log('=== Permission Debug Info ===');
  
  // 检查权限服务
  if (strapi.admin?.services?.permission) {
    const permissionService = strapi.admin.services.permission;
    console.log('Permission service methods:', Object.keys(permissionService));
    
    if (permissionService.actionProvider) {
      console.log('ActionProvider methods:', Object.keys(permissionService.actionProvider));
    }
  }
  
  // 查询现有权限
  try {
    const permissions = await strapi.db.query('admin::permission').findMany({
      where: {
        action: {
          $contains: 'enhanced-slug'
        }
      }
    });
    console.log('Found enhanced-slug permissions:', permissions.length);
    permissions.forEach((p: any) => {
      console.log('- Action:', p.action, 'Subject:', p.subject);
    });
  } catch (error) {
    console.error('Error querying permissions:', error);
  }
  
  console.log('=== End Permission Debug ===');

  // const contentTypes = Object.keys(strapi.contentTypes);

  // contentTypes.forEach((uid) => {
  //   const model = strapi.contentTypes[uid];

  //   // Skip if it's not a content type we want to handle
  //   if (!model.collectionName || model.plugin) return;

  //   // Add lifecycle hooks
  //   strapi.db.lifecycles.subscribe({
  //     models: [uid],
  //     async beforeCreate(event: any) {
  //       await handleSlugGeneration(strapi, event);
  //     },
  //     async beforeUpdate(event: any) {
  //       await handleSlugGeneration(strapi, event);
  //     },
  //   });
  // });
};

export default bootstrap;
