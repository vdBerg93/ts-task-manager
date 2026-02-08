import * as types from './types'

export interface Storage{
    save(tasks: types.State): Promise<void>;
    load(): Promise<types.State>;
}

export class FileStorage implements Storage{
    constructor(private filePath: string){}
    async save(tasks: types.State): Promise<void>{
        const fs = await import('fs/promises').then(fs => fs);
        const data = JSON.stringify(tasks, null, 2);
        await fs.writeFile(this.filePath, data, 'utf8');
    }

    async load(): Promise<types.State>{
        try{
            const fs = await import('fs/promises').then(fs => fs);
            const data = await fs.readFile(this.filePath, 'utf8');
            const state = JSON.parse(data);

            // Convert date strings back to Date objects
            return {
                ...state,
                tasks: state.tasks.map((task: any) => ({
                    ...task,
                    createdAt: new Date(task.createdAt),
                    updatedAt: new Date(task.updatedAt),
                    dueDate: task.dueDate ? new Date(task.dueDate) : undefined
                }))
            };
        }catch (err: any){
            if (err?.code === 'ENOENT'){
                // File doesn't exist > initialize
                return {
                    tasks: [],
                    nextId: 1,
                }
            }
            // Any other error
            throw err;
        }
        
    }
}