import * as path from 'path';
import * as fs from 'fs';
import * as plugin from './plugin';
import * as tm from './taskmanager';

export class PluginManager {
    private plugins: plugin.Plugin[] = [];
    private commands: Map<string, plugin.PluginCommand> = new Map();
    private extensions: Map<string, plugin.CommandExtension[]> = new Map();
    
    constructor(private ctx: plugin.PluginContext) {}

    async loadAll(pluginsDir: string): Promise<void> {
        if (!fs.existsSync(pluginsDir)) return;

        const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));

        for (const file of files){
            const fullPath = path.join(pluginsDir, file);
            await this.loadPlugin(fullPath);
        }
    }

    private async loadPlugin(filePath: string): Promise<void> {
        // require() loads a JavaScript module at runtime
        // This is how we dynamically load plugin files
        const mod = require(filePath);

        const plugin: plugin.Plugin = mod.default ?? mod.plugin ?? mod;

        // Check plugin data
        if (!plugin.name || !plugin.version){
            console.warn(`Skipping invalid plugin at ${filePath}: missing name or version`);
            return;
        }

        if (plugin.commands){
            for( const cmd of plugin.commands){
                if (this.commands.has(cmd.name)){
                    console.warn(`Plugin ${plugin.name} command ${cmd.name} conflicts with existing command. Skipping.`);
                    continue;
                }
                this.commands.set(cmd.name, cmd);
            }
        }

        if (plugin.extensions){
            for (const ext of plugin.extensions){
                const existing = this.extensions.get(ext.command) ?? [];
                existing.push(ext);
                this.extensions.set(ext.command,existing);
            }
        }

        if (plugin.initialize){
            await plugin.initialize(this.ctx);
        }

        this.plugins.push(plugin);
    }

    public hasCommand(name: string): boolean{
        return this.commands.has(name);
    }

    public getCommand(name: string): plugin.PluginCommand | undefined{
        return this.commands.get(name);
    }

    async runBeforeExecute(action: string, args: tm.ParsedArgs): Promise<void>{
        const extensions = this.extensions.get(action) ?? [];
        for (const ext of extensions){
            if (ext.beforeExecution){
                await ext.beforeExecution(args,this.ctx);
            }
        }
    }

    async runAfterExecute(action: string, args: tm.ParsedArgs): Promise<void>{
        const extensions = this.extensions.get(action) ?? [];
        for (const ext of extensions){
            if (ext.afterExecution){
                await ext.afterExecution(args, this.ctx);
            }
        }
    }

    async shutdownAll(): Promise<void>{
        for (const plugin of this.plugins){
            if (plugin.shutdown){
                await plugin.shutdown();
            }
        }
    }

    getUsage(): string[] {
        const usage: string[] = [];
        for (const cmd of this.commands.values()){
            usage.push(cmd.usage ?? cmd.name);
        }
        return usage;
    }
}