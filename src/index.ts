import * as path from 'path';
import {parseArgs, parseCommand, TaskManager} from "./core/taskmanager";
import { FileStorage } from "./core/storage";
import { PluginManager } from "./core/plugin-manager";

async function main(){
    // Initialize
    const storage = new FileStorage('tasks.json');
    
    const pluginManager = new PluginManager({storage});
    const pluginsDir = path.join(__dirname, 'plugins');
    await pluginManager.loadAll(pluginsDir);

    const taskManager = new TaskManager(storage, pluginManager);

    // Run
    const args = process.argv.slice(2);
    const parsedArgs = parseArgs(args);

    const cmd = parseCommand(parsedArgs, pluginManager);
    await taskManager.execute(cmd, parsedArgs);

    await pluginManager.shutdownAll();
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});