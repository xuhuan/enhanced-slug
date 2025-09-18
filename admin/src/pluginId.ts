import pluginPkg from "../../package.json";

const PLUGIN_ID = pluginPkg.name.replace(
    /^(@[^-,.][\w,-]+\/)-/i,
    "",
);

export { PLUGIN_ID };
