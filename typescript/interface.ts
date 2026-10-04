interface User{
    name:string;
    age?:number;
}

const rahul:User={name:"Rahul",age:25}
console.log(rahul)

const john:User={name:"John"}
console.log(john)


interface task{
    title:string;
    dueDate:string
}

const t1:task={title:"Learn TypeScript",dueDate:"2023-12-31"}
const t2:task={title:"learn angular"}

console.log(t1)
console.log(t2)

function printDueDate(Task:task):void{
    if(Task.dueDate){
    console.log(Task.dueDate.toUpperCase());
    }
}

console.log(printDueDate(t1))