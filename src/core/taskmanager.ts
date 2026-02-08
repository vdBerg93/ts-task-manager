import * as path from 'path';
import * as store from './storage';
import * as types from './types';
import * as pm from './plugin-manager';

type CommandAdd = {
    action: CommandAction.Add;
    param: {
        title: string;
        description?: string;
        due?: Date;
        status?: types.TaskStatus;
    }
}

type CommandUpdate = {
    action: CommandAction.Update;
    param: {
        id: string,
        title?: string;
        description?: string;
        status?: types.TaskStatus;
        due?: Date;
    }
}

type CommandDelete = {
    action: CommandAction.Delete;
    param: {
        id: string;
    }
}

type CommandList = {
    action: CommandAction.List;
}

type CommandPlugin = {
    action: CommandAction.Plugin;
    name: string;
    rawArgs: ParsedArgs;
}

enum CommandActionShort {
    Add = 'add',
    Update = 'up',
    Delete = 'rm',
    List = 'ls',
}

enum CommandAction{
    Add = 'add',
    Update = 'update',
    Delete = 'delete',
    List = 'list',
    Plugin = 'plugin',
}

export type Command = CommandAdd | CommandUpdate | CommandDelete | CommandList | CommandPlugin;

const usageLs = 'ls';
const usageAdd = `add <title> [--detail <description>] [--due <YYYY-MM-DD>]`;
const usageUpdate = 'up <id> [--title <title>] [--detail <description>] [--due <YYYY-MM-DD>] [--status <todo|in-progress|done>]';
const usageDelete = `rm <id/*>`;

function usage(msg: string){
    const name = path.basename(process.argv[1]);
    console.log(`Usage: ${name} ${msg}`)
    process.exit(1);
}

