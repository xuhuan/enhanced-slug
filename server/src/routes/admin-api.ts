export default [
    // {
    //     method: 'GET',
    //     path: '/settings',
    //     handler: 'controller.getSettings',
    //     config: {
    //         policies: [],
    //         // 确保管理员可以访问
    //         auth: { scope: ['find-settings'] },
    //     },
    // },
    // {
    //     method: 'POST',
    //     path: '/settings',
    //     handler: 'controller.updateSettings',
    //     config: {
    //         policies: [],
    //         auth: { scope: ['update-settings'] },
    //     },
    // },
    // // Slug Generation Route
    // {
    //     method: 'POST',
    //     path: '/generate',
    //     handler: 'controller.generate',
    //     config: {
    //         policies: [],
    //         // 确保登录的内容编辑可以访问
    //         auth: false, // 或者更精细的权限控制
    //     },
    // },


    {
        method: 'GET',
        path: '/settings',
        handler: 'settings.getSettings',
        config: {
            policies: [],
            auth: false,
        },
    },
    {
        method: 'PUT',
        path: '/settings',
        handler: 'settings.updateSettings',
        config: {
            policies: [],
            auth: false,
        },
    },
    {
        method: 'POST',
        path: '/test-translator',
        handler: 'settings.testTranslator',
        config: {
            policies: [],
            auth: false,
        },
    },
    {
        method: 'POST',
        path: '/generate',
        handler: 'slug.generate',
        config: {
            policies: [],
            auth: false,
        },
    },
];
