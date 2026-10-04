function add(a: number, b: number): number {
    return a + b;
}


add(5, 10);
console.log(add(5, 10));


const greet=(name:string):string=>`hello ${name}`
console.log(greet("John"))


function createTask(title:string,priority?:string):string{
    return `Task: ${title}, Priority: ${priority}`;
}

console.log(createTask("Learn TypeScript","High"));


const msg:string="Hello World";
console.log(msg);