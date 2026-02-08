
const userString = "0 0 * * 1-5"; // Copied from user request
console.log(`String: "${userString}"`);
for (let i = 0; i < userString.length; i++) {
    console.log(`Char[${i}]: '${userString[i]}' Code: ${userString.charCodeAt(i)}`);
}

const dashIndex = userString.indexOf('-');
if (dashIndex !== -1) {
    console.log(`Dash Code: ${userString.charCodeAt(dashIndex)}`);
    console.log(`Standard Hyphen Code: ${'-'.charCodeAt(0)}`);
    if (userString.charCodeAt(dashIndex) !== '-'.charCodeAt(0)) {
        console.error('FAIL: Dash mismatch! User is using a non-standard hyphen.');
    } else {
        console.log('SUCCESS: Dash matches standard hyphen.');
    }
} else {
    console.log('No dash found in string provided in script source.');
}
