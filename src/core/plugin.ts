import * as store from "./storage";
import * as tm from "./taskmanager";

export interface Plugin {
    name: string;
    version: string;
    commands?: PluginCommand[];
    extensions?: CommandExtension[];
    initialize?: (context: PluginContext) => void | Promise<void>;
    shutdown?: () => Promise<void>;
}


// Context object given to plugins so they can read/write tasks
export interface PluginContext{
    storage: store.Storage;
}

export interface PluginCommand{
    name: string;           // the CLI verb, e.g. "stats"
    description: string;    // shown in help text
    usage: string;          // optional usage info for this command
    execute: (args: tm.ParsedArgs, ctx: PluginContext) => Promise<void>;
}

export interface CommandExtension{
    command: string;
    description: string;
    beforeExecution?: (args: tm.ParsedArgs, context: PluginContext) => Promise<void>;
    afterExecution?: (args: tm.ParsedArgs, context: PluginContext) => Promise<void>;
}