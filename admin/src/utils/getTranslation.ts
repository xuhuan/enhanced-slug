import { PLUGIN_ID } from '../pluginId';

const getTranslation = (id: string) => `${PLUGIN_ID}.${id}`;

type AddPrefix<T extends Record<string, any>, P extends string> = {
    [K in keyof T as `${P}.${Extract<K, string>}`]: T[K]
};

const addPrefix = <
    T extends Record<string, any>,
    P extends string
>(obj: T, prefix: P): AddPrefix<T, P> => {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [`${prefix}.${k}`, v])
    ) as AddPrefix<T, P>;
}

export { getTranslation, addPrefix };