export type ParsedArgs = {
    positionals: string[];
    options: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs{
    const positionals: string[] = [];
    const options: Record<string, string | boolean> = {};

    for (let i = 0; i < argv.length; i++){
        const arg = argv[i];

        // --key=value
        if (arg.startsWith('--') && arg.includes('=')){
            const [key, value] = arg.slice(2).split('=',2);
            options[key] = value;
            continue;
        }

        // --key value | --flag
        if (arg.startsWith('--')){
            const key = arg.slice(2);
            const next = argv[i+1];
            if (next && !next.startsWith('-')){
                options[key] = next;
                i++; // consume
            }else{
                options[key] = true;
            }
            continue;
        }

        positionals.push(arg);
    }

    return { positionals, options };
}

function parseAdd(arg: ParsedArgs): Command{
    if (arg.positionals.length<2){
        usage(usageAdd);
    }
    const cmd: Command = {
        action: CommandAction.Add,
        param: {
            title: arg.positionals[1],
        }
    }

    if (typeof arg.options.detail === 'string'){
        cmd.param.description = arg.options.detail;
    }
    if (typeof arg.options.due === 'string'){
        const date = new Date(arg.options.due);
        if (isNaN(date.getTime())){
            console.error(`Invalid due date: ${arg.options.due}. Must be in YYYY-MM-DD format.`);
        }
        cmd.param.due = date;
    }
    if (typeof arg.options.status === 'string'){
        if (types.isTaskStatus(arg.options.status)){
            cmd.param.status = arg.options.status;
        }else{
            console.error(`Invalid status: ${arg.options.status}. Must be one of todo, in-progress, done.`);
        }
    }
    
    return cmd;
}

function parseUpdate(arg: ParsedArgs): Command{
    if (arg.positionals.length<2){
        usage(usageUpdate);
    }
    const cmd: Command = {
        action: CommandAction.Update,
        param: {
            id: arg.positionals[1],
        }
    }

    if (typeof arg.options.detail === 'string'){
        cmd.param.description = arg.options.detail;
    }
    if (typeof arg.options.due === 'string'){
        cmd.param.due = new Date(arg.options.due);
    }
    if (typeof arg.options.status === 'string'){
        if (types.isTaskStatus(arg.options.status)){
            cmd.param.status = arg.options.status;
        }else{
            console.error(`Invalid status: ${arg.options.status}. Must be one of todo, in-progress, done.`);
        }
    }

    return cmd;
}

function parseDelete(arg: ParsedArgs): Command{
    if (arg.positionals.length<2){
        usage(usageDelete);
    }
    const cmd: Command = {
        action: CommandAction.Delete,
        param: {
            id: arg.positionals[1],
        }
    }
    return cmd;
}

function parseList(arg: ParsedArgs): Command{
    return {
        action: CommandAction.List,
    };
}


export function parseCommand(arg: ParsedArgs, pluginManager?: pm.PluginManager): Command {   
    if (arg.positionals.length===0){
        printCommands(pluginManager);
        throw new Error('Missing command action');
    }


    const action = arg.positionals[0];
    let cmd: Command;
    switch (action){
        case CommandActionShort.Add: {
            cmd = parseAdd(arg);
            break;
        }
        case CommandActionShort.Update: {
            cmd = parseUpdate(arg);
            break;
        }
        case CommandActionShort.Delete: {
            cmd = parseDelete(arg);
            break;
        }
        case CommandActionShort.List: {
            cmd = parseList(arg);
            break;
        }
        default:
            if (pluginManager?.hasCommand(action)){
                return {
                    action: CommandAction.Plugin as const,
                    name: action,
                    rawArgs: arg,
                }
            }
            throw new Error(`Unknown command action ${action}`);
    }

    return cmd;
}

export class TaskManager {

    constructor(
        private storage: store.Storage,
        private pluginManager?: pm.PluginManager
    ) {}

    async execute(cmd: Command, parsedArgs: ParsedArgs): Promise<void>{
        if (cmd.action==='plugin'){
            const pluginCmd = this.pluginManager?.getCommand(cmd.name);
            if (!pluginCmd){
                throw new Error(`Plugin command ${cmd.name} not found.`);
            }
            return pluginCmd.execute(cmd.rawArgs, {storage: this.storage});
        }

        await this.pluginManager?.runBeforeExecute(cmd.action, parsedArgs);

        switch (cmd.action){
            case CommandAction.Add: 
                await this.addTask(cmd); 
                break;
            case CommandAction.Update: 
                await this.updateTask(cmd); 
                break;
            case CommandAction.Delete:
                await this.deleteTask(cmd); 
                break;
            case CommandAction.List:
                await this.listTasks(cmd); 
                break;
        }
        
        await this.pluginManager?.runAfterExecute(cmd.action, parsedArgs); 
    }

    async addTask(cmd: CommandAdd): Promise<void> {
        const params = cmd.param;
        const state = await this.storage.load();
        const newTask: types.Task = {
            id: String(state.nextId),
            title: params.title,
            status: 'todo',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (params.description) newTask.description = params.description;
        if (params.due) newTask.dueDate = params.due;
        const newState = {
            tasks: [...state.tasks, newTask],
            nextId: state.nextId + 1,
        }
        await this.persist(newState);
    }
    // id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>

    async updateTask(cmd: CommandUpdate): Promise<void> {
        const {id, ...updates} = cmd.param;

        // Get
        const state = await this.storage.load();
        const taskIndex = state.tasks.findIndex(task => task.id === id);
        if (taskIndex < 0) {
            console.error(`Task ID ${id} not found.`);
            return
        }
        // Update
        if (updates.title !== undefined) state.tasks[taskIndex].title = updates.title;
        if (updates.description !== undefined) state.tasks[taskIndex].description = updates.description;
        if (updates.due !== undefined) state.tasks[taskIndex].dueDate = updates.due;
        if (updates.status !== undefined) state.tasks[taskIndex].status = updates.status;
        state.tasks[taskIndex].updatedAt = new Date();
        // Save
        await this.persist(state);
    }

    async deleteTask(cmd: CommandDelete): Promise<void> {
        // Get
        const state = await this.storage.load();

        if (cmd.param.id === '*'){
            // Purge list
            state.tasks = [];
        }else{
            // Find by ID
            const index = state.tasks.findIndex(task => task.id === cmd.param.id);
            if (index < 0) {
                console.error(`Task ID ${cmd.param.id} not found.`);
                return
            }
            // Drop
            state.tasks.splice(index, 1);
        }
        
        // Save
        await this.persist(state);
    }

    async listTasks(cmd: CommandList): Promise<void>{
        const state = await this.storage.load();

        if (state.tasks.length === 0){
            console.log("No tasks to list");
            return
        }
        
        const display = state.tasks.map( task =>({
            ID: task.id,
            Status: task.status,
            Title: task.title,
            Due: task.dueDate?.toLocaleString() || '',
            Detail: task.description || ''
        }));
        console.table(display);
    }

    persist(state: types.State): Promise<void> {
        return this.storage.save(state);
    }
}

function printCommands(pluginManager?: pm.PluginManager){
        console.log('Available commands:');

        const usage = [usageAdd, usageUpdate, usageDelete, usageLs];
        if (pluginManager){
            const pluginCommands = pluginManager.getUsage() ?? [];
            for (const cmdUsage of pluginCommands){
                usage.push(cmdUsage);
            }
        }

        usage.sort();
        for (const u of usage){
            console.log(`  ${u}`);
        }
    }
