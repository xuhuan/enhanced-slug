import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../admin/src/pluginId';

const register = async ({ strapi }: { strapi: Core.Strapi }) => {
  console.log('=== Enhanced Slug Plugin Debug ===');
  console.log('Plugin ID:', PLUGIN_ID);
  console.log('Strapi admin available:', !!strapi.admin);
  console.log('Permission service available:', !!strapi.admin?.services?.permission);


  // 检查权限服务是否存在
  if (strapi.admin?.services?.permission) {
    try {
      const permissionService = strapi.admin.services.permission;
      console.log('Available permission methods:', Object.keys(permissionService));

      // 定义权限动作 - 注意 uid 要和路由中的 scope 匹配
      const actions = [
        {
          section: 'plugins',
          displayName: 'Find Enhanced Slug Settings',
          uid: 'settings.read',
          pluginName: PLUGIN_ID,
        },
        {
          section: 'plugins',
          displayName: 'Update Enhanced Slug Settings',
          uid: 'settings.update',
          pluginName: PLUGIN_ID,
        },
        {
          section: 'plugins',
          displayName: 'Generate Slug',
          uid: 'slug.generate',
          pluginName: PLUGIN_ID,
        },
        {
          section: 'plugins',
          displayName: 'Check Slug',
          uid: 'slug.check',
          pluginName: PLUGIN_ID,
        },
      ];

      // 尝试注册权限
      if (permissionService.actionProvider?.register) {
        actions.forEach((action) => {
          permissionService.actionProvider.register(action);
        });
        console.log('Permissions registered using actionProvider.register');
      } else if (permissionService.actionProvider?.registerMany) {
        await permissionService.actionProvider.registerMany(actions);
        console.log('Permissions registered using actionProvider.registerMany');
      } else {
        console.warn('No suitable permission registration method found');
        console.log('Skipping permission registration - using simplified auth');
      }
    } catch (error) {
      console.error('Error registering permissions:', error);
      console.log('Will use simplified authentication instead');
    }
  }

  strapi.customFields.register({
    name: PLUGIN_ID,
    plugin: PLUGIN_ID,
    type: 'string',
  });
};

export default register;
