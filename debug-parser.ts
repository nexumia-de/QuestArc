
import { parseTaskType, compileTaskData } from './src/lib/parsers.ts';

const inputs = [
    "Boss [hp:100]",
    "Boss [HP:100]",
    "Final Boss [hp: 5000]",
    "Boss [hp:100] [dmg:5]"
];

inputs.forEach(input => {
    console.log(`\nInput: "${input}"`);
    const typeResult = parseTaskType(input);
    console.log("Type Result:", JSON.stringify(typeResult, null, 2));

    const compileResult = compileTaskData(input);
    console.log("Compile Result Data:", JSON.stringify(compileResult.data, null, 2));
    console.log("Compile Result Title:", compileResult.title);
});
