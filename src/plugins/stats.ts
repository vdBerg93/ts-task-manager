import { Plugin,PluginContext } from "../core/plugin";
import { ParsedArgs } from "../core/taskmanager";


const statsPlugin: Plugin = {
    name: 'stats',
    version: '1.0.0',
    commands: [
        {
            name: 'stats',
            description: 'Show statistics about tasks',
            usage: 'stats',
            execute: async (args: ParsedArgs, ctx: PluginContext) => {
                // load from store
                const state = await ctx.storage.load();
                const tasks = state.tasks;
                const total = tasks.length;

                if (total === 0){
                    console.log('No tasks found.');
                    return;
                }

                const byStatus = state.tasks.reduce((counts,task)=>{
                    counts[task.status] = (counts[task.status] ?? 0) + 1;
                    return counts;
                }, {} as Record<string, number>);
                console.log(`Total tasks: ${total}`);
                for(const [status, count] of Object.entries(byStatus)){
                    console.log(`  ${status}: ${count}`);
                }
            }
        }
    ],
    // extensions:[
    //     {
    //         command: 'add',
    //         description: 'After adding a task, show updated stats',
    //         afterExecution: async (args: ParsedArgs, ctx: PluginContext) => {
    //             const state = await ctx.storage.load();
    //             const total = state.tasks.length;
    //             console.log(`Task added. Total tasks: ${total}`);
    //         }
    //     }
    // ]
};

module.exports = {plugin: statsPlugin};