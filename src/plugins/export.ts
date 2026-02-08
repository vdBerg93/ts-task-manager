import { ParsedArgs } from "../core/taskmanager";
import {Plugin, PluginContext} from "../core/plugin";

const exportPlugin: Plugin = {
    name: 'export',
    version: '1.0.0',
    commands:[
        {
            name: 'export-json',
            description: 'Export tasks as JSON',
            usage: 'export-json',
            execute: async (args: ParsedArgs, ctx: PluginContext) => {
                const state = await ctx.storage.load();
                console.log(JSON.stringify(state.tasks, null, 2));
            }
        }
    ]
}

module.exports = {plugin: exportPlugin};