
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export function isTaskStatus(value: string): value is TaskStatus{
    return value === 'todo' || 
           value === 'in-progress' || 
           value === 'done';
}

export interface Task{
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
}


export interface State{
    tasks: Task[];
    nextId: number;
}